import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 38,
        background: "linear-gradient(145deg, #0ea681 0%, #087f68 48%, #1854a4 100%)",
        color: "white",
        fontSize: 106,
        fontWeight: 800,
        letterSpacing: -8,
      }}
    >
      i.
    </div>,
    size,
  );
}
