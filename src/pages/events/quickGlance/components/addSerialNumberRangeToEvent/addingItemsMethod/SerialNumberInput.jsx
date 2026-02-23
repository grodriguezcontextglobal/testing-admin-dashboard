import { useState } from "react";
import { Space } from "antd";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import Input from "../../../../../../components/UX/inputs/Input";

const SerialNumberInput = ({ onAdd, disabled, placeholder }) => {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmedValue = value.trim();
    if (trimmedValue) {
      onAdd(trimmedValue);
      setValue("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <Space.Compact style={{ width: "100%", gap:2 }}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
      />
      <BlueButtonComponent
        type="primary"
        func={handleAdd}
        disabled={disabled || !value}
        title="Add"
      />
    </Space.Compact>
  );
};

export default SerialNumberInput;
