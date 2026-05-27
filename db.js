const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'host365.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec("CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, location TEXT, bedrooms INTEGER, maxGuests INTEGER, basePrice REAL, airbnbId TEXT, bookingComId TEXT, vrboId TEXT, imageUrl TEXT, description TEXT)");
  db.exec("CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER, guestName TEXT, channel TEXT, checkin TEXT, checkout TEXT, guests INTEGER, totalRevenue REAL, status TEXT DEFAULT 'confirmed')");
  db.exec("CREATE TABLE IF NOT EXISTS threads (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER, bookingId INTEGER, guestName TEXT, channel TEXT, subject TEXT, status TEXT DEFAULT 'open', priority TEXT DEFAULT 'normal', aiCategory TEXT, createdAt TEXT, updatedAt TEXT)");
  db.exec("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, threadId INTEGER, direction TEXT, channel TEXT, text TEXT, aiSuggested INTEGER DEFAULT 0, sentAt TEXT)");
  db.exec("CREATE TABLE IF NOT EXISTS pricing_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER, date TEXT, basePrice REAL, demandMultiplier REAL, competitorAvg REAL, finalPrice REAL, reason TEXT, updatedAt TEXT, UNIQUE(propertyId, date))");
  db.exec("CREATE TABLE IF NOT EXISTS competitor_rates (id INTEGER PRIMARY KEY AUTOINCREMENT, propertyId INTEGER, date TEXT, channel TEXT, rate REAL, fetchedAt TEXT, UNIQUE(propertyId, date, channel))");
}

function getProperties() { return getDb().prepare('SELECT * FROM properties').all(); }
function getProperty(id) { return getDb().prepare('SELECT * FROM properties WHERE id=?').get(id); }
function getUpcomingBookings(propId, days) {
  const today = new Date().toISOString().split('T')[0];
  const end = new Date(Date.now() + (days||7)*86400000).toISOString().split('T')[0];
  return getDb().prepare("SELECT * FROM bookings WHERE propertyId=? AND status='confirmed' AND checkout>=? AND checkin<=? ORDER BY checkin").all(propId, today, end);
}
function getBookingsByMonth(propId, ym) {
  return getDb().prepare("SELECT * FROM bookings WHERE propertyId=? AND (checkin LIKE ? OR checkout LIKE ?) ORDER BY checkin").all(propId, ym+'%', ym+'%');
}
function getThreads(propId, f) {
  f = f || {};
  let sql = 'SELECT * FROM threads WHERE propertyId=?';
  let params = [propId];
  if (f.status) { sql += ' AND status=?'; params.push(f.status); }
  if (f.priority) { sql += ' AND priority=?'; params.push(f.priority); }
  sql += ' ORDER BY updatedAt DESC';
  return getDb().prepare(sql).all(...params);
}
function getThread(id) { return getDb().prepare('SELECT * FROM threads WHERE id=?').get(id); }
function getThreadMessages(tid) { return getDb().prepare('SELECT * FROM messages WHERE threadId=? ORDER BY sentAt ASC').all(tid); }
function addMessage(tid, dir, ch, text, ai) {
  const now = new Date().toISOString();
  const r = getDb().prepare('INSERT INTO messages (threadId,direction,channel,text,aiSuggested,sentAt) VALUES (?,?,?,?,?,?)').run(tid, dir, ch, text, ai||0, now);
  getDb().prepare('UPDATE threads SET updatedAt=? WHERE id=?').run(now, tid);
  return r;
}
function createMessage(tid, dir, ch, text, ai, ts) {
  return getDb().prepare('INSERT INTO messages (threadId,direction,channel,text,aiSuggested,sentAt) VALUES (?,?,?,?,?,?)').run(tid, dir, ch, text, ai||0, ts||new Date().toISOString());
}
function updateThreadStatus(tid, s) {
  return getDb().prepare('UPDATE threads SET status=?, updatedAt=? WHERE id=?').run(s, new Date().toISOString(), tid);
}
function getUrgentCount(propId) {
  const r = getDb().prepare("SELECT COUNT(*) as c FROM threads WHERE propertyId=? AND priority='urgent' AND status='open'").get(propId);
  return r.c;
}
function getPricingRates(propId, ym) {
  let sql = 'SELECT * FROM pricing_rates WHERE propertyId=?';
  let params = [propId];
  if (ym) { sql += ' AND date LIKE ?'; params.push(ym+'%'); }
  sql += ' ORDER BY date';
  return getDb().prepare(sql).all(...params);
}
function upsertPricingRate(propId, date, bp, dm, ca, fp, reason) {
  const now = new Date().toISOString();
  return getDb().prepare("INSERT INTO pricing_rates (propertyId,date,basePrice,demandMultiplier,competitorAvg,finalPrice,reason,updatedAt) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(propertyId,date) DO UPDATE SET demandMultiplier=excluded.demandMultiplier,competitorAvg=excluded.competitorAvg,finalPrice=excluded.finalPrice,reason=COALESCE(excluded.reason,pricing_rates.reason),updatedAt=excluded.updatedAt").run(propId,date,bp,dm,ca,fp,reason,now);
}
function getCompetitorRates(propId, date) {
  return getDb().prepare('SELECT * FROM competitor_rates WHERE propertyId=? AND date=?').all(propId, date);
}
function getCompetitorRatesForRange(propId, ym) {
  return getDb().prepare('SELECT * FROM competitor_rates WHERE propertyId=? AND date LIKE ? ORDER BY date').all(propId, ym+'%');
}
function getRevenueData(propId) {
  const cy = new Date().getFullYear();
  const months = [];
  for (let m=1; m<=12; m++) {
    const ym = cy+'-'+String(m).padStart(2,'0');
    const r = getDb().prepare("SELECT SUM(totalRevenue) as rev, COUNT(*) as cnt FROM bookings WHERE propertyId=? AND status='confirmed' AND checkin LIKE ?").get(propId, ym+'%');
    months.push({month:ym, revenue: r.rev||0, bookings: r.cnt||0});
  }
  const cb = getDb().prepare("SELECT channel, SUM(totalRevenue) as rev, COUNT(*) as cnt FROM bookings WHERE propertyId=? AND status='confirmed' GROUP BY channel").all(propId);
  return {monthly:months, channelBreakdown:cb};
}

module.exports = {getDb,initSchema,getProperties,getProperty,getUpcomingBookings,getBookingsByMonth,getThreads,getThread,getThreadMessages,addMessage,createMessage,updateThreadStatus,getUrgentCount,getPricingRates,upsertPricingRate,getCompetitorRates,getCompetitorRatesForRange,getRevenueData};