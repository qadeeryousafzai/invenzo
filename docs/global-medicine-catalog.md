# Global Medicine Catalog

The catalog ingests public pharmaceutical reference datasets into normalized MySQL tables so every
pharmacy works from one shared medicine list instead of typing products by hand.

- Super-admin console: **Super admin → Medicine Catalog** (`/super-admin/catalog`)
- Pharmacy search: **Inventory → Medicine Catalog** (`/dashboard/catalog`)

## Architecture

```
adapters/            one importer per upstream dataset
  open-medication.ts OMC SQLite releases (multi-country)
  rxnorm.ts          RxNorm current prescribable RRF
  fda-ndc.ts         FDA NDC directory text files
  dailymed.ts        NLM SPL XML (nested per-label zips and plain XML releases)
  restricted.ts      WHO INN, EMA Article 57, DRAP — disabled pending licence clearance
normalize.ts         text/name/dosage-form/strength normalization
dedupe.ts            deterministic canonical keys for duplicate detection
runner.ts            job lifecycle, batched persistence, resume, error capture
registry.ts          source key → adapter lookup
overview.ts          source list with medicine counts and latest job
```

Each adapter yields `NormalizedMedicine` records. `runner.ts` batches them, resolves manufacturers,
inserts medicines with ingredients/identifiers/packages/aliases/source records, and records progress
on `medicine_import_jobs` so a stopped import can be resumed from its cursor.

## Tables

| Table | Purpose |
| --- | --- |
| `medicine_sources` | Source registry, licence flags, attribution requirements |
| `medicine_categories` | Optional category tree |
| `medicine_manufacturers` | Deduplicated manufacturers |
| `medicines` | One row per canonical product (brand/generic/strength/form/manufacturer) |
| `medicine_ingredients` | Active and inactive ingredients with strengths |
| `medicine_identifiers` | NDC, RxNorm CUI, SPL set id, … |
| `medicine_packages` | Package-level GTIN/NDC data |
| `medicine_source_records` | Provenance: which upstream record produced which medicine |
| `medicine_aliases` | Alternate names |
| `medicine_import_jobs` | Import run status, counters, resume cursor |
| `medicine_import_errors` | Capped log of failed records |

`products.catalogMedicineId` links a workspace product to its catalog medicine.

## Running an import

1. Apply the migration on the target database:

   ```bash
   npx prisma migrate deploy
   ```

2. Open **Super admin → Medicine Catalog**, pick a source and click **Start import**.
3. Watch progress in the import history table (it polls while a job is running).

Large jobs download the archive to the server's temp directory first, then stream it. Expect
several minutes for the multi-gigabyte DailyMed releases. Imports are skipped for sources whose
licence is not cleared (`who-inn`, `ema`, `drap`).

### Dataset options

| Source | Default dataset | Notes |
| --- | --- | --- |
| `omc` | newest `us-base` release | ~197 MB zip; 116 552 products parsed in ~90 s |
| `rxnorm` | `RxNorm_full_prescribe_current.zip` | pipe-delimited RRF |
| `fda-ndc` | `ndctext.zip` | 116 660 products parsed in ~5 s |
| `dailymed` | `human_rx_part1` | each label ships as its own nested zip; a daily update (158 labels) parses in ~35 s |

Environment overrides:

```bash
CATALOG_DAILYMED_DATASET=human_rx_part1   # or daily | weekly | monthly | human_otc_part1 …
CATALOG_MAX_DOWNLOAD_MB=4096              # download safety cap
```

## Licensing

These flags are a record of each dataset's published terms, not legal advice. Review the linked
terms before commercial redistribution.

| Source | Licence | Redistribution | Commercial | Attribution |
| --- | --- | --- | --- | --- |
| Open Medication Catalog | Apache-2.0 generator; upstream terms per country | Yes | Yes | Yes (Swissmedic, BDPM, RPL) |
| RxNorm (prescribable) | NLM RxNorm Terms of Service | Yes | Yes | Yes |
| FDA NDC Directory | US Government public domain | Yes | Yes | No (appreciated) |
| DailyMed / SPL | NLM content, generally not copyrighted | Yes | Yes | Yes |
| WHO INN | WHO terms of use | No | No | Yes — written permission required |
| EMA Article 57 | EMA reuse policy | No | No | Yes — written permission required |
| DRAP Pakistan | No explicit reuse licence | No | No | Yes — written permission required |

`medicine_sources` stores the licence fields per record and `medicine_source_records` copies them
onto every imported record, so attribution can be reproduced from the database alone.

## Performance notes

The OMC SQLite release has no index on its foreign-key columns, so the adapter reads each child
table once and buckets it in memory instead of querying per product — that change took the US
release from ~40 minutes to under two minutes.

## Verifying an import

```sql
SELECT s.name, COUNT(m.id) AS medicines
FROM medicine_sources s
LEFT JOIN medicines m ON m.sourceId = s.id
GROUP BY s.name;

SELECT status, processedRecords, importedRecords, duplicateRecords, failedRecords
FROM medicine_import_jobs
ORDER BY createdAt DESC
LIMIT 10;
```

Failed records are capped at 200 per job in `medicine_import_errors` to keep the table small; the
job counters keep the true totals.