import requests
import json

url = "http://localhost:8000/predict"
payload = {
    "company_id": "COMP_007",
    "as_of_date": "2026-01-31"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
