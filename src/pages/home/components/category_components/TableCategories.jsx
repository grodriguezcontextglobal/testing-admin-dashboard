import { useQuery } from "@tanstack/react-query"
import { Table } from "antd"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { devitrakApi } from "../../../../api/devitrakApi"
import "../../../../styles/global/ant-table.css"
const TableCategories = () => {
    const { user } = useSelector((state) => state.admin)
    const [device, setDevice] = useState([])

    const consumersQuery = useQuery({
        queryKey: ['consumersPerCompanyQuery'],
        queryFn: () => devitrakApi.post('/db_item/consulting-item', {
            company: user.company
        }),
        enabled: false,
        refetchOnMount: false
    })
    // const totalConsumers = useCallback(async () => {
    //     const response = await devitrakApi.post('db_item/consulting-item', {
    //         company: user.company
    //     })
    //     if (response.data.ok) {
    //         return sortingDataFetched(response.data.items)
    //     }
    // }, [])

    const dataFetched = consumersQuery?.data?.data?.items
    const sortingDataFetched = () => {
        const result = {}
        if (dataFetched) {
            for (let data of dataFetched) {
                if (!result[data.category_name]) {
                    result[data.category_name] = 1
                } else {
                    result[data.category_name]++
                }
            }
            return setDevice(result)
        }

    }


    useEffect(() => {
        const controller = new AbortController()
        consumersQuery.refetch()
        sortingDataFetched()
        return () => {
            controller.abort()
        }
    }, [])
    if (consumersQuery.data) {
        const formattingData = () => {
            const result = new Set()
            for (let [key, value] of Object.entries(device)) {
                result.add({ category: key, total: value })
            }
            const final = Array.from(result)
            return final
        }

        const column = [
            {
                title: 'Name',
                dataIndex: 'category',
                key: 'category'
            },
            {
                title: 'Total device',
                dataIndex: 'total',
                key: 'total',
            },
        ]
        return (
            <Table dataSource={formattingData()} columns={column} className="table-ant-customized" />
        )

    }
}

export default TableCategories;