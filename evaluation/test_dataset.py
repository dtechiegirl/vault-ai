from evaluation.dataset import load_dataset


def test_load_dataset():
    dataset = load_dataset()

    assert "dataset_info" in dataset
    assert "golden_qa" in dataset
    assert "negative_test_cases" in dataset

    assert len(dataset["golden_qa"]) == 15
    assert len(dataset["negative_test_cases"]) == 7