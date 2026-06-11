import os
from datetime import datetime, timedelta, date

from flask import Flask, jsonify, request
from flask_cors import CORS

from models import PLOT_STATUSES, Announcement, Claimant, Crop, FertilizationRecord, HarvestRecord, PestReport, PlantingLog, Plot, db
from seed import seed_database
from validators import (
    validate_announcement_payload,
    validate_batch_delete_payload,
    validate_claimant_payload,
    validate_crop_payload,
    validate_fertilization_payload,
    validate_harvest_payload,
    validate_pest_report_payload,
    validate_planting_log_payload,
    validate_plot_payload,
    validate_treatment_status_payload,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(DATA_DIR, 'garden.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
db.init_app(app)


@app.route("/api/plots", methods=["GET"])
def list_plots():
    query = Plot.query

    plot_number = request.args.get("plot_number", "").strip()
    claimer = request.args.get("claimer", "").strip()
    crop = request.args.get("crop", "").strip()
    status = request.args.get("status", "").strip()
    start_date_str = request.args.get("start_date", "").strip()
    end_date_str = request.args.get("end_date", "").strip()

    if plot_number:
        query = query.filter(Plot.plot_number.contains(plot_number))
    if claimer:
        query = query.filter(Plot.claimer.contains(claimer))
    if crop:
        query = query.filter(Plot.crop.contains(crop))
    if status:
        query = query.filter(Plot.status == status)
    if start_date_str:
        try:
            start_date_val = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            query = query.filter(Plot.claim_date >= start_date_val)
        except ValueError:
            pass
    if end_date_str:
        try:
            end_date_val = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            query = query.filter(Plot.claim_date <= end_date_val)
        except ValueError:
            pass

    plots = query.order_by(Plot.plot_number).all()
    return jsonify([plot.to_dict() for plot in plots])


@app.route("/api/plots/<int:plot_id>", methods=["GET"])
def get_plot(plot_id):
    plot = db.session.get(Plot, plot_id)
    if not plot:
        return jsonify({"error": "地块不存在"}), 404
    return jsonify(plot.to_dict(include_stats=True))


@app.route("/api/plots", methods=["POST"])
def create_plot():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_plot_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if Plot.query.filter_by(plot_number=payload["plot_number"]).first():
        return jsonify({"error": "地块编号已存在"}), 409

    plot = Plot(**payload)
    db.session.add(plot)
    db.session.commit()
    return jsonify(plot.to_dict()), 201


@app.route("/api/plots/<int:plot_id>", methods=["PUT"])
def update_plot(plot_id):
    plot = db.session.get(Plot, plot_id)
    if not plot:
        return jsonify({"error": "地块不存在"}), 404

    data = request.get_json(silent=True) or {}
    try:
        payload = validate_plot_payload(data, partial=True)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if "plot_number" in payload and payload["plot_number"] != plot.plot_number:
        existing = Plot.query.filter_by(plot_number=payload["plot_number"]).first()
        if existing:
            return jsonify({"error": "地块编号已存在"}), 409

    for key, value in payload.items():
        setattr(plot, key, value)

    db.session.commit()
    return jsonify(plot.to_dict())


@app.route("/api/plots/<int:plot_id>", methods=["DELETE"])
def delete_plot(plot_id):
    plot = db.session.get(Plot, plot_id)
    if not plot:
        return jsonify({"error": "地块不存在"}), 404

    db.session.delete(plot)
    db.session.commit()
    return jsonify({"message": "删除成功"})


@app.route("/api/plots/batch-delete", methods=["POST"])
def batch_delete_plots():
    data = request.get_json(silent=True) or {}
    try:
        ids = validate_batch_delete_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    deleted_count = 0
    for plot_id in ids:
        plot = db.session.get(Plot, plot_id)
        if plot:
            db.session.delete(plot)
            deleted_count += 1

    db.session.commit()
    return jsonify({"message": f"成功删除 {deleted_count} 条记录", "deleted_count": deleted_count})


@app.route("/api/harvest-records", methods=["GET"])
def list_harvest_records():
    query = HarvestRecord.query.join(Plot)

    plot_id = request.args.get("plot_id", "").strip()
    if plot_id:
        try:
            plot_id_int = int(plot_id)
            query = query.filter(HarvestRecord.plot_id == plot_id_int)
        except ValueError:
            pass

    plot_number = request.args.get("plot_number", "").strip()
    if plot_number:
        query = query.filter(Plot.plot_number == plot_number)

    start_date_str = request.args.get("start_date", "").strip()
    end_date_str = request.args.get("end_date", "").strip()

    if start_date_str:
        try:
            start_date_val = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            query = query.filter(HarvestRecord.actual_harvest_date >= start_date_val)
        except ValueError:
            pass
    if end_date_str:
        try:
            end_date_val = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            query = query.filter(HarvestRecord.actual_harvest_date <= end_date_val)
        except ValueError:
            pass

    records = query.order_by(HarvestRecord.actual_harvest_date.desc(), HarvestRecord.id.desc()).all()
    return jsonify([record.to_dict() for record in records])


@app.route("/api/harvest-records", methods=["POST"])
def create_harvest_record():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_harvest_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    record = HarvestRecord(**payload)
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@app.route("/api/harvest-records/<int:record_id>", methods=["DELETE"])
def delete_harvest_record(record_id):
    record = db.session.get(HarvestRecord, record_id)
    if not record:
        return jsonify({"error": "收获记录不存在"}), 404

    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "删除成功"})


