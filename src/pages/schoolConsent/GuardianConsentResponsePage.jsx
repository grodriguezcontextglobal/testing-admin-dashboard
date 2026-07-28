import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Input,
  notification,
  Result,
  Space,
  Spin,
  Typography,
} from "antd";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  respondPublicConsent,
  retrievePublicConsent,
} from "./guardianConsentPublicApi";

const { Title, Text, Paragraph } = Typography;

const pageShellStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: 24,
};

const GuardianConsentResponsePage = () => {
  const [searchParams] = useSearchParams();
  const otc = searchParams.get("otc");

  const [signerName, setSignerName] = useState("");
  const [decision, setDecision] = useState(null);

  const {
    data: consentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publicConsent", otc],
    queryFn: () => retrievePublicConsent(otc),
    enabled: Boolean(otc),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: ({
      otc: consentOtc,
      decision: consentDecision,
      signerName: name,
    }) => respondPublicConsent(consentOtc, consentDecision, name),

    onSuccess: () => {
      notification.success({
        message: "Consent submitted successfully",
        description: "Thank you for your response.",
      });
    },

    onError: (err) => {
      const status = err?.response?.status;
      const msg = err?.response?.data?.msg;

      if (status === 404) {
        notification.error({
          message: "Invalid link",
          description: "This consent link is invalid.",
        });
        return;
      }

      if (status === 410) {
        notification.error({
          message: "Link expired",
          description:
            "This consent link has expired. Please contact the school to request a new link.",
        });
        return;
      }

      if (status === 409) {
        notification.warning({
          message: "Already responded",
          description: "This consent request has already been answered.",
        });
        return;
      }

      if (status === 422) {
        notification.error({
          message: "Cannot change response",
          description: "This consent request can no longer be changed.",
        });
        return;
      }

      notification.error({
        message: "Error",
        description: msg || "An unexpected error occurred.",
      });
    },
  });

  if (!otc) {
    return (
      <div style={pageShellStyle}>
        <Result
          status="error"
          title="Invalid Link"
          subTitle="No consent code was provided. Please check the link you received."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={pageShellStyle}>
        <Spin aria-label="Loading consent details" size="large" />
      </div>
    );
  }

  if (error) {
    const status = error?.response?.status;

    if (status === 404) {
      return (
        <div style={pageShellStyle}>
          <Result
            status="error"
            title="Invalid Link"
            subTitle="This consent link is invalid. Please contact the school."
          />
        </div>
      );
    }

    if (status === 410) {
      return (
        <div style={pageShellStyle}>
          <Result
            status="warning"
            title="Link Expired"
            subTitle="This consent link has expired. Please contact the school to request a new link."
          />
        </div>
      );
    }

    return (
      <div style={pageShellStyle}>
        <Result
          status="error"
          title="Error"
          subTitle="Unable to load consent details. Please try again later."
        />
      </div>
    );
  }

  const consent = consentData?.consent;
  const company = consentData?.company;
  const guardian = consentData?.guardian;
  const student = consentData?.student;

  const companyName = company?.name || "the school";
  const guardianName = guardian?.full_name || "";
  const studentName = student?.full_name || "the student";

  if (consent?.status === "agreed" || consent?.status === "refused") {
    const isAgreed = consent.status === "agreed";

    return (
      <div style={pageShellStyle}>
        <Result
          status={isAgreed ? "success" : "info"}
          title={
            isAgreed
              ? "Consent Already Provided"
              : "Consent Already Refused"
          }
          subTitle={`${guardianName || "The guardian"} has already ${
            isAgreed ? "agreed to" : "refused"
          } the consent request for ${studentName}.`}
        />
      </div>
    );
  }

  const handleSubmit = (nextDecision) => {
    const normalizedSignerName = signerName.trim();

    if (!normalizedSignerName) {
      notification.warning({
        message: "Please enter your name",
        description: "Your full name is required to sign.",
      });
      return;
    }

    setDecision(nextDecision);

    submitMutation.mutate({
      otc,
      decision: nextDecision,
      signerName: normalizedSignerName,
    });
  };

  return (
    <div style={{ ...pageShellStyle, backgroundColor: "#f5f5f5" }}>
      <Card style={{ maxWidth: 640, width: "100%" }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          Student Consent Request
        </Title>

        <Paragraph
          type="secondary"
          style={{
            textAlign: "center",
            fontSize: 16,
            marginBottom: 0,
          }}
        >
          Hello <Text strong>{guardianName || "Guardian"}</Text>.{" "}
          <Text strong>{companyName}</Text> is requesting your consent for{" "}
          <Text strong>{studentName}</Text>.
        </Paragraph>

        <Divider />

        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div>
            <Text type="secondary">Guardian</Text>
            <br />
            <Text strong>{guardianName || "—"}</Text>
          </div>

          <div>
            <Text type="secondary">Student</Text>
            <br />
            <Text strong>{studentName}</Text>
          </div>

          <div>
            <Text type="secondary">School or organization</Text>
            <br />
            <Text strong>{companyName}</Text>
          </div>

          <div>
            <Text type="secondary">Policy</Text>
            <br />
            <Text strong>
              {consent?.policy_type || "AUP"} version{" "}
              {consent?.policy_version || "1"}
            </Text>
          </div>

          {student?.grade && (
            <div>
              <Text type="secondary">Grade</Text>
              <br />
              <Text>{student.grade}</Text>
            </div>
          )}

          {student?.homeroom && (
            <div>
              <Text type="secondary">Homeroom</Text>
              <br />
              <Text>{student.homeroom}</Text>
            </div>
          )}
        </Space>

        {consent?.consent_text && (
          <>
            <Divider />

            <Title level={5}>Consent details</Title>

            <Paragraph style={{ whiteSpace: "pre-wrap" }}>
              {consent.consent_text}
            </Paragraph>
          </>
        )}

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Guardian email</Text>
          <br />
          <Text>{guardian?.email || consent?.signer_email || "—"}</Text>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label htmlFor="guardian-consent-signer-name">
            <Text strong>Full name of guardian signing</Text>
          </label>

          <Input
            id="guardian-consent-signer-name"
            placeholder={guardianName || "Enter your full name"}
            value={signerName}
            onChange={(event) => setSignerName(event.target.value)}
            autoComplete="name"
            style={{ marginTop: 6 }}
          />

          {guardianName && (
            <Text
              type="secondary"
              style={{ display: "block", marginTop: 6 }}
            >
              Please enter your name as shown above: {guardianName}.
            </Text>
          )}
        </div>

        <Paragraph type="secondary">
          By selecting “Agree,” you confirm that you are authorized to provide
          consent for {studentName} regarding the{" "}
          {consent?.policy_type || "school"} policy issued by {companyName}.
        </Paragraph>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <Button
            danger
            size="large"
            loading={
              submitMutation.isPending && decision === "refused"
            }
            disabled={submitMutation.isPending}
            onClick={() => handleSubmit("refused")}
          >
            Refuse
          </Button>

          <Button
            type="primary"
            size="large"
            loading={
              submitMutation.isPending && decision === "agreed"
            }
            disabled={submitMutation.isPending}
            onClick={() => handleSubmit("agreed")}
          >
            Agree
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default GuardianConsentResponsePage;