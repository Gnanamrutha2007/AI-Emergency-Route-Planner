
import os
import joblib
import requests

from dotenv import load_dotenv
from django.contrib import admin
from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .views import (
    get_hospitals,
    decrement_hospital_bed,
    create_emergency_request,
    get_emergency_requests,
    a_star_route,
    check_road_conditions,
)


# ============================================================
# ENVIRONMENT CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))


# ============================================================
# LOAD TRAINED AI MODEL
# ============================================================

MODEL_PATH = os.path.join(BASE_DIR, "traffic_model.pkl")
model = joblib.load(MODEL_PATH)


TRAFFIC_MAP = {
    0: "Clear Traffic",
    1: "Moderate Traffic",
    2: "Heavy Traffic",
}


# ============================================================
# AI TRAFFIC PREDICTION API
# POST /api/predict-traffic/
# ============================================================

@api_view(["POST"])
def predict_traffic(request):
    try:
        hour = int(request.data.get("hour", 12))
        weather = int(request.data.get("weather", 0))
        severity = int(request.data.get("severity", 1))

        if not 0 <= hour <= 23:
            return Response(
                {"status": "error", "message": "Hour must be between 0 and 23"},
                status=400,
            )

        if weather not in (0, 1):
            return Response(
                {"status": "error", "message": "Weather must be 0 or 1"},
                status=400,
            )

        if severity not in (0, 1, 2):
            return Response(
                {"status": "error", "message": "Severity must be 0, 1, or 2"},
                status=400,
            )

        prediction = int(model.predict([[hour, weather, severity]])[0])

        return Response({
            "status": "success",
            "traffic_level": prediction,
            "prediction_text": TRAFFIC_MAP.get(prediction, "Unknown"),
            "recommended_speed_kmh": (
                60 if prediction == 0
                else 40 if prediction == 1
                else 25
            ),
            "model_input": {
                "hour": hour,
                "weather": weather,
                "severity": severity,
            },
            "data_type": "model_prediction_not_live_traffic",
        })

    except (TypeError, ValueError):
        return Response(
            {"status": "error", "message": "Invalid input values"},
            status=400,
        )
    except Exception:
        return Response(
            {"status": "error", "message": "Traffic prediction failed"},
            status=500,
        )


# ============================================================
# LIVE WEATHER API — OPEN-METEO
# GET /api/live-weather/
# ============================================================

@api_view(["GET"])
def live_weather(request):
    try:
        latitude = float(request.query_params.get("latitude", 12.9249))
        longitude = float(request.query_params.get("longitude", 80.1000))

        if not -90 <= latitude <= 90:
            return Response(
                {"status": "error", "message": "Latitude must be between -90 and 90"},
                status=400,
            )

        if not -180 <= longitude <= 180:
            return Response(
                {"status": "error", "message": "Longitude must be between -180 and 180"},
                status=400,
            )

        response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": latitude,
                "longitude": longitude,
                "current": (
                    "temperature_2m,"
                    "relative_humidity_2m,"
                    "apparent_temperature,"
                    "precipitation,"
                    "rain,"
                    "weather_code,"
                    "wind_speed_10m"
                ),
                "timezone": "auto",
            },
            timeout=10,
        )
        response.raise_for_status()

        data = response.json()
        current = data.get("current")

        if not current:
            return Response(
                {
                    "status": "error",
                    "message": "Weather data was not returned by the provider",
                },
                status=502,
            )

        weather_code = current.get("weather_code")
        rain = current.get("rain") or 0
        precipitation = current.get("precipitation") or 0

        weather_input = (
            0 if weather_code == 0 and rain == 0 and precipitation == 0
            else 1
        )

        return Response({
            "status": "success",
            "source": "Open-Meteo",
            "data_type": "current_weather_observation",
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "current": current,
            "weather_input_for_model": weather_input,
        })

    except requests.RequestException:
        return Response(
            {
                "status": "error",
                "message": "Live weather service is unavailable",
            },
            status=502,
        )
    except (TypeError, ValueError):
        return Response(
            {"status": "error", "message": "Invalid latitude or longitude"},
            status=400,
        )


# ============================================================
# LIVE TRAFFIC API — TOMTOM
# GET /api/live-traffic/
# ============================================================

