import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)


ANGLES_PATH = "../../datasets/angles.csv"
LABELS_PATH = "../../datasets/labels.csv"

MODEL_DIR = "../../models"
MODEL_PATH = "../../models/exercise_classifier_model.pkl"


def load_data():
    if not os.path.exists(ANGLES_PATH):
        raise FileNotFoundError(f"Angles dataset not found: {ANGLES_PATH}")

    if not os.path.exists(LABELS_PATH):
        raise FileNotFoundError(f"Labels dataset not found: {LABELS_PATH}")

    angles_df = pd.read_csv(ANGLES_PATH)
    labels_df = pd.read_csv(LABELS_PATH)

    print("\nAngles dataset loaded.")
    print("Angles shape:", angles_df.shape)
    print("Angles columns:", angles_df.columns.tolist())

    print("\nLabels dataset loaded.")
    print("Labels shape:", labels_df.shape)
    print("Labels columns:", labels_df.columns.tolist())

    print("\nClass distribution by video:")
    print(labels_df["class"].value_counts())

    return angles_df, labels_df


def prepare_train_test_data(angles_df, labels_df):
    """
    Important:
    We split by video id, not by individual frame.
    This avoids data leakage where frames from the same video appear in both train and test sets.
    """

    labels_df = labels_df.dropna()
    angles_df = angles_df.dropna()

    # Encode class labels
    label_encoder = LabelEncoder()
    labels_df["label_encoded"] = label_encoder.fit_transform(labels_df["class"])

    print("\nEncoded classes:")
    for class_name, class_id in zip(label_encoder.classes_, range(len(label_encoder.classes_))):
        print(f"{class_id}: {class_name}")

    # Split video ids, not frames
    train_labels, test_labels = train_test_split(
        labels_df,
        test_size=0.2,
        random_state=42,
        stratify=labels_df["class"]
    )

    train_vid_ids = set(train_labels["vid_id"].tolist())
    test_vid_ids = set(test_labels["vid_id"].tolist())

    train_df = angles_df[angles_df["vid_id"].isin(train_vid_ids)].copy()
    test_df = angles_df[angles_df["vid_id"].isin(test_vid_ids)].copy()

    # Attach labels to each frame using vid_id
    label_map = labels_df.set_index("vid_id")["label_encoded"].to_dict()
    class_map = labels_df.set_index("vid_id")["class"].to_dict()

    train_df["label"] = train_df["vid_id"].map(label_map)
    test_df["label"] = test_df["vid_id"].map(label_map)

    train_df["class_name"] = train_df["vid_id"].map(class_map)
    test_df["class_name"] = test_df["vid_id"].map(class_map)

    # Feature columns: remove identifiers and labels
    drop_cols = ["vid_id", "frame_order", "label", "class_name"]
    feature_cols = [col for col in train_df.columns if col not in drop_cols]

    X_train = train_df[feature_cols]
    y_train = train_df["label"]

    X_test = test_df[feature_cols]
    y_test = test_df["label"]

    print("\nFeature columns used:")
    print(feature_cols)

    print("\nTrain frame shape:", X_train.shape)
    print("Test frame shape:", X_test.shape)

    print("\nTrain class distribution by frames:")
    print(train_df["class_name"].value_counts())

    print("\nTest class distribution by frames:")
    print(test_df["class_name"].value_counts())

    return X_train, X_test, y_train, y_test, feature_cols, label_encoder


def train_model(X_train, y_train):
    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        max_depth=None,
        n_jobs=-1
    )

    print("\nTraining Exercise Classification Model...")
    model.fit(X_train, y_train)

    return model


def evaluate_model(model, X_test, y_test, label_encoder):
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nExercise Classification Evaluation")
    print("----------------------------------")
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1-score : {f1:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=label_encoder.classes_,
            zero_division=0
        )
    )

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }


def save_model(model, feature_cols, label_encoder, metrics):
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_package = {
        "model": model,
        "feature_columns": feature_cols,
        "label_encoder": label_encoder,
        "metrics": metrics
    }

    joblib.dump(model_package, MODEL_PATH)

    print("\nModel saved successfully:")
    print(MODEL_PATH)


def main():
    angles_df, labels_df = load_data()

    X_train, X_test, y_train, y_test, feature_cols, label_encoder = prepare_train_test_data(
        angles_df,
        labels_df
    )

    model = train_model(X_train, y_train)

    metrics = evaluate_model(
        model,
        X_test,
        y_test,
        label_encoder
    )

    save_model(
        model,
        feature_cols,
        label_encoder,
        metrics
    )

    print("\nExercise classifier training completed successfully.")


if __name__ == "__main__":
    main()