const express = require('express');
const cors = require('cors');
const path = require('path');
const inboxRoutes = require('./routes/inbox');
const pricingRoutes = require('./routes/pricing');
const propertiesRoutes = require('./routes/properties');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/inbox', inboxRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/properties', propertiesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), err => { if (err) next(); });
});

app.listen(PORT, () => console.log('Host365 API running on http://localhost:' + PORT));