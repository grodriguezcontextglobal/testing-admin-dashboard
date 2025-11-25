import { FormLabel, Grid, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { message, Spin, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { devitrakApi } from "../../../api/devitrakApi";
import Loading from "../../../components/animation/Loading";
import { InformationIcon } from "../../../components/icons/InformationIcon";
import { checkArray } from "../../../components/utils/checkArray";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import "../style/authStyle.css";

const ConsumerMemberVerificationSignatureAndSignatureStampComponent = () => {
  const company_id = new URLSearchParams(window.location.search).get(
    "company_id"
  );
  const documentUrl = new URLSearchParams(window.location.search).get(
    "contract_url"
  );
  const date_reference = new URLSearchParams(window.location.search).get(
    "date_reference"
  );
  const verification_id = new URLSearchParams(window.location.search).get(
    "ver_id"
  );
  const consumer_info = new URLSearchParams(window.location.search).get(
    "consumer_member_id"
  );
  const item_ids = new URLSearchParams(window.location.search).get("item_ids");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [checkIfDocumentIsSignedAlready, setCheckIfDocumentIsSignedAlready] =
    useState(false);
  const [signatureInfo, setSignatureInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      date: new Date().toLocaleString(),
    },
  });
  const [url, setUrl] = useState(null);
  const downloadDocument = async (x) => {
    try {
      const response = await devitrakApi.post(
        `/document/download/documentUrl`,
        {
          documentUrl: x,
        }
      );
      return setUrl(response.data.downloadUrl);
    } catch (error) {
      throw new Error(error);
    }
  };

  useEffect(() => {
    downloadDocument(documentUrl);
  }, []);

  useEffect(() => {
    const checkIfDocumentIsSignedAlready = async () => {
      try {
        const response = await devitrakApi.post(
          "/document/verification/consumer_member/check_signed_document",
          {
            company_id,
            contract_url: documentUrl,
            consumer_member_id: consumer_info,
            date_reference,
          }
        );
        const checkIfDocumentIsSignedAlready = await devitrakApi.post(
          "/company/consumer-signatures",
          {
            item_ids: String(item_ids).split(","),
            consumer_member_id: consumer_info,
            company_id,
            contract_url: documentUrl,
          }
        );
        const consumerMemberInfo = await devitrakApi.get(
          `/auth/${consumer_info}`
        );
        if (
          response.data.ok &&
          checkIfDocumentIsSignedAlready.data.ok &&
          consumerMemberInfo.data.ok
        ) {
          const consumerMemberInfoResponse = checkArray(
            consumerMemberInfo.data.user
          );
          setCheckIfDocumentIsSignedAlready(
            response.data.contract_info.contract_list
              .filter((item) => item.document_url === documentUrl)
              ?.at(-1)?.signature
          );
          setSignatureInfo(
            checkIfDocumentIsSignedAlready.data.data.length > 0
              ? checkIfDocumentIsSignedAlready.data.data[0]
              : null
          );
          if (checkIfDocumentIsSignedAlready.data.data.length > 0) {
            setValue(
              "fullName",
              checkIfDocumentIsSignedAlready.data.data[0].signature
            );
            setValue(
              "date",
              new Date(
                checkIfDocumentIsSignedAlready.data.data[0].date
              ).toLocaleString()
            );
            setValue("email", consumerMemberInfoResponse.email);
          }
          //   return setContractInfo({
          //     contract_info: response.data.contract_info,
          //     document_info: response.data.document,
          //   });
          return;
        }
        return null;
      } catch (error) {
        return;
      }
    };
    checkIfDocumentIsSignedAlready();
  }, []);

  const consumerMemberInfoQuery = useQuery({
    queryKey: ["consumerMemberInfoQuery"],
    queryFn: () => devitrakApi.get(`/auth/${consumer_info}`),
  });
  useEffect(() => {
    if (consumerMemberInfoQuery.data) {
      const consumerMemberInformation =
        consumerMemberInfoQuery?.data?.data?.user;
      setValue("email", consumerMemberInformation?.email);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [consumerMemberInfoQuery.data]);

  if (consumerMemberInfoQuery.isLoading)
    return <Spin fullscreen indicator={<Loading />} />;
  if (consumerMemberInfoQuery.data) {
    const addSignatureToDocument = async () => {
      return await devitrakApi.patch(
        "/document/verification/consumer_member/signing_document",
        {
          verification_id: verification_id,
          contract_url: documentUrl,
        }
      );
    };

    const submitSignaturesContracting = async (data) => {
      try {
        setLoadingStatus(true);
        const response = await devitrakApi.post(
          "/company/signatures-for-consumer-member",
          {
            signature: data.fullName,
            date: data.date,
            company_id: company_id,
            contract_url: documentUrl,
            consumer_member_id: consumer_info,
            item_ids: String(item_ids).split(","),
            verification_id: verification_id,
          }
        );
        if (response.data.ok) {
          await addSignatureToDocument();
          setLoadingStatus(false);
          message.success("Signature collected successfully");
          return window.location.assign("https://devitrak.com");
        }
      } catch (error) {
        message.error(
          (error?.data?.msg ?? error?.message) || "Failed to sign contract"
        );
        return setLoadingStatus(false);
      } finally {
        setLoadingStatus(false);
      }
    };

    return (
      <>
        {isLoading ? <Spin indicator={<Loading />} fullscreen /> : null}
        <Grid
          style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
          container
        >
          <Grid item xs={12} sm={12} md={6} lg={6}>
            <Grid
              container
              display={"flex"}
              flexDirection={"column"}
              justifyContent={"space-around"}
              alignItems={"center"}
            >
              <Grid marginX={0} className="register-container" container>
                <Grid
                  item
                  xs={12}
                  display={!signatureInfo ? "flex" : "none"}
                  flexDirection={"column"}
                  justifyContent={"space-around"}
                  alignItems={"center"}
                >
                  <Typography
                    style={{
                      color: "var(--gray900, #101828)",
                      fontSize: "30px",
                      fontFamily: "Inter",
                      fontWeight: "600",
                      lineHeight: "38px",
                      marginBottom: "1rem",
                    }}
                    variant="h1"
                  >
                    Welcome to devitrak App
                  </Typography>
                  <Typography
                    style={{
                      color: "var(--gray-500, #667085)",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      lineHeight: "24px",
                    }}
                    variant="subtitle1"
                  >
                    Please enter your full name as signature and date.
                  </Typography>
                </Grid>
                <form
                  className="register-form-container"
                  onSubmit={handleSubmit(submitSignaturesContracting)}
                >
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                    sm={12}
                    md
                  >
                    {" "}
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      {signatureInfo && "Contract/Document signed"}
                    </FormLabel>
                    <iframe src={url} width="100%" height="400"></iframe>
                  </Grid>
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                  >
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      {signatureInfo ? (
                        "Signature"
                      ) : (
                        <Tooltip title="Full name will be considered as signature and agreement to the document.">
                          {" "}
                          <span>
                            Full name <InformationIcon />
                          </span>
                        </Tooltip>
                      )}
                    </FormLabel>
                    <OutlinedInput
                      {...register("fullName")}
                      style={OutlinedInputStyle}
                      placeholder="e.g. John Doe"
                      type="text"
                      fullWidth
                      required
                      disabled={checkIfDocumentIsSignedAlready}
                    />
                  </Grid>
                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                  >
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      Consumer member email/user <InformationIcon />{" "}
                    </FormLabel>
                    <OutlinedInput
                      {...register("email")}
                      style={OutlinedInputStyle}
                      placeholder="e.g. test@test.com"
                      type="email"
                      fullWidth
                      required
                      readOnly
                      disabled={checkIfDocumentIsSignedAlready}
                    />
                  </Grid>

                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    item
                    xs={12}
                  >
                    <FormLabel style={{ marginBottom: "0.5rem" }}>
                      Date
                    </FormLabel>
                    <OutlinedInput
                      {...register("date")}
                      style={OutlinedInputStyle}
                      placeholder="e.g. John Doe"
                      type="text"
                      fullWidth
                      readOnly
                      disabled
                    />
                  </Grid>

                  <Grid
                    marginY={"20px"}
                    marginX={0}
                    textAlign={"left"}
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    item
                    xs={12}
                    style={{
                      position: "sticky",
                      bottom: "0px",
                      opacity: "1",
                    }}
                  >
                    <BlueButtonComponent
                      buttonType="submit"
                      title={"Sign and Agree"}
                      loadingState={loadingStatus}
                    />
                  </Grid>
                </form>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            display={"flex"}
            id="section-img-login-component"
            item
            md={6}
            lg={6}
          ></Grid>
        </Grid>
      </>
    );
  }
};

export default ConsumerMemberVerificationSignatureAndSignatureStampComponent;
