import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import CardRendered from "./CardRendered"

const InventoryEventValue = () => {
    const { event } = useSelector((state) => state.event)
    const [device, setDevice] = useState(0)
    const sortingDataFetched = useCallback(() => {
        const deviceData = event.deviceSetup
        let result = [0]
        for (let data of deviceData) {
            const totalItems = (data.endingNumber - data.startingNumber)
            const worth = totalItems * data.value
            result = [...result, worth]
        }
        const total = result.reduce((accu, curr) => accu + curr, 0)
        const format = Number(total).toLocaleString('en-US')
        return setDevice(`$${format}`)
    }, [])
    
    useEffect(() => {
        const controller = new AbortController()
        sortingDataFetched()
        return () => {
            controller.abort()
        }
    }, [])

    return (
        <div style={{
            padding:"-10px 0 0"
        }}>
                 <CardRendered style={{ padding:0 }} props={device} title={'Total device value'} />   
        </div>

    )
}

export default InventoryEventValue