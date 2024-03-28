import { Table } from "antd"
import '../../../../../styles/global/ant-table.css'
import { useSelector } from "react-redux"
import { devitrakApi } from "../../../../../api/devitrakApi"
import { useQuery } from "@tanstack/react-query"
import { Icon } from "@iconify/react"
import { Typography } from "@mui/material"
import { useEffect } from "react"
import _ from 'lodash'
const StaffTable = ({ searching }) => {
  const { event } = useSelector((state) => state.event)
  const staffEventQuery = useQuery({
    queryKey: ['staffEvent'],
    queryFn: () => devitrakApi.get('/staff/admin-users'),
    enabled: false,
    refetchOnMount: false,
    staleTime: Infinity,
    cacheTime: 1000 * 60 * 60 //oneHourInMs
  })
  useEffect(() => {
    const controller = new AbortController()
    staffEventQuery.refetch()
    return () => {
      controller.abort()
    }
  }, [])

  if (staffEventQuery.data) {
    const employees = staffEventQuery.data.data.adminUsers
    const groupingEmployees = _.groupBy(employees, 'email')
    const result = new Map()
    const mergeStaffInEvent2 = async () => {
      for (let data of event.staff.adminUser) {
        if (groupingEmployees[data.email]) {
          if (!result.has(data.email)) {
            result.set(data.email, { name: `${data.firstName} ${data.lastName}`, role: "Administrator", online: groupingEmployees[data.email].at(-1).online, email: data.email })
          }
        }
        if (!result.has(data.email)) {
          result.set(data.email, { name: `${data.firstName} ${data.lastName}`, role: "Administrator", online: false, email: data.email })
        }
      }
      for (let data of event.staff.headsetAttendees) {
        if (groupingEmployees[data.email]) {
          if (!result.has(data.email)) {
            result.set(data.email, { name: `${data.firstName} ${data.lastName}`, role: "Assistant", online: groupingEmployees[data.email].at(-1).online, email: data.email })
          }
        }
        if (!result.has(data.email)) {
          result.set(data.email, { name: `${data.firstName} ${data.lastName}`, role: "Assistant", online: false, email: data.email })
        }
      }
    }
    mergeStaffInEvent2()
    const dataToRender = () => {
      if (!searching || String(searching).length < 1) {
        return [...result.values()]
      } else {
        const responding = [...result.values()].filter(staff => String(staff.name).toLowerCase().includes(String(searching).toLowerCase()) || String(staff.email).toLowerCase().includes(String(searching).toLowerCase()))
        return responding
      }
    }
    const columns = [{
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      width: "10%",
      dataIndex: 'online',
      key: 'online',
      render: (online) => (
        <span
          style={{
            borderRadius: "16px",
            justifyContent: "center",
            display: "flex",
            padding: "2px 8px",
            alignItems: "center",
            background: `${online
              ? "var(--success-50, #ECFDF3)"
              : "var(--blue-50, #EFF8FF)"
              }`,
            width: "fit-content",
          }}
        >
          <Typography
            color={`${online
              ? "var(--success-700, #027A48)"
              : "var(--blue-700, #175CD3)"
              }`}
            fontSize={"12px"}
            fontFamily={"Inter"}
            fontStyle={"normal"}
            fontWeight={500}
            lineHeight={"18px"}
            textAlign={"center"}
            textTransform={"capitalize"}
            style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}
          >
            <Icon
              icon="tabler:point-filled"
              rotate={3}
              color={`${online
                ? "#12B76A"
                : "#2E90FA"
                }`}
            />
            {online
              ? "On line"
              : "Off line"}
          </Typography>
        </span>
      )
    },
    {
      title: 'Role',
      width: "20%",
      dataIndex: 'role',
      key: 'role',
    }, {
      title: 'Email',
      width: "25%",
      dataIndex: 'email',
      key: 'email',
    }]
    return (
      <Table pagination={{
        position: 'bottomCenter'
      }} className="table-ant-customized" columns={columns} dataSource={dataToRender()} />
    )
  }

}

export default StaffTable