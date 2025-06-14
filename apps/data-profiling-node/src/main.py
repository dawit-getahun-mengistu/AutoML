from fastapi import FastAPI
from src.consumer import start_consumer
from src.services.profiling_service import ProfilingService
from src.services.s3_service import S3Service
import asyncio

app = FastAPI(title="Data Profiling Node")


@app.on_event("startup")
async def startup_event():
    # Initialize services once and store them in app.state
    app.state.profiling_service = ProfilingService()
    app.state.s3_service = S3Service()
    # Start the consumer in a background thread
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, start_consumer)


@app.get("/")
def read_root():
    return {"message": "FastAPI RabbitMQ Consumer Running"}
