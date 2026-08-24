import { FormControlLabel } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import CheckboxReusableComponent from "../../../../../components/UX/checkbox/CheckboxReusableComponent";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import Input from "../../../../../components/UX/inputs/Input";
import Label from "../../../../../components/UX/inputs/Label";
import {
  EMPTY_SINGLE_MEMBER_FORM,
  buildSingleMemberPayload,
  validateSingleMemberForm,
} from "../../../utils/singleMemberUtils";
import { calculateStudentAgeFlags } from "../../../utils/ageCalculationUtils";
import { getIndustryProfile } from "../../../../../config/industryProfiles";
import {
  searchGuardians,
  saveGuardian,
} from "../../../utils/guardianConsentApi";
import {
  normalizeGuardianEmail,
  buildGuardianSearchPayload,
  selectGuardianByEmail,
  buildExistingGuardianLinkPayload,
  buildNewGuardianLinkPayload,
  extractCreatedMemberId,
} from "../../../utils/guardianConsentUtils";

const fieldWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
};

const gridTwoCol = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const optionalHint = {
  fontFamily: "Inter",
  fontSize: "12px",
  fontWeight: 400,
  color: "var(--gray-500, #667085)",
};

const errorCaption = {
  fontSize: "12px",
  fontFamily: "Inter",
  color: "var(--error, #B42318)",
  display: "block",
};

