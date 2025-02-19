import { Avatar, Card } from 'antd'
const CardEventsFound = ({ props, fn }) => {
    const subs = String(props.eventName).split(' ')
    const initials = [...subs.map(item => item[0])].toString().toUpperCase().replaceAll(',', '')
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
            height:"100%",
            gap: '20px',
            cursor: "pointer"
        }}
            styles={{
                body: {
                    padding: '5px 20px 20px 20px',
                }
            }}>
            <div style={{ width: "100%", textAlign: "left" }}><Avatar src={props.data.eventInfoDetail?.logo} style={{ width: "5rem", height: "5rem", margin: "0 0 1rem 0" }}>{!props.data.eventInfoDetail.logo && initials}</Avatar></div>
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
                <p style={{
                    width: "100%",
                    textAlign: "left",
                    color: 'var(--Gray-900, #101828)',
                    fontFamily: 'Inter',
                    fontSize: '18px',
                    fontStyle: ' normal',
                    fontWeight: 600,
                    lineHeight: '28px', /* 155.556% */
                    textWrap: "pretty"
                }}>{props.eventName}</p>
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
            }}><p style={{
                width: "100%",
                textAlign: "left",
                color: 'var(--Gray-600, #475467)',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '24px', /* 150% */
                textWrap: "pretty",
                overflowWrap: "anywhere",
      
            }}>{props.address}</p></div>
        </Card >
    )
}

export default CardEventsFound