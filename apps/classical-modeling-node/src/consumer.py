import json
import pika
import threading
import os
import logging
from data_utils.schemas import TaskDefinition
from services.model_trainer import handle_queue_requests
from producer import send_message
from dotenv import load_dotenv, find_dotenv
from services.s3_service import S3Service

load_dotenv(find_dotenv())
s3_service = S3Service()

RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "rabbitmq")
QUEUE_NAME = os.environ.get("CLASSICAL_TRAINING_REQUEST_QUEUE", "CLASSICAL_TRAINING_REQUEST_QUEUE")

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
        result = handle_queue_requests(dataset_key=task_info.dataset_key, target_column=task_info.target_column, task_type=task_info.task_type)
        model_key = result["best_model_info"]["model_uuid"]

        # upload the model to S3
        with open(result["best_model_info"]["saved_model_path"], "rb") as model_file:
            s3_service.upload_single_file(
                file_obj=model_file,
                key=f'{model_key}.pkl',
                content_type="application/octet-stream",
                filename=f'{model_key}.pkl'
            )

        # update the key
        result["best_model_info"]["model_uuid"] = f"{model_key}.pkl"

        # publish the result to the result queue
        send_message(message={"dataset_id": task_info.dataset_id, **result})

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    except Exception as e:
        logger.error(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

def consume():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, heartbeat=10000))
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
