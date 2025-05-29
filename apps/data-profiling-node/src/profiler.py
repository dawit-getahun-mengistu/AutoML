import logging
from src.data_utils import Dataset, serialize
from src.services.profiling_service import ProfilingService
from src.services.storage_service import StorageService

from src.producer import send_message

# Logger Config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


storage_service = StorageService()
profiling_service = ProfilingService()


def perform_profiling(dataset: Dataset):
    report = profiling_service.profile_dataset(dataset=dataset, storage_service=storage_service)
    logger.info(f"Processed dataset: {dataset.name}, Report: {report}")

    payload = {"id": dataset.id, "report": serialize(report)}

    send_message(payload)
