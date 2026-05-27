import express from 'express';
import cors from 'cors';
import { initDb } from './db.mjs';
import inboxRoutes from './routes/inbox.mjs';
import pricingRoutes from './routes/pricing.mjs';
import propertiesRoutes from './routes/properties.mjs';
import { seedDb } from './seed.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = initDb();
const count = db.prepare('SELECT COUNT(*) as c FROM properties').get();
if (count.c === 0) { console.log('Empty DB — seeding...'); seedDb(db); }
app.locals.db = db;

app.use('/api/inbox', inboxRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/properties', propertiesRoutes);

app.get('/api/health', (req, res) => { res.json({ status: 'ok', uptime: process.uptime() }); });

app.listen(PORT, () => console.log('Host365 API on port ' + PORT));
