import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

print("Generating simulated Chennai traffic data...")
# Features: [Hour (0-23), Weather (0=Clear, 1=Rain), Emergency_Severity (0=Low, 1=Med, 2=High)]
# Target: Traffic Density (0=Clear, 1=Moderate, 2=Heavy)
data = {
    'hour': [8, 9, 14, 18, 19, 2, 4, 17, 10, 15, 8, 18, 23, 1],
    'weather': [0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1],
    'severity': [1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 1, 2, 0, 0],
    'traffic': [2, 2, 1, 2, 2, 0, 0, 2, 1, 1, 2, 2, 0, 0] 
}

df = pd.DataFrame(data)
X = df[['hour', 'weather', 'severity']]
y = df['traffic']

print("Training Random Forest AI model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

# Save the trained model to a file
model_filename = 'traffic_model.pkl'
joblib.dump(model, model_filename)

print(f"Model trained successfully! Saved as '{model_filename}'")