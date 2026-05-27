import { Router } from 'express';
import { calculatePricing } from '../ai/calculatePricing.mjs';
const router = Router();

router.get('/:propertyId', (req, res) => {
  const db = req.app.locals.db;
  const p = db.prepare('SELECT * FROM properties WHERE id=?').get(req.params.propertyId);
  if (!p) return res.status(404).json({ error: 'Not found' });
  p.rates = db.prepare('SELECT * FROM pricing_rates WHERE propertyId=? ORDER BY date ASC').all(req.params.propertyId);
  p.competitors = db.prepare('SELECT * FROM competitor_rates WHERE propertyId=? ORDER BY date, channel').all(req.params.propertyId);
  res.json(p);
});

router.get('/:propertyId/rates', (req, res) => {
  const db = req.app.locals.db;
  const { month } = req.query;
  let q = 'SELECT * FROM pricing_rates WHERE propertyId=?';
  const p = [req.params.propertyId];
  if (month) { q += ' AND date LIKE ?'; p.push(month+'%'); }
  q += ' ORDER BY date ASC';
  res.json(db.prepare(q).all(...p));
});

router.post('/:propertyId/rates', (req, res) => {
  const db = req.app.locals.db;
  const { date, price, reason } = req.body;
  if (!date || !price) return res.status(400).json({ error: 'date and price required' });
  const prop = db.prepare('SELECT * FROM properties WHERE id=?').get(req.params.propertyId);
  if (!prop) return res.status(404).json({ error: 'Not found' });
  const { demandMultiplier } = calculatePricing(prop.basePrice, date, 0, 0);
  const compAvg = db.prepare('SELECT AVG(rate) as avg FROM competitor_rates WHERE propertyId=? AND date=?').get(req.params.propertyId, date)?.avg || 0;
  db.prepare('INSERT INTO pricing_rates (propertyId,date,basePrice,demandMultiplier,competitorAvg,finalPrice,reason,updatedAt) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(propertyId,date) DO UPDATE SET finalPrice=excluded.finalPrice,demandMultiplier=excluded.demandMultiplier,reason=excluded.reason,updatedAt=excluded.updatedAt').run(req.params.propertyId, date, prop.basePrice, demandMultiplier, compAvg, price, reason||'manual adjustment', new Date().toISOString());
  res.json({ success: true, date, finalPrice: price, reason: reason||'manual adjustment' });
});

router.get('/:propertyId/competitors', (req, res) => {
  res.json(req.app.locals.db.prepare('SELECT * FROM competitor_rates WHERE propertyId=? ORDER BY date, channel').all(req.params.propertyId));
});

router.get('/:propertyId/analytics', (req, res) => {
  const db = req.app.locals.db;
  const pid = req.params.propertyId;
  const mr = db.prepare("SELECT strftime('%Y-%m',checkin) as month,SUM(totalRevenue) as revenue,COUNT(*) as bookings FROM bookings WHERE propertyId=? AND status='confirmed' GROUP BY month ORDER BY month").all(pid);
  const cr = db.prepare("SELECT channel,SUM(totalRevenue) as revenue,COUNT(*) as bookings FROM bookings WHERE propertyId=? AND status='confirmed' GROUP BY channel").all(pid);
  const cm = new Date().toISOString().substring(0,7);
  const cmr = db.prepare("SELECT COALESCE(SUM(totalRevenue),0) as revenue FROM bookings WHERE propertyId=? AND checkin LIKE ? AND status='confirmed'").get(pid, cm+'%');
  const ag = db.prepare("SELECT COALESCE(SUM(guests),0) as total FROM bookings WHERE propertyId=? AND checkin<=date('now') AND checkout>=date('now') AND status='confirmed'").get(pid);
  const oc = db.prepare("SELECT COUNT(*) * 100.0 / 30 as rate FROM bookings WHERE propertyId=? AND checkin<=date('now') AND checkout>=date('now') AND status='confirmed'").get(pid);
  const ad = db.prepare("SELECT AVG(finalPrice) as avg FROM pricing_rates WHERE propertyId=? AND date LIKE ?").get(pid, cm+'%');
  res.json({ monthlyRevenue: mr, channelRevenue: cr, currentMonthRevenue: cmr?.revenue||0, activeGuests: ag?.total||0, occupancyRate: Math.min(Math.round(oc?.rate||0),100), avgDailyRate: Math.round(ad?.avg||0) });
});

export default router;
