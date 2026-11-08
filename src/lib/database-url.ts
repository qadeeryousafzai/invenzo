type DatabaseEnvironment = Record<string, string | undefined>;

export function buildDatabaseUrl(environment: DatabaseEnvironment = process.env) {
  const configuredUrl = environment.DATABASE_URL?.trim();
  if (configuredUrl) return configuredUrl;

  const host = environment.DB_HOST?.trim();
  const username = environment.DB_USER?.trim();
  const password = environment.DB_PASSWORD;
  const database = environment.DB_NAME?.trim();
  const port = Number(environment.DB_PORT || 3306);

  if (!host || !username || !password || !database) return undefined;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return undefined;

  const url = new URL("mysql://localhost");
  url.hostname = host;
  url.port = String(port);
  url.username = username;
  url.password = password;
  url.pathname = `/${encodeURIComponent(database)}`;
  return url.toString();
}

export function configureDatabaseUrl() {
  const databaseUrl = buildDatabaseUrl();
  if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}