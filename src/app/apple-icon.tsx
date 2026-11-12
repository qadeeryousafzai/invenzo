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
        background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)",
      }}
    >
      <svg
        width="128"
        height="128"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M24 2 4 13v22l20 11 20-11V13L24 2Z" fill="white" fillOpacity="0.15" />
        <path d="M24 2 4 13l20 11 20-11L24 2Z" fill="white" fillOpacity="0.25" />
        <circle cx="24" cy="17" r="3.5" fill="white" />
        <rect x="20.5" y="23" width="7" height="14" rx="3.5" fill="white" />
      </svg>
    </div>,
    size,
  );
}