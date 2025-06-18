import json
import pika
import threading
import os
import logging
from data_utils.schemas import TaskDefinition
from services.feature_service import process_feature_engineering_from_queue
from producer import send_message

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("DATA_ENGINEERING_REQUEST_QUEUE", "DATA_ENGINEERING_REQUEST_QUEUE")

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
        try:
            # Process the feature engineering task
            data_keys = process_feature_engineering_from_queue(dataset_key=task_info.dataset_key, profiling=task_info.json_str, task_type=task_info.task_type, target_column=task_info.target_column)
            send_message(message={"dataset_id": task_info.dataset_id, "error": "", **data_keys})
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            logger.error(f"Error processing feature engineering task: {e}")
            # publish the result to the result queue
            send_message(message={"dataset_id": task_info.dataset_id, "error": str(e)})
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
