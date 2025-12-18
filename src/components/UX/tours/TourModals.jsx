import { Modal, Table, Tour, Typography } from "antd";
import { useEffect, useState } from "react";

const { Paragraph } = Typography;

const TourModal = ({
  open,
  setOpen,
  title,
  description,
  columns,
  dataSource,
  steps,
  width = 1000,
  scroll = { x: "max-content" },
  pagination = false,
  tourProps = {},
  modalProps = {},
}) => {
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    if (open) {
      // Small delay to ensure Modal and Table headers are rendered before Tour calculates position
      const timer = setTimeout(() => setTourOpen(true), 500);
      return () => clearTimeout(timer);
    } else {
      setTourOpen(false);
    }
  }, [open]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => setOpen(false)}
      width={width}
      footer={null}
      centered
      style={{ top: 20 }}
      {...modalProps}
    >
      {description && <Paragraph>{description}</Paragraph>}

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        scroll={scroll}
        size="middle"
        bordered
      />

      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={steps}
        zIndex={2000}
        scrollIntoViewOptions={{ block: "center" }}
        {...tourProps}
      />
    </Modal>
  );
};

export default TourModal;
