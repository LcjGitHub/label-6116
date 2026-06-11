import os
import sys
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Plot, db


def test_create_plot_missing_required_fields_returns_400(client, app):
    payload = {"plot_number": "T-01"}
    response = client.post("/api/plots", json=payload)
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_create_plot_duplicate_plot_number_returns_409(client, app):
    with app.app_context():
        db.session.add(Plot(
            plot_number="DUP-01",
            claimer="测试人",
            crop="番茄",
            claim_date=date(2026, 3, 1),
            expected_harvest_date=date(2026, 6, 15),
            status="种植中",
        ))
        db.session.commit()

    payload = {
        "plot_number": "DUP-01",
        "claimer": "另一个人",
        "crop": "黄瓜",
        "claim_date": "2026-04-01",
        "expected_harvest_date": "2026-07-01",
    }
    response = client.post("/api/plots", json=payload)
    assert response.status_code == 409
    data = response.get_json()
    assert "error" in data


def test_list_plots_filter_by_claimer_fuzzy(client, app):
    with app.app_context():
        db.session.add_all([
            Plot(
                plot_number="F-01",
                claimer="张三丰",
                crop="番茄",
                claim_date=date(2026, 3, 1),
                expected_harvest_date=date(2026, 6, 15),
                status="种植中",
            ),
            Plot(
                plot_number="F-02",
                claimer="张三",
                crop="黄瓜",
                claim_date=date(2026, 3, 5),
                expected_harvest_date=date(2026, 5, 20),
                status="种植中",
            ),
            Plot(
                plot_number="F-03",
                claimer="李四",
                crop="辣椒",
                claim_date=date(2026, 3, 10),
                expected_harvest_date=date(2026, 7, 1),
                status="种植中",
            ),
        ])
        db.session.commit()

    response = client.get("/api/plots?claimer=张三")
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    claimers = {item["claimer"] for item in data}
    assert "张三丰" in claimers
    assert "张三" in claimers
    assert "李四" not in claimers


def test_batch_delete_empty_array_returns_400(client, app):
    response = client.post("/api/plots/batch-delete", json={"ids": []})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_batch_delete_mixed_valid_and_invalid_ids(client, app):
    with app.app_context():
        p1 = Plot(
            plot_number="B-01",
            claimer="测试人A",
            crop="番茄",
            claim_date=date(2026, 3, 1),
            expected_harvest_date=date(2026, 6, 15),
            status="种植中",
        )
        p2 = Plot(
            plot_number="B-02",
            claimer="测试人B",
            crop="黄瓜",
            claim_date=date(2026, 3, 5),
            expected_harvest_date=date(2026, 5, 20),
            status="种植中",
        )
        db.session.add_all([p1, p2])
        db.session.commit()
        valid_id_1 = p1.id
        valid_id_2 = p2.id

    invalid_id = 99999
    response = client.post(
        "/api/plots/batch-delete",
        json={"ids": [valid_id_1, invalid_id, valid_id_2]},
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["deleted_count"] == 2

    with app.app_context():
        remaining = Plot.query.filter(Plot.id.in_([valid_id_1, valid_id_2])).all()
        assert len(remaining) == 0
