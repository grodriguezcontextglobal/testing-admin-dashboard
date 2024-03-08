import { useSelector } from "react-redux"
import { devitrakApi } from "../../../api/devitrakApi"
import CardRendered from "../../events/quickGlance/components/CardRendered"
import { useCallback, useEffect, useState } from "react"

const TotalConsumer = () => {
    const { user } = useSelector((state) => state.admin)
    const [consumersList, setConsumersList] = useState([])
    const totalConsumers = useCallback(async () => {
        const response = await devitrakApi.post('/auth/users', {
            provider: user.company
        })
        if (response.data.ok) {
            sortingDataFetched(response.data.users)
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
            const jsonToString = JSON.stringify(data)
            result.add(jsonToString)
        }

        const finalList = new Set()
        for (let data of Array.from(result)) {
            const stringToJson = JSON.parse(data)
            finalList.add(stringToJson)
        }
        const consumers = Array.from(finalList)
        return setConsumersList(consumers)
    }
    return (
        <CardRendered props={consumersList.length} title={'Total consumers'} />
    )
}

export default TotalConsumer