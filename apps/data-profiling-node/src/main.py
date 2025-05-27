from fastapi import FastAPI
from src.consumer import start_consumer
import asyncio

app = FastAPI(title="Data Profiling Node", on_startup=start_consumer())


@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, start_consumer)


@app.get("/")
def read_root():
    return {"message": "FastAPI RabbitMQ Consumer Running"}
