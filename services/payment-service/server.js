const amqp = require('amqplib');

const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function setup() {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createConfirmChannel();

  await channel.assertExchange('order.events', 'topic', { durable: true });
  await channel.assertQueue('payment_service_queue', { durable: true });
  await channel.bindQueue('payment_service_queue', 'order.events', 'order.placed');
  await channel.assertExchange('payment.events', 'topic', { durable: true });

  console.log('Payment service connected to RabbitMQ. Listening for order.placed');

  channel.consume('payment_service_queue', async (msg) => {
    if (!msg) return;

    try {
      const order = JSON.parse(msg.content.toString());
      console.log('Processing payment for order:', order);

      const paymentEvent = {
        orderId: order.orderId,
        product: order.product,
        quantity: order.quantity,
        status: 'paid',
        createdAt: new Date().toISOString(),
      };

      channel.publish('payment.events', 'payment.success', Buffer.from(JSON.stringify(paymentEvent)), { persistent: true });
      await channel.waitForConfirms();
      channel.ack(msg);
      console.log('Published payment.success:', paymentEvent);
    } catch (error) {
      console.error('Payment processing failed; returning message to queue:', error.message);
      channel.nack(msg, false, true);
    }
  }, { noAck: false });
}

setup().catch((error) => {
  console.error('Payment service failed to start:', error.message);
  process.exit(1);
});
