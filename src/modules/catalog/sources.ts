import { COUNTRY_NAMES } from "./normalize";

export type SourceDefinition = {
  key: string;
  name: string;
  countryCode: string | null;
  homepageUrl: string;
  datasetUrl: string;
  licenseName: string;
  licenseUrl: string;
  attributionRequired: boolean;
  redistributionAllowed: boolean;
  commercialUseAllowed: boolean;
  adapterKey: string | null;
  /** false → adapter exists but must not be run without explicit permission. */
  enabled: boolean;
  /** Short status shown in the admin UI. */
  status: "ready" | "review-required" | "blocked";
  notes: string;
};

/**
 * Registry of supported global-medicine sources.
 *
 * Licensing flags are a record of each upstream dataset's published terms. They
 * are not legal advice; review the linked terms before commercial redistribution.
 */
export const CATALOG_SOURCES: SourceDefinition[] = [
  {
    key: "omc",
    name: "Open Medication Catalog",
    countryCode: "MULTI",
    homepageUrl: "https://openmedicationcatalog.org/",
    datasetUrl: "https://openmedicationcatalog.org/catalog.json",
    licenseName: "Per-source upstream terms (Apache-2.0 generator)",
    licenseUrl: "https://github.com/open-medication/open-medication-catalog/blob/main/docs/licences.md",
    attributionRequired: true,
    redistributionAllowed: true,
    commercialUseAllowed: true,
    adapterKey: "omc",
    enabled: true,
    status: "ready",
    notes:
      "Aggregates Swissmedic (CH), BDPM (FR), RPL (PL) and FDA NDC (US). Each national source keeps its own upstream licence; see the linked licensing report. Swissmedic/BDPM/RPL require attribution.",
  },
  {
    key: "rxnorm",
    name: "RxNorm Current Prescribable Content",
    countryCode: "US",
    homepageUrl: "https://www.nlm.nih.gov/research/umls/rxnorm/",
    datasetUrl: "https://download.nlm.nih.gov/rxnorm/RxNorm_full_prescribe_current.zip",
    licenseName: "NLM RxNorm Terms of Service",
    licenseUrl: "https://www.nlm.nih.gov/research/umls/rxnorm/docs/termsofservice.html",
    attributionRequired: true,
    redistributionAllowed: true,
    commercialUseAllowed: true,
    adapterKey: "rxnorm",
    enabled: true,
    status: "ready",
    notes:
      "Current Prescribable Content monthly release, pipe-delimited RRF. No UMLS licence required for the prescribable subset. Attribution to NLM RxNorm is expected.",
  },
  {
    key: "fda-ndc",
    name: "US FDA NDC Directory",
    countryCode: "US",
    homepageUrl: "https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory",
    datasetUrl: "https://www.accessdata.fda.gov/cder/ndctext.zip",
    licenseName: "US Government public domain",
    licenseUrl: "https://www.fda.gov/about-fda/about-website/website-policies",
    attributionRequired: false,
    redistributionAllowed: true,
    commercialUseAllowed: true,
    adapterKey: "fda-ndc",
    enabled: true,
    status: "ready",
    notes:
      "FDA NDC directory text files (product.txt, package.txt). Public domain as a US government work; credit appreciated but not required.",
  },
  {
    key: "dailymed",
    name: "DailyMed (NLM SPL)",
    countryCode: "US",
    homepageUrl: "https://dailymed.nlm.nih.gov/",
    datasetUrl: "https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm",
    licenseName: "NLM DailyMed terms (public domain SPL content)",
    licenseUrl: "https://www.nlm.nih.gov/copyright.html",
    attributionRequired: true,
    redistributionAllowed: true,
    commercialUseAllowed: true,
    adapterKey: "dailymed",
    enabled: true,
    status: "ready",
    notes:
      "Structured Product Labeling XML. NLM content is generally not subject to copyright; attribution to DailyMed/NLM is expected. Large archive — run off-peak.",
  },
  {
    key: "who-inn",
    name: "WHO International Nonproprietary Names",
    countryCode: "GLOBAL",
    homepageUrl: "https://www.who.int/teams/health-product-and-policy-standards/inn/inn-schemas",
    datasetUrl: "https://www.who.int/teams/health-product-and-policy-standards/inn/inn-schemas",
    licenseName: "WHO terms of use (review required)",
    licenseUrl: "https://www.who.int/about/copyright",
    attributionRequired: true,
    redistributionAllowed: false,
    commercialUseAllowed: false,
    adapterKey: "who-inn",
    enabled: false,
    status: "review-required",
    notes:
      "No bulk dataset is published for redistribution. INN lists are available as PDF/website content only. Requires written permission before any commercial redistribution.",
  },
  {
    key: "ema",
    name: "European Medicines Agency (Article 57)",
    countryCode: "MULTI",
    homepageUrl: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database",
    datasetUrl: "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database",
    licenseName: "EMA copyright / reuse policy (review required)",
    licenseUrl: "https://www.ema.europa.eu/en/about-us/terms-use-website",
    attributionRequired: true,
    redistributionAllowed: false,
    commercialUseAllowed: false,
    adapterKey: "ema",
    enabled: false,
    status: "review-required",
    notes:
      "Article 57 database export requires registration and acceptance of EMA terms. Redistribution is restricted; obtain written confirmation before ingesting.",
  },
  {
    key: "drap",
    name: "DRAP Pakistan",
    countryCode: "PK",
    homepageUrl: "https://www.dra.gov.pk/",
    datasetUrl: "https://www.dra.gov.pk/",
    licenseName: "DRAP terms (written permission required)",
    licenseUrl: "https://www.dra.gov.pk/",
    attributionRequired: true,
    redistributionAllowed: false,
    commercialUseAllowed: false,
    adapterKey: "drap",
    enabled: false,
    status: "blocked",
    notes:
      "DRAP registered-drug lists are published as PDFs without an explicit reuse licence. Written permission from DRAP is required before commercial use. Adapter is intentionally disabled until that permission is on file.",
  },
];

export function getSourceDefinition(key: string): SourceDefinition | undefined {
  return CATALOG_SOURCES.find((source) => source.key === key);
}

export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}