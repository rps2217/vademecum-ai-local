import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { openDB } from 'idb';

const DB_KEY = 'sqlite-db-file';

export class SQLiteService {
  private static db: any = null;
  private static SQL: any = null;

  static async initialize() {
    if (this.db) return;

    // Workaround for Vite/bundler module resolution weirdness
    const sqlInitFunc = typeof initSqlJs === 'function' ? initSqlJs : (initSqlJs as any).default;

    // Load SQL.js
    this.SQL = await sqlInitFunc({
      locateFile: () => sqlWasmUrl
    });

    // Try to load existing DB from storage
    const idb = await openDB('sqlite-storage', 1, {
      upgrade(db) {
        db.createObjectStore('data');
      },
    });

    const savedDb = await idb.get('data', DB_KEY);
    if (savedDb) {
      this.db = new this.SQL.Database(new Uint8Array(savedDb));
    } else {
      this.db = new this.SQL.Database();
      // Initialize Schema
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          sku TEXT PRIMARY KEY,
          nombre_comercial TEXT,
          data TEXT
        );
      `);
      await this.save();
    }
  }

  static async save() {
    if (!this.db) return;
    const data = this.db.export();
    const idb = await openDB('sqlite-storage', 1);
    await idb.put('data', data, DB_KEY);
  }

  static getDB() {
    if (!this.db) throw new Error('SQLite not initialized');
    
    // Proxy que emula better-sqlite3 API sobre sql.js
    const db = this.db;
    return {
      run: (sql: string, params: any[] = []) => db.run(sql, params),
      prepare: (sql: string) => {
        const stmt = db.prepare(sql);
        return {
          run: (...params: any[]) => {
            stmt.run(params);
            return { changes: 1 };
          },
          get: (...params: any[]) => {
            stmt.bind(params);
            let result = null;
            if (stmt.step()) result = stmt.getAsObject();
            stmt.reset();
            return result;
          },
          all: (...params: any[]) => {
            stmt.bind(params);
            const results = [];
            while (stmt.step()) {
              results.push(stmt.getAsObject());
            }
            stmt.reset();
            return results;
          },
          free: () => stmt.free()
        };
      },
      exec: (sql: string) => db.exec(sql)
    };
  }
}
