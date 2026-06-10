import os
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from models import Plot, db
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


with app.app_context():
    db.create_all()
    seed_database()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000, debug=True)
