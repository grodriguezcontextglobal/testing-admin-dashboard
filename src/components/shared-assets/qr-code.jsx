import { QRCodeSVG } from "qrcode.react";

const SIZE_MAP = {
  sm: 128,
  md: 160,
  lg: 200,
};

/**
 * Untitled UI-compatible QR code component backed by qrcode.react.
 *
 * @param {"sm"|"md"|"lg"} size
 * @param {string} value - The URL or string to encode
 * @param {object} options
 * @param {string} [options.image] - Center logo URL
 * @param {{ imageSize?: number, margin?: number }} [options.imageOptions]
 * @param {{ color?: string }} [options.dotsOptions]
 * @param {{ color?: string }} [options.cornersSquareOptions] - unused (qrcode.react does not support per-corner colors)
 * @param {{ color?: string }} [options.cornersDotOptions]   - unused
 */
export const QRCode = ({ size = "md", value, options = {} }) => {
  const px = SIZE_MAP[size] ?? SIZE_MAP.md;
  const { image, imageOptions = {}, dotsOptions = {} } = options;

  const imageSettings = image
    ? {
        src: image,
        height: Math.round(px * (imageOptions.imageSize ?? 0.3)),
        width: Math.round(px * (imageOptions.imageSize ?? 0.3)),
        excavate: true,
        margin: imageOptions.margin ?? 2,
      }
    : undefined;

  return (
    <QRCodeSVG
      value={value}
      size={px}
      fgColor={dotsOptions.color ?? "#000000"}
      bgColor="#ffffff"
      level="H"
      imageSettings={imageSettings}
    />
  );
};