const Single = ({ closingModal }) => {
  const { user } = useSelector((state) => state.admin);
  // Industry-adaptive vocabulary/fields: schools show grade/homeroom and call
  // the responsible adult "Parent / Guardian"; other industries hide the school
  // fields and use their own representative label (industryProfiles.js).
  const { fields, representative } = getIndustryProfile(
    user?.companyData?.industry
  );
  const [form, setForm] = useState({
    ...EMPTY_SINGLE_MEMBER_FORM,
    company_id: user.sqlInfo.company_id,
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [guardianResolving, setGuardianResolving] = useState(false);
  const [guardianError, setGuardianError] = useState(null);

  // Derive minor/under_13 from DOB — no manual checkbox needed
  const ageFlags = useMemo(
    () => calculateStudentAgeFlags(form.date_of_birth),
    [form.date_of_birth]
  );
  const isEducation = user?.companyData?.industry === "Education";

  useEffect(() => {
    setForm((prev) => ({ ...prev, company_id: user.sqlInfo.company_id }));
  }, [user.sqlInfo.company_id]);

  const update = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Auto-search guardian when email field loses focus
  const handleGuardianEmailBlur = async () => {
    if (!ageFlags.minor || !form.parent_guardian_email) return;

    const companyId = user.sqlInfo.company_id;
    const guardianEmail = normalizeGuardianEmail(form.parent_guardian_email);

    try {
      const searchResponse = await searchGuardians(
        buildGuardianSearchPayload({ companyId, email: guardianEmail })
      );
      const existingGuardian = selectGuardianByEmail(searchResponse?.guardians, guardianEmail);

      if (existingGuardian) {
        setForm((prev) => ({
          ...prev,
          parent_guardian_first_name: existingGuardian.first_name || prev.parent_guardian_first_name,
          parent_guardian_last_name: existingGuardian.last_name || prev.parent_guardian_last_name,
          parent_guardian_phone_number: existingGuardian.phone_number || prev.parent_guardian_phone_number,
        }));
        setGuardianError(
          `Existing guardian found. Their information will be linked to this student.`
        );
      }
    } catch (err) {
      // Silently fail - user can still enter manually
      console.warn("Guardian search failed:", err);
    }
  };

  const clear = () => {
    setForm({ ...EMPTY_SINGLE_MEMBER_FORM, company_id: user.sqlInfo.company_id });
    setErrors([]);
    setGuardianError(null);
  };

  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const handleSubmit = async () => {
    const errs = validateSingleMemberForm(form, {
      representativeLabel: representative.label,
      requireDob: isEducation,
    });
    if (errs.length) return setErrors(errs);

    setErrors([]);
    setGuardianError(null);
    setSaving(true);

    try {
      // Step 1: Create the student
      const createResponse = await devitrakApi.post(
        "/db_member/new-member",
        buildSingleMemberPayload(form)
      );

      const createdMemberId = extractCreatedMemberId(createResponse);
      if (!createdMemberId) {
        throw new Error("Student created but member ID not returned from server.");
      }

      // Step 2: If minor, resolve guardian
      if (ageFlags.minor) {
        setGuardianResolving(true);
        const companyId = user.sqlInfo.company_id;
        const guardianEmail = normalizeGuardianEmail(form.parent_guardian_email);

        // Search for existing guardian by email
        const searchResponse = await searchGuardians(
          buildGuardianSearchPayload({ companyId, email: guardianEmail })
        );

        const existingGuardian = selectGuardianByEmail(searchResponse?.guardians, guardianEmail);

        const relationship = form.relationship || "guardian";

        if (existingGuardian) {
          // Link existing guardian to new student
          await saveGuardian(
            buildExistingGuardianLinkPayload({
              companyId,
              memberId: createdMemberId,
              guardianId: existingGuardian.id,
              relationship,
            })
          );
        } else {
          // Create and link new guardian
          await saveGuardian(
            buildNewGuardianLinkPayload({
              companyId,
              memberId: createdMemberId,
              firstName: form.parent_guardian_first_name,
              lastName: form.parent_guardian_last_name,
              email: guardianEmail,
              phoneNumber: form.parent_guardian_phone_number,
              relationship,
            })
          );
        }
        setGuardianResolving(false);
      }

      // optional welcome email — admin's choice; spreadsheet imports never send
      if (sendWelcomeEmail && form.email) {
        try {
          const recipients = [form.email];
          if (ageFlags.minor && form.parent_guardian_email) {
            recipients.push(form.parent_guardian_email);
          }
          await devitrakApi.post("/nodemailer/single-email-notification", {
            consumer: recipients,
            subject: `Welcome to ${user.companyData.company_name}`,
            message: `Hi ${form.first_name},\n\nA profile has been created for you in ${user.companyData.company_name}'s device management system. You'll receive equipment details, agreements, and return reminders at this address.\n\n${user.companyData.company_name}`,
            eventSelected: "",
            company: user.companyData.company_name,
          });
        } catch {
          // email failure shouldn't block the created record
        }
      }

      // Success - clear form and close modal
      clear();
      closingModal(false);
    } catch (error) {
      setGuardianResolving(false);
      const msg = error.message || "An unexpected error occurred.";

      // If student was created but guardian failed, show specific message
      if (error.message?.includes("member ID")) {
        setErrors([msg]);
      } else if (error.response?.status === 400 || error.response?.status === 404) {
        setErrors([`Guardian association failed: ${error.response?.data?.msg || msg}`]);
      } else {
        setErrors([msg]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={gridTwoCol}>
        <div style={fieldWrapper}>
          <Label>First name *</Label>
          <Input value={form.first_name} onChange={update("first_name")} required />
        </div>
        <div style={fieldWrapper}>
          <Label>Last name *</Label>
          <Input value={form.last_name} onChange={update("last_name")} required />
        </div>
        <div style={fieldWrapper}>
          <Label>Email *</Label>
          <Input type="email" value={form.email} onChange={update("email")} required />
        </div>
        <div style={fieldWrapper}>
          <Label>Phone *</Label>
          <Input value={form.phone} onChange={update("phone")} required />
        </div>
        <div style={fieldWrapper}>
          <Label>
            Street <span style={optionalHint}>(Optional)</span>
          </Label>
          <Input value={form.address_street} onChange={update("address_street")} />
        </div>
        <div style={fieldWrapper}>
          <Label>
            City <span style={optionalHint}>(Optional)</span>
          </Label>
          <Input value={form.address_city} onChange={update("address_city")} />
        </div>
        <div style={fieldWrapper}>
          <Label>
            State <span style={optionalHint}>(Optional)</span>
          </Label>
          <Input value={form.address_state} onChange={update("address_state")} />
        </div>
        <div style={fieldWrapper}>
          <Label>
            Zip <span style={optionalHint}>(Optional)</span>
          </Label>
          <Input value={form.address_zip} onChange={update("address_zip")} />
        </div>
        {fields.grade && (
          <div style={fieldWrapper}>
            <Label>
              Grade <span style={optionalHint}>(Optional)</span>
            </Label>
            <Input value={form.grade} onChange={update("grade")} placeholder="e.g. 7" />
          </div>
        )}
        {fields.homeroom && (
          <div style={fieldWrapper}>
            <Label>
              Homeroom <span style={optionalHint}>(Optional)</span>
            </Label>
            <Input value={form.homeroom} onChange={update("homeroom")} placeholder="e.g. Rivera 7B" />
          </div>
        )}
      </div>

      <FormControlLabel
        control={
          <CheckboxReusableComponent
            name="sendWelcomeEmail"
            checked={sendWelcomeEmail}
            onChange={(e) => setSendWelcomeEmail(e.target.checked)}
          />
        }
        label="Send a welcome email to this person"
      />

      {fields.minor && (
        <>
          <div style={fieldWrapper}>
            <Label>
              Date of birth {isEducation ? "*" : "(Optional)"}
            </Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={update("date_of_birth")}
              max={new Date().toISOString().split("T")[0]}
              required={isEducation}
            />
          </div>

          {ageFlags.dob_valid && ageFlags.under_13 && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                background: "var(--warning-bg, #FEF3C7)",
                border: "1px solid var(--warning-border, #F59E0B)",
                fontSize: "13px",
                fontFamily: "Inter",
                color: "var(--warning-text, #92400E)",
              }}
            >
              This student is under 13. COPPA regulations may require additional
              consent depending on your school settings.
            </div>
          )}

          {ageFlags.minor && (
            <div
              style={{
                ...gridTwoCol,
                border: "1px solid var(--gray-200, #EAECF0)",
                borderRadius: "12px",
                padding: "16px",
                background: "var(--gray-50, #F9FAFB)",
              }}
            >
              <div style={fieldWrapper}>
                <Label>{representative.label} first name *</Label>
                <Input
                  value={form.parent_guardian_first_name}
                  onChange={update("parent_guardian_first_name")}
                  required
                />
              </div>
              <div style={fieldWrapper}>
                <Label>{representative.label} last name *</Label>
                <Input
                  value={form.parent_guardian_last_name}
                  onChange={update("parent_guardian_last_name")}
                  required
                />
              </div>
              <div style={fieldWrapper}>
                <Label>{representative.label} email *</Label>
                <Input
                  type="email"
                  value={form.parent_guardian_email}
                  onChange={update("parent_guardian_email")}
                  onBlur={handleGuardianEmailBlur}
                  required
                />
                {guardianError && (
                  <span style={{ fontSize: "12px", color: "var(--blue-600, #2563EB)" }}>
                    {guardianError}
                  </span>
                )}
              </div>
              <div style={fieldWrapper}>
                <Label>{representative.label} phone *</Label>
                <Input
                  value={form.parent_guardian_phone_number}
                  onChange={update("parent_guardian_phone_number")}
                  required
                />
              </div>
              <div style={fieldWrapper}>
                <Label>Relationship</Label>
                <select
                  value={form.relationship}
                  onChange={update("relationship")}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--gray-300, #D0D5DD)",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    backgroundColor: "white",
                  }}
                >
                  <option value="guardian">Guardian</option>
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {errors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {errors.map((e, i) => (
            <span key={i} style={errorCaption}>
              {e}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          paddingTop: "16px",
          borderTop: "1px solid var(--gray-200, #EAECF0)",
        }}
      >
        <GrayButtonComponent
          title="Clear"
          func={clear}
          buttonType="reset"
          styles={{ width: "100%" }}
          disabled={saving || guardianResolving}
        />
        <BlueButtonComponent
          title="Create member"
          func={handleSubmit}
          styles={{ width: "100%" }}
          isDisabled={saving || guardianResolving}
          isLoading={saving || guardianResolving}
        />
      </div>
    </div>
  );
};

export default Single;
