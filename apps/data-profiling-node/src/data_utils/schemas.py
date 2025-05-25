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
