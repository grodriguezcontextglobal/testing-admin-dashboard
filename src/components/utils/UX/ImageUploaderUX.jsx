import { useRef, useState } from "react";
import { UploadIcon } from "../../icons/UploadIcon";

const DEFAULT_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

const getReadableFileSize = (size) => {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) return "Invalid file type.";
    if (file.size > maxSize) return "File size exceeds the allowed limit.";
    return "";
  };

  const handleFileSelection = (files) => {
    const file = files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploadedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setImageUploadedValue(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setError("");
    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageUploadedValue(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (isDisabled) return;
    handleFileSelection(event.dataTransfer.files);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadedFile(null);
    setPreviewUrl(null);
    setError("");
    setImageUploadedValue(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const dropZoneBorderColor = error
    ? "var(--error-300, #FDA29B)"
    : isDragOver
    ? "var(--primary-300, #D6BBFB)"
    : "var(--gray-200, #EAECF0)";

  const dropZoneBg = error
    ? "var(--error-25, #FFFBFA)"
    : isDragOver
    ? "var(--primary-25, #FCFAFF)"
    : isDisabled
    ? "var(--gray-50, #F9FAFB)"
    : "#FFF";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onClick={() => !isDisabled && inputRef.current?.click()}
        style={{
          padding: "16px 24px",
          borderRadius: "12px",
          border: `1px dashed ${dropZoneBorderColor}`,
          background: dropZoneBg,
          cursor: isDisabled ? "not-allowed" : "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          textAlign: "center",
          transition: "border-color 0.15s ease, background 0.15s ease",
          userSelect: "none",
        }}
      >
        {/* Featured icon — double-ring style */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "8px solid var(--gray-50, #F9FAFB)",
            background: "var(--gray-100, #F2F4F7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <UploadIcon stroke={isDisabled ? "#D0D5DD" : "#475467"} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: "20px",
                color: isDisabled ? "var(--gray-300, #D0D5DD)" : "var(--primary-700, #6941C6)",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                lineHeight: "20px",
                color: isDisabled ? "var(--gray-300, #D0D5DD)" : "var(--gray-600, #475467)",
              }}
            >
              or drag and drop
            </span>
          </div>

          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "18px",
              color: isDisabled ? "var(--gray-300, #D0D5DD)" : "var(--gray-500, #667085)",
            }}
          >
            {hint}
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".jpeg,.png,.jpg,.gif"
          disabled={isDisabled}
          hidden
          onChange={(e) => handleFileSelection(e.target.files)}
        />
      </div>

      {/* Image preview + file info */}
      {uploadedFile && previewUrl && (
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid var(--gray-200, #EAECF0)",
            background: "#FFF",
            overflow: "hidden",
          }}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: "100%",
              height: 200,
              background: "var(--gray-50, #F9FAFB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          </div>

          {/* File meta row */}
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              borderTop: "1px solid var(--gray-100, #F2F4F7)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: "20px",
                  color: "var(--gray-700, #344054)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {uploadedFile.name}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "20px",
                  color: "var(--gray-600, #475467)",
                }}
              >
                {getReadableFileSize(uploadedFile.size)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: "none",
                border: "none",
                padding: "0",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: "20px",
                color: "var(--error-700, #B42318)",
                flexShrink: 0,
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Validation error */}
      {error && (
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            lineHeight: "20px",
            color: "var(--error-600, #D92D20)",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default ImageUploaderUX;
