const amqp = require('amqplib');
const express = require('express');
const { randomUUID } = require('crypto');

const app = express();
const port = process.env.PORT || 5001;
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
app.use(express.json());

async function setup() {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createConfirmChannel();

  await channel.assertExchange('order.events', 'topic', { durable: true });
  await channel.assertExchange('payment.events', 'topic', { durable: true });

  await channel.assertQueue('payment_service_queue', { durable: true });
  await channel.bindQueue('payment_service_queue', 'order.events', 'order.placed');

  await channel.assertQueue('inventory_service_queue', { durable: true });
  await channel.bindQueue('inventory_service_queue', 'order.events', 'order.placed');

  await channel.assertQueue('notification_payment_queue', { durable: true });
  await channel.bindQueue('notification_payment_queue', 'payment.events', 'payment.success');

  app.post('/order', async (req, res) => {
    const { product, quantity } = req.body || {};
    const parsedQuantity = Number(quantity);

    if (typeof product !== 'string' || !product.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Invalid order payload.' });
    }

    const order = {
      orderId: randomUUID(),
      product: product.trim(),
      quantity: parsedQuantity,
      createdAt: new Date().toISOString(),
    };

    try {
      channel.publish('order.events', 'order.placed', Buffer.from(JSON.stringify(order)), { persistent: true });
      await channel.waitForConfirms();
      return res.status(202).json({ message: `Order for ${order.product} accepted.`, orderId: order.orderId });
    } catch (error) {
      return res.status(503).json({ message: 'Failed to publish order event.', error: error.message });
    }
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.listen(port, () => console.log(`Order service listening on port ${port}`));
}

setup().catch((error) => {
  console.error('Order service failed to connect to RabbitMQ:', error.message);
  process.exit(1);
});
