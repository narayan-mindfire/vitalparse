const express = require('express');
const cors = require('cors');
const path = require('path');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.use('/api/documents', documentRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Serve React static files from apps/web/dist
const webDistPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// Catch-all to serve React's index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

module.exports = app;
