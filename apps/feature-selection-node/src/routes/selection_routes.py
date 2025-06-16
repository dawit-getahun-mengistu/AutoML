from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.featuer_selector import process_feature_selection_from_api
import pandas as pd
import json
import io

router = APIRouter()

@router.post("/process/")
async def process_features(
    csv_file: UploadFile = File(...),
    target_column: str = Form(...)
):
    # Read file contents as bytes
    csv_bytes = await csv_file.read()

    # Convert bytes into the correct data structures
    try:
        csv_df = pd.read_csv(io.BytesIO(csv_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing files: {e}")

    # Now, pass the DataFrame and dictionary to your service function
    return process_feature_selection_from_api(
        csv_df, target_column
    )