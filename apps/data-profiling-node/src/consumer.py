import pika, threading, os

# RabbitMQ Configuration
RABBITMQ_HOST = RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'rabbitmq')
QUEUE_NAME = "task_queue"

def process_message(ch, method, properties, body):
    """ Callback function to process received messages """
    print(f"Received message: {body.decode()}")
    ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge the message

def consume():
    """ Function to start consuming messages """
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    
    channel.basic_qos(prefetch_count=1)  # Limit prefetch for fair distribution
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_message)
    
    print(" [*] Waiting for messages. To exit, press CTRL+C")
    channel.start_consuming()

def start_consumer():
    """ Runs RabbitMQ consumer in a separate thread """
    print(f'Consumer starting at {QUEUE_NAME}')
    thread = threading.Thread(target=consume)
    thread.start()
