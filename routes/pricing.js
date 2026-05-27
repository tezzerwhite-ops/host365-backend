const express = require('express');
const router = express.Router();
const db = require('../db');
const {calculatePricing} = require('../ai/calculatePricing');

router.get('/:propertyId', (req, res) => {
  try {
    const propId = parseInt(req.params.propertyId);
    const prop = db.getProperty(propId);
    if (!prop) return res.status(404).json({error:'Property not found'});
    const rates = db.getPricingRates(propId);
    const competitors = db.getCompetitorRatesForRange(propId, '2026-06');
    res.json({property:{id:prop.id,name:prop.name,basePrice:prop.basePrice}, rates, competitors});
  } catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:propertyId/rates', (req, res) => {
  try {
    const propId = parseInt(req.params.propertyId);
    const month = req.query.month || '2026-06';
    const rates = db.getPricingRates(propId, month);
    const enriched = rates.map(r => ({...r, competitors: db.getCompetitorRates(propId, r.date)}));
    res.json({rates:enriched});
  } catch(e) { res.status(500).json({error:e.message}); }
});

router.post('/:propertyId/rates', (req, res) => {
  try {
    const propId = parseInt(req.params.propertyId);
    const {date,price,reason} = req.body;
    if (!date||!price) return res.status(400).json({error:'date and price required'});
    const prop = db.getProperty(propId);
    if (!prop) return res.status(404).json({error:'Property not found'});
    const bookings = db.getBookingsByMonth(propId, date.substring(0,7));
    const comps = db.getCompetitorRates(propId, date);
    const compAvg = comps.length ? Math.round(comps.reduce((s,c)=>s+c.rate,0)/comps.length) : 0;
    const result = calculatePricing(price, date, bookings, compAvg);
    const finalReason = reason || result.reason;
    db.upsertPricingRate(propId, date, price, result.demandMultiplier, compAvg, result.finalPrice, finalReason);
    res.json({propertyId:propId,date,basePrice:price,demandMultiplier:result.demandMultiplier,competitorAvg:compAvg,finalPrice:result.finalPrice,reason:finalReason,updatedAt:new Date().toISOString()});
  } catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:propertyId/competitors', (req, res) => {
  try {
    const propId = parseInt(req.params.propertyId);
    const month = req.query.month || '2026-06';
    const competitors = db.getCompetitorRatesForRange(propId, month);
    const byDate = {};
    for (const c of competitors) {
      if (!byDate[c.date]) byDate[c.date] = {date:c.date, channels:{}};
      byDate[c.date].channels[c.channel] = c.rate;
    }
    res.json({competitors:Object.values(byDate)});
  } catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:propertyId/analytics', (req, res) => {
  try {
    const propId = parseInt(req.params.propertyId);
    const all = db.getDb().prepare("SELECT * FROM bookings WHERE propertyId=? AND status='confirmed'").all(propId);
    const ys = new Date('2026-01-01'), ye = new Date('2026-12-31');
    const totalDays = (ye-ys)/86400000;
    let bd = 0;
    for (const b of all) {
      const s = new Date(Math.max(new Date(b.checkin).getTime(), ys.getTime()));
      const e = new Date(Math.min(new Date(b.checkout).getTime(), ye.getTime()));
      if (e>s) bd += (e-s)/86400000;
    }
    const occ = Math.round((bd/totalDays)*1000)/10;
    const tr = all.reduce((s,b)=>s+b.totalRevenue,0);
    const adr = bd>0 ? Math.round(tr/bd) : 0;
    const today = new Date().toISOString().split('T')[0];
    const active = all.filter(b=>b.checkin<=today&&b.checkout>=today).length;
    const rd = db.getRevenueData(propId);
    res.json({occupancy:occ,avgDailyRate:adr,totalRevenue:tr,activeGuests:active,totalBookings:all.length,monthly:rd.monthly,channelBreakdown:rd.channelBreakdown});
  } catch(e) { res.status(500).json({error:e.message}); }
});

module.exports = router;