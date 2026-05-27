const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try { res.json({properties: db.getProperties()}); }
  catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:id', (req, res) => {
  try {
    const prop = db.getProperty(parseInt(req.params.id));
    if (!prop) return res.status(404).json({error:'Property not found'});
    const upcoming = db.getUpcomingBookings(prop.id, 30);
    const today = new Date();
    const ym = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0');
    const monthBookings = db.getBookingsByMonth(prop.id, ym);
    const all = db.getDb().prepare("SELECT * FROM bookings WHERE propertyId=? AND status='confirmed'").all(prop.id);
    const tr = all.reduce((s,b)=>s+b.totalRevenue,0);
    const now = new Date().toISOString().split('T')[0];
    const active = all.filter(b=>b.checkin<=now&&b.checkout>=now).length;
    res.json({property:prop,upcoming,monthBookings,stats:{totalRevenue:tr,totalBookings:all.length,activeGuests:active}});
  } catch(e) { res.status(500).json({error:e.message}); }
});

router.get('/:id/bookings', (req, res) => {
  try {
    const propId = parseInt(req.params.id);
    const month = req.query.month || new Date().toISOString().substring(0,7);
    res.json({bookings: db.getBookingsByMonth(propId, month)});
  } catch(e) { res.status(500).json({error:e.message}); }
});

module.exports = router;