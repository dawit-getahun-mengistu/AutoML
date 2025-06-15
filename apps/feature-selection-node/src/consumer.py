import json
import pika
import threading
import os
import logging
from dotenv import load_dotenv, find_dotenv
from data_utils.schemas import TaskDefinition
from services.featuer_selector import process_feature_selection_from_queue
from producer import send_message

load_dotenv(find_dotenv())

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("DATA_SELECTION_REQUEST_QUEUE", "DATA_SELECTION_REQUEST_QUEUE")

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

def process_message(ch, method, properties, body):
    logger.info(f"Received message: {body.decode()}")
    try:
        message_data = json.loads(body.decode())
        task_info = TaskDefinition.from_dict(message_data)
        logger.info(f"Task Definition: {task_info}")

        # Process the feature selection task
        data_keys = process_feature_selection_from_queue(dataset_key=task_info.dataset_key, target_column=task_info.target_column)

        # publish the result to the result queue
        send_message(message={"dataset_id": task_info.dataset_id, **data_keys})

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def consume():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message)
    logger.info(" [*] Waiting for messages. To exit press CTRL+C")
    channel.start_consuming()

def start_consumer():
    logger.info(f"Consumer starting at {QUEUE_NAME}")
    thread = threading.Thread(target=consume)
    thread.start()
