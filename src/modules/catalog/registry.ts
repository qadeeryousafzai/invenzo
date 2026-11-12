import type { CatalogAdapter } from "./types";
import { dailyMedAdapter } from "./adapters/dailymed";
import { drapAdapter, emaAdapter, whoInnAdapter } from "./adapters/restricted";
import { fdaNdcAdapter } from "./adapters/fda-ndc";
import { openMedicationAdapter } from "./adapters/open-medication";
import { rxnormAdapter } from "./adapters/rxnorm";

export const CATALOG_ADAPTERS: Record<string, CatalogAdapter> = {
  omc: openMedicationAdapter,
  rxnorm: rxnormAdapter,
  "fda-ndc": fdaNdcAdapter,
  dailymed: dailyMedAdapter,
  "who-inn": whoInnAdapter,
  ema: emaAdapter,
  drap: drapAdapter,
};

export function getCatalogAdapter(key: string): CatalogAdapter | null {
  return CATALOG_ADAPTERS[key] ?? null;
}