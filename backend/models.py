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

    harvest_records = db.relationship("HarvestRecord", back_populates="plot", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "plot_number": self.plot_number,
            "claimer": self.claimer,
            "crop": self.crop,
            "claim_date": self.claim_date.isoformat(),
            "expected_harvest_date": self.expected_harvest_date.isoformat(),
        }


class HarvestRecord(db.Model):
    __tablename__ = "harvest_records"

    id = db.Column(db.Integer, primary_key=True)
    plot_id = db.Column(db.Integer, db.ForeignKey("plots.id"), nullable=False)
    actual_harvest_date = db.Column(db.Date, nullable=False)
    harvest_weight = db.Column(db.Float, nullable=False)
    remark = db.Column(db.Text, nullable=True)

    plot = db.relationship("Plot", back_populates="harvest_records")

    def to_dict(self):
        return {
            "id": self.id,
            "plot_id": self.plot_id,
            "plot_number": self.plot.plot_number if self.plot else None,
            "actual_harvest_date": self.actual_harvest_date.isoformat(),
            "harvest_weight": self.harvest_weight,
            "remark": self.remark,
        }
