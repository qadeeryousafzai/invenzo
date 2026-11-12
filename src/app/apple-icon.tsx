export const size = { width: 180, height: 180 };
export const contentType = "image/svg+xml";

export default function AppleIcon() {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0d9488"/>
          <stop offset="0.5" stop-color="#0f766e"/>
          <stop offset="1" stop-color="#134e4a"/>
        </linearGradient>
      </defs>
      <rect width="180" height="180" rx="38" fill="url(#bg)"/>
      <g transform="translate(26 26) scale(2.7)">
        <path d="M24 2 4 13v22l20 11 20-11V13L24 2Z" fill="white" fill-opacity="0.15"/>
        <path d="M24 2 4 13l20 11 20-11L24 2Z" fill="white" fill-opacity="0.25"/>
        <circle cx="24" cy="17" r="3.5" fill="white"/>
        <rect x="20.5" y="23" width="7" height="14" rx="3.5" fill="white"/>
      </g>
    </svg>`,
    { headers: { "Content-Type": "image/svg+xml" } }
  );
}