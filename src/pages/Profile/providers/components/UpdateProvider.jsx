import PropTypes from "prop-types";
import { useState } from "react";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../../components/UX/dropdown/SelectComponent";
import Input from "../../../../components/UX/inputs/Input";
import Label from "../../../../components/UX/inputs/Label";
import ModalUX from "../../../../components/UX/modal/ModalUX";
import "../../../../styles/global/actionForm.css";
import { emptyProviderForm, providerFieldErrors } from "../utils/providerForm";

const MODAL_WIDTH = 640;

const STATUS_OPTIONS = [
  { id: "active", label: "Active", supportingText: "Available to order from" },
  { id: "inactive", label: "Inactive", supportingText: "Kept on record, not in use" },
  { id: "pending", label: "Pending", supportingText: "Not approved yet" },
];

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * The supplier form, for adding one and for editing one.
 *
 * It was a flat column of ten placeholder-only boxes under three group labels:
 * one "Address" label above four inputs, one "Contact Information" above four
 * more. Nothing carried a `htmlFor`, so no label belonged to any field — once
 * you had typed, the screen no longer said which box was the state and which
 * was the ZIP.
 *
 * The Save button was disabled on ten conditions with nothing explaining which
 * one was unmet, and two of the ten — `industry` and `services` — have no
 * control on this form at all: they are seeded with a placeholder because the
 * endpoint requires them. So the button could sit greyed out with every visible
 * field complete. It is enabled now, and pressing it names what is missing on
 * the field it is missing from.
 *
 * `dialogMode`, `handleInputChange` and `handleSubmit` keep the same contract,
 * so both callers work unchanged. `isSaving` and `failure` are optional: a
 * caller that tracks them gets a spinner and an inline error, one that does not
 * behaves as before.
 */
const UpdateProvider = ({
  openDialog,
  setOpenDialog,
  newProvider,
  handleInputChange,
  handleSubmit,
  dialogMode,
  setNewProvider,
  isSaving = false,
  failure = "",
}) => {
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isAdding = dialogMode === "add";
  const errors = providerFieldErrors(newProvider);
  const errorCount = Object.keys(errors).length;
  const errorFor = (name) => (submitAttempted ? errors[name] : undefined);

  const closeModal = () => {
    setSubmitAttempted(false);
    setOpenDialog(false);
    setNewProvider(emptyProviderForm());
  };

  /* The parent's own handler already gates on the same rules and, when they are
     unmet, returns without a word. Stopping here means the reader is told. */
  const attemptSubmit = () => {
    setSubmitAttempted(true);
    if (errorCount > 0) return undefined;
    return handleSubmit();
  };

  /* Synthesised to match what a MUI Select's onChange used to hand the parent,
     so `handleInputChange` needs no change. */
  const pickStatus = (option) =>
    handleInputChange({
      target: { name: "status", value: option?.id ?? "active" },
    });

  const field = ({ name, label, placeholder, type, wide, optional }) => (
    <div
      className={`action-form__field${wide ? " action-form__field--wide" : ""}`}
      key={name}
    >
      <Label htmlFor={name}>
        {label}
        {optional ? "" : " *"}
      </Label>
      <Input
        id={name}
        name={name}
        type={type ?? "text"}
        placeholder={placeholder}
        value={name.split(".").reduce((step, part) => step?.[part], newProvider) ?? ""}
        onChange={handleInputChange}
        disabled={isSaving}
        error={Boolean(errorFor(name))}
      />
      {errorFor(name) && (
        <p className="action-form__feedback action-form__feedback--error">
          {errorFor(name)}
        </p>
      )}
    </div>
  );

  const companyDone = Boolean(String(newProvider?.companyName ?? "").trim());
  const addressDone = !["street", "city", "state", "postalCode"].some(
    (part) => errors[`address.${part}`]
  );
  const contactDone = !["name", "email", "phone"].some(
    (part) => errors[`contactInfo.${part}`]
  );

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">
        {isAdding ? "Add a supplier" : "Edit supplier"}
      </h2>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      <p className="action-form__lead">
        {isAdding
          ? "A supplier is who inventory is rented or bought from. Three things are needed: who they are, where they are, and who to talk to."
          : "Changes apply to this supplier everywhere it is referenced."}
      </p>

      <section className={stepClass(companyDone)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            The company
          </h3>
        </div>
        <div className="action-form__grid">
          {field({
            name: "companyName",
            label: "Company name",
            placeholder: "Acme Supplies",
            wide: true,
          })}
          <div className="action-form__field action-form__field--wide">
            <SelectComponent
              label="Status"
              placeholder="Select a status"
              items={STATUS_OPTIONS}
              value={
                STATUS_OPTIONS.find((option) => option.id === newProvider?.status) ??
                null
              }
              onSelect={pickStatus}
            />
          </div>
        </div>
      </section>

      <section className={stepClass(addressDone)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            Where they are
          </h3>
        </div>
        <div className="action-form__grid">
          {field({
            name: "address.street",
            label: "Street",
            placeholder: "1 Main St",
            wide: true,
          })}
          {field({ name: "address.city", label: "City", placeholder: "Austin" })}
          {field({ name: "address.state", label: "State", placeholder: "TX" })}
          {field({
            name: "address.postalCode",
            label: "ZIP / postal code",
            placeholder: "78701",
          })}
          {field({
            name: "address.country",
            label: "Country",
            placeholder: "USA",
            optional: true,
            wide: true,
          })}
        </div>
      </section>

      <section className={stepClass(contactDone)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">3</span>
            Who to contact
          </h3>
          <span className="action-form__step-note">
            The person you deal with, not the company switchboard
          </span>
        </div>
        <div className="action-form__grid">
          {field({
            name: "contactInfo.name",
            label: "Contact name",
            placeholder: "Ada Lovelace",
          })}
          {field({
            name: "contactInfo.phone",
            label: "Phone",
            placeholder: "(555) 000-0000",
          })}
          {field({
            name: "contactInfo.email",
            label: "Email",
            type: "email",
            placeholder: "ada@acme.com",
            wide: true,
          })}
          {field({
            name: "contactInfo.website",
            label: "Website",
            placeholder: "acme.com",
            optional: true,
            wide: true,
          })}
        </div>
      </section>

      {failure && <p className="action-form__notice">{failure}</p>}

      {submitAttempted && errorCount > 0 && (
        <p className="action-form__notice">
          {errorCount} field{errorCount === 1 ? " needs" : "s need"} filling in
          above.
        </p>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          {isAdding
            ? "The supplier becomes selectable wherever inventory names an owner."
            : "Saving updates the record for everyone in the company."}
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          func={closeModal}
          isDisabled={isSaving}
        />
        <BlueButtonComponent
          title={isAdding ? "Add supplier" : "Save changes"}
          buttonType="button"
          func={attemptSubmit}
          isDisabled={isSaving}
          isLoading={isSaving}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      body={bodyModal()}
      openDialog={openDialog}
      closeModal={closeModal}
      width={MODAL_WIDTH}
    />
  );
};

UpdateProvider.propTypes = {
  openDialog: PropTypes.bool,
  setOpenDialog: PropTypes.func.isRequired,
  newProvider: PropTypes.object,
  handleInputChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  dialogMode: PropTypes.string,
  setNewProvider: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  failure: PropTypes.string,
};

export default UpdateProvider;
