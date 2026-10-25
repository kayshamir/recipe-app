import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let pending: Promise<SQLiteDatabase> | undefined;
export function database() {
  pending ??= openDatabaseAsync('recipe-app.db')
    .then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.withTransactionAsync(async () => {
        const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
        if ((row?.user_version ?? 0) < 1) {
          await db.execAsync(`
          CREATE TABLE favorites (recipe_id TEXT PRIMARY KEY, title TEXT NOT NULL, version INTEGER NOT NULL);
          CREATE TABLE shopping_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
            quantity TEXT NOT NULL, unit TEXT, purchased INTEGER NOT NULL DEFAULT 0);
          CREATE TABLE downloads (recipe_id TEXT PRIMARY KEY, version INTEGER NOT NULL, saved_at TEXT NOT NULL);
          PRAGMA user_version = 1;
        `);
        }
      });
      return db;
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}
