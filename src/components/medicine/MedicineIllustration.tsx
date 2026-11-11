import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type DosageForm =
  | "Tablet"
  | "Capsule"
  | "Syrup"
  | "Injection"
  | "Cream"
  | "Drops"
  | "Inhaler"
  | "Sachet"
  | "Ointment"
  | "Powder";

export const DOSAGE_FORMS: DosageForm[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Drops",
  "Inhaler",
  "Sachet",
  "Ointment",
  "Powder",
];

type Palette = {
  bgFrom: string;
  bgTo: string;
  accent: string;
  accentSoft: string;
  text: string;
  subtext: string;
  chip: string;
};

/** Coordinated pastel palettes keyed by medicine category. */
const CATEGORY_PALETTES: Record<string, Palette> = {
  Antibiotics: { bgFrom: "#e8f1ff", bgTo: "#d6e6ff", accent: "#3b6fd4", accentSoft: "#bcd2f7", text: "#1e3a6b", subtext: "#5b6f96", chip: "#dbe7ff" },
  Analgesics: { bgFrom: "#ffeef1", bgTo: "#ffdde4", accent: "#d4506e", accentSoft: "#f7c2cf", text: "#7a1f35", subtext: "#96566a", chip: "#ffdfe6" },
  "Gastrointestinal": { bgFrom: "#e9f7ec", bgTo: "#d6f0dc", accent: "#2f9e5b", accentSoft: "#b6e4c4", text: "#1c5c36", subtext: "#548069", chip: "#d8f2e0" },
  Diabetes: { bgFrom: "#fff1e6", bgTo: "#ffe3cc", accent: "#e08a2b", accentSoft: "#f8d2a6", text: "#7c4812", subtext: "#9a6c40", chip: "#ffe7d1" },
  Vitamins: { bgFrom: "#f3ecff", bgTo: "#e6d8ff", accent: "#8a5cd4", accentSoft: "#d2bdf3", text: "#4c2d7a", subtext: "#715a96", chip: "#e9dcff" },
  Cardiovascular: { bgFrom: "#e6f6f4", bgTo: "#d2efeb", accent: "#1f9e91", accentSoft: "#aee0d9", text: "#145c55", subtext: "#4d827c", chip: "#d4f0ec" },
  Dermatology: { bgFrom: "#fff0e9", bgTo: "#ffe0d1", accent: "#e0794a", accentSoft: "#f6c6ab", text: "#7c3c1e", subtext: "#9c6449", chip: "#ffe2d3" },
  "General medicines": { bgFrom: "#eef1f6", bgTo: "#dfe5ee", accent: "#5b6b85", accentSoft: "#c2ccda", text: "#2f3b50", subtext: "#66748c", chip: "#e2e8f0" },
};

const FALLBACK_PALETTE: Palette = CATEGORY_PALETTES["General medicines"];

/** Keywords used to infer a category when one is not supplied. */
const CATEGORY_KEYWORDS: { category: keyof typeof CATEGORY_PALETTES; words: string[] }[] = [
  { category: "Antibiotics", words: ["amoxicillin", "azithromycin", "ciprofloxacin", "doxycycline", "penicillin", "cephalexin", "metronidazole", "antibiotic", "levofloxacin", "clarithromycin"] },
  { category: "Analgesics", words: ["panadol", "paracetamol", "ibuprofen", "aspirin", "diclofenac", "naproxen", "tramadol", "codeine", "pain", "analgesic", "fever"] },
  { category: "Gastrointestinal", words: ["omeprazole", "pantoprazole", "esomeprazole", "ranitidine", "domperidone", "ondansetron", "loperamide", "gastro", "acid", "antacid"] },
  { category: "Diabetes", words: ["metformin", "glimepiride", "gliclazide", "insulin", "sitagliptin", "pioglitazone", "diabet", "glucose"] },
  { category: "Vitamins", words: ["vitamin", "vit", "folic", "ascorbic", "cyanocobalamin", "cholecalciferol", "multivitamin", "zinc", "iron", "ferrous"] },
  { category: "Cardiovascular", words: ["atorvastatin", "amlodipine", "losartan", "bisoprolol", "ramipril", "hydrochlorothiazide", "cardio", "blood pressure", "statin"] },
  { category: "Dermatology", words: ["cream", "ointment", "gel", "lotion", "clotrimazole", "hydrocortisone", "derm", "skin", "acne", "betamethasone"] },
];

