from datetime import date

from models import Plot, db

SEED_DATA = [
    {
        "plot_number": "A-01",
        "claimer": "张三",
        "crop": "番茄",
        "claim_date": date(2026, 3, 1),
        "expected_harvest_date": date(2026, 6, 15),
    },
    {
        "plot_number": "A-02",
        "claimer": "李四",
        "crop": "黄瓜",
        "claim_date": date(2026, 3, 5),
        "expected_harvest_date": date(2026, 5, 20),
    },
    {
        "plot_number": "B-01",
        "claimer": "王五",
        "crop": "辣椒",
        "claim_date": date(2026, 3, 10),
        "expected_harvest_date": date(2026, 7, 1),
    },
    {
        "plot_number": "B-02",
        "claimer": "赵六",
        "crop": "茄子",
        "claim_date": date(2026, 3, 12),
        "expected_harvest_date": date(2026, 6, 30),
    },
    {
        "plot_number": "C-01",
        "claimer": "孙七",
        "crop": "生菜",
        "claim_date": date(2026, 3, 15),
        "expected_harvest_date": date(2026, 5, 10),
    },
]


def seed_database():
    if Plot.query.count() > 0:
        return

    for item in SEED_DATA:
        db.session.add(Plot(**item))
    db.session.commit()
