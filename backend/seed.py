from datetime import date

from models import Announcement, Claimant, Crop, FertilizationRecord, HarvestRecord, PestReport, PlantingLog, Plot, db

SEED_DATA = [
    {
        "plot_number": "A-01",
        "claimer": "张三",
        "crop": "番茄",
        "claim_date": date(2026, 3, 1),
        "expected_harvest_date": date(2026, 6, 15),
        "status": "已收获",
    },
    {
        "plot_number": "A-02",
        "claimer": "李四",
        "crop": "黄瓜",
        "claim_date": date(2026, 3, 5),
        "expected_harvest_date": date(2026, 5, 20),
        "status": "已收获",
    },
    {
        "plot_number": "B-01",
        "claimer": "王五",
        "crop": "辣椒",
        "claim_date": date(2026, 3, 10),
        "expected_harvest_date": date(2026, 7, 1),
        "status": "种植中",
    },
    {
        "plot_number": "B-02",
        "claimer": "赵六",
        "crop": "茄子",
        "claim_date": date(2026, 3, 12),
        "expected_harvest_date": date(2026, 6, 30),
        "status": "种植中",
    },
    {
        "plot_number": "C-01",
        "claimer": "孙七",
        "crop": "生菜",
        "claim_date": date(2026, 3, 15),
        "expected_harvest_date": date(2026, 5, 10),
        "status": "已收获",
    },
    {
        "plot_number": "C-02",
        "claimer": "周八",
        "crop": "白菜",
        "claim_date": date(2026, 2, 1),
        "expected_harvest_date": date(2026, 4, 1),
        "status": "空闲",
    },
]

SEED_HARVEST_RECORDS = [
    {
        "plot_number": "A-01",
        "actual_harvest_date": date(2026, 6, 10),
        "harvest_weight": 12.5,
        "remark": "第一批番茄成熟，品质优良",
    },
    {
        "plot_number": "A-02",
        "actual_harvest_date": date(2026, 5, 18),
        "harvest_weight": 8.3,
        "remark": "黄瓜提前成熟",
    },
    {
        "plot_number": "C-01",
        "actual_harvest_date": date(2026, 5, 8),
        "harvest_weight": 5.0,
        "remark": None,
    },
]

SEED_CROPS = [
    {"code": "C001", "name": "番茄", "category": "果菜", "suitable_season": "春、夏、秋"},
    {"code": "C002", "name": "黄瓜", "category": "果菜", "suitable_season": "春、夏"},
    {"code": "C003", "name": "辣椒", "category": "果菜", "suitable_season": "春、夏、秋"},
    {"code": "C004", "name": "茄子", "category": "果菜", "suitable_season": "春、夏"},
    {"code": "C005", "name": "生菜", "category": "叶菜", "suitable_season": "春、秋、冬"},
    {"code": "C006", "name": "白菜", "category": "叶菜", "suitable_season": "秋、冬"},
    {"code": "C007", "name": "萝卜", "category": "根茎", "suitable_season": "秋、冬"},
    {"code": "C008", "name": "胡萝卜", "category": "根茎", "suitable_season": "春、秋"},
]

