import os
from datetime import datetime, timedelta, date

from flask import Flask, jsonify, request
from flask_cors import CORS

from models import PLOT_STATUSES, Crop, HarvestRecord, PlantingLog, Plot, db
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

    if "status" in data:
        status = (data.get("status") or "").strip()
        if status:
            if status not in PLOT_STATUSES:
                raise ValueError(f"状态必须为以下值之一: {', '.join(PLOT_STATUSES)}")
            payload["status"] = status

    return payload


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


def validate_batch_delete_payload(data):
    ids = data.get("ids")
    if not ids or not isinstance(ids, list):
        raise ValueError("缺少必填字段: ids（数组）")

    if len(ids) == 0:
        raise ValueError("删除列表不能为空")

    parsed_ids = []
    for idx in ids:
        try:
            parsed_id = int(idx)
            if parsed_id <= 0:
                raise ValueError
            parsed_ids.append(parsed_id)
        except (ValueError, TypeError):
            raise ValueError(f"无效的编号: {idx}")

    return parsed_ids


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


def validate_planting_log_payload(data):
    required_fields = ["plot_id", "log_date", "content", "recorder"]
    missing = [field for field in required_fields if data.get(field) is None or str(data.get(field)).strip() == ""]
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

    payload["log_date"] = parse_date(data.get("log_date"), "记录日期")

    content = (data.get("content") or "").strip()
    if not content:
        raise ValueError("日志内容不能为空")
    payload["content"] = content

    recorder = (data.get("recorder") or "").strip()
    if not recorder:
        raise ValueError("记录人不能为空")
    payload["recorder"] = recorder

    return payload


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


def validate_crop_payload(data, partial=False):
    required_fields = ["code", "name", "category", "suitable_season"]
    if not partial:
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            raise ValueError(f"缺少必填字段: {', '.join(missing)}")

    payload = {}
    if "code" in data or not partial:
        payload["code"] = (data.get("code") or "").strip()
        if not payload["code"]:
            raise ValueError("编号不能为空")

    if "name" in data or not partial:
        payload["name"] = (data.get("name") or "").strip()
        if not payload["name"]:
            raise ValueError("名称不能为空")

    if "category" in data or not partial:
        payload["category"] = (data.get("category") or "").strip()
        if not payload["category"]:
            raise ValueError("分类不能为空")

    if "suitable_season" in data or not partial:
        payload["suitable_season"] = (data.get("suitable_season") or "").strip()
        if not payload["suitable_season"]:
            raise ValueError("适宜季节不能为空")

    return payload


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


with app.app_context():
    db.create_all()
    seed_database()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7000, debug=True)
