const amqp = require('amqplib');

const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function setup() {
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();

  await channel.assertExchange('order.events', 'topic', { durable: true });
  await channel.assertQueue('inventory_service_queue', { durable: true });
  await channel.bindQueue('inventory_service_queue', 'order.events', 'order.placed');

  console.log('Inventory service connected to RabbitMQ. Listening for order.placed');

  channel.consume('inventory_service_queue', (msg) => {
    if (!msg) return;

    const order = JSON.parse(msg.content.toString());
    console.log('Inventory reserved for order:', order);
    channel.ack(msg);
  }, { noAck: false });
}

setup().catch((error) => {
  console.error('Inventory service failed to start:', error.message);
  process.exit(1);
});