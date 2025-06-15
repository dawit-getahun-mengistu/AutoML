import logging
import pika
import os
import json


# RabbitMQ Configuration
RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("DATA_ENGINEERING_RESULT_QUEUE", "DATA_ENGINEERING_RESULT_QUEUE")

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


def send_message(message: dict | None):
    """Sends a message to the RabbitMQ queue"""
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, port=5672))
    channel = connection.channel()

    # Declare queue (must match the consumer queue)
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    # Convert message to JSON string
    message_json = json.dumps(message)

    # Publish message
    channel.basic_publish(
        exchange="",
        routing_key=QUEUE_NAME,
        body=message_json,
        properties=pika.BasicProperties(
            delivery_mode=2  # Make message persistent
        ),
    )

    logger.info(f" [x] Sent: {message_json}")

    # Close connection
    connection.close()


if __name__ == "__main__":
    message = {"msg": "Hello, RabbitMQ!"}
    send_message(message)
