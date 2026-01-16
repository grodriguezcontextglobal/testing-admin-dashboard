import { useEffect, useState } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { OutlinedInput } from "@mui/material";
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
    company_id: [user.sqlInfo.company_id],
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    setForm({
      ...form,
      company_id: [user.sqlInfo.company_id],
    });
  }, []);
  const update = (key) => (e) => {
    const value = e?.target?.value ?? "";
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
    });
    setErrors([]);
  };

  const handleSubmit = async () => {
    try {
      // Build combined address from parts if not provided
      const combinedAddress = `${form.address_street}, ${form.address_city}, ${form.address_state} ${form.address_zip}`;

      const errs = [];
      if (!form.first_name) errs.push("first_name is required");
      if (!form.last_name) errs.push("last_name is required");
      if (!form.email) errs.push("email is required");
      if (!form.phone) errs.push("phone is required");
      if (errs.length) {
        setErrors(errs);
        return;
      }

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: combinedAddress,
        address_street: form.address_street,
        address_city: form.address_city,
        address_state: form.address_state,
        address_zip: form.address_zip,
        company_id: user.sqlInfo.company_id,
      };
      const fetching = await devitrakApi.post("/db_member/new-member", payload);
      if (fetching.data) {
        clear();
        return closingModal(false);
      }
    } catch (error) {
      return setErrors(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>First Name <span style={{ color: "red" }}>*</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.first_name}
            onChange={update("first_name")}
            aria-required="true"
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>Last Name <span style={{ color: "red" }}>*</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.last_name}
            onChange={update("last_name")}
            aria-required="true"
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>Email <span style={{ color: "red" }}>*</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            type="email"
            value={form.email}
            onChange={update("email")}
            aria-required="true"
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: "bold" }}>Phone <span style={{ color: "red" }}>*</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.phone}
            onChange={update("phone")}
            aria-required="true"
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>Street <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_street}
            onChange={update("address_street")}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>City <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_city}
            onChange={update("address_city")}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>State <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_state}
            onChange={update("address_state")}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column" }}>
          <span>Zip <span style={{ color: "gray", fontSize: "0.9em" }}>(Optional)</span></span>
          <OutlinedInput
            style={OutlinedInputStyle}
            value={form.address_zip}
            onChange={update("address_zip")}
          />
        </label>
      </div>

      {errors.length ? (
        <div style={{ color: "crimson" }}>
          {errors.map((e, i) => (
            <div key={i}>{e}</div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <GrayButtonComponent func={clear} title="Clear" />
        <BlueButtonComponent func={handleSubmit} title="Create Member" />
      </div>
    </div>
  );
};

export default Single;
