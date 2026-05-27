const express = require('express');
const router = express.Router();
const db = require('../db');
const ai = require('../ai/suggestReply');

router.get('/threads', (req, res) => {
  try {
    const propId = parseInt(req.query.propertyId) || 1;
    let filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.priority) filters.priority = req.query.priority;
    let threads = db.getThreads(propId, filters);
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      threads = threads.filter(t => t.subject.toLowerCase().includes(q) || t.guestName.toLowerCase().includes(q));
    }
    const enriched = threads.map(t => {
      const msgs = db.getThreadMessages(t.id);
      return {...t, unread: msgs.filter(m => m.direction==='inbound').length, messageCount: msgs.length, lastMessage: msgs[msgs.length-1] || null};
    });
    res.json({threads: enriched});
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.get('/threads/:id', (req, res) => {
  try {
    const thread = db.getThread(parseInt(req.params.id));
    if (!thread) return res.status(404).json({error:'Thread not found'});
    const messages = db.getThreadMessages(thread.id);
    const booking = thread.bookingId ? db.getDb().prepare('SELECT * FROM bookings WHERE id=?').get(thread.bookingId) : null;
    res.json({thread, messages, booking});
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.post('/threads/:id/reply', (req, res) => {
  try {
    const tid = parseInt(req.params.id);
    const {message} = req.body;
    if (!message || !message.trim()) return res.status(400).json({error:'Message required'});
    const thread = db.getThread(tid);
    if (!thread) return res.status(404).json({error:'Thread not found'});
    const result = db.addMessage(tid, 'outbound', thread.channel, message.trim());
    res.status(201).json({id:result.lastInsertRowid,threadId:tid,direction:'outbound',text:message.trim(),sentAt:new Date().toISOString()});
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.post('/messages', (req, res) => {
  try {
    const {channel,guestName,text,bookingId,timestamp,subject,propertyId} = req.body;
    if (!guestName||!text||!channel) return res.status(400).json({error:'guestName, text, channel required'});
    const propId = propertyId||1;
    const sentAt = timestamp||new Date().toISOString();
    const subj = subject||'New message';
    let thread = db.getDb().prepare('SELECT * FROM threads WHERE guestName=? AND status=? ORDER BY updatedAt DESC LIMIT 1').get(guestName,'open');
    if (!thread) {
      const now = new Date().toISOString();
      const r = db.getDb().prepare("INSERT INTO threads (propertyId,bookingId,guestName,channel,subject,status,priority,aiCategory,createdAt,updatedAt) VALUES (?1,?2,?3,?4,?5,'open','normal','general',?6,?6)").run(propId,bookingId||null,guestName,channel,subj,now);
      thread = {id:r.lastInsertRowid,channel,guestName};
    }
    db.createMessage(thread.id,'inbound',channel,text,0,sentAt);
    res.status(201).json({threadId:thread.id,message:'Message logged'});
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.get('/suggested-reply/:threadId', async (req, res) => {
  try {
    const tid = parseInt(req.params.threadId);
    const thread = db.getThread(tid);
    if (!thread) return res.status(404).json({error:'Thread not found'});
    const messages = db.getThreadMessages(tid);
    const result = await ai.suggestReply(thread, messages);
    res.json(result);
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.patch('/threads/:id', (req, res) => {
  try {
    const tid = parseInt(req.params.id);
    const thread = db.getThread(tid);
    if (!thread) return res.status(404).json({error:'Thread not found'});
    if (req.body.status) db.updateThreadStatus(tid, req.body.status);
    if (req.body.priority) db.getDb().prepare('UPDATE threads SET priority=?,updatedAt=? WHERE id=?').run(req.body.priority, new Date().toISOString(), tid);
    res.json({...thread,status:req.body.status||thread.status,priority:req.body.priority||thread.priority});
  } catch(e) { res.status(500).json({error: e.message}); }
});

router.get('/urgent-count', (req, res) => {
  const propId = parseInt(req.query.propertyId)||1;
  res.json({count: db.getUrgentCount(propId)});
});

module.exports = router;