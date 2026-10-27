import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_cases():
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)
    assert len(cases) >= 1
    first = cases[0]
    assert "borrowerName" in first
    assert "caseNumber" in first
    assert "findingsCount" in first


def test_create_and_get_case():
    payload = {
        "borrowerName": "Aravind Swaminathan",
        "bankName": "Canara Bank",
        "branch": "Jayanagar 4th Block",
        "loanAmount": "₹60,00,000",
        "propertyType": "Residential Plot",
        "propertyAddress": "Site 12, 5th Cross, Jayanagar, Bengaluru",
        "surveyNumber": "Sy. No. 19/2",
        "boundaries": {"north": "Road", "south": "Site 13", "east": "Site 20", "west": "Road"}
    }
    res = client.post("/api/v1/cases", json=payload)
    assert res.status_code == 201
    c = res.json()
    c_id = c["id"]

    res_get = client.get(f"/api/v1/cases/{c_id}")
    assert res_get.status_code == 200
    assert res_get.json()["borrowerName"] == "Aravind Swaminathan"

    # Test update status
    res_patch = client.patch(f"/api/v1/cases/{c_id}", json={"status": "Document Processing"})
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "Document Processing"
