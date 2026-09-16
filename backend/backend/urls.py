import os
import joblib

from django.contrib import admin
from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .views import (
    get_hospitals,
    decrement_hospital_bed,
    create_emergency_request,
    get_emergency_requests,
    a_star_route
)


# ============================================================
# LOAD TRAINED AI MODEL
# ============================================================

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'traffic_model.pkl'
)

model = joblib.load(MODEL_PATH)


TRAFFIC_MAP = {
    0: "Clear Traffic",
    1: "Moderate Traffic",
    2: "Heavy Traffic"
}


# ============================================================
# AI TRAFFIC PREDICTION API
# ============================================================

@api_view(['POST'])
def predict_traffic(request):

    try:
        hour = int(request.data.get('hour', 12))
        weather = int(request.data.get('weather', 0))
        severity = int(request.data.get('severity', 1))

        prediction = model.predict(
            [[hour, weather, severity]]
        )[0]

        result_label = TRAFFIC_MAP.get(
            int(prediction),
            "Unknown"
        )

        return Response({
            "status": "success",
            "traffic_level": int(prediction),
            "prediction_text": result_label,
            "recommended_speed_kmh":
                60 if prediction == 0
                else (40 if prediction == 1 else 25)
        })

    except Exception as e:

        return Response(
            {
                "status": "error",
                "message": str(e)
            },
            status=400
        )

# ============================================================
# A* ROUTE OPTIMIZATION API
# ============================================================

@api_view(['POST'])
def calculate_route(request):

    try:
        start = request.data.get('start')
        goal = request.data.get('goal')
        traffic_level = int(request.data.get('traffic_level', 0))

        if not start or not goal:
            return Response(
                {
                    "status": "error",
                    "message": "Start and goal coordinates are required"
                },
                status=400
            )

        route = a_star_route(
            start=start,
            goal=goal,
            traffic_level=traffic_level
        )

        if not route:
            return Response(
                {
                    "status": "error",
                    "message": "No route found"
                },
                status=404
            )

        return Response({
            "status": "success",
            "route": route,
            "traffic_level": traffic_level,
            "route_points": len(route)
        })

    except Exception as e:

        return Response(
            {
                "status": "error",
                "message": str(e)
            },
            status=400
        )
# ============================================================
# URL ROUTES
# ============================================================

urlpatterns = [

    path(
        'admin/',
        admin.site.urls
    ),

    # AI traffic prediction
    path(
        'api/predict-traffic/',
        predict_traffic
    ),

    # A* route optimization
    path(
        'api/calculate-route/',
        calculate_route,
        name='calculate_route'
    ),
    # Hospital information
    path(
        'api/hospitals/',
        get_hospitals,
        name='get_hospitals'
    ),

    # Decrease ICU bed after dispatch
    path(
        'api/decrement-bed/',
        decrement_hospital_bed,
        name='decrement_hospital_bed'
    ),

    # Create emergency request
    path(
        'api/emergency-requests/',
        create_emergency_request,
        name='create_emergency_request'
    ),

    # Get previous emergency requests
    path(
        'api/emergency-requests/list/',
        get_emergency_requests,
        name='get_emergency_requests'
    ),
]