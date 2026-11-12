export type NormalizedIngredient = {
  name: string;
  role?: string | null;
  strengthText?: string | null;
};

export type NormalizedIdentifier = {
  system: string;
  value: string;
  use?: string | null;
};

export type NormalizedPackage = {
  description?: string | null;
  quantityValue?: string | null;
  quantityUnit?: string | null;
  gtin?: string | null;
  regulatoryStatus?: string | null;
  marketingStatus?: string | null;
  sourceRecordId?: string | null;
};

export type NormalizedAlias = {
  alias: string;
  aliasType: "BRAND" | "GENERIC" | "ABBREVIATION" | "OTHER";
};

export type NormalizedMedicine = {
  sourceKey: string;
  sourceRecordId: string;
  brandName?: string | null;
  genericName?: string | null;
  displayName: string;
  strengthText?: string | null;
  dosageForm?: string | null;
  route?: string | null;
  atcCode?: string | null;
  manufacturerName?: string | null;
  countryCode?: string | null;
  regulatoryStatus?: string | null;
  ingredients: NormalizedIngredient[];
  identifiers: NormalizedIdentifier[];
  packages: NormalizedPackage[];
  aliases: NormalizedAlias[];
};

export type AdapterInput = {
  /** Directory containing downloaded/extracted dataset files. */
  workDir: string;
  /** Original downloaded archive path, if any. */
  archivePath?: string | null;
  /** Dataset release label (e.g. "2026.11"). */
  datasetLabel?: string | null;
};

export type ProgressUpdate = {
  processed: number;
  imported: number;
  duplicate: number;
  failed: number;
  cursor?: string | null;
  totalRecords?: number | null;
};

export type ImportContext = {
  jobId: string;
  sourceKey: string;
  batchSize: number;
  /** Number of records already processed by previous runs (resume offset). */
  resumeOffset: number;
  onProgress: (update: ProgressUpdate) => Promise<void>;
  shouldStop: () => boolean;
};

export interface CatalogAdapter {
  key: string;
  label: string;
  /** Human-readable dataset location shown in the admin UI. */
  datasetUrl: string;
  /** Download/extract the dataset into `workDir`. */
  prepare(input: AdapterInput): Promise<void>;
  /** Yields normalized records in a stable order so resume offsets are valid. */
  iterRecords(input: AdapterInput): AsyncGenerator<NormalizedMedicine, void, void>;
  /** Release any resources held by the adapter. */
  cleanup?(): Promise<void>;
}