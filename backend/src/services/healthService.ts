import { database } from '../config/database';

export async function checkDatabaseConnection(): Promise<void> {
  await database.query('SELECT 1');
}