import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


DATA_PATH = "../../datasets/generated/pushup_features.csv"
MODEL_DIR = "../../models"
MODEL_PATH = "../../models/pushup_model.pkl"


def load_dataset():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    print("\nPush-up dataset loaded successfully.")
    print("Shape:", df.shape)
    print("Columns:", df.columns.tolist())

    print("\nLabel distribution:")
    print(df["label"].value_counts())

    return df


def prepare_data(df):
    df = df.dropna()

    # These columns are identifiers, not ML features
    drop_columns = ["video_file", "frame", "label"]

    X = df.drop(columns=drop_columns)
    y = df["label"]

    X = X.select_dtypes(include=["int64", "float64"])

    print("\nFeature columns used:")
    print(X.columns.tolist())

    return X, y


def train_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )

    print("\nTraining Push-up Posture Model...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nPush-up Model Evaluation Results")
    print("--------------------------------")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1-score : {f1:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    return model, X.columns.tolist(), {
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
        "metrics": metrics
    }

    joblib.dump(model_package, MODEL_PATH)

    print("\nPush-up model saved successfully:")
    print(MODEL_PATH)


def main():
    df = load_dataset()
    X, y = prepare_data(df)

    model, feature_columns, metrics = train_model(X, y)

    save_model(
        model=model,
        feature_columns=feature_columns,
        metrics=metrics
    )

    print("\nPush-up model training completed successfully.")


if __name__ == "__main__":
    main()