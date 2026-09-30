const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:5001';

app.use(cors());
app.use(express.json());

app.post('/order', async (req, res) => {
  try {
    const response = await fetch(`${orderServiceUrl}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const result = await response.json();
    return res.status(response.status).json(result);
  } catch (error) {
    return res.status(503).json({ message: 'Order service is unavailable.', error: error.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, () => {
  console.log(`Gateway listening on port ${port}`);
});
