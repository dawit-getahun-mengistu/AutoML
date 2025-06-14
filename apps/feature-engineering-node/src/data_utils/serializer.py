import json
import numpy as np
import pandas as pd
from typing import Any
from datetime import datetime
from enum import Enum
from uuid import UUID


def custom_serializer(obj):
    if isinstance(obj, (UUID,)):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, Enum):
        return obj.value
    elif isinstance(obj, set):
        return list(obj)
    elif isinstance(obj, np.generic):  # Handles np.int64, np.float64, etc.
        return obj.item()
    elif isinstance(obj, pd.DataFrame):
        return obj.to_dict(orient="records")
    elif hasattr(obj, "__dict__"):
        return {k: custom_serializer(v) for k, v in obj.__dict__.items() if not k.startswith("_")}
    elif isinstance(obj, list):
        return [custom_serializer(v) for v in obj]
    elif isinstance(obj, dict):
        return {k: custom_serializer(v) for k, v in obj.items()}
    return obj


def serialize(obj: Any) -> str:
    """
    Serialize an object to a JSON string using a custom serializer.
    """
    return json.dumps(
        obj, default=custom_serializer, indent=2
    )  # indent=2 instead of indent=4 to avoid additional spaces
