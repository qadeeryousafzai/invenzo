export type SqliteRow = Record<string, unknown>;

export type SqliteStatement<T> = {
  all(...params: unknown[]): T[];
  get(...params: unknown[]): T | undefined;
  iterate(...params: unknown[]): Iterable<T>;
};

export type SqliteReader = {
  prepare<T = SqliteRow>(sql: string): SqliteStatement<T>;
  /** Stream every row of a query without materialising the result set. */
  iterate<T = SqliteRow>(sql: string): Iterable<T>;
  close(): void;
};

type NodeSqliteStatement = {
  all(...params: unknown[]): unknown[];
  get(...params: unknown[]): unknown;
  iterate(...params: unknown[]): IterableIterator<unknown>;
};

type NodeSqliteDatabase = {
  prepare(sql: string): NodeSqliteStatement;
  close(): void;
};

type BetterSqlite3Statement<T> = {
  all(...params: unknown[]): T[];
  get(...params: unknown[]): T | undefined;
  iterate(...params: unknown[]): IterableIterator<T>;
};

type BetterSqlite3Database = {
  prepare<T>(sql: string): BetterSqlite3Statement<T>;
  close(): void;
};

/**
 * Open a SQLite database read-only.
 *
 * Prefers the built-in `node:sqlite` module (Node 22+) and falls back to
 * `better-sqlite3` when it is installed. Both are loaded dynamically so the
 * application still builds when neither is available.
 */
export async function openSqliteReadOnly(file: string): Promise<SqliteReader> {
  const nodeSqlite = await loadNodeSqlite();
  if (nodeSqlite) {
    const db = new nodeSqlite.DatabaseSync(file, { readOnly: true }) as NodeSqliteDatabase;
    return {
      prepare<T>(sql: string) {
        const statement = db.prepare(sql);
        return {
          all: (...params) => statement.all(...params) as T[],
          get: (...params) => statement.get(...params) as T | undefined,
          iterate: (...params) => statement.iterate(...params) as Iterable<T>,
        };
      },
      iterate<T>(sql: string) {
        return db.prepare(sql).iterate() as Iterable<T>;
      },
      close: () => db.close(),
    };
  }

  const betterSqlite3 = await loadBetterSqlite3();
  if (betterSqlite3) {
    const db = new betterSqlite3(file, { readonly: true, fileMustExist: true }) as BetterSqlite3Database;
    return {
      prepare<T>(sql: string) {
        const statement = db.prepare<T>(sql);
        return {
          all: (...params) => statement.all(...params),
          get: (...params) => statement.get(...params),
          iterate: (...params) => statement.iterate(...params),
        };
      },
      iterate<T>(sql: string) {
        return db.prepare<T>(sql).iterate() as Iterable<T>;
      },
      close: () => db.close(),
    };
  }

  throw new Error(
    "Reading the Open Medication Catalog SQLite release requires either Node.js 22+ (built-in node:sqlite) or the better-sqlite3 package. Install better-sqlite3 or run the importer on Node.js 22+.",
  );
}

async function loadNodeSqlite(): Promise<{ DatabaseSync: new (file: string, options?: { readOnly?: boolean }) => NodeSqliteDatabase } | null> {
  try {
    const moduleName = "node:sqlite";
    const mod = (await import(moduleName)) as unknown as {
      DatabaseSync?: new (file: string, options?: { readOnly?: boolean }) => NodeSqliteDatabase;
    };
    if (mod.DatabaseSync) return { DatabaseSync: mod.DatabaseSync };
    return null;
  } catch {
    return null;
  }
}

async function loadBetterSqlite3(): Promise<(new (file: string, options?: { readonly?: boolean; fileMustExist?: boolean }) => BetterSqlite3Database) | null> {
  try {
    const mod = (await import("better-sqlite3")) as unknown as {
      default?: new (file: string, options?: { readonly?: boolean; fileMustExist?: boolean }) => BetterSqlite3Database;
    };
    return mod.default ?? null;
  } catch {
    return null;
  }
}