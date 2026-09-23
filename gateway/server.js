const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');

const app = express();
const port = process.env.PORT || 5000;
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

app.use(cors());
app.use(express.json());

let channel;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    await channel.assertExchange('order.events', 'topic', { durable: true });
    await channel.assertQueue('order.placed.queue', { durable: true });
    await channel.bindQueue('order.placed.queue', 'order.events', 'order.placed');

    console.log('RabbitMQ connected and exchange/queue configured.');
  } catch (error) {
    console.error('RabbitMQ connection error:', error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

app.post('/order', async (req, res) => {
  const { product, quantity } = req.body || {};

  if (!product || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
    return res.status(400).json({ message: 'Invalid order payload.' });
  }

  if (!channel) {
    return res.status(503).json({ message: 'RabbitMQ is not ready yet.' });
  }

  try {
    const payload = JSON.stringify({ product, quantity, createdAt: new Date().toISOString() });
    channel.publish('order.events', 'order.placed', Buffer.from(payload), { persistent: true });
    return res.status(200).json({ message: `Order for ${product} created and sent to queue.` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to publish order event.', error: error.message });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

connectRabbitMQ();

app.listen(port, () => {
  console.log(`Gateway listening on port ${port}`);
});
