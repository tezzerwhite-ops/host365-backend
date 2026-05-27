import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => res.json(req.app.locals.db.prepare('SELECT * FROM properties').all()));

router.get('/:id', (req, res) => {
  const db = req.app.locals.db;
  const p = db.prepare('SELECT * FROM properties WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  p.bookings = db.prepare('SELECT * FROM bookings WHERE propertyId=? ORDER BY checkin ASC').all(req.params.id);
  p.openThreads = db.prepare("SELECT * FROM threads WHERE propertyId=? AND status='open' ORDER BY priority DESC, updatedAt DESC").all(req.params.id);
  res.json(p);
});

export default router;
