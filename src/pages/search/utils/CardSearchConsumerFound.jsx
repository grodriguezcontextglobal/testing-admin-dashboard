import { Avatar, Card } from 'antd'
const CardSearchConsumersFound = ({ props, fn }) => {
  return (
    <Card onClick={() => fn(props)} style={{
      borderRadius: '12px',
      border: '1px solid #D0D5DD',
      background: '#FFF',
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
          padding: '5px 10px 20px 20px',
        }
      }}
    >
      <div style={{ width: "100%", textAlign: "left" }}><Avatar src={props?.profile_picture} style={{ width: "5rem", height: "5rem", margin: "0 0 1rem 0" }}>{props.name[0]}{props.lastName[0]}</Avatar></div>
      <div style={{
        width: "100%",
        textAlign: "left",
        color: 'var(--Gray-900, #101828)',
        fontFamily: 'Inter',
        fontSize: '18px',
        fontStyle: ' normal',
        fontWeight: 600,
        lineHeight: '28px', /* 155.556% */
        textWrap: "pretty"
      }}>
        {props.name} {props.lastName}
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
          textWrap: "pretty",
          overflowWrap: "anywhere",
        }}>
          {props.email}
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
      }}>{props.phoneNumber ?? '000-000-0000'}</div>
    </Card>
  )
}

export default CardSearchConsumersFound