import { Avatar, Card } from 'antd'

const CARD_STYLE = {
  borderRadius: '12px',
  border: '1px solid var(--gray-200, #EAECF0)',
  background: 'var(--base-white, #FFF)',
  boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)',
  cursor: 'pointer',
  height: '100%',
}

const CardEventsFound = ({ props, fn }) => {
  const initials = String(props.eventName)
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      onClick={() => fn(props)}
      style={CARD_STYLE}
      styles={{ body: { padding: '16px 20px 20px' } }}
    >
      <Avatar
        src={props.data.eventInfoDetail?.logo}
        style={{ width: '3.5rem', height: '3.5rem', marginBottom: '12px', display: 'block' }}
      >
        {!props.data.eventInfoDetail?.logo && initials}
      </Avatar>
      <p style={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 600, lineHeight: '24px', color: 'var(--gray-900, #101828)', textWrap: 'pretty', marginBottom: '4px' }}>
        {props.eventName}
      </p>
      <p style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: 'var(--gray-500, #667085)', overflowWrap: 'anywhere', textWrap: 'pretty', margin: 0 }}>
        {props.address}
      </p>
    </Card>
  )
}

export default CardEventsFound
