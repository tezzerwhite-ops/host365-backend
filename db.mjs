import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'host365.db');

export function initDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, location TEXT NOT NULL, bedrooms INTEGER, maxGuests INTEGER, basePrice REAL, airbnbId TEXT, bookingComId TEXT, vrboId TEXT, imageUrl TEXT);
    CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER NOT NULL, guestName TEXT NOT NULL, channel TEXT NOT NULL, checkin TEXT NOT NULL, checkout TEXT NOT NULL, guests INTEGER, totalRevenue REAL, status TEXT DEFAULT 'confirmed', FOREIGN KEY (propertyId) REFERENCES properties(id));
    CREATE TABLE IF NOT EXISTS threads (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER NOT NULL, bookingId INTEGER, guestName TEXT NOT NULL, channel TEXT NOT NULL, subject TEXT NOT NULL, status TEXT DEFAULT 'open', priority TEXT DEFAULT 'normal', aiCategory TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, FOREIGN KEY (propertyId) REFERENCES properties(id), FOREIGN KEY (bookingId) REFERENCES bookings(id));
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, threadId INTEGER NOT NULL, direction TEXT NOT NULL, channel TEXT NOT NULL, text TEXT NOT NULL, aiSuggested INTEGER DEFAULT 0, sentAt TEXT NOT NULL, FOREIGN KEY (threadId) REFERENCES threads(id));
    CREATE TABLE IF NOT EXISTS pricing_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER NOT NULL, date TEXT NOT NULL, basePrice REAL NOT NULL, demandMultiplier REAL DEFAULT 1.0, competitorAvg REAL, finalPrice REAL NOT NULL, reason TEXT, updatedAt TEXT NOT NULL, FOREIGN KEY (propertyId) REFERENCES properties(id), UNIQUE(propertyId, date));
    CREATE TABLE IF NOT EXISTS competitor_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER NOT NULL, date TEXT NOT NULL, channel TEXT NOT NULL, rate REAL NOT NULL, fetchedAt TEXT NOT NULL, FOREIGN KEY (propertyId) REFERENCES properties(id), UNIQUE(propertyId, date, channel));
  `);
  return db;
}