@app.route("/api/planting-logs", methods=["GET"])
def list_planting_logs():
    query = PlantingLog.query.join(Plot)

    plot_id = request.args.get("plot_id", "").strip()
    if plot_id:
        try:
            plot_id_int = int(plot_id)
            query = query.filter(PlantingLog.plot_id == plot_id_int)
        except ValueError:
            pass

    logs = query.order_by(PlantingLog.log_date.desc(), PlantingLog.id.desc()).all()
    return jsonify([log.to_dict() for log in logs])


@app.route("/api/planting-logs", methods=["POST"])
def create_planting_log():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_planting_log_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    log = PlantingLog(**payload)
    db.session.add(log)
    db.session.commit()
    return jsonify(log.to_dict()), 201


@app.route("/api/fertilization-records", methods=["GET"])
def list_fertilization_records():
    query = FertilizationRecord.query.join(Plot)

    plot_id = request.args.get("plot_id", "").strip()
    if plot_id:
        try:
            plot_id_int = int(plot_id)
            query = query.filter(FertilizationRecord.plot_id == plot_id_int)
        except ValueError:
            pass

    plot_number = request.args.get("plot_number", "").strip()
    if plot_number:
        query = query.filter(Plot.plot_number == plot_number)

    records = query.order_by(FertilizationRecord.fertilization_date.desc(), FertilizationRecord.id.desc()).all()
    return jsonify([record.to_dict() for record in records])


@app.route("/api/fertilization-records", methods=["POST"])
def create_fertilization_record():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_fertilization_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    record = FertilizationRecord(**payload)
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@app.route("/api/pest-reports", methods=["GET"])
def list_pest_reports():
    query = PestReport.query.join(Plot)

    plot_id = request.args.get("plot_id", "").strip()
    if plot_id:
        try:
            plot_id_int = int(plot_id)
            query = query.filter(PestReport.plot_id == plot_id_int)
        except ValueError:
            pass

    severity = request.args.get("severity", "").strip()
    if severity:
        query = query.filter(PestReport.severity == severity)

    reports = query.order_by(PestReport.discovery_date.desc(), PestReport.id.desc()).all()
    return jsonify([report.to_dict() for report in reports])


@app.route("/api/pest-reports", methods=["POST"])
def create_pest_report():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_pest_report_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    report = PestReport(**payload)
    db.session.add(report)
    db.session.commit()
    return jsonify(report.to_dict()), 201


