from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services.report_service import generate_report_from_api
import pandas as pd
import json
import io

router = APIRouter()

@router.post("/process/")
async def process_features(
    profiling_context: str = Form(...),
    feature_engineering_context: str = Form(...),
    feature_selection_context: str = Form(...),
    model_training_context: str = Form(...)
):
    # Now, pass the DataFrame and dictionary to your service function
    return generate_report_from_api(
        profiling_context=profiling_context,
        feature_engineering_context=feature_engineering_context,
        feature_selection_context=feature_selection_context,
        model_training_context=model_training_context
    )