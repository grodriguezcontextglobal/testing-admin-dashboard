import { Table } from "antd"
import '../../../../../styles/global/ant-table.css'
import { useSelector } from "react-redux"
import { devitrakApi } from "../../../../../api/devitrakApi"
import { useQuery } from "@tanstack/react-query"
import { Icon } from "@iconify/react"
import { Typography } from "@mui/material"
const StaffTable = ({ searching }) => {
  const { event } = useSelector((state) => state.event)
  const staffEventQuery = useQuery({
    queryKey: ['staffEvent'],
    queryFn: () => devitrakApi.post('/staff/admin-users', {
      company: event.company
    }),
    refetchOnMount: false,
    staleTime: Infinity,
    cacheTime: 1000 * 60 * 60 //oneHourInMs
  })

  if (staffEventQuery.data) {
    const staffMember = new Map()
    const organizeStaff = () => {
      const membersCompany = staffEventQuery.data.data.adminUsers
      for (let data of membersCompany) {
        staffMember.set(data.email, data)
      }
    }
    organizeStaff()
    const dataFoundToRender = () => {
      const result = new Set()
      const admins = event.staff.adminUser
      const assistants = event.staff.headsetAttendees
      if (admins) {
        for (let data of admins) {
          if (staffMember.has(data)) {
            const member = staffMember.get(data)
            result.add({ ...member, name: `${member.name} ${member.lastName}`, role: "Administrator" })
          }

        }
      }
      if (assistants) {
        for (let data of assistants) {
          if (staffMember.has(data)) {
            const member = staffMember.get(data)
            result.add({ ...member, name: `${member.name} ${member.lastName}`, role: "Assistant" })
          }
        }
      }
      return Array.from(result)
    }

    const dataToRender = () => {
      if (!searching || String(searching).length < 1) {
        return dataFoundToRender()
      } else {
        const responding = dataFoundToRender().filter(staff => String(staff.name).toLowerCase().includes(String(searching).toLowerCase()) || String(staff.email).toLowerCase().includes(String(searching).toLowerCase()))
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