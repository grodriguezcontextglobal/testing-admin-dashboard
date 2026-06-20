import { Table } from "antd";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { Check, X } from "lucide-react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useState } from "react";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";

const SignaturesProof = ({ data }) => {
  const [url, setUrl] = useState(null);
  if (!data) {
    return null;
  }
  const formattingData = () => {
    return data[0].contract_url.map((item) => ({
      Document: item.title,
      Url: item.view_url,
      Date: data[0].date,
      Agree: data[0].accepted,
    }));
  };
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

  const columns = [
    {
      title: "Document",
      dataIndex: "Document",
      key: "Document",
    },
    {
      title: "Acceptance Date",
      dataIndex: "Date",
      key: "Date",
    },
    {
      title: "Acceptance",
      dataIndex: "Agree",
      key: "Agree",
      render: (agree) =>
        agree ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "9999px", background: "#ECFDF3", color: "var(--success-700, #067647)", fontSize: "12px", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            <Check size={16} />
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "9999px", background: "#FEF3F2", color: "var(--danger-action, #b42318)", fontSize: "12px", fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
            <X size={16} />
          </span>
        ),
    },
    {
      title: "Url",
      dataIndex: "Url",
      key: "Url",
      render: (url_) => {
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <BlueButtonComponent
              title={url ? "Document displayed below" : "View Document"}
              func={() => downloadDocument(url_)}
            />
            {url && (
              <>
                <iframe src={url} width="100%" height="500px" />
                <GrayButtonComponent title="Close" func={() => setUrl(null)} />
              </>
            )}
          </div>
        );
      },
    },
  ];
  return <Table columns={columns} dataSource={formattingData()} />;
};

export default SignaturesProof;
