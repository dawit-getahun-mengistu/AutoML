import json
from src.services.profiling_service import ProfilingService
from src.data_utils import custom_serializer

file_url = "https://raw.githubusercontent.com/pycaret/pycaret/master/datasets/diabetes.csv"

file_path = "./tests/benin-malanville.csv"


def test_event():
    result = ProfilingService.profile(file_name=file_path, title="Test Profile")
    assert result is not None
    print(result)
    with open("test_event2.json", "w") as f:
        json.dump(result, f, indent=2, default=custom_serializer)


if __name__ == "__main__":
    test_event()
    print("Test completed successfully.")
