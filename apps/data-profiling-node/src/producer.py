import pika
import os

# RabbitMQ Configuration
RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'rabbitmq')  # Default to localhost if env var is not set
QUEUE_NAME = "task_task"

def send_message(message: str):
    """ Sends a message to the RabbitMQ queue """
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, port=5672))
    channel = connection.channel()

    # Declare queue (must match the consumer queue)
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    # Publish message
    channel.basic_publish(
        exchange='',
        routing_key=QUEUE_NAME,
        body=message,
        properties=pika.BasicProperties(
            delivery_mode=2  # Make message persistent
        )
    )

    print(f" [x] Sent: {message}")

    # Close connection
    connection.close()

if __name__ == "__main__":
    message = "Hello, RabbitMQ!"
    send_message(message)
