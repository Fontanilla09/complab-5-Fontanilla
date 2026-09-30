const amqp = require('amqplib');

const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function setup() {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange('payment.events', 'topic', { durable: true });
  await channel.assertQueue('notification_payment_queue', { durable: true });
  await channel.bindQueue('notification_payment_queue', 'payment.events', 'payment.success');

  console.log('Notification service connected to RabbitMQ. Listening for payment.success');

  channel.consume('notification_payment_queue', (msg) => {
    if (!msg) return;

    const event = JSON.parse(msg.content.toString());
    console.log('Received payment.success; notification processed:', event);
    channel.ack(msg);
  }, { noAck: false });
}

setup().catch((error) => {
  console.error('Notification service failed to start:', error.message);
  process.exit(1);
});
