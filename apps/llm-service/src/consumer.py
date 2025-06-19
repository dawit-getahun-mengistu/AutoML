import json
import pika
import threading
import os
import logging
from data_utils.schemas import TaskDefinition
from services.report_service import generate_report_from_queue
from producer import send_message

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("REPORT_GENERATION_REQUEST_QUEUE", "REPORT_GENERATION_REQUEST_QUEUE")

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


def process_message(ch, method, properties, body):
    logger.info(f"Received message: {body.decode()}")
    dataset_id = ""
    try:
        message_data = json.loads(body.decode())
        task_info = TaskDefinition.from_dict(message_data)
        dataset_id = task_info.dataset_id
        logger.info(f"Task Definition: {task_info}")
        data_keys = generate_report_from_queue(
            profiling_context=task_info.profiling_context,
            feature_engineering_context=task_info.feature_engineering_context,
            feature_selection_context=task_info.feature_selection_context,
            model_training_context=task_info.model_training_context,
        )

        send_message(message={"dataset_id": task_info.dataset_id, "error": "", **data_keys})
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {e}")
        send_message(
            message={"dataset_id": dataset_id, "error": str(e), "html_key": "", "pdf_key": ""}
        )
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        send_message(
            message={"dataset_id": dataset_id, "error": str(e), "html_key": "", "pdf_key": ""}
        )
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def consume():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=RABBITMQ_HOST, port=5672, heartbeat=10000)
    )
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
