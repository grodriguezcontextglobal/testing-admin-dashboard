import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { registerStaffActivity } from "../../../../../api/activityLog";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import SelectComponent from "../../../../../components/UX/dropdown/SelectComponent";
import Input from "../../../../../components/UX/inputs/Input";
import Label from "../../../../../components/UX/inputs/Label";
import { getIndustryProfile } from "../../../../../config/industryProfiles";
import "../../../../../styles/global/actionForm.css";
import { calculateStudentAgeFlags } from "../../../utils/ageCalculationUtils";
import { saveGuardian, searchGuardians } from "../../../utils/guardianConsentApi";
import {
  buildExistingGuardianLinkPayload,
  buildGuardianSearchPayload,
  buildNewGuardianLinkPayload,
  extractCreatedMemberId,
  normalizeGuardianEmail,
  selectGuardianByEmail,
} from "../../../utils/guardianConsentUtils";
import {
  EMPTY_SINGLE_MEMBER_FORM,
  buildSingleMemberPayload,
  singleMemberFieldErrors,
} from "../../../utils/singleMemberUtils";

const RELATIONSHIPS = [
  { id: "guardian", label: "Guardian" },
  { id: "mother", label: "Mother" },
  { id: "father", label: "Father" },
  { id: "other", label: "Other" },
];

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * Creating one member.
 *
 * The form was a flat two-column grid of eleven inputs with the validation
 * printed as a list of sentences underneath it — "Phone is required." with no
 * indication of which of the eleven boxes that was. It is grouped now, and each
 * message sits on its own field.
 *
 * The important fix is not cosmetic. Creating a minor is two writes: the member,
 * then the guardian link. When the second failed, the first had already
 * happened — but the form kept its contents and the error said nothing about
 * it, so the natural next move was to press "Create member" again and end up
 * with two of them. The created id is now held, the button changes to finish
 * the link, and the member is never created twice.
 */
