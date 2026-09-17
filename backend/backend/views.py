from django.http import JsonResponse
import json
import joblib
import os

from .models import Hospital, EmergencyRequest
from django.views.decorators.csrf import csrf_exempt


# ============================================================
# LOAD AI TRAFFIC MODEL
# ============================================================

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    'traffic_model.pkl'
)

model = joblib.load(MODEL_PATH)


# ============================================================
# AI TRAFFIC PREDICTION
# ============================================================

def predict_traffic(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            hour = int(data.get('hour', 12))
            weather = int(data.get('weather', 0))
            severity = int(data.get('severity', 1))

            # Run trained Random Forest model
            prediction = model.predict(
                [[hour, weather, severity]]
            )[0]

            traffic_map = {
                0: "Low Traffic 🟢",
                1: "Moderate Traffic 🟡",
                2: "Heavy Traffic 🔴"
            }

            return JsonResponse({
                "status": "success",
                "traffic_level": int(prediction),
                "prediction_text": traffic_map.get(
                    int(prediction),
                    "Unknown"
                )
            })

        except Exception as e:
            return JsonResponse(
                {"status": "error", "error": str(e)},
                status=400
            )

    return JsonResponse(
        {"error": "Only POST allowed"},
        status=405
    )


# ============================================================
# GET HOSPITALS
# ============================================================

def get_hospitals(request):

    hospitals = list(
        Hospital.objects.values(
            'id',
            'name',
            'latitude',
            'longitude',
            'icu_beds',
            'status'
        )
    )

    # Fallback hospitals if database is empty
    if not hospitals:
        hospitals = [
            {
                "id": 1,
                "name": "Tagore Medical College",
                "latitude": 12.8596,
                "longitude": 80.1417,
                "icu_beds": 12,
                "status": "Optimal"
            },
            {
                "id": 2,
                "name": "Chettinad Health City",
                "latitude": 12.7917,
                "longitude": 80.2173,
                "icu_beds": 5,
                "status": "Moderate"
            },
            {
                "id": 3,
                "name": "SRM General Hospital",
                "latitude": 12.8236,
                "longitude": 80.0435,
                "icu_beds": 8,
                "status": "Optimal"
            }
        ]

    formatted_hospitals = [
        {
            "id": h["id"],
            "name": h["name"],
            "coords": [
                h["latitude"],
                h["longitude"]
            ],
            "beds": h["icu_beds"],
            "status": h["status"]
        }
        for h in hospitals
    ]

    return JsonResponse(
        formatted_hospitals,
        safe=False
    )


# ============================================================
# DECREMENT HOSPITAL ICU BED
# ============================================================

@csrf_exempt
def decrement_hospital_bed(request):

    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            hospital_id = data.get('hospital_id')

            hospital = Hospital.objects.get(
                id=hospital_id
            )

            if hospital.icu_beds > 0:

                hospital.icu_beds -= 1

                if hospital.icu_beds == 0:
                    hospital.status = "Full / Critical"

                hospital.save()

            return JsonResponse({
                "success": True,
                "remaining_beds": hospital.icu_beds
            })

        except Exception as e:
            return JsonResponse(
                {"error": str(e)},
                status=400
            )

    return JsonResponse(
        {"error": "Only POST allowed"},
        status=405
    )


# ============================================================
# CREATE EMERGENCY REQUEST
# ============================================================

@csrf_exempt
def create_emergency_request(request):

    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            patient_name = data.get(
                'patientName',
                ''
            ).strip()

            emergency_type = data.get(
                'emergencyType',
                'Other'
            )

            severity = int(
                data.get('severity', 1)
            )

            location = data.get(
                'location',
                ''
            ).strip()

            notes = data.get(
                'notes',
                ''
            ).strip()

            # Basic validation
            if not patient_name:
                return JsonResponse(
                    {
                        "status": "error",
                        "message": "Patient name is required"
                    },
                    status=400
                )

            if not location:
                return JsonResponse(
                    {
                        "status": "error",
                        "message": "Patient location is required"
                    },
                    status=400
                )

            if severity not in [0, 1, 2]:
                return JsonResponse(
                    {
                        "status": "error",
                        "message": "Severity must be 0, 1, or 2"
                    },
                    status=400
                )

            # Save emergency request
            emergency = EmergencyRequest.objects.create(
                patient_name=patient_name,
                emergency_type=emergency_type,
                severity=severity,
                location=location,
                notes=notes,
                status="Pending"
            )

            return JsonResponse({
                "status": "success",
                "message": "Emergency request created successfully",
                "emergency_id": emergency.id,
                "patient_name": emergency.patient_name,
                "emergency_type": emergency.emergency_type,
                "severity": emergency.severity,
                "location": emergency.location,
                "notes": emergency.notes,
                "request_status": emergency.status,
                "created_at": emergency.created_at.isoformat()
            })

        except json.JSONDecodeError:
            return JsonResponse(
                {
                    "status": "error",
                    "message": "Invalid JSON data"
                },
                status=400
            )

        except Exception as e:
            return JsonResponse(
                {
                    "status": "error",
                    "message": str(e)
                },
                status=400
            )

    return JsonResponse(
        {"error": "Only POST allowed"},
        status=405
    )


# ============================================================
# GET EMERGENCY REQUESTS
# ============================================================

def get_emergency_requests(request):

    if request.method == 'GET':
        try:
            requests = EmergencyRequest.objects.all().order_by(
                '-created_at'
            )

            data = [
                {
                    "id": emergency.id,
                    "patient_name": emergency.patient_name,
                    "emergency_type": emergency.emergency_type,
                    "severity": emergency.severity,
                    "location": emergency.location,
                    "notes": emergency.notes,
                    "status": emergency.status,
                    "created_at": emergency.created_at.isoformat()
                }
                for emergency in requests
            ]

            return JsonResponse(
                data,
                safe=False
            )

        except Exception as e:
            return JsonResponse(
                {
                    "status": "error",
                    "message": str(e)
                },
                status=400
            )

    return JsonResponse(
        {"error": "Only GET allowed"},
        status=405
    )
# ============================================================
# A* ROUTE OPTIMIZATION
# ============================================================

import heapq
import math


def a_star_route(start, goal, traffic_level=0):
    """
    A* route optimization prototype.

    start and goal are [latitude, longitude].
    traffic_level:
        0 = Low
        1 = Moderate
        2 = Heavy
    """

    start_node = (
        round(float(start[0]), 3),
        round(float(start[1]), 3)
    )

    goal_node = (
        round(float(goal[0]), 3),
        round(float(goal[1]), 3)
    )

    traffic_cost = {
        0: 1.0,
        1: 1.2,
        2: 1.5
    }

    def heuristic(node):
        lat_diff = node[0] - goal_node[0]
        lon_diff = node[1] - goal_node[1]

        return math.sqrt(
            lat_diff ** 2 +
            lon_diff ** 2
        )

    open_set = []

    heapq.heappush(
        open_set,
        (0, start_node)
    )

    came_from = {}
    g_score = {
        start_node: 0
    }

    closed_set = set()

    while open_set:

        _, current = heapq.heappop(open_set)

        if current in closed_set:
            continue

        closed_set.add(current)

        # Goal reached
        if current == goal_node:

            path = []

            while current in came_from:
                path.append(current)
                current = came_from[current]

            path.append(start_node)
            path.reverse()

            return path

        lat, lon = current

        raw_neighbors = [
            (lat + 0.001, lon),
            (lat - 0.001, lon),
            (lat, lon + 0.001),
            (lat, lon - 0.001),
            (lat + 0.001, lon + 0.001),
            (lat + 0.001, lon - 0.001),
            (lat - 0.001, lon + 0.001),
            (lat - 0.001, lon - 0.001)
        ]

        # Round every generated coordinate
        # to prevent floating-point problems
        neighbors = [
            (
                round(neighbor[0], 3),
                round(neighbor[1], 3)
            )
            for neighbor in raw_neighbors
        ]

        for neighbor in neighbors:

            if neighbor in closed_set:
                continue

            movement_cost = math.sqrt(
                (neighbor[0] - lat) ** 2 +
                (neighbor[1] - lon) ** 2
            )

            tentative_g = (
                g_score[current]
                + movement_cost
                * traffic_cost.get(
                    traffic_level,
                    1.0
                )
            )

            if (
                neighbor not in g_score
                or tentative_g < g_score[neighbor]
            ):

                came_from[neighbor] = current
                g_score[neighbor] = tentative_g

                f_score = (
                    tentative_g
                    + heuristic(neighbor)
                )

                heapq.heappush(
                    open_set,
                    (f_score, neighbor)
                )

    return []
# ============================================================
# ROAD-BLOCK / ROAD-CONDITION ANALYSIS
# ============================================================

@csrf_exempt
def check_road_conditions(request):

    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            traffic_level = int(
                data.get('traffic_level', 0)
            )

            weather = int(
                data.get('weather', 0)
            )

            severity = int(
                data.get('severity', 1)
            )

            # Prototype road-condition rules
            road_block = False
            road_condition = "Clear Road"
            risk_level = "Low"

            # Heavy traffic indicates possible congestion
            if traffic_level == 2:
                road_condition = "Heavy Congestion"
                risk_level = "High"

            # Weather can increase road risk
            if weather == 1:
                road_condition = "Poor Weather Condition"
                risk_level = "Moderate"

            # Critical emergency + heavy traffic
            if traffic_level == 2 and severity == 2:
                road_block = True
                road_condition = "Possible Road Block"
                risk_level = "High"

            return JsonResponse({
                "status": "success",
                "road_block": road_block,
                "road_condition": road_condition,
                "risk_level": risk_level,
                "traffic_level": traffic_level,
                "weather": weather,
                "severity": severity
            })

        except Exception as e:
            return JsonResponse(
                {
                    "status": "error",
                    "message": str(e)
                },
                status=400
            )

    return JsonResponse(
        {"error": "Only POST allowed"},
        status=405
    )