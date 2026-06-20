import { Avatar, Card } from 'antd'
import { BadgeWithDot } from '../../../components/base/badges/badges'

const CARD_STYLE = {
  borderRadius: '12px',
  border: '1px solid var(--gray-200, #EAECF0)',
  background: 'var(--base-white, #FFF)',
  boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)',
  cursor: 'pointer',
  height: '100%',
}

const CardSearchStaffFound = ({ props, fn }) => {
  const isPending = String(props?.other?.status ?? '').toLowerCase() !== 'confirmed'
  return (
    <Card
      onClick={() => fn(props)}
      style={CARD_STYLE}
      styles={{ body: { padding: '16px 20px 20px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <Avatar src={props?.other?.imageProfile} style={{ width: '3.5rem', height: '3.5rem' }}>
          {!props?.other?.imageProfile && `${props?.name?.[0] ?? ''}${props?.lastName?.[0] ?? ''}`}
        </Avatar>
        {isPending && (
          <BadgeWithDot color="warning">{props?.status ?? 'Pending'}</BadgeWithDot>
        )}
      </div>
      <p style={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 600, lineHeight: '24px', color: 'var(--gray-900, #101828)', textWrap: 'pretty', marginBottom: '4px' }}>
        {props?.name} {props?.lastName}
      </p>
      <p style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: 'var(--Primary-700, #6941C6)', overflowWrap: 'anywhere', textWrap: 'pretty', marginBottom: '4px' }}>
        {props?.email}
      </p>
      <p style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 400, lineHeight: '20px', color: 'var(--gray-500, #667085)', margin: 0 }}>
        {props?.phoneNumber ?? '—'}
      </p>
    </Card>
  )
}

export default CardSearchStaffFound
