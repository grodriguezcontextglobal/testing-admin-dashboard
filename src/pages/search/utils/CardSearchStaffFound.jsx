import { Typography } from '@mui/material'
import { Avatar, Card } from 'antd'
import { Subtitle } from '../../../styles/global/Subtitle'
const CardSearchStaffFound = ({ props, fn }) => {
  return (
    <Card onClick={() => fn(props)} style={{
      borderRadius: '12px',
      border: '1px solid #D0D5DD',
      backgroundColor: '#FFF',
      boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      padding: '5px',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '20px',
      cursor: "pointer",
      height:"100%"
    }}
      styles={{
        body: {
          padding: '5px 20px 20px 20px',
        }
      }}
    >
      <div style={{ width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Avatar src={props?.other?.imageProfile} style={{ width: "5rem", height: "5rem", margin: "0 0 1rem 0" }}>
          {
            !props?.other &&
            props?.name[0]}{props?.lastName[0]
          }
        </Avatar>
        <Typography style={{...Subtitle, display:`${String(props?.other?.status).toLowerCase() !== "confirmed" ? "flex" :"none"}`, color:"red", textDecoration:"underline"}}>
          {props?.status}
        </Typography>
      </div>
      <div style={{
        width: "100%",
        textAlign: "left",
        color: 'var(--Gray-900, #101828)',
        fontFamily: 'Inter',
        fontSize: '18px',
        fontStyle: ' normal',
        fontWeight: 600,
        lineHeight: '28px', /* 155.556% */
      }}>
        {props?.name} {props?.lastName}
      </div>
      <div style={{
        width: "100%",
        textAlign: "left",
        color: 'var(--Primary-700, #6941C6)',
        fontFamily: 'Inter',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: 400,
        lineHeight: '24px', /* 150% */
        textWrap: "pretty"
      }}>
        <p style={{
          width: "100%",
          textAlign: "left",
          fontFamily: 'Inter',
          fontSize: '16px',
          fontStyle: 'normal',
          fontWeight: 400,
          lineHeight: '24px', /* 150% */
          textWrap: "pretty"
        }}>
          {props?.email}
        </p>
      </div>
      <div style={{
        width: "100%",
        textAlign: "left",
        color: 'var(--Gray-600, #475467)',
        fontFamily: 'Inter',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: 400,
        lineHeight: '24px' /* 150% */
      }}>{props?.phoneNumber ?? '000-000-0000'}</div>
    </Card>
  )
}

export default CardSearchStaffFound