import { Table } from "antd";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { CheckIcon } from "../../../../../components/icons/CheckIcon";
import { CloseIcon } from "../../../../../components/icons/CloseIcon";
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
      title: "Date",
      dataIndex: "Date",
      key: "Date",
    },
    {
      title: "Agree",
      dataIndex: "Agree",
      key: "Agree",
      render: (agree) => (agree ? <CheckIcon stroke="green" /> : <CloseIcon stroke="red" />),
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
