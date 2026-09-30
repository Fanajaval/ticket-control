import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { database } from '../config/database';

async function setupDatabase(): Promise<void> {
  const schema = await readFile(join(process.cwd(), 'src/database/schema.sql'), 'utf8');
  const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean);

  for (const statement of statements) {
    await database.query(statement);
  }
}

setupDatabase()
  .then(() => console.log('Schéma MySQL prêt.'))
  .catch((error: unknown) => {
    console.error('Échec de la configuration MySQL.', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => database.end());