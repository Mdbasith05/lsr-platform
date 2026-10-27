import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_custom_finding_and_decision():
    # Fetch first case
    cases_res = client.get("/api/v1/cases")
    case_id = cases_res.json()[0]["id"]

    # Add custom manual observation
    finding_payload = {
        "title": "Unregistered Agreement of Sale Noted in Encumbrance Recital",
        "category": "Encumbrance / Charge",
        "severity": "warning",
        "description": "Recitals in 2016 deed refer to prior 2014 unregistered agreement.",
        "pageNumber": 3,
        "evidenceSnippet": "Agreement of sale dated 12-05-2014 executed without registration.",
        "aiConfidence": 1.0,
        "lawyerDecision": "pending",
        "suggestedQueryText": "Confirm whether 2014 agreement was cancelled or superseded."
    }
    res_add = client.post(f"/api/v1/cases/{case_id}/scrutiny/findings", json=finding_payload)
    assert res_add.status_code == 201
    f_id = res_add.json()["id"]

    # Dismiss finding
    res_dismiss = client.patch(f"/api/v1/scrutiny/findings/{f_id}", json={"decision": "dismissed", "notes": "Superseded by absolute registered deed."})
    assert res_dismiss.status_code == 200
    assert res_dismiss.json()["lawyerDecision"] == "dismissed"
