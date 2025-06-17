from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.classification import train_and_select_best_classifier
from services.regression import train_and_select_best_model
import pandas as pd
import json
import io

router = APIRouter()

@router.post("/process/")
async def process_features(
    csv_file: UploadFile = File(...),
    task_type: str = Form(...),
    target_column: str = Form(...)
):
    csv_bytes = await csv_file.read()
    try:
        csv_df = pd.read_csv(io.BytesIO(csv_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing files: {e}")
    
    if task_type not in ["classification", "regression"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid task type. Must be 'classification' or 'regression'."
        )

    if task_type == "classification":
        model_info = train_and_select_best_classifier(csv_df, target_column)
    else:
        model_info = train_and_select_best_model(csv_df, target_column)

    # Now, pass the DataFrame and dictionary to your service function
    return model_info