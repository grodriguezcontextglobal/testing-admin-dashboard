import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useSelector } from "react-redux";
import _ from 'lodash'
import FormatQuickGlanceCardGraphRender from "./graphic/FormatQuickGlanceCardGraphRender";
const GraphicInventoryEventActivity = () => {
    const { event } = useSelector((state) => state.event)
    const deviceStatusInEvent = useQuery({
        queryKey: ['devicesInEvent'],
        queryFn: () => devitrakApi.post('/receiver/receiver-pool-list', {
            eventSelected: event.eventInfoDetail.eventName,
            provider: event.company
        }),
        refetchOnMount: false,
        notifyOnChangeProps: ['data', 'dataUpdatedAt']
    })

    const sortData = () => {
        const data = deviceStatusInEvent?.data?.data?.receiversInventory
        const groupingByStatus = _.groupBy(data, 'status')
        const groupingByActivity = _.groupBy(data, 'activity')
        return {
            checkedOut: groupingByActivity['YES']?.length ?? 0,
            defected: "",
            onHand: groupingByActivity['No']?.length ?? 0,
            lost: groupingByStatus["Lost"]?.length ?? 0,
            total: data?.length ?? 0,

        }
    }
    sortData()

    const dataToExport = [
        { name: "Checked out", value: sortData().checkedOut },
        {
            name: "Not-Functional Report",
            value: 0,
        },
        { name: "On hands", value: sortData().onHand }, //numberDisplayDynamically()
        { name: "Lost", value: sortData().lost },
    ];
    const dataToMap = [dataToExport];
    return (
        <Grid
            display={"flex"}
            justifyContent={"space-between"}
            alignItems={"center"}
            margin={'-10px 0 0 0'}
        >
            {dataToMap?.map((item, index) => {
                return (
                    <Grid key={index} item xs={12}>
                        <FormatQuickGlanceCardGraphRender
                            key={index}
                            dataToRender={item}
                            totalDeviceInRange={sortData().total} //deviceRangeDisplay()
                            index={index}
                        />
                    </Grid>
                );
            })}
        </Grid>
    )
}

export default GraphicInventoryEventActivity