import { message } from "antd";

const costValueInputFormat = ({ props, setValue }) => {
  if (String(props).includes(".")) {
    const regex = /\.\d{3,}/;
    if (regex.test(props)) {
      setValue(`cost`, String(props).slice(0, -3));
      return message.error(
        "Please enter the cost in the format of 12000.54 | 95.44 | 4585"
      );
    }
  }
  if (String(props).includes(",")) {
    const formattingInputValue = String(props).replaceAll(",", "");
    return setValue(`cost`, formattingInputValue);
  }
};

export default costValueInputFormat;
