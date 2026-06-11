from datetime import date

from models import Crop, HarvestRecord, Plot, db

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
