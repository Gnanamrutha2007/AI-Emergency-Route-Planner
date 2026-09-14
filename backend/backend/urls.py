import os
import joblib
from django.contrib import admin
from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Load the trained AI model once on server start
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'traffic_model.pkl')
model = joblib.load(MODEL_PATH)

TRAFFIC_MAP = {
    0: "Clear Traffic",
    1: "Moderate Traffic",
    2: "Heavy Traffic"
}

@api_view(['POST'])
def predict_traffic(request):
    try:
        # Extract inputs sent from React frontend
        hour = int(request.data.get('hour', 12))
        weather = int(request.data.get('weather', 0))       # 0: Clear, 1: Rain
        severity = int(request.data.get('severity', 1))     # 0: Low, 1: Med, 2: High

        # Run AI prediction
        prediction = model.predict([[hour, weather, severity]])[0]
        result_label = TRAFFIC_MAP.get(prediction, "Unknown")

        return Response({
            "status": "success",
            "traffic_level": prediction,
            "prediction_text": result_label,
            "recommended_speed_kmh": 60 if prediction == 0 else (40 if prediction == 1 else 25)
        })
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=400)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/predict-traffic/', predict_traffic),
]