import joblib
import numpy as np

# load model
model = joblib.load("model.pkl")
le = joblib.load("label_encoder.pkl")

def predict_goal(age, bmi):
    X = np.array([[age, bmi]])
    pred = model.predict(X)
    return le.inverse_transform(pred)[0]