import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { useStatusNotification } from "../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import ModalUX from "../../../components/UX/modal/ModalUX";
import { onAddCustomerInfo } from "../../../store/slices/customerSlice";
import { onAddCustomer } from "../../../store/slices/stripeSlice";
import "../../../styles/global/actionForm.css";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import {
  EMPTY_NEW_CONSUMER_FORM,
  buildEventOptions,
  buildExistingConsumerPatch,
  buildNewConsumerProfile,
  buildSqlConsumerPayload,
  isAlreadyInEvent,
  newConsumerFieldErrors,
} from "./newConsumerForm";

const QUICK_GLANCE_PATH = "/events/event-quickglance";

/* ModalUX defaults to 1000px, which for four fields is a band of empty space.
   560 leaves ~512px of content: two grid columns, not the three that would put
   an empty cell beside the two name fields. */
const MODAL_WIDTH = 560;

const TEXT_FIELDS = [
  { key: "firstName", label: "First name", placeholder: "Ada" },
  { key: "lastName", label: "Last name", placeholder: "Lovelace" },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "name@company.com",
    wide: true,
  },
];

const phoneInputStyle = {
  ...OutlinedInputStyle,
  padding: "0px 20px",
  width: "100%",
  boxShadow: "rgba(16, 24, 40, 0.05) 1px 1px 2px",
  border: "solid 0.1px rgba(16,24,40,0.2)",
};

const phoneErrorStyle = { ...phoneInputStyle, border: "solid 1px #D92D20" };

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * Adding a consumer, from the consumer list or from inside an event.
 *
 * It was eleven inline style objects over a flat form: the modal title said
 * "Add new consumer." and so did the submit button, the labels were a `<p>`
 * wrapped in an `InputLabel` with no `htmlFor`, and the "Event assigned to"
 * cell rendered *both* an antd `Select` fed MUI `MenuItem` children *and* a
 * read-only `OutlinedInput`, one of the two hidden with `display: none`
 * depending on the pathname. The chosen event travelled as a JSON string
 * through a DOM value.
 *
 * It is two numbered steps now — who they are, which event — with each message
 * under the field it is about. The event step states the event when you are
 * already inside one instead of rendering a disabled copy of a control.
 *
 * What it sends is unchanged: the three bodies come from newConsumerForm.js and
 * are pinned there by tests, including the trailing null the patch has always
 * carried when no event is picked.
 */
