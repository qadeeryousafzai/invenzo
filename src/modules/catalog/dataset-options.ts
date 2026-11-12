/** Dataset selector options that are safe to import from client components. */
export type DailyMedSelectorOption = {
  value: string;
  label: string;
  hint: string;
};

export const DAILYMED_SELECTORS: DailyMedSelectorOption[] = [
  { value: "human_rx_part1", label: "Human prescription labels — part 1 (3.00 GB)", hint: "Largest single source of US prescription products" },
  { value: "human_rx_part2", label: "Human prescription labels — part 2 (3.00 GB)", hint: "" },
  { value: "human_rx_part3", label: "Human prescription labels — part 3 (3.00 GB)", hint: "" },
  { value: "human_rx_part4", label: "Human prescription labels — part 4 (3.00 GB)", hint: "" },
  { value: "human_rx_part5", label: "Human prescription labels — part 5 (3.00 GB)", hint: "" },
  { value: "human_rx_part6", label: "Human prescription labels — part 6 (1.82 GB)", hint: "" },
  { value: "human_otc_part1", label: "Human OTC labels — part 1 (3.00 GB)", hint: "" },
  { value: "monthly", label: "Latest monthly update (1.5–1.7 GB)", hint: "Incremental — not the full catalog" },
  { value: "weekly", label: "Latest weekly update (~680 MB)", hint: "Incremental — not the full catalog" },
  { value: "daily", label: "Latest daily update (88 MB)", hint: "Smallest — useful for a smoke test" },
];

export const DEFAULT_DAILYMED_SELECTOR = "human_rx_part1";