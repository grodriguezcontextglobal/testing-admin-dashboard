import { useSelector } from "react-redux"
import { devitrakApi } from "../../../api/devitrakApi"
import CardRendered from "../../events/quickGlance/components/CardRendered"
import { useCallback, useEffect, useState } from "react"

const TotalDevice = () => {
    const { user } = useSelector((state) => state.admin)
    const [device, setDevice] = useState('')
    const totalConsumers = useCallback(async () => {
        const response = await devitrakApi.post('db_item/consulting-item', {
            company_id: user.sqlInfo.company_id
        })
        if (response.data.ok) {
            sortingDataFetched(response.data.items)
        }
    }, [])

    useEffect(() => {
      const controller = new AbortController()
      totalConsumers()

      return () => {
        controller.abort()
      }
    }, [])
    
    const sortingDataFetched = (props) => {
        const result = new Set()
        for (let data of props) {
            result.add({ key: data.item_id, ...data })
        }
        const total = Array.from(result).reduce((accu, { cost }) => accu + Number(cost), 0)
        const format = Number(total).toLocaleString('en-US')
        return setDevice(`$${format}`)
    }

    return (
        <CardRendered props={device} title={'Total device value'} />
    )
}

export default TotalDevice