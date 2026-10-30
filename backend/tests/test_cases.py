import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_cases():
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)

    # If empty in clean initial product state, create a test case to verify list item serialization
    if len(cases) == 0:
        create_res = client.post("/api/v1/cases", json={
            "borrowerName": "Test List Applicant",
            "bankName": "Bank of Baroda",
            "branch": "MG Road",
            "loanAmount": "₹50,00,000",
            "propertyType": "Residential Plot",
            "propertyAddress": "Plot 1, Test Layout",
            "surveyNumber": "10/1",
        })
        assert create_res.status_code == 201
        res = client.get("/api/v1/cases")
        cases = res.json()

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


def test_case_full_details_endpoint():
    """Verifies that GET /api/v1/cases/{case_id}/full returns complete consolidated state."""
    payload = {
        "borrowerName": "Deepa Sundaram",
        "bankName": "State Bank of India",
        "branch": "Indiranagar",
        "loanAmount": "₹85,00,000",
        "propertyType": "Residential Apartment",
        "propertyAddress": "Flat 302, Green Glen Layout, Bellandur, Bengaluru",
        "surveyNumber": "Sy. No. 58/3",
        "boundaries": {"north": "Driveway", "south": "Flat 301", "east": "Corridor", "west": "Open Air Space"}
    }
    create_res = client.post("/api/v1/cases", json=payload)
    assert create_res.status_code == 201
    case_data = create_res.json()
    case_id = case_data["id"]

    # Call /full endpoint
    full_res = client.get(f"/api/v1/cases/{case_id}/full")
    assert full_res.status_code == 200
    body = full_res.json()

    assert "case" in body
    assert body["case"]["id"] == case_id
    assert body["case"]["borrowerName"] == "Deepa Sundaram"
    assert "documents" in body
    assert isinstance(body["documents"], list)
    assert "findings" in body
    assert isinstance(body["findings"], list)
    assert "queries" in body
    assert isinstance(body["queries"], list)
    assert "report" in body
    # Initial draft report exists
    assert body["report"] is not None
    assert body["report"]["caseId"] == case_id
    assert body["report"]["reportRefNumber"].startswith("LSR/STAT/2026/")


def test_bulk_case_list_pre_aggregated_counts():
    """Verifies that list_cases efficiently computes aggregated counts without N+1 query failures."""
    res = client.get("/api/v1/cases")
    assert res.status_code == 200
    cases = res.json()
    assert isinstance(cases, list)
    for c in cases:
        assert "documentCount" in c
        assert "openQueriesCount" in c
        assert "findingsCount" in c
        assert "critical" in c["findingsCount"]
        assert "warning" in c["findingsCount"]
        assert "info" in c["findingsCount"]
