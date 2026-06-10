import { useRef, useState } from "react";
import { Typography } from "@mui/material";
import { Avatar } from "antd";
import { UploadIcon } from "../../icons/UploadIcon";

const DEFAULT_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

const getReadableFileSize = (size) => {
  if (!size) return "0 KB";
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const ImageUploaderUX = ({
  setImageUploadedValue,
  label = "Click to upload",
  hint = "SVG, PNG, JPG or GIF (max. 5MB)",
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  isDisabled = false,
}) => {
  const inputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState("");

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      return "Invalid file type.";
    }

    if (file.size > maxSize) {
      return "File size exceeds the allowed limit.";
    }

    return "";
  };

  const handleFileSelection = (files) => {
    const file = files?.[0];

    if (!file) return;

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setUploadedFile(null);
      setImageUploadedValue(null);
      return;
    }

    setError("");
    setUploadedFile(file);
    setImageUploadedValue(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    if (isDisabled) return;

    handleFileSelection(event.dataTransfer.files);
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setError("");
    setImageUploadedValue(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        onClick={() => !isDisabled && inputRef.current?.click()}
        style={{
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid var(--gray-200, #EAECF0)",
          background: isDisabled ? "var(--gray-50, #F9FAFB)" : "#FFF",
          cursor: isDisabled ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          textAlign: "center",
        }}
      >
        <Avatar
          size={48}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "6px solid var(--gray-50, #F9FAFB)",
            background: "var(--base-white, #FFF)",
            borderRadius: "28px",
          }}
        >
          <UploadIcon />
        </Avatar>

        <div>
          <Typography
            style={{
              fontFamily: "Inter",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "20px",
              color: "var(--primary-700, #6941C6)",
            }}
          >
            {label}
          </Typography>

          <Typography
            style={{
              fontFamily: "Inter",
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "20px",
              color: "var(--gray-600, #475467)",
            }}
          >
            or drag and drop
          </Typography>
        </div>

        <Typography
          style={{
            fontFamily: "Inter",
            fontSize: "12px",
            fontWeight: 400,
            lineHeight: "18px",
            color: "var(--gray-600, #475467)",
          }}
        >
          {hint}
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept=".jpeg,.png,.jpg,.gif"
          disabled={isDisabled}
          hidden
          onChange={(event) => handleFileSelection(event.target.files)}
        />
      </div>

      {uploadedFile && (
        <div
          style={{
            // width: "100%",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "#FFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <Typography
              style={{
                fontFamily: "Inter",
                fontSize: "14px",
                fontWeight: 500,
                color: "var(--gray-700, #344054)",
              }}
            >
              {uploadedFile.name}
            </Typography>

            <Typography
              style={{
                fontFamily: "Inter",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--gray-600, #475467)",
              }}
            >
              {getReadableFileSize(uploadedFile.size)}
            </Typography>
          </div>

          <Typography
            onClick={handleRemove}
            style={{
              fontFamily: "Inter",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--danger-action, #D92D20)",
              cursor: "pointer",
            }}
          >
            Remove
          </Typography>
        </div>
      )}

      {error && (
        <Typography
          style={{
            fontFamily: "Inter",
            fontSize: "14px",
            fontWeight: 400,
            color: "var(--danger-action, #D92D20)",
          }}
        >
          {error}
        </Typography>
      )}
    </div>
  );
};

export default ImageUploaderUX;