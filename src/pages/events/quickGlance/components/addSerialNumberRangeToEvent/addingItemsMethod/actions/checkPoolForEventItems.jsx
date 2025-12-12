import { devitrakApi } from "../../../../../../../api/devitrakApi"

const checkPoolForEventItems = async ({ event, deviceTitle }) => {
    const poolForEvent = await devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider:event.company,
        company:event.company_id,
        type:deviceTitle,
    })
    console.log(poolForEvent?.data);
    return poolForEvent?.data?.receiversInventory ?? []
}

export default checkPoolForEventItems