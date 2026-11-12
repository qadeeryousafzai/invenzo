import type { AdapterInput, CatalogAdapter } from "../types";

export class SourceNotLicensedError extends Error {
  readonly sourceKey: string;

  constructor(sourceKey: string, message: string) {
    super(message);
    this.name = "SourceNotLicensedError";
    this.sourceKey = sourceKey;
  }
}

/**
 * Placeholder adapters for sources whose upstream terms do not permit bulk
 * redistribution. They exist so the admin UI can list every requested source,
 * but they refuse to run until the licence position is confirmed in writing.
 */
function restrictedAdapter(options: {
  key: string;
  label: string;
  datasetUrl: string;
  reason: string;
}): CatalogAdapter {
  return {
    key: options.key,
    label: options.label,
    datasetUrl: options.datasetUrl,
    async prepare(input: AdapterInput): Promise<void> {
      void input;
      throw new SourceNotLicensedError(
        options.key,
        `The ${options.label} dataset is disabled in Invenzo. ${options.reason}`,
      );
    },
    async *iterRecords(): AsyncGenerator<never, void, void> {
      throw new SourceNotLicensedError(
        options.key,
        `The ${options.label} dataset is disabled in Invenzo. ${options.reason}`,
      );
    },
  };
}

export const whoInnAdapter = restrictedAdapter({
  key: "who-inn",
  label: "WHO International Nonproprietary Names",
  datasetUrl: "https://www.who.int/teams/health-product-and-policy-standards/inn/inn-schemas",
  reason:
    "WHO does not publish a redistributable bulk INN dataset. Written permission is required before ingesting INN lists; the WHO copyright terms forbid commercial redistribution without it.",
});

export const emaAdapter = restrictedAdapter({
  key: "ema",
  label: "European Medicines Agency (Article 57)",
  datasetUrl:
    "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database",
  reason:
    "The Article 57 database export requires EMA registration and acceptance of its reuse terms. Redistribution is restricted; confirm the licence in writing before enabling this source.",
});

export const drapAdapter = restrictedAdapter({
  key: "drap",
  label: "DRAP Pakistan",
  datasetUrl: "https://www.dra.gov.pk/",
  reason:
    "DRAP publishes registered-drug lists as PDFs without an explicit reuse licence. Written permission from DRAP is required before any commercial use, so the adapter stays disabled.",
});