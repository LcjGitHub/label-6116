from datetime import datetime

from models import PEST_TYPES, PLOT_STATUSES, SEVERITY_LEVELS, TREATMENT_STATUSES, Plot, db


def parse_date(value, field_name):
    """解析日期字符串为 date 对象。

    Args:
        value: 日期字符串，格式应为 YYYY-MM-DD。
        field_name: 字段名称，用于错误提示。

    Returns:
        datetime.date: 解析后的日期对象。

    Raises:
        ValueError: 当值为空或格式不正确时抛出，附带详细错误信息。
    """
    if not value:
        raise ValueError(f"{field_name} 不能为空")
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError(f"{field_name} 格式应为 YYYY-MM-DD") from exc


def validate_plot_payload(data, partial=False):
    """校验地块创建或更新的载荷数据。

    Args:
        data: 包含地块信息的字典数据。
        partial: 是否为部分更新模式。True 时只校验 data 中存在的字段，
            False 时校验所有必填字段。

    Returns:
        dict: 经过清洗和校验的地块数据字典，可直接用于创建或更新 Plot 模型。

    Raises:
        ValueError: 当必填字段缺失、字段格式错误或业务规则不满足时抛出。
    """
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


def validate_batch_delete_payload(data):
    """校验批量删除请求的载荷数据。

    Args:
        data: 包含删除 ID 列表的字典数据，需包含 'ids' 字段。

    Returns:
        list[int]: 解析后的正整数 ID 列表。

    Raises:
        ValueError: 当 ids 缺失、非数组、为空或包含无效编号时抛出。
    """
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


def validate_harvest_payload(data):
    """校验收获记录创建的载荷数据。

    Args:
        data: 包含收获记录信息的字典数据。

    Returns:
        dict: 经过清洗和校验的收获记录数据字典，可直接用于创建 HarvestRecord 模型。

    Raises:
        ValueError: 当必填字段缺失、字段格式错误或关联地块不存在时抛出。
    """
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


def validate_planting_log_payload(data):
    """校验种植日志创建的载荷数据。

    Args:
        data: 包含种植日志信息的字典数据。

    Returns:
        dict: 经过清洗和校验的种植日志数据字典，可直接用于创建 PlantingLog 模型。

    Raises:
        ValueError: 当必填字段缺失、字段格式错误或关联地块不存在时抛出。
    """
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


def validate_crop_payload(data, partial=False):
    """校验作物创建或更新的载荷数据。

    Args:
        data: 包含作物信息的字典数据。
        partial: 是否为部分更新模式。True 时只校验 data 中存在的字段，
            False 时校验所有必填字段。

    Returns:
        dict: 经过清洗和校验的作物数据字典，可直接用于创建或更新 Crop 模型。

    Raises:
        ValueError: 当必填字段缺失或字段为空时抛出。
    """
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


def validate_fertilization_payload(data):
    required_fields = ["plot_id", "fertilization_date", "fertilizer_name", "amount_kg", "operator"]
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

    payload["fertilization_date"] = parse_date(data.get("fertilization_date"), "施肥日期")

    fertilizer_name = (data.get("fertilizer_name") or "").strip()
    if not fertilizer_name:
        raise ValueError("肥料名称不能为空")
    payload["fertilizer_name"] = fertilizer_name

    try:
        payload["amount_kg"] = float(data.get("amount_kg"))
        if payload["amount_kg"] <= 0:
            raise ValueError
    except (ValueError, TypeError):
        raise ValueError("用量必须为大于0的数字")

    operator = (data.get("operator") or "").strip()
    if not operator:
        raise ValueError("操作人不能为空")
    payload["operator"] = operator

    return payload


def validate_pest_report_payload(data):
    required_fields = ["plot_id", "discovery_date", "pest_type", "severity", "symptom_description"]
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

    payload["discovery_date"] = parse_date(data.get("discovery_date"), "发现日期")

    pest_type = (data.get("pest_type") or "").strip()
    if pest_type not in PEST_TYPES:
        raise ValueError(f"病虫害类型必须为以下值之一: {', '.join(PEST_TYPES)}")
    payload["pest_type"] = pest_type

    severity = (data.get("severity") or "").strip()
    if severity not in SEVERITY_LEVELS:
        raise ValueError(f"严重程度必须为以下值之一: {', '.join(SEVERITY_LEVELS)}")
    payload["severity"] = severity

    symptom_description = (data.get("symptom_description") or "").strip()
    if not symptom_description:
        raise ValueError("症状描述不能为空")
    payload["symptom_description"] = symptom_description

    treatment_status = (data.get("treatment_status") or "").strip()
    if treatment_status:
        if treatment_status not in TREATMENT_STATUSES:
            raise ValueError(f"处理状态必须为以下值之一: {', '.join(TREATMENT_STATUSES)}")
        payload["treatment_status"] = treatment_status

    return payload


def validate_treatment_status_payload(data):
    treatment_status = (data.get("treatment_status") or "").strip()
    if not treatment_status:
        raise ValueError("缺少必填字段: treatment_status")
    if treatment_status not in TREATMENT_STATUSES:
        raise ValueError(f"处理状态必须为以下值之一: {', '.join(TREATMENT_STATUSES)}")
    return {"treatment_status": treatment_status}


def validate_claimant_payload(data):
    required_fields = ["code", "name", "phone"]
    missing = [field for field in required_fields if not data.get(field, "").strip()]
    if missing:
        raise ValueError(f"缺少必填字段: {', '.join(missing)}")

    payload = {}
    payload["code"] = (data.get("code") or "").strip()
    if not payload["code"]:
        raise ValueError("编号不能为空")

    payload["name"] = (data.get("name") or "").strip()
    if not payload["name"]:
        raise ValueError("姓名不能为空")

    payload["phone"] = (data.get("phone") or "").strip()
    if not payload["phone"]:
        raise ValueError("联系电话不能为空")

    remark = data.get("remark")
    if remark is not None:
        payload["remark"] = str(remark).strip() or None
    else:
        payload["remark"] = None

    return payload


def validate_announcement_payload(data):
    required_fields = ["title", "content", "publish_date"]
    missing = [field for field in required_fields if data.get(field) is None or str(data.get(field)).strip() == ""]
    if missing:
        raise ValueError(f"缺少必填字段: {', '.join(missing)}")

    payload = {}

    title = (data.get("title") or "").strip()
    if not title:
        raise ValueError("标题不能为空")
    if len(title) > 128:
        raise ValueError("标题长度不能超过128个字符")
    payload["title"] = title

    content = (data.get("content") or "").strip()
    if not content:
        raise ValueError("正文内容不能为空")
    payload["content"] = content

    payload["publish_date"] = parse_date(data.get("publish_date"), "发布日期")

    is_pinned = data.get("is_pinned")
    if is_pinned is None:
        payload["is_pinned"] = False
    else:
        payload["is_pinned"] = bool(is_pinned)

    return payload
