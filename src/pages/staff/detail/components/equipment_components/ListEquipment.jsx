import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Button, List } from "antd";
import _ from 'lodash';
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import "../../../../../styles/global/ant-select.css";
import ModalReturnDeviceFromStaff from "./ModalReturnDeviceFromStaff";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
const ListEquipment = () => {
    const [openReturnDeviceStaffModal, setOpenReturnDeviceStaffModal] = useState(false)
    const [deviceInfo, setDeviceInfo] = useState({})
    const { profile } = useSelector((state) => state.staffDetail);
    const { user } = useSelector((state) => state.admin);
    const [assignedEquipmentList, setAssignedEquipmentList] = useState([])
    const location = useLocation()
    const staffMemberQuery = useQuery({
        queryKey: ['staffMemberInfo'],
        queryFn: () => devitrakApi.post("/db_staff/consulting-member", {
            email: profile.email
        }),
        enabled: false,
        refetchOnMount: false
    })
    const listImagePerItemQuery = useQuery({
        queryKey: ["imagePerItemList"],
        queryFn: () => devitrakApi.post("/image/images", { company: user.company }),
        enabled: false,
        refetchOnMount: false
    });

    const itemsInInventoryQuery = useQuery({
        queryKey: ['ItemsInventoryCheckingQuery'],
        queryFn: () => devitrakApi.post("/db_item/consulting-item", {
            company: user.company,
        }),
        enabled: false,
        refetchOnMount: false
    })

    useEffect(() => {
        const controller = new AbortController()
        staffMemberQuery.refetch()
        listImagePerItemQuery.refetch()
        itemsInInventoryQuery.refetch()
        return () => {
            controller.abort()
        }
    }, [])

    const deviceDB = {}
    const deviceImageDB = {}
    const fetchLeasePerStaffMember = async (staffMember) => {
        const assignedEquipmentStaffQuery = await devitrakApi.post('/db_lease/consulting-lease', {
            staff_member_id: staffMember?.data?.member.at(-1).staff_id
        })
        if (assignedEquipmentStaffQuery.data.ok) {
            setAssignedEquipmentList(assignedEquipmentStaffQuery.data.lease)
        }
        return assignedEquipmentList
    }

    useEffect(() => {
        const controller = new AbortController()
        const staffMember = staffMemberQuery?.data
        if (staffMember) {
            fetchLeasePerStaffMember(staffMember)
        }
        return () => {
            controller.abort()
        }
    }, [staffMemberQuery.data])
    if (itemsInInventoryQuery.isLoading || listImagePerItemQuery.isLoading || staffMemberQuery.isLoading) return <div style={CenteringGrid}><Loading /></div>

    if (itemsInInventoryQuery.data && listImagePerItemQuery.data && staffMemberQuery.data) {
        deviceDB.current = itemsInInventoryQuery?.data?.data?.items
        deviceImageDB.current = listImagePerItemQuery?.data?.data?.item
        const groupingImage = _.groupBy(deviceImageDB.current, "item_group")
        const groupSerialNumber = _.groupBy(deviceDB.current, 'item_id')
        const dataToRender = (props) => {
            return {
                devicePhoto: groupingImage[groupSerialNumber[props.item_id]?.at(-1).item_group]?.at(-1).source,
                item_id_info: groupSerialNumber[props.item_id]?.at(-1)
            }
        }

        return (
            <>

                <Grid
                    container
                    display={"flex"}
                    justifyContent={"center"}
                    alignItems={"center"}
                    marginY={2}
                    key={location.key}
                >
                    <Typography
                        textTransform="none"
                        textAlign="justify"
                        fontFamily="Inter"
                        fontSize="14px"
                        fontStyle="normal"
                        fontWeight={400}
                        lineHeight="20px"
                        color="var(--gray-600, #475467)"
                        margin={'0.2rem auto 0.5rem'}
                        style={{
                            wordWrap: "break-word",
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        Page to display all assigned equipment to staff member.
                    </Typography>
                    <Grid
                        style={{
                            borderRadius: "8px",
                            border: "1px solid var(--gray-300, #D0D5DD)",
                            background: "var(--gray-100, #F2F4F7)",
                            padding: "24px",
                            width: "100%",
                        }} item xs={12} sm={12} md={12} lg={12}>
                        <List
                            itemLayout="horizontal"
                            dataSource={assignedEquipmentList}
                            renderItem={(item) => (
                                < List.Item key={item?.created_at} actions={[<Button disabled={item.active === 0} onClick={() => { setDeviceInfo({ ...item, ...dataToRender({ item_id: item.device_id }) }); setOpenReturnDeviceStaffModal(true) }} key={`${item.created_at}.${item.device_id}`} style={item.active === 0 ? LightBlueButton : BlueButton}><Typography style={item.active === 0 ? { ...LightBlueButtonText, color: "var(---gray600)" } : BlueButtonText}>Return</Typography></Button>]}>
                                    <List.Item.Meta
                                        avatar={<Avatar>
                                            <img src={dataToRender({ item_id: item.device_id }).devicePhoto} alt={dataToRender({ item_id: item.device_id }).devicePhoto} />
                                        </Avatar>}
                                        title={<Typography style={{ ...Subtitle, fontWeight: 600 }}>{dataToRender({ item_id: item?.device_id })?.item_id_info?.category_name} {dataToRender({ item_id: item?.device_id })?.item_id_info?.brand} {dataToRender({ item_id: item?.device_id })?.item_id_info?.item_group} {dataToRender({ item_id: item?.device_id })?.item_id_info?.serial_number}</Typography>}
                                        description={<div style={{ width: "100%", display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
                                            Status: {item.active ? "In-use" : "Returned"}, assignment date: {new Date(item.date_assignment).toUTCString()},
                                            location: {item.location}, returned device date: {item.subscription_returned_date ? new Date(item.subscription_returned_date).toUTCString() : "Still in use"}
                                        </div>}
                                    />
                                </List.Item>
                            )}
                        />
                    </Grid >
                </Grid >
                {openReturnDeviceStaffModal &&
                    <ModalReturnDeviceFromStaff openReturnDeviceStaffModal={openReturnDeviceStaffModal} setOpenReturnDeviceStaffModal={setOpenReturnDeviceStaffModal} deviceInfo={deviceInfo} />
                }
            </>
        );
    }
};

export default ListEquipment;