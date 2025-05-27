import pandas as pd
from typing import Optional, Any, Dict, List

from dataclasses import dataclass
from ydata_profiling.model.description import BaseAnalysis
from ydata_profiling.model.sample import Sample


@dataclass
class YDataProfilingSchema:
    """
    Data profiling schema
    """

    analysis: BaseAnalysis
    table: Dict[str, Any]
    correlations: Optional[pd.DataFrame]
    alerts: List[str]
    samples: List[Sample]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis": self.analysis.__dict__
            if hasattr(self.analysis, "__dict__")
            else str(self.analysis),
            "table": self.table,
            "correlations": self.correlations.to_dict()
            if isinstance(self.correlations, pd.DataFrame)
            else self.correlations,
            "alerts": self.alerts,
            "samples": [s.__dict__ if hasattr(s, "__dict__") else str(s) for s in self.samples],
        }


@dataclass
class Dataset:
    id: str
    name: str
    description: Optional[str]
    projectId: str
    status: str  # Assuming DatasetStatus enum is converted to string
    file: str
    format: str  # Assuming DatasetFormat enum is converted to string
    size: Optional[int]
    rows: Optional[int]
    cols: Optional[int]
    profiling_context: Optional[str]  # Assuming JSON is serialized to string
    feature_selection_context: Optional[str]
    feature_engineering_context: Optional[str]
    training_context: Optional[str]
    profiling_metadata: Optional[str]
    feature_selection_metadata: Optional[str]
    feature_engineering_metadata: Optional[str]
    training_metadata: Optional[str]
    profilingStatus: str  # Assuming ProcessStatus enum is converted to string
    featureSelectionStatus: str
    featureEngineeringStatus: str
    trainingStatus: str
    profilingError: Optional[str]
    featureSelectionError: Optional[str]
    featureEngineeringError: Optional[str]
    trainingError: Optional[str]
    llmError: Optional[str]
    createdAt: str
    updatedAt: Optional[str]

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            projectId=data["projectId"],
            status=data["status"],
            file=data["file"],
            format=data["format"],
            size=data["size"],
            rows=data["rows"],
            cols=data["cols"],
            profiling_context=data["profiling_context"],
            feature_selection_context=data["feature_selection_context"],
            feature_engineering_context=data["feature_engineering_context"],
            training_context=data["training_context"],
            profiling_metadata=data["profiling_metadata"],
            feature_selection_metadata=data["feature_selection_metadata"],
            feature_engineering_metadata=data["feature_engineering_metadata"],
            training_metadata=data["training_metadata"],
            profilingStatus=data["profilingStatus"],
            featureSelectionStatus=data["featureSelectionStatus"],
            featureEngineeringStatus=data["featureEngineeringStatus"],
            trainingStatus=data["trainingStatus"],
            profilingError=data["profilingError"],
            featureSelectionError=data["featureSelectionError"],
            featureEngineeringError=data["featureEngineeringError"],
            trainingError=data["trainingError"],
            llmError=data["llmError"],
            createdAt=data["createdAt"],
            updatedAt=data["updatedAt"],
        )
