import { Grid, Typography } from "@mui/material"
import { Table } from "antd"
import '../../../../../styles/global/ant-table.css'
import { RightNarrowInCircle } from "../../../../../components/icons/Icons";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useSelector } from "react-redux";
const columns = [
    {
        title: 'Name',
        dataIndex: 'consumer',
        key: 'consumer',
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount) => (
            <Typography>${Number(amount).toLocaleString('en-US')}</Typography>
        )
    },
    {
        title: '',
        dataIndex: 'entireData',
        key: 'action',
        width: "5%",
        render: () => (
            <span><RightNarrowInCircle /></span>
        )
    },
];
const Report = () => {
    const { event } = useSelector((state) => state.event)
    const cashReportQuery = useQuery({
        queryKey: ['cashReportListPerCompany'],
        queryFn: () => devitrakApi.post('/cash-report/cash-reports', {
            event: event.eventInfoDetail.eventName,
            company: event.company
        })
    })
    if (cashReportQuery.data) {
        const sourceReportData = () => {
            const result = new Set()
            if (cashReportQuery.data.data.report) {
                const report = cashReportQuery?.data?.data?.report
                for (let data of report) {
                    result.add({
                        key: data.id,
                        consumer: data.attendee,
                        amount: data.amount,
                        entireData: data
                    })
                }
                return Array.from(result)
            }
            return []
        }
        return (
            <Grid container>
                <Grid style={{
                    borderTop: '1px solid var(--gray-200, #eaecf0)',
                    borderLeft: '1px solid var(--gray-200, #eaecf0)',
                    borderRight: '1px solid var(--gray-200, #eaecf0)',
                    borderRadius: '12px 12px 0 0',
                    padding: "12px",
                    marginBottom: "-5px"
                }} item xs={12} sm={12} md={12} lg={12}>
                    <Typography style={{
                        color: 'var(--Gray-900, #101828)',
                        fontFamily: 'Inter',
                        fontSize: '19px',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        lineHeight: '28px',
                        width: "100%",
                        textAlign: "left"
                    }}>Cash receipts</Typography>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Table className="table-ant-customized" columns={columns} dataSource={sourceReportData()} pagination={{
                        position: 'bottomCenter',
                    }} />
                </Grid>
            </Grid>
        )

    }
}

export default Report