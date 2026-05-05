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
XYZ_DISTANCES_PATH = "../../datasets/xyz_distances.csv"
DISTANCES_3D_PATH = "../../datasets/calculated_3d_distances.csv"
LABELS_PATH = "../../datasets/labels.csv"

MODEL_DIR = "../../models"
MODEL_PATH = "../../models/exercise_classifier_v2_model.pkl"


def load_datasets():
    for path in [ANGLES_PATH, XYZ_DISTANCES_PATH, DISTANCES_3D_PATH, LABELS_PATH]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Dataset not found: {path}")

    angles_df = pd.read_csv(ANGLES_PATH)
    xyz_df = pd.read_csv(XYZ_DISTANCES_PATH)
    dist3d_df = pd.read_csv(DISTANCES_3D_PATH)
    labels_df = pd.read_csv(LABELS_PATH)

    print("\nDatasets loaded successfully.")
    print("angles.csv shape:", angles_df.shape)
    print("xyz_distances.csv shape:", xyz_df.shape)
    print("calculated_3d_distances.csv shape:", dist3d_df.shape)
    print("labels.csv shape:", labels_df.shape)

    print("\nClass distribution by video:")
    print(labels_df["class"].value_counts())

    return angles_df, xyz_df, dist3d_df, labels_df


def merge_feature_files(angles_df, xyz_df, dist3d_df):
    """
    Merge all feature files using vid_id + frame_order.
    This gives richer features than angle-only training.
    """

    merged_df = angles_df.merge(
        xyz_df,
        on=["vid_id", "frame_order"],
        how="inner"
    )

    merged_df = merged_df.merge(
        dist3d_df,
        on=["vid_id", "frame_order"],
        how="inner"
    )

    merged_df = merged_df.dropna()

    print("\nMerged feature dataset shape:", merged_df.shape)
    print("Total feature columns before label merge:", len(merged_df.columns))

    return merged_df


def prepare_train_test_data(features_df, labels_df):
    """
    Split by video ID, not by frame.
    This prevents frames from the same video appearing in both train and test sets.
    """

    labels_df = labels_df.dropna().copy()

    label_encoder = LabelEncoder()
    labels_df["label_encoded"] = label_encoder.fit_transform(labels_df["class"])

    print("\nEncoded classes:")
    for class_id, class_name in enumerate(label_encoder.classes_):
        print(f"{class_id}: {class_name}")

    train_labels, test_labels = train_test_split(
        labels_df,
        test_size=0.2,
        random_state=42,
        stratify=labels_df["class"]
    )

    train_vid_ids = set(train_labels["vid_id"].tolist())
    test_vid_ids = set(test_labels["vid_id"].tolist())

    label_map = labels_df.set_index("vid_id")["label_encoded"].to_dict()
    class_map = labels_df.set_index("vid_id")["class"].to_dict()

    features_df["label"] = features_df["vid_id"].map(label_map)
    features_df["class_name"] = features_df["vid_id"].map(class_map)

    train_df = features_df[features_df["vid_id"].isin(train_vid_ids)].copy()
    test_df = features_df[features_df["vid_id"].isin(test_vid_ids)].copy()

    drop_cols = ["vid_id", "frame_order", "label", "class_name"]
    feature_cols = [col for col in train_df.columns if col not in drop_cols]

    X_train = train_df[feature_cols]
    y_train = train_df["label"]

    X_test = test_df[feature_cols]
    y_test = test_df["label"]

    print("\nFeature count:", len(feature_cols))
    print("\nTrain frame shape:", X_train.shape)
    print("Test frame shape:", X_test.shape)

    print("\nTrain class distribution by frames:")
    print(train_df["class_name"].value_counts())

    print("\nTest class distribution by frames:")
    print(test_df["class_name"].value_counts())

    return X_train, X_test, y_train, y_test, feature_cols, label_encoder


def train_model(X_train, y_train):
    model = RandomForestClassifier(
        n_estimators=500,
        random_state=42,
        class_weight="balanced",
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1
    )

    print("\nTraining improved Exercise Classification Model...")
    model.fit(X_train, y_train)

    return model


def evaluate_model(model, X_test, y_test, label_encoder):
    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print("\nImproved Exercise Classification Evaluation")
    print("-------------------------------------------")
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

    print("\nImproved model saved successfully:")
    print(MODEL_PATH)


def main():
    angles_df, xyz_df, dist3d_df, labels_df = load_datasets()

    features_df = merge_feature_files(
        angles_df,
        xyz_df,
        dist3d_df
    )

    X_train, X_test, y_train, y_test, feature_cols, label_encoder = prepare_train_test_data(
        features_df,
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

    print("\nImproved exercise classifier training completed successfully.")


if __name__ == "__main__":
    main()