const DOSAGE_FORM_HINTS: { form: DosageForm; words: string[] }[] = [
  { form: "Capsule", words: ["capsule", "cap", "softgel"] },
  { form: "Syrup", words: ["syrup", "syrup", "elixir", "liquid", "oral solution"] },
  { form: "Injection", words: ["injection", "injectable", "vial", "ampoule", "ampoule", "iv", "im", "shot"] },
  { form: "Cream", words: ["cream", "topical"] },
  { form: "Drops", words: ["drop", "drops", "eye", "ear", "nasal"] },
  { form: "Inhaler", words: ["inhaler", "inhalation", "puff", "mdi", "rotacap"] },
  { form: "Sachet", words: ["sachet", "powder for solution", "effervescent"] },
  { form: "Ointment", words: ["ointment", "salve", "balm"] },
  { form: "Powder", words: ["powder", "granule", "granules"] },
  { form: "Tablet", words: ["tablet", "tab", "chewable", "dispersible"] },
];

export function inferCategory(name: string, category?: string | null): keyof typeof CATEGORY_PALETTES {
  if (category) {
    const match = (Object.keys(CATEGORY_PALETTES) as (keyof typeof CATEGORY_PALETTES)[]).find((key) => key.toLowerCase() === category.toLowerCase());
    if (match) return match;
  }
  const haystack = name.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.words.some((word) => haystack.includes(word))) return entry.category;
  }
  return "General medicines";
}

export function inferDosageForm(name: string, strength?: string | null): DosageForm {
  const haystack = `${name} ${strength ?? ""}`.toLowerCase();
  for (const entry of DOSAGE_FORM_HINTS) {
    if (entry.words.some((word) => haystack.includes(word))) return entry.form;
  }
  return "Tablet";
}

export function getPalette(category?: string | null, medicineName?: string | null): Palette {
  if (category) {
    const match = (Object.keys(CATEGORY_PALETTES) as (keyof typeof CATEGORY_PALETTES)[]).find((key) => key.toLowerCase() === category.toLowerCase());
    if (match) return CATEGORY_PALETTES[match];
  }
  return CATEGORY_PALETTES[inferCategory(medicineName ?? "", category)] ?? FALLBACK_PALETTE;
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function splitStrength(strength?: string | null) {
  if (!strength) return { value: "", unit: "" };
  const match = strength.trim().match(/^([\d.]+\s*[a-zA-Z%]*)\s*(.*)$/);
  if (match) return { value: match[1].trim(), unit: match[2].trim() };
  return { value: strength.trim(), unit: "" };
}

/* ------------------------------------------------------------------ */
/* Dosage-form illustrations (each drawn in a 200x200 centered viewBox) */
/* ------------------------------------------------------------------ */

function TabletArt({ palette, seed }: { palette: Palette; seed: number }) {
  const rotation = (seed % 30) - 15;
  return (
    <g transform={`rotate(${rotation} 100 100)`}>
      <ellipse cx="100" cy="104" rx="58" ry="40" fill="rgba(0,0,0,0.10)" />
      <circle cx="100" cy="100" r="56" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" />
      <circle cx="100" cy="100" r="56" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="100" y1="46" x2="100" y2="154" stroke={palette.accent} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <circle cx="82" cy="82" r="10" fill="#ffffff" opacity="0.35" />
    </g>
  );
}

function CapsuleArt({ palette, seed }: { palette: Palette; seed: number }) {
  const rotation = (seed % 40) - 20;
  return (
    <g transform={`rotate(${rotation} 100 100)`}>
      <rect x="42" y="74" width="116" height="52" rx="26" fill="rgba(0,0,0,0.10)" transform="translate(0 6)" />
      <rect x="42" y="72" width="116" height="52" rx="26" fill={palette.accent} />
      <path d="M100 72 h32 a26 26 0 0 1 0 52 h-32 z" fill={palette.accentSoft} />
      <rect x="42" y="72" width="116" height="52" rx="26" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.5" />
      <rect x="58" y="82" width="30" height="12" rx="6" fill="#ffffff" opacity="0.3" />
      <line x1="100" y1="72" x2="100" y2="124" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.5" />
    </g>
  );
}

function SyrupArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="176" rx="46" ry="10" fill="rgba(0,0,0,0.10)" />
      <path d="M74 60 h52 v18 l10 14 v72 a10 10 0 0 1 -10 10 h-52 a10 10 0 0 1 -10 -10 v-72 l10 -14 z" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" strokeLinejoin="round" />
      <path d="M78 104 h44 v50 a6 6 0 0 1 -6 6 h-32 a6 6 0 0 1 -6 -6 z" fill={palette.accent} opacity="0.85" />
      <rect x="82" y="46" width="36" height="18" rx="4" fill={palette.accent} />
      <rect x="86" y="118" width="28" height="24" rx="3" fill="#ffffff" opacity="0.85" />
      <line x1="90" y1="126" x2="110" y2="126" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="132" x2="106" y2="132" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

function InjectionArt({ palette }: { palette: Palette }) {
  return (
    <g transform="rotate(-35 100 100)">
      <ellipse cx="100" cy="150" rx="52" ry="9" fill="rgba(0,0,0,0.10)" />
      <rect x="40" y="92" width="96" height="18" rx="6" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="2.5" />
      <rect x="52" y="86" width="10" height="30" rx="3" fill={palette.accent} />
      <rect x="118" y="86" width="10" height="30" rx="3" fill={palette.accent} />
      <rect x="132" y="96" width="42" height="10" rx="3" fill={palette.accent} />
      <rect x="170" y="98" width="22" height="6" rx="2" fill={palette.accent} opacity="0.8" />
      <rect x="62" y="96" width="52" height="10" rx="3" fill="#ffffff" opacity="0.5" />
    </g>
  );
}

function CreamArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="178" rx="42" ry="9" fill="rgba(0,0,0,0.10)" />
      <path d="M70 78 h60 v78 a12 12 0 0 1 -12 12 h-36 a12 12 0 0 1 -12 -12 z" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" strokeLinejoin="round" />
      <rect x="78" y="58" width="44" height="22" rx="5" fill={palette.accent} />
      <path d="M100 58 v-14 a6 6 0 0 1 6 -6 h8" fill="none" stroke={palette.accent} strokeWidth="5" strokeLinecap="round" />
      <rect x="82" y="104" width="36" height="34" rx="4" fill="#ffffff" opacity="0.9" />
      <path d="M100 112 c6 0 8 6 8 10 a8 8 0 0 1 -16 0 c0 -4 2 -10 8 -10 z" fill={palette.accent} opacity="0.8" />
    </g>
  );
}

function DropsArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="178" rx="34" ry="8" fill="rgba(0,0,0,0.10)" />
      <path d="M84 70 h32 v16 l8 12 v68 a10 10 0 0 1 -10 10 h-28 a10 10 0 0 1 -10 -10 v-68 l8 -12 z" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" strokeLinejoin="round" />
      <rect x="88" y="52" width="24" height="20" rx="4" fill={palette.accent} />
      <path d="M100 34 c6 8 10 12 10 18 a10 10 0 0 1 -20 0 c0 -6 4 -10 10 -18 z" fill={palette.accent} />
      <path d="M100 96 c8 0 12 8 12 16 a12 12 0 0 1 -24 0 c0 -8 4 -16 12 -16 z" fill={palette.accent} opacity="0.75" />
    </g>
  );
}

function InhalerArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="180" rx="34" ry="8" fill="rgba(0,0,0,0.10)" />
      <rect x="76" y="58" width="48" height="104" rx="14" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" />
      <rect x="84" y="46" width="32" height="18" rx="6" fill={palette.accent} />
      <path d="M84 70 h32 v34 h-32 z" fill="#ffffff" opacity="0.55" />
      <path d="M116 78 c14 0 20 8 20 18 v10 h-18 v-12 c0 -4 -2 -6 -6 -6 z" fill={palette.accent} />
      <circle cx="100" cy="130" r="10" fill={palette.accent} opacity="0.6" />
    </g>
  );
}

function SachetArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="176" rx="46" ry="9" fill="rgba(0,0,0,0.10)" />
      <path d="M62 52 h76 a6 6 0 0 1 6 6 v18 l-8 8 v76 a8 8 0 0 1 -8 8 h-60 a8 8 0 0 1 -8 -8 v-76 l-8 -8 v-18 a6 6 0 0 1 6 -6 z" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" strokeLinejoin="round" />
      <path d="M62 52 h76 l-6 14 h-64 z" fill={palette.accent} opacity="0.5" />
      <rect x="82" y="102" width="36" height="28" rx="4" fill="#ffffff" opacity="0.9" />
      <path d="M90 110 h20 M90 118 h14" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function OintmentArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="178" rx="38" ry="8" fill="rgba(0,0,0,0.10)" />
      <rect x="68" y="86" width="64" height="78" rx="10" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" />
      <rect x="74" y="64" width="52" height="26" rx="6" fill={palette.accent} />
      <rect x="80" y="70" width="40" height="6" rx="3" fill="#ffffff" opacity="0.4" />
      <path d="M88 120 h24 v20 a6 6 0 0 1 -6 6 h-12 a6 6 0 0 1 -6 -6 z" fill={palette.accent} opacity="0.55" />
    </g>
  );
}

