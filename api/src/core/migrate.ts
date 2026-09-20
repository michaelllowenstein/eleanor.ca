import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const currentFile = fileURLToPath(import.meta.url);
const directory = path.resolve(
  path.dirname(currentFile),
  "../migrations",
);

const database = new Pool({
  connectionString: databaseUrl,
  max: 1
});

try {
  const migrations = (await readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migration of migrations) {
    console.log(`Applying ${migration}`);
    await database.query(
      await readFile(path.join(directory, migration), "utf8"),
    );
  }
} finally {
  await database.end();
}
