from fastapi import FastAPI
from routes.report_router import router as report_router
from consumer import start_consumer
import asyncio

app = FastAPI(title="Feature Engineering Node")
app.include_router(report_router, prefix="/report", tags=["Feature Engineering"])

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, start_consumer)
