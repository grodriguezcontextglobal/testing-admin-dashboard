import { Grid } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import _ from 'lodash'
import { useDispatch, useSelector } from "react-redux"
import { devitrakApi } from "../../../api/devitrakApi"
import { onAddListEventPermitPerAdmin } from "../../../store/slices/eventSlice"
import CardEventDisplay from "../../events/components/CardEventDisplay"
import BannerMsg from "../../events/utils/BannerMsg"
const MainPage = () => {
    const { user } = useSelector((state) => state.admin);

    const dispatch = useDispatch();
    const eventQuery = useQuery({
        queryKey: ["events"],
        queryFn: () => devitrakApi.post("/event/event-list", {
            company: user.company
        }),
        refetchOnMount: false,
        cacheTime: 1000 * 60 * 15, //fifteenMinutesInMs
        staleTime: 1000 * 60 * 15
    });
    const dataPerCompany = () => {
        const groupOfCompanies = eventQuery?.data?.data?.list
        if (groupOfCompanies) return groupOfCompanies;
        return undefined;
    };
    dataPerCompany();
    if (eventQuery.data) {
        const renderingDataBasedOnStaffAndActiveEvent = () => {
            let checking = []
            if (dataPerCompany()) {
                const group_by_active = _.groupBy(dataPerCompany(), "active");
                const activeAndAdminMember = group_by_active.true?.filter(
                    (adminMember) =>
                        adminMember.staff?.adminUser?.find(
                            (member) => member === user.email
                        )
                );
                if (activeAndAdminMember) {
                    checking = [...checking, ...activeAndAdminMember]
                } else {
                    checking = [...checking]
                }
                const activeAndHeadsetAttendeesMember = group_by_active.true?.filter(
                    (adminMember) =>
                        adminMember.staff.headsetAttendees?.find(
                            (member) => member === user?.email
                        )
                );
                if (activeAndHeadsetAttendeesMember) {
                    checking = [...checking, ...activeAndHeadsetAttendeesMember]
                } else {
                    checking = [...checking]
                }
                const activeEventAndMembers = [...checking];

                const inactiveButAdmin = group_by_active.false?.filter((adminMember) =>
                    adminMember.staff.adminUser?.find((member) => member === user.email)
                );

                dispatch(
                    onAddListEventPermitPerAdmin({
                        active: activeEventAndMembers,
                        completed: inactiveButAdmin,
                    })
                );
                if (activeEventAndMembers && inactiveButAdmin) {
                    const noDuplicated = new Set()
                    for (let data of [...activeEventAndMembers, ...inactiveButAdmin]) {
                        const jsonToString = JSON.stringify(data)
                        if (!noDuplicated.has(jsonToString)) {
                            noDuplicated.add(jsonToString)
                        }
                    }
                    const depuratedResult = new Set()
                    for (let data of Array.from(noDuplicated)) {
                        const parsing = JSON.parse(data)
                        depuratedResult.add(parsing)
                    }
                    return Array.from(depuratedResult)
                }
                if (activeEventAndMembers && !inactiveButAdmin) return activeEventAndMembers;
                if (!activeAndAdminMember && inactiveButAdmin) return inactiveButAdmin;
                if (!activeAndAdminMember && !inactiveButAdmin) return [];
            }
        };
        renderingDataBasedOnStaffAndActiveEvent();

        const dataToBeRenderedInUpcomingSection = () => {
            const result = new Set()
            for (let data of renderingDataBasedOnStaffAndActiveEvent()) {
                const currentDate = new Date();
                const begin = new Date(`${data.eventInfoDetail.dateBegin}`)
                let ending = new Date(`${data.eventInfoDetail.dateEnd}`)
                if (currentDate < begin || currentDate >= begin && currentDate <= ending) {
                    result.add({ key: data.id, ...data })
                }
            }
            return Array.from(result)
        }

        return (
            <Grid textAlign={"right"}
                display={'flex'}
                justifyContent={"space-between"}
                alignItems={"center"}
                alignSelf={'flex-start'}
                gap={1}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
            >

                {dataToBeRenderedInUpcomingSection()?.length > 0 ? (
                    dataToBeRenderedInUpcomingSection()?.map((event) => {
                        return (
                            <Grid
                                key={event.id}
                                padding={1}
                                alignSelf={'flex-start'}
                                item
                                xs={12}
                                sm={12}
                                md={12}
                                lg={6}
                            >
                                <CardEventDisplay props={event} />
                            </Grid>
                        )
                    })
                ) : <BannerMsg />}
            </Grid>
        )
    }

}

export default MainPage