const Single = ({ onClose }) => {
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();
  const queryClient = useQueryClient();

  // Industry-adaptive vocabulary/fields: schools show grade/homeroom and call
  // the responsible adult "Parent / Guardian"; other industries hide the school
  // fields and use their own representative label (industryProfiles.js).
  const { fields, representative } = getIndustryProfile(user?.companyData?.industry);
  const isEducation = user?.companyData?.industry === "Education";

  const [form, setForm] = useState({
    ...EMPTY_SINGLE_MEMBER_FORM,
    company_id: user.sqlInfo.company_id,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState(null);
  const [guardianNote, setGuardianNote] = useState(null);

  // Set once the member exists. Everything after this point is the guardian
  // link, and re-running step one would create a duplicate.
  const createdMemberId = useRef(null);

  const ageFlags = useMemo(
    () => calculateStudentAgeFlags(form.date_of_birth),
    [form.date_of_birth]
  );

  const fieldErrors = useMemo(
    () =>
      singleMemberFieldErrors(form, {
        representativeLabel: representative.label,
        requireDob: isEducation,
      }),
    [form, representative.label, isEducation]
  );

  useEffect(() => {
    setForm((previous) => ({ ...previous, company_id: user.sqlInfo.company_id }));
  }, [user.sqlInfo.company_id]);

  const update = (key) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value ?? "";
    setForm((previous) => ({ ...previous, [key]: value }));
    if (key === "parent_guardian_email") setGuardianNote(null);
  };

  const errorFor = (key) => (submitAttempted ? fieldErrors[key] : undefined);

  const clear = () => {
    setForm({ ...EMPTY_SINGLE_MEMBER_FORM, company_id: user.sqlInfo.company_id });
    setSubmitAttempted(false);
    setFailure(null);
    setGuardianNote(null);
    createdMemberId.current = null;
  };

  /* ────────────────────────────────────────────────────── guardian lookup ── */

  const handleGuardianEmailBlur = async () => {
    if (!ageFlags.minor || !form.parent_guardian_email) return;

    try {
      const guardianEmail = normalizeGuardianEmail(form.parent_guardian_email);
      const response = await searchGuardians(
        buildGuardianSearchPayload({
          companyId: user.sqlInfo.company_id,
          email: guardianEmail,
        })
      );
      const existing = selectGuardianByEmail(response?.guardians, guardianEmail);
      if (!existing) return;

      setForm((previous) => ({
        ...previous,
        parent_guardian_first_name:
          existing.first_name || previous.parent_guardian_first_name,
        parent_guardian_last_name:
          existing.last_name || previous.parent_guardian_last_name,
        parent_guardian_phone_number:
          existing.phone_number || previous.parent_guardian_phone_number,
      }));
      setGuardianNote(
        `${representative.label} already on file — their details have been filled in and will be linked.`
      );
    } catch (error) {
      // The lookup is a convenience; the fields can still be typed by hand.
      console.warn("Guardian search failed:", error);
    }
  };

  const linkGuardian = async (memberId) => {
    const companyId = user.sqlInfo.company_id;
    const guardianEmail = normalizeGuardianEmail(form.parent_guardian_email);
    const relationship = form.relationship || "guardian";

    const response = await searchGuardians(
      buildGuardianSearchPayload({ companyId, email: guardianEmail })
    );
    const existing = selectGuardianByEmail(response?.guardians, guardianEmail);

    await saveGuardian(
      existing
        ? buildExistingGuardianLinkPayload({
            companyId,
            memberId,
            guardianId: existing.id,
            relationship,
          })
        : buildNewGuardianLinkPayload({
            companyId,
            memberId,
            firstName: form.parent_guardian_first_name,
            lastName: form.parent_guardian_last_name,
            email: guardianEmail,
            phoneNumber: form.parent_guardian_phone_number,
            relationship,
          })
    );
  };

  /* ───────────────────────────────────────────────────────────── submitting ── */

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (Object.keys(fieldErrors).length > 0) return;

    setFailure(null);
    setSaving(true);

    try {
      if (!createdMemberId.current) {
        const response = await devitrakApi.post(
          "/db_member/new-member",
          buildSingleMemberPayload(form)
        );
        const memberId = extractCreatedMemberId(response);
        if (!memberId) {
          throw new Error(
            "The member was saved but the server did not return an id, so the guardian could not be linked."
          );
        }
        createdMemberId.current = memberId;

        registerStaffActivity({
          action: "CREATE",
          target_model: "Member",
          target_id: memberId,
          details: {
            first_name: form.first_name,
            last_name: form.last_name,
            grade: form.grade,
          },
        });
      }

      if (ageFlags.minor) await linkGuardian(createdMemberId.current);

      // DeleteMember and AdvanceGrades already do this; creating one did not,
      // so a member you had just added was missing from the table behind the
      // modal until something else happened to refetch it.
      await queryClient.invalidateQueries({ queryKey: ["membersInfoQuery"] });

      notify("success", `${form.first_name} ${form.last_name} was added.`.trim());
      clear();
      onClose();
    } catch (error) {
      console.error(error);
      const detail =
        error?.response?.data?.msg || error?.message || "An unexpected error occurred.";
      setFailure({
        // Once the member exists, only the link is outstanding — saying so is
        // what stops the retry from creating a second member.
        memberCreated: Boolean(createdMemberId.current),
        detail,
      });
    } finally {
      setSaving(false);
    }
  };

  const awaitingGuardianOnly = Boolean(failure?.memberCreated);

  /* ────────────────────────────────────────────────────────────────── body ── */

  return (
    <div className="action-form">
      {contextHolder}

      <section className={stepClass(Boolean(form.first_name && form.last_name))}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            Who they are
          </h3>
        </div>

        <div className="action-form__grid">
          {[
            { key: "first_name", label: "First name" },
            { key: "last_name", label: "Last name" },
            { key: "email", label: "Email", type: "email" },
            { key: "phone", label: "Phone" },
          ].map((field) => (
            <div className="action-form__field" key={field.key}>
              <Label htmlFor={field.key}>{field.label} *</Label>
              <Input
                id={field.key}
                type={field.type ?? "text"}
                value={form[field.key]}
                onChange={update(field.key)}
                disabled={saving || awaitingGuardianOnly}
              />
              {errorFor(field.key) && (
                <p className="action-form__feedback action-form__feedback--error">
                  {errorFor(field.key)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="action-form__step">
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            Address and school details
          </h3>
          <span className="action-form__step-note">All optional</span>
        </div>

        <div className="action-form__grid">
          {[
            { key: "address_street", label: "Street" },
            { key: "address_city", label: "City" },
            { key: "address_state", label: "State" },
            { key: "address_zip", label: "Zip" },
            fields.grade && { key: "grade", label: "Grade", placeholder: "e.g. 7" },
            fields.homeroom && {
              key: "homeroom",
              label: "Homeroom",
              placeholder: "e.g. Rivera 7B",
            },
          ]
            .filter(Boolean)
            .map((field) => (
              <div className="action-form__field" key={field.key}>
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  value={form[field.key]}
                  onChange={update(field.key)}
                  placeholder={field.placeholder}
                  disabled={saving || awaitingGuardianOnly}
                />
              </div>
            ))}
        </div>
      </section>

      {fields.minor && (
        <section className={stepClass(Boolean(form.date_of_birth))}>
          <div className="action-form__step-head">
            <h3 className="action-form__step-title">
              <span className="action-form__step-index">3</span>
              Age and {representative.label.toLowerCase()}
            </h3>
          </div>

          <div className="action-form__field">
            <Label htmlFor="date_of_birth">
              Date of birth {isEducation ? "*" : "(optional)"}
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={update("date_of_birth")}
              max={new Date().toISOString().split("T")[0]}
              disabled={saving || awaitingGuardianOnly}
            />
            <p className="action-form__step-note">
              This decides who receives notices about the member. Without it they
              are recorded as an adult.
            </p>
            {errorFor("date_of_birth") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("date_of_birth")}
              </p>
            )}
          </div>

          {ageFlags.dob_valid && ageFlags.under_13 && (
            <p className="action-form__banner action-form__banner--warning">
              This member is under 13. COPPA may require additional consent
              depending on your settings.
            </p>
          )}

          {ageFlags.minor && (
            <>
              <p className="action-form__step-note">
                A minor, so their {representative.label.toLowerCase()} is required
                and will receive every notice.
              </p>
              <div className="action-form__grid">
                {[
                  { key: "parent_guardian_first_name", label: "first name" },
                  { key: "parent_guardian_last_name", label: "last name" },
                  {
                    key: "parent_guardian_email",
                    label: "email",
                    type: "email",
                    onBlur: handleGuardianEmailBlur,
                  },
                  { key: "parent_guardian_phone_number", label: "phone" },
                ].map((field) => (
                  <div className="action-form__field" key={field.key}>
                    <Label htmlFor={field.key}>
                      {`${representative.label} ${field.label} *`}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type ?? "text"}
                      value={form[field.key]}
                      onChange={update(field.key)}
                      onBlur={field.onBlur}
                      disabled={saving}
                    />
                    {errorFor(field.key) && (
                      <p className="action-form__feedback action-form__feedback--error">
                        {errorFor(field.key)}
                      </p>
                    )}
                    {field.key === "parent_guardian_email" && guardianNote && (
                      <p className="action-form__feedback action-form__feedback--ok">
                        {guardianNote}
                      </p>
                    )}
                  </div>
                ))}

                <div className="action-form__field">
                  <Label>Relationship</Label>
                  <SelectComponent
                    items={RELATIONSHIPS}
                    value={RELATIONSHIPS.find((item) => item.id === form.relationship)}
                    onSelect={(option) =>
                      setForm((previous) => ({
                        ...previous,
                        relationship: option?.id ?? "guardian",
                      }))
                    }
                    placeholder="Guardian"
                  />
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {failure && (
        <p className="action-form__notice">
          {failure.memberCreated
            ? `${form.first_name} ${form.last_name} was created, but linking the ${representative.label.toLowerCase()} failed: ${failure.detail} Fix the details above and finish the link — pressing again will not create a second member.`
            : failure.detail}
        </p>
      )}

      {submitAttempted && Object.keys(fieldErrors).length > 0 && (
        <p className="action-form__notice">
          {Object.keys(fieldErrors).length} field
          {Object.keys(fieldErrors).length === 1 ? " needs" : "s need"} filling in
          above.
        </p>
      )}

      <div className="action-form__footer">
        <GrayButtonComponent
          title="Clear"
          buttonType="button"
          disabled={saving}
          func={clear}
        />
        <BlueButtonComponent
          title={awaitingGuardianOnly ? "Finish linking" : "Create member"}
          buttonType="button"
          func={handleSubmit}
          isDisabled={saving}
          isLoading={saving}
        />
      </div>
    </div>
  );
};

Single.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Single;
