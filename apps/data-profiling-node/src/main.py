from fastapi import FastAPI
from consumer import start_consumer

app = FastAPI(
    title="Data Profiling Node",
    on_startup=start_consumer()
)

@app.get("/")
def read_root():
    return {"message": "FastAPI RabbitMQ Consumer Running"}
