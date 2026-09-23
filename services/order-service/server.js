const amqp = require('amqplib');

const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function setup() {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange('order.events', 'topic', { durable: true });
  await channel.assertQueue('order.placed.queue', { durable: true });
  await channel.bindQueue('order.placed.queue', 'order.events', 'order.placed');

  await channel.assertExchange('payment.events', 'topic', { durable: true });
  await channel.assertQueue('payment.success.queue', { durable: true });
  await channel.bindQueue('payment.success.queue', 'payment.events', 'payment.success');

  console.log('Order service connected to RabbitMQ. Listening for order.placed');

  channel.consume('order.placed.queue', (msg) => {
    if (!msg) return;

    const order = JSON.parse(msg.content.toString());
    console.log('Received order.placed:', order);

    const paymentEvent = {
      orderId: Date.now(),
      product: order.product,
      quantity: order.quantity,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };

    channel.publish('payment.events', 'payment.success', Buffer.from(JSON.stringify(paymentEvent)), { persistent: true });
    console.log('Published payment.success event');

    channel.ack(msg);
  }, { noAck: false });
}

setup().catch((error) => {
  console.error('Order service failed to start:', error.message);
  process.exit(1);
});
