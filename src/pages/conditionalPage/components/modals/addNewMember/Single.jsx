import { FormControlLabel } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import CheckboxReusableComponent from "../../../../../components/UX/checkbox/CheckboxReusableComponent";
import Input from "../../../../../components/UX/inputs/Input";
import Label from "../../../../../components/UX/inputs/Label";
import {
  EMPTY_SINGLE_MEMBER_FORM,
  buildSingleMemberPayload,
  validateSingleMemberForm,
} from "../../../utils/singleMemberUtils";

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
  const [form, setForm] = useState({
    ...EMPTY_SINGLE_MEMBER_FORM,
    company_id: user.sqlInfo.company_id,
  });
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((prev) => ({ ...prev, company_id: user.sqlInfo.company_id }));
  }, [user.sqlInfo.company_id]);

  const update = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clear = () => {
    setForm({ ...EMPTY_SINGLE_MEMBER_FORM, company_id: user.sqlInfo.company_id });
    setErrors([]);
  };

  const handleSubmit = async () => {
    const errs = validateSingleMemberForm(form);
    if (errs.length) return setErrors(errs);
    try {
      setSaving(true);
      const fetching = await devitrakApi.post(
        "/db_member/new-member",
        buildSingleMemberPayload(form)
      );
      if (fetching.data) {
        clear();
        closingModal(false);
      }
    } catch (error) {
      setErrors([error.message || "An unexpected error occurred."]);
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
      </div>

      <FormControlLabel
        control={
          <CheckboxReusableComponent
            name="minor"
            checked={form.minor}
            onChange={update("minor")}
          />
        }
        label="Is the member a minor?"
      />

      {form.minor && (
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
            <Label>Guardian&apos;s first name *</Label>
            <Input
              value={form.parent_guardian_first_name}
              onChange={update("parent_guardian_first_name")}
              required
            />
          </div>
          <div style={fieldWrapper}>
            <Label>Guardian&apos;s last name *</Label>
            <Input
              value={form.parent_guardian_last_name}
              onChange={update("parent_guardian_last_name")}
              required
            />
          </div>
          <div style={fieldWrapper}>
            <Label>Guardian&apos;s email *</Label>
            <Input
              type="email"
              value={form.parent_guardian_email}
              onChange={update("parent_guardian_email")}
              required
            />
          </div>
          <div style={fieldWrapper}>
            <Label>Guardian&apos;s phone *</Label>
            <Input
              value={form.parent_guardian_phone_number}
              onChange={update("parent_guardian_phone_number")}
              required
            />
          </div>
        </div>
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
          disabled={saving}
        />
        <BlueButtonComponent
          title="Create member"
          func={handleSubmit}
          styles={{ width: "100%" }}
          isDisabled={saving}
          isLoading={saving}
        />
      </div>
    </div>
  );
};

export default Single;
