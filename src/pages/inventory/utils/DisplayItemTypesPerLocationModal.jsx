import ModalUX from "../../../components/UX/modal/ModalUX";
import BaseTable from "../../../components/UX/tables/BaseTable";

const DisplayItemTypesPerLocationModal = ({
  id_key,
  openDetails,
  closeModal,
  nodeName,
  rows,
  columns,
}) => {
//   console.log(id_key, openDetails, closeModal, nodeName, rows, columns);
const bodyModal = () => {
  return <BaseTable columns={columns}
        dataSource={rows}
        enablePagination={true}
        pageSize={10} />
}
  return (
    <ModalUX 
    key={id_key}
    title={`Item Types in ${nodeName} (${rows?.length} types)`}
    body={bodyModal()}
    openDialog={openDetails}
    closeModal={closeModal}
    />
  );
};
export default DisplayItemTypesPerLocationModal;
