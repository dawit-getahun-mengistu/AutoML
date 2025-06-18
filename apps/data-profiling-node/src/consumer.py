import json
import logging
import pika
import threading
import os
from src.data_utils import Dataset

from src.profiler import perform_profiling

# RabbitMQ Configuration
RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("DATA_PROFILING_REQUEST_QUEUE", "DATA_PROFILING_REQUEST_QUEUE")


# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


def process_message(ch, method, properties, body) -> None:
    """Callback function to process received messages"""
    logger.info(f"Received message: {body.decode()}")

    try:
        # Decode message
        message_data = json.loads(body.decode())
        dataset = Dataset.from_dict(message_data)
        logger.info(f"Received dataset: {dataset.name}")

        # ADD Profiling Logic Here
        perform_profiling(dataset=dataset)

        ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge the message

    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # Reject the message
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)  # Reject the message


def consume():
    """Function to start consuming messages"""
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, port=5672))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    channel.basic_qos(prefetch_count=1)  # Limit prefetch for fair distribution
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message)

    logger.info(" [*] Waiting for messages. To exit, press CTRL+C")
    channel.start_consuming()


def start_consumer():
    """Runs RabbitMQ consumer in a separate thread"""
    logger.info(f"Consumer starting at {QUEUE_NAME}")
    thread = threading.Thread(target=consume)
    thread.start()
