import { Select } from "antd";
import PropTypes from "prop-types";
import { AntSelectorStyle } from "../../../../../../../../styles/global/AntSelectorStyle";
import { formatCurrency } from "../../../../utils/lostFee";
import { serialRangeLabel } from "../../../../utils/serialRange";
import "../../../../consumerDetail.css";

/**
 * Pick a device type, and say plainly what is available in it.
 *
 * This is where `RRRRRNaN` came from. The old screens rendered availability as
 * a reconstructed range:
 *
 *     Number("RRRRR001")                        // NaN
 *     String(NaN).padStart(ref.length, ref[0])  // "RRRRRNaN"
 *     → "Range of serial number for selected item: RRRRRNaN - RRRRRNaN"
 *
 * and when nothing was available they returned `{ min: 0, max: 0 }`, which
 * rendered as "0 - 0" and read like a real range of serials.
 *
 * Now the count leads — that is the number that decides whether you can serve
 * the consumer at all — and the range is shown as the actual first and last
 * strings from inventory, never rebuilt from arithmetic.
 */
const DeviceTypePicker = ({
  options,
  value,
  onChange,
  availableSerials,
  disabled,
}) => {
  const range = serialRangeLabel(availableSerials);
  const selected = options.find((option) => option.group === value);

  return (
    <div className="txn__col">
      <label className="txn__label" htmlFor="txn-device-type">
        Device type
      </label>
      <Select
        id="txn-device-type"
        showSearch
        disabled={disabled}
        style={{ ...AntSelectorStyle, width: "100%" }}
        placeholder="Choose the device the consumer is taking"
        value={value ?? undefined}
        onChange={onChange}
        optionFilterProp="label"
        filterSort={(a, b) =>
          String(a?.label ?? "").localeCompare(String(b?.label ?? ""))
        }
        // The value is the group name, not a JSON blob. Every one of the old
        // screens stringified the whole setup object into the Select's value and
        // JSON.parse'd it back out on each render — including inside a
        // useCallback that threw when nothing was selected yet.
        options={options.map((option) => ({
          label: option.group,
          value: option.group,
        }))}
      />

      {value && (
        <p
          className={`txn__availability${
            range.count === 0 ? " txn__availability--empty" : ""
          }`}
        >
          {range.count === 0 ? (
            <span>
              No <strong>{value}</strong> is free at this event right now.
            </span>
          ) : (
            <>
              <span>
                <strong>{range.count}</strong> available
              </span>
              <span>·</span>
              <span>
                <code>{range.min}</code>
                {range.min !== range.max && (
                  <>
                    {" – "}
                    <code>{range.max}</code>
                  </>
                )}
              </span>
              {selected?.value ? (
                <>
                  <span>·</span>
                  <span>{formatCurrency(selected.value)} replacement value</span>
                </>
              ) : null}
            </>
          )}
        </p>
      )}
    </div>
  );
};

DeviceTypePicker.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      group: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  availableSerials: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
};

DeviceTypePicker.defaultProps = {
  value: null,
  availableSerials: [],
  disabled: false,
};

export default DeviceTypePicker;
