import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 112,
        background: "linear-gradient(145deg, #176b87 0%, #147d78 100%)",
        color: "white",
        fontSize: 280,
        fontWeight: 800,
        letterSpacing: -24,
      }}
    >
      i.
    </div>,
    size,
  );
}
