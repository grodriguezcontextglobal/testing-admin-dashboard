import { useSelector } from "react-redux"
import { devitrakApi } from "../../../../api/devitrakApi"
import { useCallback, useEffect, useState } from "react"
import { Table } from "antd"
import "../../../../styles/global/ant-table.css"
const TableCategories = () => {
    const { user } = useSelector((state) => state.admin)
    const [device, setDevice] = useState([])
    const totalConsumers = useCallback(async () => {
        const response = await devitrakApi.post('db_item/consulting-item', {
            company: user.company
        })
        if (response.data.ok) {
            return sortingDataFetched(response.data.items)
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
        const result = {}
        for (let data of props) {
            if (!result[data.category_name]) {
                result[data.category_name] = 1
            } else {
                result[data.category_name]++
            }
        }
        return setDevice(result)
    }

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

export default TableCategories;