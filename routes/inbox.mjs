import { Router } from 'express';
import { suggestReply } from '../ai/suggestReply.mjs';
const router = Router();

router.get('/threads', (req, res) => {
  const db = req.app.locals.db;
  const { status, priority, search } = req.query;
  let q = "SELECT t.*,(SELECT COUNT(*) FROM messages m WHERE m.threadId=t.id) as messageCount,(SELECT COUNT(*) FROM messages m WHERE m.threadId=t.id AND m.direction='inbound') as unreadCount,b.checkin,b.checkout,b.guests as bookingGuests FROM threads t LEFT JOIN bookings b ON t.bookingId=b.id WHERE 1=1";
  const p = [];
  if (status) { q += ' AND t.status=?'; p.push(status); }
  if (priority) { q += ' AND t.priority=?'; p.push(priority); }
  if (search) { q += ' AND (t.guestName LIKE ? OR t.subject LIKE ?)'; p.push('%'+search+'%','%'+search+'%'); }
  q += " ORDER BY CASE WHEN t.priority='urgent' THEN 0 ELSE 1 END, t.updatedAt DESC";
  res.json(db.prepare(q).all(...p));
});

router.get('/threads/:id', (req, res) => {
  const db = req.app.locals.db;
  const t = db.prepare("SELECT t.*,b.checkin,b.checkout,b.guests as bookingGuests,b.channel as bookingChannel FROM threads t LEFT JOIN bookings b ON t.bookingId=b.id WHERE t.id=?").get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Thread not found' });
  t.messages = db.prepare('SELECT * FROM messages WHERE threadId=? ORDER BY sentAt ASC').all(req.params.id);
  res.json(t);
});

router.post('/threads/:id/reply', (req, res) => {
  const db = req.app.locals.db;
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
  const t = db.prepare('SELECT * FROM threads WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Thread not found' });
  const sentAt = new Date().toISOString();
  db.prepare('INSERT INTO messages (threadId,direction,channel,text,aiSuggested,sentAt) VALUES (?,?,?,?,?,?)').run(req.params.id, 'outbound', t.channel, message.trim(), 0, sentAt);
  db.prepare('UPDATE threads SET updatedAt=? WHERE id=?').run(sentAt, req.params.id);
  res.json({ success: true, sentAt });
});

router.post('/messages', (req, res) => {
  const db = req.app.locals.db;
  const { channel, guestName, text, bookingId, timestamp } = req.body;
  if (!channel || !guestName || !text) return res.status(400).json({ error: 'channel, guestName, text required' });
  const sentAt = timestamp || new Date().toISOString();
  let thread = db.prepare("SELECT id FROM threads WHERE guestName=? AND bookingId=? AND status!='resolved' ORDER BY updatedAt DESC LIMIT 1").get(guestName, bookingId||null);
  if (!thread) {
    const r = db.prepare("INSERT INTO threads (propertyId,bookingId,guestName,channel,subject,status,priority,aiCategory,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)").run(1, bookingId||null, guestName, channel, text.substring(0,80), 'open', 'normal', 'general', sentAt, sentAt);
    thread = { id: r.lastInsertRowid };
  }
  db.prepare('INSERT INTO messages (threadId,direction,channel,text,aiSuggested,sentAt) VALUES (?,?,?,?,?,?)').run(thread.id, 'inbound', channel, text, 0, sentAt);
  db.prepare('UPDATE threads SET updatedAt=? WHERE id=?').run(sentAt, thread.id);
  res.json({ threadId: thread.id, success: true });
});

router.get('/suggested-reply/:threadId', async (req, res) => {
  const db = req.app.locals.db;
  const t = db.prepare('SELECT * FROM threads WHERE id=?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Thread not found' });
  const msgs = db.prepare('SELECT * FROM messages WHERE threadId=? ORDER BY sentAt DESC LIMIT 3').all(req.params.id).reverse();
  const result = await suggestReply(t, msgs);
  res.json(result);
});

export default router;
