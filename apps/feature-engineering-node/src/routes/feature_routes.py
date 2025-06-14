from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.feature_service import process_feature_engineering
import pandas as pd
import json
import io

router = APIRouter()

@router.post("/process/")
async def process_features(
    csv_file: UploadFile = File(...),
    profiling_file: UploadFile = File(...),
    task: str = Form(...),
    target_column: str = Form(...)
):
    # Read file contents as bytes
    csv_bytes = await csv_file.read()
    profiling_bytes = await profiling_file.read()

    # Convert bytes into the correct data structures
    try:
        csv_df = pd.read_csv(io.BytesIO(csv_bytes))

        # Create a Python dictionary from the JSON bytes
        # We must first decode the bytes into a string, then parse the JSON
        profiling_dict = json.loads(profiling_bytes.decode("utf-8"))

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing files: {e}")

    # Now, pass the DataFrame and dictionary to your service function
    return process_feature_engineering(
        csv_df, profiling_dict, target_column, task
    )