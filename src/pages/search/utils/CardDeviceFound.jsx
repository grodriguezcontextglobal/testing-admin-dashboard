import { PropTypes } from 'prop-types'
import { BadgeWithDot } from '../../../components/base/badges/badges'
import { GeneralDeviceIcon } from '../../../components/icons/GeneralDeviceIcon'
import BlueButtonComponent from '../../../components/UX/buttons/BlueButton'
// import DangerButtonConfirmationComponent from '../../../components/UX/buttons/DangerButtonConfirmation'
import ReusableCardWithHeaderAndFooter from '../../../components/UX/cards/ReusableCardWithHeaderAndFooter'

const FIELD_LABEL = {
  fontFamily: 'Inter',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '18px',
  color: 'var(--gray-500, #667085)',
  marginBottom: '2px',
}

const FIELD_VALUE = {
  fontFamily: 'Inter',
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '20px',
  color: 'var(--gray-900, #101828)',
  textWrap: 'pretty',
  overflowWrap: 'anywhere',
}

// eslint-disable-next-line no-unused-vars
const CardDeviceFound = ({ props, fn, returnFn, loadingStatus, returnLoading }) => (
  <ReusableCardWithHeaderAndFooter
    key={props.data?.id}
    title={
      <span style={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 600, lineHeight: '24px', color: 'var(--gray-900, #101828)' }}>
        {props?.type}
      </span>
    }
    actions={[
      <div
        key={props.data?.id}
        style={{ display: 'flex', gap: '8px', padding: '0 16px', width: '100%' }}
      >
        <BlueButtonComponent
          title="Details"
          func={() => fn(props)}
          buttonType="button"
          loadingState={loadingStatus}
          size="sm"
        />
        {/* <DangerButtonConfirmationComponent
          loadingState={returnLoading}
          func={() => returnFn(props)}
          title="Return"
          confirmationTitle="Return this device?"
          size="sm"
        /> */}
      </div>,
    ]}
  >
    <div style={{ paddingTop: '8px' }}>
      {props.image ? (
        <img
          src={props.image}
          alt={props.serialNumber}
          style={{ objectFit: 'cover', height: 'auto', width: '60%', marginBottom: '12px', display: 'block' }}
        />
      ) : (
        <div style={{ marginBottom: '12px' }}>
          <GeneralDeviceIcon dimensions={{ width: '100px', height: 'auto' }} />
        </div>
      )}

      <div style={{ marginBottom: '8px' }}>
        <p style={FIELD_LABEL}>Serial number</p>
        <p style={FIELD_VALUE}>{props?.serialNumber}</p>
      </div>

      {/* A unit on the shelf has no event, so the row says where it is instead
          of printing an empty Event field under a heading. */}
      <div style={{ marginBottom: '12px' }}>
        <p style={FIELD_LABEL}>{props.inWarehouse ? 'Location' : 'Event'}</p>
        <p style={{ ...FIELD_VALUE, fontSize: '13px' }}>
          {props.inWarehouse ? props?.location || '—' : props?.event}
        </p>
      </div>

      {/* Three states, not two: in someone's hands, in an event's pool, or in
          stock. Labelling a warehouse unit "In event's stock" would be wrong
          about the one thing the search was asked. */}
      {props.inWarehouse ? (
        <BadgeWithDot color="blue" size="sm">
          In warehouse
        </BadgeWithDot>
      ) : (
        <BadgeWithDot color={props.active ? 'orange' : 'success'} size="sm">
          {props.active ? 'In transaction' : "In event's stock"}
        </BadgeWithDot>
      )}
    </div>
  </ReusableCardWithHeaderAndFooter>
)

export default CardDeviceFound

CardDeviceFound.propTypes = {
  props: PropTypes.object.isRequired,
  fn: PropTypes.func,
  returnFn: PropTypes.func,
  loadingStatus: PropTypes.bool,
  returnLoading: PropTypes.bool,
}
