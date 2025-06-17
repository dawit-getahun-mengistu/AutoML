from fastapi import FastAPI
from routes.modeling_route import router as modeling_router
from consumer import start_consumer
import asyncio

app = FastAPI(title="Feature Engineering Node")
app.include_router(modeling_router, prefix="/modeling", tags=["Classical Modeling"])

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, start_consumer)

