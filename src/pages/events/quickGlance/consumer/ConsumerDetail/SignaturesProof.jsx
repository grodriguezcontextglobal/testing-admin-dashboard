import PropTypes from "prop-types";
import { useState } from "react";
import { devitrakApi } from "../../../../../api/devitrakApi";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { StatusChip } from "../../../../../components/UX/profile";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import "../consumerDetail.css";

/**
 * The documents a consumer accepted, and their acceptance state.
 *
 * Three things changed from the previous version:
 *
 *  - It read `data[0].contract_url` only, so a transaction with more than one
 *    signature record showed the first record's documents and silently dropped
 *    the rest.
 *  - The viewer was an <iframe> rendered *inside a table cell's render
 *    function*, keyed off one shared `url` state — so opening one document
 *    dropped a 500px-tall iframe into every row at once. It is a modal now.
 *  - Acceptance was a bare ✓ or ✗ glyph with no text. A screen reader heard
 *    nothing; a sighted reader had to guess which was which.
 */
const SignaturesProof = ({ data, emptyLabel }) => {
  const [openDocument, setOpenDocument] = useState(null);
  const [isOpening, setIsOpening] = useState(null);
  const [failed, setFailed] = useState(null);

  const records = Array.isArray(data) ? data : [];

  const rows = records.flatMap((record, recordIndex) =>
    (Array.isArray(record?.contract_url) ? record.contract_url : []).map(
      (document, documentIndex) => ({
        key: `${record?.transaction_id ?? recordIndex}-${documentIndex}`,
        title: document?.title || "Untitled document",
        viewUrl: document?.view_url,
        date: record?.date,
        accepted: Boolean(record?.accepted),
      })
    )
  );

  const openDocumentUrl = async (row) => {
    setIsOpening(row.key);
    setFailed(null);
    try {
      const response = await devitrakApi.post("/document/download/documentUrl", {
        documentUrl: row.viewUrl,
      });
      setOpenDocument({ title: row.title, url: response.data.downloadUrl });
    } catch (error) {
      // Previously `throw new Error(error)` from inside an async click handler:
      // an unhandled rejection, and nothing at all on screen.
      setFailed(row.key);
    } finally {
      setIsOpening(null);
    }
  };

  if (rows.length === 0) {
    return (
      <EmptyState
        compact
        icon="tabler:file-off"
        title={emptyLabel}
        description="Documents appear here once the consumer accepts them."
      />
    );
  }

  const columns = [
    {
      title: "Document",
      dataIndex: "title",
      key: "title",
      render: (title) => <span style={{ fontWeight: 500 }}>{title}</span>,
    },
    {
      title: "Accepted on",
      dataIndex: "date",
      key: "date",
      responsive: ["md"],
      render: (date) => (
        <span className="profile-date__exact">{date || "—"}</span>
      ),
    },
    {
      title: "Acceptance",
      dataIndex: "accepted",
      key: "accepted",
      render: (accepted) =>
        accepted ? (
          <StatusChip tone="success" pip label="Accepted" />
        ) : (
          <StatusChip tone="critical" pip label="Not accepted" />
        ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, row) => (
        <span className="profile-row-actions">
          <LightBlueButtonComponent
            title={failed === row.key ? "Retry" : "View"}
            size="sm"
            disabled={!row.viewUrl}
            loadingState={isOpening === row.key}
            func={() => openDocumentUrl(row)}
          />
        </span>
      ),
    },
  ];

  return (
    <>
      <BaseTable
        className="profile-table"
        columns={columns}
        dataSource={rows}
        enablePagination={rows.length > 10}
        pageSize={10}
      />
      {openDocument && (
        <ModalUX
          title={openDocument.title}
          openDialog={Boolean(openDocument)}
          closeModal={() => setOpenDocument(null)}
          width={900}
          body={
            <iframe
              src={openDocument.url}
              title={openDocument.title}
              style={{ width: "100%", height: "70dvh", border: 0 }}
            />
          }
          footer={[
            <GrayButtonComponent
              key="close"
              title="Close"
              func={() => setOpenDocument(null)}
            />,
          ]}
        />
      )}
    </>
  );
};

SignaturesProof.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      transaction_id: PropTypes.string,
      date: PropTypes.string,
      accepted: PropTypes.bool,
      contract_url: PropTypes.array,
    })
  ),
  emptyLabel: PropTypes.string,
};

SignaturesProof.defaultProps = {
  data: [],
  emptyLabel: "No signed documents",
};

export default SignaturesProof;