SEED_PLANTING_LOGS = [
    {
        "plot_number": "A-01",
        "log_date": date(2026, 3, 5),
        "content": "番茄幼苗定植完成，浇水充足，覆盖地膜保温。",
        "recorder": "张三",
    },
    {
        "plot_number": "A-01",
        "log_date": date(2026, 4, 12),
        "content": "番茄开花期，进行第一次授粉，追施复合肥。",
        "recorder": "张三",
    },
    {
        "plot_number": "A-02",
        "log_date": date(2026, 3, 10),
        "content": "黄瓜种子直播，覆土2厘米，浇透水。",
        "recorder": "李四",
    },
    {
        "plot_number": "A-02",
        "log_date": date(2026, 4, 5),
        "content": "黄瓜搭架引蔓，摘除侧芽，促进主蔓生长。",
        "recorder": "李四",
    },
    {
        "plot_number": "B-01",
        "log_date": date(2026, 3, 15),
        "content": "辣椒定植，株距30厘米，浇定根水。",
        "recorder": "王五",
    },
    {
        "plot_number": "B-01",
        "log_date": date(2026, 5, 20),
        "content": "辣椒开始挂果，喷施叶面肥，注意防治蚜虫。",
        "recorder": "王五",
    },
    {
        "plot_number": "B-02",
        "log_date": date(2026, 3, 18),
        "content": "茄子幼苗移栽，覆盖遮阳网缓苗。",
        "recorder": "赵六",
    },
    {
        "plot_number": "B-02",
        "log_date": date(2026, 5, 25),
        "content": "茄子进入结果期，追施磷钾肥，摘除老叶。",
        "recorder": "赵六",
    },
    {
        "plot_number": "C-01",
        "log_date": date(2026, 3, 20),
        "content": "生菜撒播育苗，保持苗床湿润。",
        "recorder": "孙七",
    },
    {
        "plot_number": "C-01",
        "log_date": date(2026, 4, 15),
        "content": "生菜间苗定株，追施稀薄氮肥。",
        "recorder": "孙七",
    },
    {
        "plot_number": "C-02",
        "log_date": date(2026, 2, 5),
        "content": "白菜播种完成，覆盖稻草保湿。",
        "recorder": "周八",
    },
    {
        "plot_number": "C-02",
        "log_date": date(2026, 3, 20),
        "content": "白菜已收获完毕，清理地块，准备休耕。",
        "recorder": "周八",
    },
]

SEED_PEST_REPORTS = [
    {
        "plot_number": "A-01",
        "discovery_date": date(2026, 4, 15),
        "pest_type": "虫害",
        "severity": "轻微",
        "symptom_description": "发现少量蚜虫在番茄叶片背面，尚未造成明显危害。",
        "treatment_status": "已处理",
    },
    {
        "plot_number": "B-01",
        "discovery_date": date(2026, 5, 20),
        "pest_type": "病害",
        "severity": "中等",
        "symptom_description": "辣椒叶片出现黄褐色斑点，部分叶片开始萎蔫，疑似炭疽病。",
        "treatment_status": "处理中",
    },
    {
        "plot_number": "B-02",
        "discovery_date": date(2026, 5, 28),
        "pest_type": "杂草",
        "severity": "严重",
        "symptom_description": "茄子地块杂草丛生，主要有狗尾草和牛筋草，与作物争夺养分严重。",
        "treatment_status": "待处理",
    },
    {
        "plot_number": "A-02",
        "discovery_date": date(2026, 4, 25),
        "pest_type": "虫害",
        "severity": "中等",
        "symptom_description": "黄瓜叶片发现潜叶蝇痕迹，叶片出现不规则白色弯曲隧道。",
        "treatment_status": "已处理",
    },
]

SEED_FERTILIZATION_RECORDS = [
    {
        "plot_number": "A-01",
        "fertilization_date": date(2026, 3, 15),
        "fertilizer_name": "复合肥",
        "amount_kg": 2.5,
        "operator": "张三",
    },
    {
        "plot_number": "A-01",
        "fertilization_date": date(2026, 4, 20),
        "fertilizer_name": "尿素",
        "amount_kg": 1.2,
        "operator": "张三",
    },
    {
        "plot_number": "A-02",
        "fertilization_date": date(2026, 3, 20),
        "fertilizer_name": "复合肥",
        "amount_kg": 2.0,
        "operator": "李四",
    },
    {
        "plot_number": "A-02",
        "fertilization_date": date(2026, 4, 15),
        "fertilizer_name": "磷酸二氢钾",
        "amount_kg": 0.8,
        "operator": "李四",
    },
    {
        "plot_number": "B-01",
        "fertilization_date": date(2026, 3, 25),
        "fertilizer_name": "有机肥",
        "amount_kg": 5.0,
        "operator": "王五",
    },
    {
        "plot_number": "B-01",
        "fertilization_date": date(2026, 5, 10),
        "fertilizer_name": "复合肥",
        "amount_kg": 1.5,
        "operator": "王五",
    },
    {
        "plot_number": "B-02",
        "fertilization_date": date(2026, 3, 28),
        "fertilizer_name": "复合肥",
        "amount_kg": 2.2,
        "operator": "赵六",
    },
    {
        "plot_number": "B-02",
        "fertilization_date": date(2026, 5, 15),
        "fertilizer_name": "磷钾肥",
        "amount_kg": 1.0,
        "operator": "赵六",
    },
    {
        "plot_number": "C-01",
        "fertilization_date": date(2026, 3, 25),
        "fertilizer_name": "氮肥",
        "amount_kg": 1.0,
        "operator": "孙七",
    },
    {
        "plot_number": "C-02",
        "fertilization_date": date(2026, 2, 15),
        "fertilizer_name": "复合肥",
        "amount_kg": 1.8,
        "operator": "周八",
    },
]

