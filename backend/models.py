from datetime import date

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Plot(db.Model):
    __tablename__ = "plots"

    id = db.Column(db.Integer, primary_key=True)
    plot_number = db.Column(db.String(32), unique=True, nullable=False)
    claimer = db.Column(db.String(64), nullable=False)
    crop = db.Column(db.String(64), nullable=False)
    claim_date = db.Column(db.Date, nullable=False)
    expected_harvest_date = db.Column(db.Date, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "plot_number": self.plot_number,
            "claimer": self.claimer,
            "crop": self.crop,
            "claim_date": self.claim_date.isoformat(),
            "expected_harvest_date": self.expected_harvest_date.isoformat(),
        }
