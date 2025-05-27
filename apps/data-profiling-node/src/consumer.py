import json
import pika
import threading
import os
from src.data_utils import Dataset

# RabbitMQ Configuration
RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("DATA_PROFILING_REQUEST_QUEUE", "DATA_PROFILING_REQUEST_QUEUE")


def process_message(ch, method, properties, body):
    """Callback function to process received messages"""
    print(f"Received message: {body.decode()}")

    try:
        # Decode message
        message_data = json.loads(body.decode())
        dataset = Dataset.from_dict(message_data)
        print(f"Received dataset: {dataset.name}")

        # ADD Profiling Logic Here
        ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge the message
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # Reject the message
    except Exception as e:
        print(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)  # Reject and requeue


def consume():
    """Function to start consuming messages"""
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, port=5672))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    channel.basic_qos(prefetch_count=1)  # Limit prefetch for fair distribution
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message)

    print(" [*] Waiting for messages. To exit, press CTRL+C")
    channel.start_consuming()


def start_consumer():
    """Runs RabbitMQ consumer in a separate thread"""
    print(f"Consumer starting at {QUEUE_NAME}")
    thread = threading.Thread(target=consume)
    thread.start()
