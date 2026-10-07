import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "./Card";

/**
 * 2026-10-07: the tile pointed at an S3 bucket that now answers 403, so every
 * policy card showed a broken image. The logo is white, so it sits on the
 * brand's dark blue rather than on the card's white.
 */
const doc = { id: 1, title: "Privacy Policy", description: "…", url: "/doc.pdf" };

describe("Platform policy card", () => {
  it("shows the Devitrak logo from Cloudinary", () => {
    render(<Card doc={doc} />);
    const logo = screen.getByRole("img", { name: "Devitrak" });
    expect(logo).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/dpdzkhh07/image/upload/v1791386367/devitrak_login_jeki3x.svg"
    );
  });

  it("puts the white logo on a dark background", () => {
    render(<Card doc={doc} />);
    const tile = screen.getByRole("img", { name: "Devitrak" }).parentElement;
    expect(tile).toHaveStyle({ backgroundColor: "#021833" });
  });
});
