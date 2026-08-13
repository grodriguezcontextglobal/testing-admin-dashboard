import { useMemo, useState, useRef } from "react";
import { Divider, Typography, Button, Tooltip } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { utils, writeFile } from "xlsx";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import TourModals from "../../../../components/UX/tours/TourModals";
import MultipleFromXLSX from "./addNewMember/MultipleFromXLSX";
import Single from "./addNewMember/Single";
import {
  MEMBER_IMPORT_COLUMNS,
  buildTemplateRow,
  columnRequirementLabel,
} from "../../utils/xlsxImportUtils";

const { Text } = Typography;

const AddNewMember = ({ openModal, setOpenModal }) => {
  const [choose, setChoose] = useState(0);
  const [openTour, setOpenTour] = useState(false);

  // One ref per template column, for the Tour to point at the right header.
  // Previously fourteen useRef declarations, three parallel lists (columns,
  // steps, example row) and a template built from one of them — four places to
  // edit to add one column, which is why `grade` and `homeroom` were importable
  // for months while the downloadable template never offered them. All of it now
  // derives from MEMBER_IMPORT_COLUMNS, which the importer's own tests check
  // against the accepted-header map in both directions.
  const headerRefs = useRef({});

  const tourColumns = MEMBER_IMPORT_COLUMNS.map((column) => ({
    title: column.title,
    dataIndex: column.header,
    key: column.header,
    width: column.width,
    onHeaderCell: () => ({
      ref: (node) => {
        headerRefs.current[column.header] = node;
      },
    }),
  }));

  const tourSteps = MEMBER_IMPORT_COLUMNS.map((column) => ({
    title: `${column.title} (${columnRequirementLabel(column)})`,
    description: column.description,
    target: () => headerRefs.current[column.header],
  }));

  const tourData = [buildTemplateRow()];

  const handleDownloadTemplate = () => {
    // Column order pinned to the spec rather than left to object key order, and
    // `header` listed explicitly so a column whose example is blank (image_url)
    // still gets a header cell instead of vanishing from the sheet.
    const ws = utils.json_to_sheet(tourData, {
      header: MEMBER_IMPORT_COLUMNS.map((column) => column.header),
    });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Template");
    writeFile(wb, "Member_Import_Template.xlsx");
  };

  const bodyUX = useMemo(() => {
    return (
      <div>
        {choose === 0 ? (
          <Single closingModal={setOpenModal} />
        ) : (
          <MultipleFromXLSX closingModal={setOpenModal} />
        )}
      </div>
    );
  }, [choose, setOpenModal]);
  const renderingTitleWithOptions = () => {
    const AddButton = choose === 0 ? BlueButtonComponent : GrayButtonComponent;
    const ImportButton = choose === 1 ? BlueButtonComponent : GrayButtonComponent;
    return (
      <>
        <p
          style={{
            fontFamily: "Inter",
            fontSize: "18px",
            fontWeight: 600,
            lineHeight: "28px",
            color: "var(--gray-900, #101828)",
            margin: "0 0 24px",
          }}
        >
          Choose option to add new member(s)
        </p>
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <AddButton
            key="add"
            title={"Add new member"}
            styles={{ width: "50%" }}
            func={() => setChoose(0)}
          />
          <ImportButton
            key="import"
            title={"Import (.xlsx)"}
            styles={{ width: "50%" }}
            func={() => setChoose(1)}
          />
        </div>
        {choose === 1 && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <GrayButtonComponent
              title="View Template Guide"
              func={() => setOpenTour(true)}
              style={{ width: "fit-content" }}
            />
          </div>
        )}
        <Divider />
      </>
    );
  };

  return (
    <>
      {!openTour && (
        <ModalUX
          title={renderingTitleWithOptions()}
          openDialog={openModal}
          closeModal={setOpenModal}
          width={1000}
          footer={null}
          modalStyles={{}}
          body={bodyUX}
        />
      )}
      {choose === 1 && openTour && (
        <TourModals
          open={openTour}
          setOpen={setOpenTour}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Member Import Template Guide</span>
              <Tooltip title="Download Template">
                <Button
                  type="primary"
                  shape="round"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  size="small"
                >Download Template</Button>
              </Tooltip>
            </div>
          }
          description={
            <>
              This guide shows the expected structure for your Excel (.xlsx)
              file.
              <br />
              <Text type="danger">Note:</Text> Headers are case-insensitive.
            </>
          }
          columns={tourColumns}
          dataSource={tourData}
          steps={tourSteps}
          width={3000}
        />
      )}
    </>
  );
};

export default AddNewMember;
