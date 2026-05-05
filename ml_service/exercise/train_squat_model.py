import os
import pandas as pd
import joblib

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


DATA_PATH = "../../datasets/squat_features_augmented.csv"
MODEL_DIR = "../../models"
MODEL_PATH = "../../models/squat_model.pkl"


def load_dataset():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    print("\nDataset loaded successfully.")
    print("Shape:", df.shape)
    print("\nColumns:")
    print(df.columns.tolist())

    return df


def detect_label_column(df):
    possible_label_columns = [
        "label",
        "Label",
        "class",
        "Class",
        "target",
        "Target",
        "status",
        "Status",
        "posture",
        "Posture",
        "correct",
        "Correct"
    ]

    for col in possible_label_columns:
        if col in df.columns:
            return col

    # If no known label column found, assume last column is label
    return df.columns[-1]


def prepare_data(df):
    label_col = detect_label_column(df)

    print("\nDetected label column:", label_col)

    # Drop rows with missing values
    df = df.dropna()

    X = df.drop(columns=[label_col])
    y = df[label_col]

    # Keep only numeric feature columns
    X = X.select_dtypes(include=["int64", "float64"])
    if "frame" in X.columns:
        X = X.drop(columns=["frame"])

    print("\nFeature columns used:")
    print(X.columns.tolist())

    print("\nLabel distribution:")
    print(y.value_counts())

    return X, y, label_col


def train_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if y.nunique() > 1 else None
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        max_depth=None,
        class_weight="balanced"
    )

    print("\nTraining Random Forest model...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nModel Evaluation Results")
    print("------------------------")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1-score : {f1:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    return model, {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }


def save_model(model):
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    print("\nModel saved successfully:")
    print(MODEL_PATH)


def main():
    df = load_dataset()
    X, y, label_col = prepare_data(df)
    model, metrics = train_model(X, y)
    save_model(model)

    print("\nTraining completed successfully.")
    print("Use these results in your research report / evaluation section.")


if __name__ == "__main__":
    main()