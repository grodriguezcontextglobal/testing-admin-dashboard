import { Card } from 'antd'
const CardDeviceFound = ({ props, fn }) => {
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
            cursor: "pointer"
        }}
            styles={{
                body: {
                    padding: '5px 20px 20px 20px',
                }
            }}>
            <div style={{ width: "100%", textAlign: "left" }}>
                    {
                        props.image ?
                            <img src={props?.image} alt={`${props?.image}`} style={{ objectFit: "cover",  height: "auto", width: "70%" }} /> :
                            ''
                    }
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
                textWrap: "pretty"
            }}>
                {props?.serialNumber}
            </div>
            <div style={{
                width: "100%",
                textAlign: "left",
                color: 'var(--Gray-600, #475467)',
                fontFamily: 'Inter',
                fontSize: '16px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '24px', /* 150% */
                textWrap: "pretty"
            }}>{props?.type}</div>
        </Card >
    )
}

export default CardDeviceFound