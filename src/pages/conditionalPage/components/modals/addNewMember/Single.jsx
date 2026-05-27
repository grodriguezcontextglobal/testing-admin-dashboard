import { useEffect, useState } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { Checkbox, FormControlLabel, OutlinedInput } from "@mui/material";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";

const Single = ({ closingModal }) => {
  const { user } = useSelector((state) => state.admin);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    company_id: user.sqlInfo.company_id,
    minor: false,
    parent_guardian_first_name: "",
    parent_guardian_last_name: "",
    parent_guardian_email: "",
    parent_guardian_phone_number: "",
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      company_id: user.sqlInfo.company_id,
    }));
  }, [user.sqlInfo.company_id]);

  const update = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const clear = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address_street: "",
      address_city: "",
      address_state: "",
      address_zip: "",
      company_id: user.sqlInfo.company_id,
      minor: false,
      parent_guardian_first_name: "",
      parent_guardian_last_name: "",
      parent_guardian_email: "",
      parent_guardian_phone_number: "",
    });
    setErrors([]);
  };

  const handleSubmit = async () => {
    try {
      const combinedAddress = `${form.address_street}, ${form.address_city}, ${form.address_state} ${form.address_zip}`;

      const errs = [];
      if (!form.first_name) errs.push("First name is required.");
      if (!form.last_name) errs.push("Last name is required.");
      if (!form.email) errs.push("Email is required.");
      if (!form.phone) errs.push("Phone is required.");
      if (form.minor) {
        if (!form.parent_guardian_first_name)
          errs.push("Guardian first name is required for minors.");
        if (!form.parent_guardian_last_name)
          errs.push("Guardian last name is required for minors.");
        if (!form.parent_guardian_email)
          errs.push("Guardian email is required for minors.");
        if (!form.parent_guardian_phone_number)
          errs.push("Guardian phone number is required for minors.");
      }

      if (errs.length) {
        setErrors(errs);
        return;
      }

      const payload = {
        ...form,
        address: combinedAddress,
      };

      const fetching = await devitrakApi.post("/db_member/new-member", payload);
      if (fetching.data) {
        clear();
        closingModal(false);
      }
    } catch (error) {
      setErrors([error.message || "An unexpected error occurred."]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>
            First Name <span style={{ color: "red" }}>*</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.first_name}
            onChange={update("first_name")}
            required
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>
            Last Name <span style={{ color: "red" }}>*</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.last_name}
            onChange={update("last_name")}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>
            Email <span style={{ color: "red" }}>*</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            type="email"
            value={form.email}
            onChange={update("email")}
            required
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>
            Phone <span style={{ color: "red" }}>*</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.phone}
            onChange={update("phone")}
            required
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>
            Street{" "}
            <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_street}
            onChange={update("address_street")}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>
            City{" "}
            <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_city}
            onChange={update("address_city")}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>
            State{" "}
            <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_state}
            onChange={update("address_state")}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>
            Zip{" "}
            <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span>
          </span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_zip}
            onChange={update("address_zip")}
          />
        </label>
      </div>
      <FormControlLabel
        control={<Checkbox checked={form.minor} onChange={update("minor")} />}
        label="Is the member a minor?"
      />

      {form.minor && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            border: "1px solid #ccc",
            borderRadius: 4,
            padding: 12,
            marginTop: 12,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "bold" }}>
              Guardian&lsquo;s First Name <span style={{ color: "red" }}>*</span>
            </span>
            <OutlinedInput
              style={OutlinedInputStyle}
              value={form.parent_guardian_first_name}
              onChange={update("parent_guardian_first_name")}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "bold" }}>
              Guardian&lsquo;s Last Name <span style={{ color: "red" }}>*</span>
            </span>
            <OutlinedInput
              style={OutlinedInputStyle}
              value={form.parent_guardian_last_name}
              onChange={update("parent_guardian_last_name")}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "bold" }}>
              Guardian&lsquo;s Email <span style={{ color: "red" }}>*</span>
            </span>
            <OutlinedInput
              style={OutlinedInputStyle}
              type="email"
              value={form.parent_guardian_email}
              onChange={update("parent_guardian_email")}
              required
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "bold" }}>
              Guardian&lsquo;s Phone <span style={{ color: "red" }}>*</span>
            </span>
            <OutlinedInput
              style={OutlinedInputStyle}
              value={form.parent_guardian_phone_number}
              onChange={update("parent_guardian_phone_number")}
              required
            />
          </label>
        </div>
      )}

      {errors.length > 0 && (
        <div style={{ color: "crimson", marginTop: 12 }}>
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 12,
        }}
      >
        <GrayButtonComponent func={clear} title="Clear" />
        <BlueButtonComponent func={handleSubmit} title="Create Member" />
      </div>
    </div>
  );
};

export default Single;
