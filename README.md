# COMLAB 5 - System Integration and Architecture 2

This project demonstrates a simple multi-container microservice architecture with a React frontend, Express API gateway, RabbitMQ event bus, and two backend services.

## Services

- Frontend: React + Vite on port 3000
- Gateway: Express API on port 5000
- Order service: listens for `order.placed`
- Payment service: listens for `payment.success`
- RabbitMQ: management console on http://localhost:15672

## Run

```bash
docker compose up --build
```

## Access

- Frontend: http://localhost:3000
- Gateway: http://localhost:5000
- RabbitMQ Console: http://localhost:15672 with guest / guest

## Test flow

1. Open the frontend and submit an order.
2. The gateway publishes `order.placed` to RabbitMQ.
3. The order service consumes the event and emits `payment.success`.
4. The payment service consumes that event.
5. Verify the queue and exchange bindings in RabbitMQ.