@app.route("/api/pest-reports/<int:report_id>/status", methods=["PATCH"])
def update_pest_report_status(report_id):
    report = db.session.get(PestReport, report_id)
    if not report:
        return jsonify({"error": "病虫害上报不存在"}), 404

    data = request.get_json(silent=True) or {}
    try:
        payload = validate_treatment_status_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    report.treatment_status = payload["treatment_status"]
    db.session.commit()
    return jsonify(report.to_dict())


@app.route("/api/statistics", methods=["GET"])
def get_statistics():
    total_plots = Plot.query.count()

    crop_types = db.session.query(Plot.crop).distinct().count()

    today = date.today()
    fourteen_days_later = today + timedelta(days=14)
    upcoming_harvests = Plot.query.filter(
        Plot.expected_harvest_date >= today,
        Plot.expected_harvest_date <= fourteen_days_later
    ).count()

    crop_groups = db.session.query(
        Plot.crop,
        db.func.count(Plot.id).label("count")
    ).group_by(Plot.crop).order_by(db.func.count(Plot.id).desc()).all()

    crop_distribution = [
        {"crop_name": crop, "count": count}
        for crop, count in crop_groups
    ]

    return jsonify({
        "total_plots": total_plots,
        "crop_types": crop_types,
        "upcoming_harvests": upcoming_harvests,
        "crop_distribution": crop_distribution,
    })


@app.route("/api/crops", methods=["GET"])
def list_crops():
    category = request.args.get("category", "").strip()
    query = Crop.query
    if category:
        query = query.filter(Crop.category == category)
    crops = query.order_by(Crop.code).all()
    return jsonify([crop.to_dict() for crop in crops])


@app.route("/api/crops", methods=["POST"])
def create_crop():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_crop_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if Crop.query.filter_by(code=payload["code"]).first():
        return jsonify({"error": "编号已存在"}), 409
    if Crop.query.filter_by(name=payload["name"]).first():
        return jsonify({"error": "名称已存在"}), 409

    crop = Crop(**payload)
    db.session.add(crop)
    db.session.commit()
    return jsonify(crop.to_dict()), 201


@app.route("/api/claimants", methods=["GET"])
def list_claimants():
    query = Claimant.query

    name = request.args.get("name", "").strip()
    if name:
        query = query.filter(Claimant.name.contains(name))

    claimants = query.order_by(Claimant.code).all()
    return jsonify([claimant.to_dict() for claimant in claimants])


@app.route("/api/claimants", methods=["POST"])
def create_claimant():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_claimant_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if Claimant.query.filter_by(code=payload["code"]).first():
        return jsonify({"error": "编号已存在"}), 409
    if Claimant.query.filter_by(name=payload["name"]).first():
        return jsonify({"error": "姓名已存在"}), 409

    claimant = Claimant(**payload)
    db.session.add(claimant)
    db.session.commit()
    return jsonify(claimant.to_dict()), 201


@app.route("/api/announcements", methods=["GET"])
def list_announcements():
    announcements = Announcement.query.order_by(
        Announcement.is_pinned.desc(),
        Announcement.publish_date.desc(),
        Announcement.id.desc()
    ).all()
    return jsonify([announcement.to_dict() for announcement in announcements])


@app.route("/api/announcements", methods=["POST"])
def create_announcement():
    data = request.get_json(silent=True) or {}
    try:
        payload = validate_announcement_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    announcement = Announcement(**payload)
    db.session.add(announcement)
    db.session.commit()
    return jsonify(announcement.to_dict()), 201


@app.route("/api/announcements/<int:announcement_id>", methods=["DELETE"])
def delete_announcement(announcement_id):
    announcement = db.session.get(Announcement, announcement_id)
    if not announcement:
        return jsonify({"error": "公告不存在"}), 404

    db.session.delete(announcement)
    db.session.commit()
    return jsonify({"message": "删除成功"})


with app.app_context():
    db.create_all()
    seed_database()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000, debug=True)
