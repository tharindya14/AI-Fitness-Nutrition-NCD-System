import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# load dataset
users = pd.read_csv("../../datasets/user_profiles.csv")

# simple features
X = users[["age", "BMI"]]
y = users["goal"]

# encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# train model
model = RandomForestClassifier()
model.fit(X, y_encoded)

# save model
joblib.dump(model, "model.pkl")
joblib.dump(le, "label_encoder.pkl")

print("Model trained and saved!")