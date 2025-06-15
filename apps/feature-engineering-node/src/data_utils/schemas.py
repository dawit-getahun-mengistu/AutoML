from dataclasses import dataclass


@dataclass
class TaskDefinition:
    dataset_id: str
    json_str: str
    dataset_key: str
    task_type: str
    target_column: str

    @classmethod
    def from_dict(cls, data: dict):
        return cls(
            dataset_id=data["dataset_id"],
            json_str=data["json_str"],
            dataset_key=data["dataset_key"],
            task_type=data["task_type"],
            target_column=data["target_column"],
        )
