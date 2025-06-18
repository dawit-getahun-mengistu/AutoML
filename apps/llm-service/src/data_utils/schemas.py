from dataclasses import dataclass


@dataclass
class TaskDefinition:
    dataset_id: str
    profiling_context: str
    feature_engineering_context: str
    feature_selection_context: str
    model_training_context: str

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            dataset_id=data["dataset_id"],
            profiling_context=data["profiling_context"],
            feature_engineering_context=data["feature_engineering_context"],
            feature_selection_context=data["feature_selection_context"],
            model_training_context=data["model_training_context"]
        )
