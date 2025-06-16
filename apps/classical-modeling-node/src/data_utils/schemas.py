from dataclasses import dataclass


@dataclass
class TaskDefinition:
    dataset_id: str
    dataset_key: str
    target_column: str
    task_type: str

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            dataset_id=data["dataset_id"],
            dataset_key=data["dataset_key"],
            target_column=data["target_column"],
            task_type=data["task_type"],
        )
