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
    
    console.log('[SQLiteService] Proveyendo proxy de base de datos compatibilidad better-sqlite3');
    // Proxy que emula better-sqlite3 API sobre sql.js
    const db = this.db;
    return {
      run: (sql: string, params: any[] = []) => db.run(sql, params),
      prepare: (sql: string) => {
        const stmt = db.prepare(sql);
        return {
          run: (...params: any[]) => {
            // better-sqlite3 permite .run(a, b, c) o .run([a, b, c])
            const finalParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
            stmt.run(finalParams);
            return { changes: 1 };
          },
          get: (...params: any[]) => {
            const finalParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
            stmt.bind(finalParams);
            let result = null;
            if (stmt.step()) result = stmt.getAsObject();
            stmt.reset();
            return result;
          },
          all: (...params: any[]) => {
            const finalParams = (params.length === 1 && Array.isArray(params[0])) ? params[0] : params;
            stmt.bind(finalParams);
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