export const CreateNewConsumer = ({ createUserButton, setCreateUserButton }) => {
  const [form, setForm] = useState({ ...EMPTY_NEW_CONSUMER_FORM });
  const [selectedEventOption, setSelectedEventOption] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");

  const { event, eventsPerAdmin } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const insideEvent = location.pathname === QUICK_GLANCE_PATH;
  const activeEvents = useMemo(
    () => eventsPerAdmin?.active ?? [],
    [eventsPerAdmin]
  );

  const eventOptions = useMemo(
    () => buildEventOptions(activeEvents),
    [activeEvents]
  );

  /* Inside an event the target is not a choice. It is still resolved against
     the admin's active events rather than taken from the selected event
     directly, because the payload needs that record's id. */
  const eventInScope = useMemo(() => {
    if (!insideEvent) return selectedEventOption?.event ?? null;
    return (
      activeEvents.find(
        (item) =>
          item?.eventInfoDetail?.eventName === event?.eventInfoDetail?.eventName
      ) ?? null
    );
  }, [insideEvent, selectedEventOption, activeEvents, event]);

  const fieldErrors = newConsumerFieldErrors(form);
  const errorCount = Object.keys(fieldErrors).length;
  const errorFor = (key) => (submitAttempted ? fieldErrors[key] : undefined);

  const update = (key) => (eventOrValue) =>
    setForm((current) => ({
      ...current,
      [key]: eventOrValue?.target ? eventOrValue.target.value : eventOrValue,
    }));

  const closeModal = () => {
    setForm({ ...EMPTY_NEW_CONSUMER_FORM });
    setSelectedEventOption(null);
    setSubmitAttempted(false);
    setFailure("");
    setCreateUserButton(false);
  };

  const fail = (detail) => {
    setFailure(detail);
    setSaving(false);
  };

  /* The list behind the modal. These used to be one call passing three names as
     a single key — ["listOfConsumers", "attendeesList", "consumersList"] is one
     hierarchical key that matches no query, so a consumer you had just added
     was missing from the table until a reload. The sibling modals
     (AddNoteModal, EditCOnsumerInfoModal) invalidate them one at a time. */
  const refreshConsumerLists = () => {
    queryClient.invalidateQueries({ queryKey: ["listOfConsumers"], exact: true });
    queryClient.invalidateQueries({ queryKey: ["consumersList"], exact: true });
  };

  const afterConsumerSaved = (consumer) => {
    if (!insideEvent) return closeModal();
    const formatted = { ...consumer, uid: consumer.id ?? consumer.uid };
    dispatch(onAddCustomerInfo(formatted));
    dispatch(onAddCustomer(formatted));
    ["transactionsList", "listOfDevicesAssigned", "listOfNoOperatingDevices"].forEach(
      (key) => queryClient.invalidateQueries({ queryKey: [key] })
    );
    return navigate(
      `/events/event-attendees/${formatted.uid}/transactions-details`
    );
  };

  const createConsumer = async () => {
    const created = await devitrakApi.post(
      "/auth/new",
      buildNewConsumerProfile({ form, user, event: eventInScope })
    );
    if (!created.data) {
      return fail("The consumer could not be created. Nothing was saved — try again.");
    }
    await devitrakApi.post(
      "/db_consumer/new_consumer",
      buildSqlConsumerPayload(form)
    );
    refreshConsumerLists();
    notify("success", `${form.firstName} ${form.lastName} was added.`);
    setSaving(false);
    return afterConsumerSaved(created.data);
  };

  const attachExistingConsumer = async (existing) => {
    const who = `${form.firstName} ${form.lastName} (${form.email})`;
    if (isAlreadyInEvent(existing, eventInScope)) {
      notify("info", `${who} is already in the event/company record.`);
      setSaving(false);
      return afterConsumerSaved(existing);
    }
    const updated = await devitrakApi.patch(
      `/auth/${existing.id}`,
      buildExistingConsumerPatch({ existing, form, user, event: eventInScope })
    );
    if (!updated.data) {
      return fail(
        `${who} is already on record, but the update did not go through. Try again.`
      );
    }
    refreshConsumerLists();
    notify(
      "success",
      eventInScope
        ? `${who} was already on record and has been added to ${eventInScope.eventInfoDetail.eventName}.`
        : `${who} was already on record and their details have been updated.`
    );
    setSaving(false);
    return afterConsumerSaved(existing);
  };

  /* Same sequence as before: look the email up first, then either attach the
     record that came back or create a new one. */
  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setFailure("");
    if (errorCount > 0) return;
    setSaving(true);
    try {
      const lookup = await devitrakApi.post("/auth/user-query", {
        email: form.email,
      });
      if (!lookup.data?.ok) {
        return fail(
          "The consumer record could not be checked, so nothing was created. Try again."
        );
      }
      const found = lookup.data.users ?? [];
      if (found.length > 0) return await attachExistingConsumer(found.at(-1));
      return await createConsumer();
    } catch (error) {
      return fail(error.message);
    }
  };

  const detailsDone =
    Boolean(form.firstName && form.lastName && form.email && form.phoneNumber) &&
    errorCount === 0;

  const eventStepDone = insideEvent
    ? Boolean(eventInScope)
    : Boolean(selectedEventOption);

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">Add a consumer</h2>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      {contextHolder}

      <p className="action-form__lead">
        Four details create a consumer. If the email is already on record, that
        consumer is added here instead of a second one being created.
      </p>

      <section className={stepClass(detailsDone)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            Who they are
          </h3>
        </div>

        <div className="action-form__grid">
          {TEXT_FIELDS.map((field) => (
            <div
              className={`action-form__field${field.wide ? " action-form__field--wide" : ""}`}
              key={field.key}
            >
              <Label htmlFor={field.key}>{field.label} *</Label>
              <Input
                id={field.key}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={update(field.key)}
                disabled={saving}
                error={Boolean(errorFor(field.key))}
              />
              {errorFor(field.key) && (
                <p className="action-form__feedback action-form__feedback--error">
                  {errorFor(field.key)}
                </p>
              )}
            </div>
          ))}

          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="phoneNumber">Phone number *</Label>
            <PhoneInput
              id="phoneNumber"
              countrySelectProps={{ unicodeFlags: true }}
              defaultCountry="US"
              placeholder="(555) 000-0000"
              disabled={saving}
              style={errorFor("phoneNumber") ? phoneErrorStyle : phoneInputStyle}
              value={form.phoneNumber}
              onChange={update("phoneNumber")}
            />
            {errorFor("phoneNumber") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("phoneNumber")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={stepClass(eventStepDone)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            Which event
          </h3>
          {!insideEvent && (
            <span className="action-form__step-note">Optional</span>
          )}
        </div>

        {insideEvent ? (
          eventInScope ? (
            <p className="action-form__banner action-form__banner--info">
              They are added to{" "}
              <strong>{eventInScope.eventInfoDetail.eventName}</strong>, the
              event you are looking at.
            </p>
          ) : (
            <p className="action-form__banner action-form__banner--warning">
              <strong>
                {event?.eventInfoDetail?.eventName ?? "This event"}
              </strong>{" "}
              is not among your active events, so the consumer is created
              without an event attached.
            </p>
          )
        ) : (
          <div className="action-form__field">
            <SelectComponent
              label="Event"
              placeholder="Search an active event"
              items={eventOptions}
              value={selectedEventOption}
              onSelect={setSelectedEventOption}
            />
            <p className="action-form__step-note">
              Leave this out and the consumer is created without an event.
            </p>
          </div>
        )}
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
          {insideEvent
            ? "Saving opens their transactions for this event."
            : "Saving adds them to the consumer list."}
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          func={closeModal}
          isDisabled={saving}
        />
        <BlueButtonComponent
          title="Add consumer"
          buttonType="button"
          func={handleSubmit}
          isDisabled={saving}
          isLoading={saving}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      openDialog={createUserButton}
      closeModal={closeModal}
      body={bodyModal()}
      width={MODAL_WIDTH}
    />
  );
};

CreateNewConsumer.propTypes = {
  createUserButton: PropTypes.bool.isRequired,
  setCreateUserButton: PropTypes.func.isRequired,
};
