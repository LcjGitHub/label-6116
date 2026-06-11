import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from models import HarvestRecord, Plot, db
from seed import seed_database

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(DATA_DIR, 'garden.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app)
db.init_app(app)


def parse_date(value, field_name):
    if not value:
        raise ValueError(f"{field_name} 不能为空")
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"{field_name} 格式应为 YYYY-MM-DD") from exc


def validate_plot_payload(data, partial=False):
    required_fields = ["plot_number", "claimer", "crop", "claim_date", "expected_harvest_date"]
    if not partial:
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            raise ValueError(f"缺少必填字段: {', '.join(missing)}")

    payload = {}
    if "plot_number" in data or not partial:
        payload["plot_number"] = (data.get("plot_number") or "").strip()
        if not payload["plot_number"]:
            raise ValueError("地块编号不能为空")

    if "claimer" in data or not partial:
        payload["claimer"] = (data.get("claimer") or "").strip()
        if not payload["claimer"]:
            raise ValueError("认领人不能为空")

    if "crop" in data or not partial:
        payload["crop"] = (data.get("crop") or "").strip()
        if not payload["crop"]:
            raise ValueError("作物不能为空")

    if "claim_date" in data or not partial:
        payload["claim_date"] = parse_date(data.get("claim_date"), "认领日期")

    if "expected_harvest_date" in data or not partial:
        payload["expected_harvest_date"] = parse_date(
            data.get("expected_harvest_date"), "预计收获日"
        )

    if (
        "claim_date" in payload
        and "expected_harvest_date" in payload
        and payload["expected_harvest_date"] < payload["claim_date"]
    ):
        raise ValueError("预计收获日不能早于认领日期")

    return payload


@app.route("/api/plots", methods=["GET"])
def list_plots():
    query = Plot.query

    claimer = request.args.get("claimer", "").strip()
    crop = request.args.get("crop", "").strip()

    if claimer:
        query = query.filter(Plot.claimer.contains(claimer))
    if crop:
        query = query.filter(Plot.crop.contains(crop))

    plots = query.order_by(Plot.plot_number).all()
    return jsonify([plot.to_dict() for plot in plots])


@app.route("/api/plots/<int:plot_id>", methods=["GET"])
def get_plot(plot_id):
    plot = db.session.get(Plot, plot_id)
    if not plot:
        return jsonify({"error": "地块不存在"}), 404
    return jsonify(plot.to_dict())


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


def validate_harvest_payload(data):
    required_fields = ["plot_id", "actual_harvest_date", "harvest_weight"]
    missing = [field for field in required_fields if data.get(field) is None]
    if missing:
        raise ValueError(f"缺少必填字段: {', '.join(missing)}")

    payload = {}

    try:
        payload["plot_id"] = int(data.get("plot_id"))
    except (ValueError, TypeError):
        raise ValueError("地块编号格式错误")

    plot = db.session.get(Plot, payload["plot_id"])
    if not plot:
        raise ValueError("关联地块不存在")

    payload["actual_harvest_date"] = parse_date(data.get("actual_harvest_date"), "实际收获日期")

    try:
        payload["harvest_weight"] = float(data.get("harvest_weight"))
        if payload["harvest_weight"] <= 0:
            raise ValueError
    except (ValueError, TypeError):
        raise ValueError("收获重量必须为大于0的数字")

    remark = data.get("remark")
    if remark is not None:
        payload["remark"] = str(remark).strip() or None

    return payload


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


with app.app_context():
    db.create_all()
    seed_database()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000, debug=True)
