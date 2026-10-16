import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


TRAIN_PATH = "../../datasets/lunge_dataset/err.train.csv"
TEST_PATH = "../../datasets/lunge_dataset/err.test.csv"

MODEL_DIR = "../../models"
MODEL_PATH = "../../models/lunge_model.pkl"


LABEL_MAP = {
    "C": "correct",
    "L": "incorrect_lunge"
}


def load_datasets():
    if not os.path.exists(TRAIN_PATH):
        raise FileNotFoundError(f"Train dataset not found: {TRAIN_PATH}")

    if not os.path.exists(TEST_PATH):
        raise FileNotFoundError(f"Test dataset not found: {TEST_PATH}")

    train_df = pd.read_csv(TRAIN_PATH)
    test_df = pd.read_csv(TEST_PATH)

    print("\nLunge train dataset loaded.")
    print("Train shape:", train_df.shape)
    print("Train columns:", train_df.columns.tolist())

    print("\nLunge test dataset loaded.")
    print("Test shape:", test_df.shape)

    print("\nTrain label distribution:")
    print(train_df["label"].value_counts())

    print("\nTest label distribution:")
    print(test_df["label"].value_counts())

    return train_df, test_df


def prepare_data(train_df, test_df):
    train_df = train_df.dropna().copy()
    test_df = test_df.dropna().copy()

    train_df["label_name"] = train_df["label"].map(LABEL_MAP)
    test_df["label_name"] = test_df["label"].map(LABEL_MAP)

    train_df["label_name"] = train_df["label_name"].fillna(train_df["label"])
    test_df["label_name"] = test_df["label_name"].fillna(test_df["label"])

    X_train = train_df.drop(columns=["label", "label_name"])
    y_train = train_df["label_name"]

    X_test = test_df.drop(columns=["label", "label_name"])
    y_test = test_df["label_name"]

    X_train = X_train.select_dtypes(include=["int64", "float64"])
    X_test = X_test.select_dtypes(include=["int64", "float64"])

    feature_columns = X_train.columns.tolist()

    print("\nFeature columns used:")
    print(feature_columns)

    print("\nTraining features shape:", X_train.shape)
    print("Testing features shape:", X_test.shape)

    return X_train, X_test, y_train, y_test, feature_columns


def train_model(X_train, y_train):
    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )

    print("\nTraining Lunge Posture Model...")
    model.fit(X_train, y_train)

    return model


def evaluate_model(model, X_test, y_test):
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nLunge Model Evaluation Results")
    print("------------------------------")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1-score : {f1:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }


def save_model(model, feature_columns, metrics):
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_package = {
        "model": model,
        "feature_columns": feature_columns,
        "label_map": LABEL_MAP,
        "metrics": metrics
    }

    joblib.dump(model_package, MODEL_PATH)

    print("\nLunge model saved successfully:")
    print(MODEL_PATH)


def main():
    train_df, test_df = load_datasets()

    X_train, X_test, y_train, y_test, feature_columns = prepare_data(
        train_df,
        test_df
    )

    model = train_model(X_train, y_train)

    metrics = evaluate_model(
        model,
        X_test,
        y_test
    )

    save_model(
        model=model,
        feature_columns=feature_columns,
        metrics=metrics
    )

    print("\nLunge model training completed successfully.")


if __name__ == "__main__":
    main()