function PowderArt({ palette }: { palette: Palette }) {
  return (
    <g>
      <ellipse cx="100" cy="176" rx="46" ry="10" fill="rgba(0,0,0,0.10)" />
      <path d="M66 78 h68 l-8 84 a8 8 0 0 1 -8 8 h-36 a8 8 0 0 1 -8 -8 z" fill={palette.accentSoft} stroke={palette.accent} strokeWidth="3" strokeLinejoin="round" />
      <rect x="74" y="62" width="52" height="20" rx="5" fill={palette.accent} />
      <path d="M82 78 c4 -8 32 -8 36 0 z" fill={palette.accent} opacity="0.4" />
      <circle cx="90" cy="112" r="3" fill={palette.accent} opacity="0.7" />
      <circle cx="104" cy="124" r="2.5" fill={palette.accent} opacity="0.7" />
      <circle cx="96" cy="138" r="3" fill={palette.accent} opacity="0.7" />
      <circle cx="110" cy="104" r="2" fill={palette.accent} opacity="0.6" />
    </g>
  );
}

function renderArt(form: DosageForm, palette: Palette, seed: number) {
  switch (form) {
    case "Capsule":
      return <CapsuleArt palette={palette} seed={seed} />;
    case "Syrup":
      return <SyrupArt palette={palette} />;
    case "Injection":
      return <InjectionArt palette={palette} />;
    case "Cream":
      return <CreamArt palette={palette} />;
    case "Drops":
      return <DropsArt palette={palette} />;
    case "Inhaler":
      return <InhalerArt palette={palette} />;
    case "Sachet":
      return <SachetArt palette={palette} />;
    case "Ointment":
      return <OintmentArt palette={palette} />;
    case "Powder":
      return <PowderArt palette={palette} />;
    case "Tablet":
    default:
      return <TabletArt palette={palette} seed={seed} />;
  }
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export function MedicineIllustration({
  medicineName,
  genericName,
  strength,
  dosageForm,
  category,
  size = 220,
  className,
}: {
  medicineName: string;
  genericName?: string | null;
  strength?: string | null;
  dosageForm?: string | null;
  category?: string | null;
  size?: number;
  className?: string;
}) {
  const name = (medicineName || "Medicine").toString();
  const palette = getPalette(category, name);
  const form: DosageForm = (DOSAGE_FORMS.find((f) => f.toLowerCase() === (dosageForm ?? "").toLowerCase()) ?? inferDosageForm(name, strength));
  const seed = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const strengthParts = splitStrength(strength);
  const displayName = truncate(name, 16);
  const displayGeneric = genericName ? truncate(genericName, 22) : "";
  const displayStrength = strengthParts.value ? truncate(strengthParts.value, 10) : "";

  const style: CSSProperties = { width: size, height: size };

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ ...style, borderRadius: Math.round(size * 0.14) }}
      role="img"
      aria-label={`${name} ${displayStrength} ${form} illustration`}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`bg-${seed}-${form}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.bgFrom} />
            <stop offset="100%" stopColor={palette.bgTo} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height="200" rx="28" fill={`url(#bg-${seed}-${form})`} />
        <circle cx="164" cy="40" r="30" fill={palette.accent} opacity="0.08" />
        <circle cx="34" cy="168" r="24" fill={palette.accent} opacity="0.07" />

        {displayStrength && (
          <g>
            <rect x="60" y="16" width="80" height="24" rx="12" fill={palette.chip} />
            <text x="100" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill={palette.text} fontFamily="Inter, system-ui, sans-serif">
              {displayStrength}
            </text>
          </g>
        )}

        <g transform="translate(0 6) scale(0.86) translate(16 8)">{renderArt(form, palette, seed)}</g>

        <text x="100" y="150" textAnchor="middle" fontSize="15" fontWeight="800" fill={palette.text} fontFamily="Inter, system-ui, sans-serif" letterSpacing="-0.2">
          {displayName}
        </text>
        {displayGeneric && (
          <text x="100" y="164" textAnchor="middle" fontSize="8.5" fontWeight="500" fill={palette.subtext} fontFamily="Inter, system-ui, sans-serif">
            {displayGeneric}
          </text>
        )}
        <text x="100" y="186" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={palette.accent} fontFamily="Inter, system-ui, sans-serif" letterSpacing="0.6">
          {form.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

export default MedicineIllustration;