from pydantic import BaseModel
from typing import Optional


class PriceReportIn(BaseModel):
    station_id: int
    fuel_type: str
    price: float
    reported_by: Optional[str] = None
    timestamp: Optional[str] = None


class PriceReportOut(PriceReportIn):
    id: int
