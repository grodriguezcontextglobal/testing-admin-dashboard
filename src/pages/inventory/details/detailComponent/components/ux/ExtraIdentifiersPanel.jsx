import { Icon } from "@iconify/react";
import PropTypes from "prop-types";
import { useState } from "react";

import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../../components/UX/inputs/Input";
import Label from "../../../../../../components/UX/inputs/Label";
import { validateNewIdentifier } from "../../../../utils/extraIdentifiers";

/**
 * The identifiers an item carries beyond its serial number.
 *
 * The panel this replaces had the list itself behind the "Add more information"
 * button, so an item that already carried an IMEI showed nothing at all until
 * you clicked a button that said you were adding one. You could not read what
 * was there without pretending to write.
 *
 * So the list is always on, and the form is the thing that opens. What is
 * recorded is a fact about the item; adding to it is an action, and only the
 * action needs a button.
 *
 * The entries used to render as MUI Chips labelled `key:value` — one flat
 * string, in a row that did not wrap and had no gap, so three identifiers
 * squashed into each other and none of them could be scanned. A stored
 * identifier has two halves that are read differently: the name is a label you
 * skim, the value is a code you compare character by character. They get
 * different weights and the value gets a monospace face.
 */
const ExtraIdentifiersPanel = ({ entries, onAdd, onRemove, disabled }) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);

  const list = Array.isArray(entries) ? entries : [];

  const reset = () => {
    setName("");
    setValue("");
    setError(null);
  };

  const submit = () => {
    const verdict = validateNewIdentifier({ name, value, existing: list });
    if (!verdict.ok) return setError(verdict.reason);
    onAdd({ name, value });
    reset();
  };

  /* Enter submits the row. Two boxes and a button is a form, and a form that
     needs the mouse for its last step is slower than the typing that filled
     it. */
  const onKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submit();
  };

  return (
    <section className="identifiers">
      <header className="identifiers__head">
        <div>
          <p className="identifiers__title">
            Extra identifiers
            {list.length > 0 && (
              <span className="identifiers__count">{list.length}</span>
            )}
          </p>
          <p className="identifiers__lead">
            Anything else that names this exact unit — an IMEI, a MAC address,
            an asset tag. The serial number is already recorded.
          </p>
        </div>
        {!adding && (
          <GrayButtonComponent
            title="Add identifier"
            buttonType="button"
            size="sm"
            disabled={disabled}
            func={() => setAdding(true)}
          />
        )}
      </header>

      {list.length === 0 && !adding && (
        <p className="identifiers__empty">
          None recorded. The serial number identifies this unit on its own.
        </p>
      )}

      {list.length > 0 && (
        <ul className="identifiers__list">
          {list.map((entry, index) => (
            <li className="identifiers__row" key={`${entry.keyObject}-${index}`}>
              <div className="identifiers__pair">
                <span className="identifiers__name">{entry.keyObject}</span>
                <span className="identifiers__value">{entry.valueObject}</span>
              </div>
              <button
                type="button"
                className="identifiers__remove"
                aria-label={`Remove ${entry.keyObject}`}
                onClick={() => onRemove(index)}
                disabled={disabled}
              >
                <Icon icon="tabler:trash" width={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="identifiers__form">
          <div className="identifiers__field">
            <Label htmlFor="identifier-name" required>
              Name
            </Label>
            <Input
              id="identifier-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              onKeyDown={onKeyDown}
              placeholder="IMEI"
              disabled={disabled}
              autoFocus
              fullWidth
            />
          </div>
          <div className="identifiers__field">
            <Label htmlFor="identifier-value" required>
              Value
            </Label>
            <Input
              id="identifier-value"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              onKeyDown={onKeyDown}
              placeholder="356378100123456"
              disabled={disabled}
              fullWidth
            />
          </div>
          <div className="identifiers__actions">
            <GrayButtonComponent
              title="Cancel"
              buttonType="button"
              size="sm"
              func={() => {
                reset();
                setAdding(false);
              }}
            />
            <BlueButtonComponent
              title="Add"
              buttonType="button"
              size="sm"
              disabled={disabled}
              func={submit}
            />
          </div>
          {error && <p className="identifiers__error">{error}</p>}
        </div>
      )}
    </section>
  );
};

ExtraIdentifiersPanel.propTypes = {
  entries: PropTypes.array,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ExtraIdentifiersPanel.defaultProps = {
  entries: [],
  disabled: false,
};

export default ExtraIdentifiersPanel;