@api_view(["GET"])
def live_traffic(request):
    try:
        api_key = os.getenv("TOMTOM_API_KEY")

        if not api_key:
            return Response(
                {
                    "status": "error",
                    "message": "TomTom API key missing. Check backend/.env.",
                },
                status=503,
            )

        latitude = float(request.query_params.get("latitude", 12.9249))
        longitude = float(request.query_params.get("longitude", 80.1000))

        if not -90 <= latitude <= 90:
            return Response(
                {"status": "error", "message": "Invalid latitude"},
                status=400,
            )

        if not -180 <= longitude <= 180:
            return Response(
                {"status": "error", "message": "Invalid longitude"},
                status=400,
            )

        response = requests.get(
            "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json",
            params={
                "key": api_key,
                "point": f"{latitude},{longitude}",
                "unit": "KMPH",
            },
            timeout=15,
        )

        if response.status_code != 200:
            return Response(
                {
                    "status": "error",
                    "message": "TomTom did not return traffic data.",
                    "provider_status": response.status_code,
                },
                status=502,
            )

        data = response.json()
        flow = data.get("flowSegmentData")

        if not flow:
            return Response(
                {"status": "error", "message": "No traffic flow data returned."},
                status=502,
            )

        current_speed = flow.get("currentSpeed")
        free_flow_speed = flow.get("freeFlowSpeed")

        if current_speed is None or free_flow_speed is None:
            return Response(
                {"status": "error", "message": "Traffic speeds are unavailable."},
                status=502,
            )

        if free_flow_speed <= 0:
            traffic_level = None
            traffic_text = "Unable to classify traffic"
        else:
            speed_ratio = current_speed / free_flow_speed

            if speed_ratio >= 0.75:
                traffic_level = 0
            elif speed_ratio >= 0.40:
                traffic_level = 1
            else:
                traffic_level = 2

            traffic_text = TRAFFIC_MAP[traffic_level]

        return Response({
            "status": "success",
            "source": "TomTom Traffic API",
            "data_type": "live_traffic_observation",
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "traffic": {
                "current_speed_kmh": current_speed,
                "free_flow_speed_kmh": free_flow_speed,
                "current_travel_time_seconds": flow.get(
                    "currentTravelTime"
                ),
                "free_flow_travel_time_seconds": flow.get(
                    "freeFlowTravelTime"
                ),
                "confidence": flow.get("confidence"),
                "road_closure": flow.get("roadClosure"),
                "traffic_level": traffic_level,
                "traffic_text": traffic_text,
            },
        })

    except requests.RequestException:
        return Response(
            {
                "status": "error",
                "message": "Could not connect to TomTom. Check your connection.",
            },
            status=502,
        )
    except (TypeError, ValueError):
        return Response(
            {"status": "error", "message": "Invalid latitude or longitude."},
            status=400,
        )


# ============================================================
# A* ROUTE OPTIMIZATION API
# ============================================================

@api_view(["POST"])
def calculate_route(request):
    try:
        start = request.data.get("start")
        goal = request.data.get("goal")
        traffic_level = int(request.data.get("traffic_level", 0))

        if not start or not goal:
            return Response(
                {
                    "status": "error",
                    "message": "Start and goal coordinates are required",
                },
                status=400,
            )

        if traffic_level not in (0, 1, 2):
            return Response(
                {
                    "status": "error",
                    "message": "Traffic level must be 0, 1, or 2",
                },
                status=400,
            )

        route = a_star_route(
            start=start,
            goal=goal,
            traffic_level=traffic_level,
        )

        if not route:
            return Response(
                {"status": "error", "message": "No route found"},
                status=404,
            )

        return Response({
            "status": "success",
            "route": route,
            "traffic_level": traffic_level,
            "route_points": len(route),
        })

    except (TypeError, ValueError):
        return Response(
            {"status": "error", "message": "Invalid route input"},
            status=400,
        )
    except Exception:
        return Response(
            {"status": "error", "message": "Route calculation failed"},
            status=500,
        )


# ============================================================
# URL ROUTES
# ============================================================

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/predict-traffic/", predict_traffic, name="predict_traffic"),
    path("api/live-weather/", live_weather, name="live_weather"),
    path("api/live-traffic/", live_traffic, name="live_traffic"),
    path("api/calculate-route/", calculate_route, name="calculate_route"),

    path("api/hospitals/", get_hospitals, name="get_hospitals"),
    path(
        "api/decrement-bed/",
        decrement_hospital_bed,
        name="decrement_hospital_bed",
    ),
    path(
        "api/emergency-requests/",
        create_emergency_request,
        name="create_emergency_request",
    ),
    path(
        "api/emergency-requests/list/",
        get_emergency_requests,
        name="get_emergency_requests",
    ),
    path(
        "api/road-conditions/",
        check_road_conditions,
        name="check_road_conditions",
    ),
]
