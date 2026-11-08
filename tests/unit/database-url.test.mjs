import test from "node:test";
import assert from "node:assert/strict";
import { buildDatabaseUrl } from "../../src/lib/database-url.ts";

test("uses DATABASE_URL when it is explicitly configured", () => {
  assert.equal(buildDatabaseUrl({ DATABASE_URL: "mysql://db.example/app" }), "mysql://db.example/app");
});

test("builds an encoded MySQL URL from DB_* variables", () => {
  const value = buildDatabaseUrl({
    DB_HOST: "127.0.0.1",
    DB_USER: "app user",
    DB_PASSWORD: "p@ss:word#1",
    DB_NAME: "inventory app",
    DB_PORT: "3306",
  });
  const url = new URL(value);

  assert.equal(url.hostname, "127.0.0.1");
  assert.equal(url.port, "3306");
  assert.equal(decodeURIComponent(url.username), "app user");
  assert.equal(decodeURIComponent(url.password), "p@ss:word#1");
  assert.equal(decodeURIComponent(url.pathname.slice(1)), "inventory app");
});

test("returns undefined for incomplete or invalid DB_* configuration", () => {
  assert.equal(buildDatabaseUrl({ DB_HOST: "localhost" }), undefined);
  assert.equal(buildDatabaseUrl({ DB_HOST: "localhost", DB_USER: "app", DB_PASSWORD: "x", DB_NAME: "app", DB_PORT: "70000" }), undefined);
});