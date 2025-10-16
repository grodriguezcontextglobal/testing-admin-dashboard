import { FormLabel, Grid, OutlinedInput } from "@mui/material";
import { message, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import "../../../../authentication/style/authStyle.css";
import { useSelector } from "react-redux";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";

const SignedContractViewHigherPermissionLevel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useSelector((state) => state.staffDetail);
  const staffMemberInfo = profile;

  // Redirect if already signed
  const [contractInfo, setContractInfo] = useState(null);
  const [signatureInfo, setSignatureInfo] = useState(null);
  const { register, setValue } = useForm({
    defaultValues: {
      email: staffMemberInfo.email,
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
    downloadDocument(location.state.contract_url);
  }, []);

  useEffect(() => {
    const checkIfDocumentIsSignedAlready = async () => {
      try {
        const response = await devitrakApi.post(
          `/document/verification/staff_member/check_signed_document`,
          {
            verificationID: location.state.verificationId,
          }
        );
        const checkIfDocumentIsSignedAlready = await devitrakApi.post(
          "/company/consulting-signatures",
          {
            staff_member_id: profile.adminUserInfo.id,
            company_id: location.state.company_id,
            contract_url: location.state.contract_url,
            verification_id: location.state.verification_id,
          }
        );
        if (response.data.ok) {
          setSignatureInfo(checkIfDocumentIsSignedAlready.data.data[0]);
          return setContractInfo({
            contract_info: response.data.contract_info,
            document_info: response.data.document,
          });
        }
        return null;
      } catch (error) {
        return;
      }
    };
    checkIfDocumentIsSignedAlready();
  }, []);

  useEffect(() => {
    if (location.state.verificationId && location.state.contract_url) {
      fetchVerification();
    }
  }, [location.state.verificationId, location.state.contract_url]);

  useEffect(() => {
    downloadDocument(location.state.contract_url);
  }, [location.state.contract_url]);

  const fetchVerification = async () => {
    try {
      const response = await devitrakApi.post(
        "/document/verification/staff_member/check_signed_document",
        {
          verificationID: location.state.verificationId,
          contract_url: location.state.contract_url, // "document ir" interpreted as document URL
        }
      );
      if (response.data?.ok) {
        setContractInfo({
          contract_info: response.data.contract_info,
          document_info: response.data.document,
        });
      }
    } catch (error) {
      message.error("Failed to load contract verification");
    }
  };

  useEffect(() => {
    if (signatureInfo) {
      setValue("signature", signatureInfo.signature);
      setValue("date", signatureInfo.date);
    }
  }, [signatureInfo])
  

  // Derive display values from verification; fall back to staff info when needed
  const fullNameDisplay =
    contractInfo?.contract_info?.signature_name ??
    contractInfo?.document_info?.signature_name ??
    `${staffMemberInfo?.first_name ?? ""} ${
      staffMemberInfo?.last_name ?? ""
    }`.trim();

  const emailDisplay =
    staffMemberInfo?.email ??
    staffMemberInfo?.user ??
    staffMemberInfo?.username ??
    "";

  const dateDisplay =
    contractInfo?.document_info?.date ??
    contractInfo?.contract_info?.date ??
    "";

  return (
    <>
      <Grid
        style={{ backgroundColor: "var(--basewhite)", height: "100dvh" }}
        container
      >
        <BlueButtonComponent
          title={"Back"}
          func={() =>
            navigate(`/staff/${staffMemberInfo.adminUserInfo._id}/main`, {
              state: { verificationId: null, contract_url: null },
            })
          }
          buttonType="button"
          titleStyles={{ textTransform: "none", with: "100%", gap: "2px" }}
        />
        <Grid
          container
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-around"}
          alignItems={"center"}
        >
          {/* <Grid marginX={0} className="register-container" container> */}
          <form
            className="register-form-container"
            onSubmit={(e) => e.preventDefault()}
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
              <iframe src={url} width="100%" height="400" />
            </Grid>

            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>
                Signature
              </FormLabel>
              <OutlinedInput
                {...register("signature")}
                style={OutlinedInputStyle}
                placeholder="e.g. John Doe"
                type="text"
                fullWidth
                required
                disabled
                defaultValue={fullNameDisplay}
              />
            </Grid>

            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <Tooltip title="Staff member login email/user (read-only)">
                <FormLabel style={{ marginBottom: "0.5rem" }}>
                  Staff member login email/user
                </FormLabel>
                <OutlinedInput
                  {...register("email")}
                  style={OutlinedInputStyle}
                  placeholder="e.g. test@test.com"
                  type="email"
                  fullWidth
                  required
                  disabled
                  defaultValue={emailDisplay}
                />
              </Tooltip>
            </Grid>

            <Grid marginY={"20px"} marginX={0} textAlign={"left"} item xs={12}>
              <FormLabel style={{ marginBottom: "0.5rem" }}>Date</FormLabel>
              <OutlinedInput
                {...register("date")}
                style={OutlinedInputStyle}
                type="text"
                defaultValue={dateDisplay}
                fullWidth
                readOnly
                disabled
              />
            </Grid>
          </form>
          {/* </Grid> */}
        </Grid>
      </Grid>
    </>
  );
};

export default SignedContractViewHigherPermissionLevel;
