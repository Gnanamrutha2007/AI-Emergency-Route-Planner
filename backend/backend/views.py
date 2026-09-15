from django.http import JsonResponse
import json
import joblib
import os
from .models import Hospital
from django.views.decorators.csrf import csrf_exempt
# Load your model once when server starts
MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'traffic_model.pkl')
model = joblib.load(MODEL_PATH)

def predict_traffic(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            hour = data.get('hour', 12)
            weather = data.get('weather', 0)
            severity = data.get('severity', 1)
            
            prediction = model.predict([[hour, weather, severity]])[0]
            traffic_map = {0: "Low Traffic 🟢", 1: "Moderate Traffic 🟡", 2: "Heavy Traffic 🔴"}
            
            return JsonResponse({
                "traffic_level": int(prediction),
                "prediction_text": traffic_map.get(int(prediction), "Unknown")
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)

def get_hospitals(request):
    # Fetch hospitals from the database, or fallback to default list if empty
    hospitals = list(Hospital.objects.values('id', 'name', 'latitude', 'longitude', 'icu_beds', 'status'))
    
    if not hospitals:
        # Fallback data if database hasn't been seeded yet
        hospitals = [
            {"id": 1, "name": "Tagore Medical College", "latitude": 12.8596, "longitude": 80.1417, "icu_beds": 12, "status": "Optimal"},
            {"id": 2, "name": "Chettinad Health City", "latitude": 12.7917, "longitude": 80.2173, "icu_beds": 5, "status": "Moderate"},
            {"id": 3, "name": "SRM General Hospital", "latitude": 12.8236, "longitude": 80.0435, "icu_beds": 8, "status": "Optimal"}
        ]

    formatted_hospitals = [
        {
            "id": h["id"],
            "name": h["name"],
            "coords": [h["latitude"], h["longitude"]],
            "beds": h["icu_beds"],
            "status": h["status"]
        } for h in hospitals
    ]
    return JsonResponse(formatted_hospitals, safe=False)


def decrement_hospital_bed(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            hospital_id = data.get('hospital_id')
            
            hospital = Hospital.objects.get(id=hospital_id)
            if hospital.icu_beds > 0:
                hospital.icu_beds -= 1
                if hospital.icu_beds == 0:
                    hospital.status = "Full / Critical"
                hospital.save()
                
            return JsonResponse({"success": True, "remaining_beds": hospital.icu_beds})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Only POST allowed"}, status=405)