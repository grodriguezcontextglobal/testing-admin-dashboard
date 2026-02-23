import { Space, Typography } from 'antd';
import Chip from '../../../../../../components/UX/Chip/Chip';

const ScannedSerialsList = ({ serials, onRemove }) => {
  return (
    <div
      style={{
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '8px',
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
      }}
    >
      {serials?.length > 0 ? (
        <Space size={[8, 16]} wrap>
          {serials.map((serial, i) => (
            <Chip
              key={serial}
              label={serial}
              onDelete={() => onRemove(i)}
            />
          ))}
        </Space>
      ) : (
        <Typography.Text type="secondary">No items scanned yet.</Typography.Text>
      )}
    </div>
  );
};

export default ScannedSerialsList;