SEED_ANNOUNCEMENTS = [
    {
        "title": "关于社区菜园夏季维护的重要通知",
        "content": "各位邻居大家好，夏季高温天气即将到来，请大家注意以下事项：1. 早晚浇水，避免中午高温时段；2. 及时搭建遮阳网，防止作物灼伤；3. 注意病虫害防治，定期巡查。如有疑问请联系社区管理员。",
        "publish_date": date(2026, 6, 1),
        "is_pinned": True,
    },
    {
        "title": "新增有机肥料领取通知",
        "content": "社区新采购一批有机肥料，有需要的邻居可于本周六上午9点到社区服务中心领取，每户限领5公斤。数量有限，先到先得。",
        "publish_date": date(2026, 6, 5),
        "is_pinned": False,
    },
    {
        "title": "菜园种植经验分享会",
        "content": "为了提高大家的种植技术，社区将于下周日下午2点在多功能厅举办种植经验分享会，邀请资深种植达人分享番茄、黄瓜的种植技巧。欢迎大家踊跃参加。",
        "publish_date": date(2026, 6, 8),
        "is_pinned": False,
    },
]

SEED_CLAIMANTS = [
    {"code": "R001", "name": "张三", "phone": "13800001001", "remark": None},
    {"code": "R002", "name": "李四", "phone": "13800001002", "remark": None},
    {"code": "R003", "name": "王五", "phone": "13800001003", "remark": None},
    {"code": "R004", "name": "赵六", "phone": "13800001004", "remark": None},
    {"code": "R005", "name": "孙七", "phone": "13800001005", "remark": None},
    {"code": "R006", "name": "周八", "phone": "13800001006", "remark": None},
]


def seed_database():
    plots_seeded = False
    if Plot.query.count() == 0:
        for item in SEED_DATA:
            db.session.add(Plot(**item))
        db.session.commit()
        plots_seeded = True

    if HarvestRecord.query.count() == 0:
        for item in SEED_HARVEST_RECORDS:
            plot_number = item["plot_number"]
            plot = Plot.query.filter_by(plot_number=plot_number).first()
            if plot:
                record_data = {k: v for k, v in item.items() if k != "plot_number"}
                record_data["plot_id"] = plot.id
                db.session.add(HarvestRecord(**record_data))
        db.session.commit()

    if Crop.query.count() == 0:
        for item in SEED_CROPS:
            db.session.add(Crop(**item))
        db.session.commit()

    if PlantingLog.query.count() == 0:
        for item in SEED_PLANTING_LOGS:
            plot_number = item["plot_number"]
            plot = Plot.query.filter_by(plot_number=plot_number).first()
            if plot:
                log_data = {k: v for k, v in item.items() if k != "plot_number"}
                log_data["plot_id"] = plot.id
                db.session.add(PlantingLog(**log_data))
        db.session.commit()

    if FertilizationRecord.query.count() == 0:
        for item in SEED_FERTILIZATION_RECORDS:
            plot_number = item["plot_number"]
            plot = Plot.query.filter_by(plot_number=plot_number).first()
            if plot:
                record_data = {k: v for k, v in item.items() if k != "plot_number"}
                record_data["plot_id"] = plot.id
                db.session.add(FertilizationRecord(**record_data))
        db.session.commit()

    if PestReport.query.count() == 0:
        for item in SEED_PEST_REPORTS:
            plot_number = item["plot_number"]
            plot = Plot.query.filter_by(plot_number=plot_number).first()
            if plot:
                report_data = {k: v for k, v in item.items() if k != "plot_number"}
                report_data["plot_id"] = plot.id
                db.session.add(PestReport(**report_data))
        db.session.commit()

    if Announcement.query.count() == 0:
        for item in SEED_ANNOUNCEMENTS:
            db.session.add(Announcement(**item))
        db.session.commit()

    if Claimant.query.count() == 0:
        for item in SEED_CLAIMANTS:
            db.session.add(Claimant(**item))
        db.session.commit()
