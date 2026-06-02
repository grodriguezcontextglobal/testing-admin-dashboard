import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import ModalUX from "../../../components/UX/modal/ModalUX";
import BaseTable from "../../../components/UX/tables/BaseTable";
import ExpandedShipmentView from "./utils/ExpandedShipmentView";
import { RightChevronIcon } from "../../../components/icons/RightChevronIcon";
import { DownNarrow } from "../../../components/icons/DownNarrow";

export const ShipmentRecord = ({ open, setOpen }) => {
    const { user } = useSelector((state) => state.admin);
    const shipmentsQuery = useQuery({
        queryKey: ["shipmentRecords", user.sqlInfo.company_id],
        queryFn: () =>
            devitrakApi.post(`/db_shipment/search`, {
                company_id: user.sqlInfo.company_id,
            }),
        enabled: !!user.sqlInfo.company_id,
    });

    const closeModal = () => {
        return setOpen(false);
    };

    const columns = [
        {
            title: "Recipient",
            dataIndex: "recipient_name",
            key: "recipient",
        },
        {
            title: "Destination",
            dataIndex: "destination",
            key: "destination",
        },
        {
            title: "Authorizer",
            dataIndex: "authorizer_name",
            key: "authorizer",
        },
        {
            title: "Courier",
            dataIndex: "courier",
            key: "courier",
        },
        {
            title: "Tracking number",
            dataIndex: "tracking_number",
            key: "trackingNumber",
        },
    ];

    const bodyModal = () => {
        return (
            <BaseTable
                columns={columns}
                dataSource={shipmentsQuery.data?.data?.shipments || []}
                rowKey={(record) => record.shipment_id}
                expandable={{
                    expandedRowRender: (record) => (
                        <ExpandedShipmentView package_list={record.package_list} />
                    ),
                    rowExpandable: (record) => record.package_list && record.package_list.length > 0,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        expanded ? (
                            <button onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer', backgroundColor: "transparent", border: "none", outline: "none", margin: 0, padding: 0 }}>
                                <DownNarrow style={{ cursor: 'pointer' }} />
                            </button>
                        ) : (
                            <button onClick={(e) => onExpand(record, e)} style={{ cursor: 'pointer', backgroundColor: "transparent", border: "none", outline: "none", margin: 0, padding: 0 }}>
                                <RightChevronIcon style={{ cursor: 'pointer' }} />
                            </button>
                        ),
                }}
                enablePagination={true}
                pageSize={10}
            />

        );
    };

    return (
        <ModalUX
            title={"Shipment records"}
            openDialog={open}
            closeModal={closeModal}
            body={bodyModal()}
        />
    );
};
