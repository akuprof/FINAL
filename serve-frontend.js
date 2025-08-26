
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist/public')));

// API proxy to Railway backend
app.use('/api', (req, res) => {
  const backendUrl = 'https://final-production-8f03.up.railway.app' + req.url;
  
  // Simple proxy using fetch
  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      'host': 'final-production-8f03.up.railway.app'
    }
  };
  
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = JSON.stringify(req.body);
  }
  
  fetch(backendUrl, options)
    .then(response => response.json())
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: 'Proxy error' }));
});

// Handle React Router - serve index.html for all non-api routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on http://0.0.0.0:${PORT}`);
});
