from datetime import date

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

PLOT_STATUSES = ["种植中", "已收获", "空闲"]
PEST_TYPES = ["虫害", "病害", "杂草"]
SEVERITY_LEVELS = ["轻微", "中等", "严重"]
TREATMENT_STATUSES = ["待处理", "处理中", "已处理"]


class Plot(db.Model):
    __tablename__ = "plots"

    id = db.Column(db.Integer, primary_key=True)
    plot_number = db.Column(db.String(32), unique=True, nullable=False)
    claimer = db.Column(db.String(64), nullable=False)
    crop = db.Column(db.String(64), nullable=False)
    claim_date = db.Column(db.Date, nullable=False)
    expected_harvest_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(16), nullable=False, default="种植中")

    harvest_records = db.relationship("HarvestRecord", back_populates="plot", cascade="all, delete-orphan")
    planting_logs = db.relationship("PlantingLog", back_populates="plot", cascade="all, delete-orphan")
    fertilization_records = db.relationship("FertilizationRecord", back_populates="plot", cascade="all, delete-orphan")
    pest_reports = db.relationship("PestReport", back_populates="plot", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "plot_number": self.plot_number,
            "claimer": self.claimer,
            "crop": self.crop,
            "claim_date": self.claim_date.isoformat(),
            "expected_harvest_date": self.expected_harvest_date.isoformat(),
            "status": self.status,
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


class Crop(db.Model):
    __tablename__ = "crops"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(32), unique=True, nullable=False)
    name = db.Column(db.String(64), unique=True, nullable=False)
    category = db.Column(db.String(32), nullable=False)
    suitable_season = db.Column(db.String(64), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "category": self.category,
            "suitable_season": self.suitable_season,
        }


class PlantingLog(db.Model):
    __tablename__ = "planting_logs"

    id = db.Column(db.Integer, primary_key=True)
    plot_id = db.Column(db.Integer, db.ForeignKey("plots.id"), nullable=False)
    log_date = db.Column(db.Date, nullable=False)
    content = db.Column(db.Text, nullable=False)
    recorder = db.Column(db.String(64), nullable=False)

    plot = db.relationship("Plot", back_populates="planting_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "plot_id": self.plot_id,
            "plot_number": self.plot.plot_number if self.plot else None,
            "log_date": self.log_date.isoformat(),
            "content": self.content,
            "recorder": self.recorder,
        }


class FertilizationRecord(db.Model):
    __tablename__ = "fertilization_records"

    id = db.Column(db.Integer, primary_key=True)
    plot_id = db.Column(db.Integer, db.ForeignKey("plots.id"), nullable=False)
    fertilization_date = db.Column(db.Date, nullable=False)
    fertilizer_name = db.Column(db.String(64), nullable=False)
    amount_kg = db.Column(db.Float, nullable=False)
    operator = db.Column(db.String(64), nullable=False)

    plot = db.relationship("Plot", back_populates="fertilization_records")

    def to_dict(self):
        return {
            "id": self.id,
            "plot_id": self.plot_id,
            "plot_number": self.plot.plot_number if self.plot else None,
            "fertilization_date": self.fertilization_date.isoformat(),
            "fertilizer_name": self.fertilizer_name,
            "amount_kg": self.amount_kg,
            "operator": self.operator,
        }


class PestReport(db.Model):
    __tablename__ = "pest_reports"

    id = db.Column(db.Integer, primary_key=True)
    plot_id = db.Column(db.Integer, db.ForeignKey("plots.id"), nullable=False)
    discovery_date = db.Column(db.Date, nullable=False)
    pest_type = db.Column(db.String(16), nullable=False)
    severity = db.Column(db.String(16), nullable=False)
    symptom_description = db.Column(db.Text, nullable=False)
    treatment_status = db.Column(db.String(16), nullable=False, default="待处理")

    plot = db.relationship("Plot", back_populates="pest_reports")

    def to_dict(self):
        return {
            "id": self.id,
            "plot_id": self.plot_id,
            "plot_number": self.plot.plot_number if self.plot else None,
            "discovery_date": self.discovery_date.isoformat(),
            "pest_type": self.pest_type,
            "severity": self.severity,
            "symptom_description": self.symptom_description,
            "treatment_status": self.treatment_status,
        }
