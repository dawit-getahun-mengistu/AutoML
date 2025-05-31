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
    status: str  # Corresponds to DatasetStatus enum
    file: str
    format: str  # Corresponds to DatasetFormat enum
    size: Optional[int]
    rows: Optional[int]
    cols: Optional[int]

    profiling_context: Optional[str]  # JSON serialized as string
    feature_selection_context: Optional[str]
    feature_engineering_context: Optional[str]
    training_context: Optional[str]

    profiling_metadata: Optional[str]
    feature_selection_metadata: Optional[str]
    feature_engineering_metadata: Optional[str]
    training_metadata: Optional[str]

    profilingStatus: str  # Corresponds to ProcessStatus enum
    featureSelectionStatus: str
    featureEngineeringStatus: str
    trainingStatus: str

    profilingError: Optional[str]
    featureSelectionError: Optional[str]
    featureEngineeringError: Optional[str]
    trainingError: Optional[str]
    llmError: Optional[str]

    EDAFileViz: Optional[str]
    FeaturesVizFile: Optional[str]
    featureEngineeringVizFile: Optional[str]
    trainingVizFile: Optional[str]

    profilingFile: Optional[str]
    featureSelectionFile: Optional[str]
    featureEngineeringFile: Optional[str]
    trainingFile: Optional[str]
    trainingType: Optional[str]  # Corresponds to TrainingType enum

    createdAt: str
    updatedAt: Optional[str]

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description"),
            projectId=data["projectId"],
            status=data["status"],
            file=data["file"],
            format=data["format"],
            size=data.get("size"),
            rows=data.get("rows"),
            cols=data.get("cols"),
            profiling_context=data.get("profiling_context"),
            feature_selection_context=data.get("feature_selection_context"),
            feature_engineering_context=data.get("feature_engineering_context"),
            training_context=data.get("training_context"),
            profiling_metadata=data.get("profiling_metadata"),
            feature_selection_metadata=data.get("feature_selection_metadata"),
            feature_engineering_metadata=data.get("feature_engineering_metadata"),
            training_metadata=data.get("training_metadata"),
            profilingStatus=data["profilingStatus"],
            featureSelectionStatus=data["featureSelectionStatus"],
            featureEngineeringStatus=data["featureEngineeringStatus"],
            trainingStatus=data["trainingStatus"],
            profilingError=data.get("profilingError"),
            featureSelectionError=data.get("featureSelectionError"),
            featureEngineeringError=data.get("featureEngineeringError"),
            trainingError=data.get("trainingError"),
            llmError=data.get("llmError"),
            EDAFileViz=data.get("EDAFileViz"),
            FeaturesVizFile=data.get("FeaturesVizFile"),
            featureEngineeringVizFile=data.get("featureEngineeringVizFile"),
            trainingVizFile=data.get("trainingVizFile"),
            profilingFile=data.get("profilingFile"),
            featureSelectionFile=data.get("featureSelectionFile"),
            featureEngineeringFile=data.get("featureEngineeringFile"),
            trainingFile=data.get("trainingFile"),
            trainingType=data.get("trainingType"),
            createdAt=data["createdAt"],
            updatedAt=data.get("updatedAt"),
        )
