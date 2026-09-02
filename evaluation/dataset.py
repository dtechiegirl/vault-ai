import json
from pathlib import Path


DATASET_PATH = Path(__file__).parent / "golden_qa_set.json"


def load_dataset() -> dict:
    with DATASET_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)