from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PriceReportIn(BaseModel):
    station_id: str
    fuel_type: str
    price: float
    reported_by: Optional[str] = None
    timestamp: Optional[str] = None


class PriceReportOut(PriceReportIn):
    id: str


class StationBase(BaseModel):
    name: str
    brand: str
    address: str
    city: str
    province: str
    lat: float
    lng: float
    amenities: Optional[list[str]] = None


class StationCreate(StationBase):
    pass


class StationUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    amenities: Optional[list[str]] = None


class StationOut(StationBase):
    id: str
    is_active: bool = True
    created_by: Optional[str] = None
    latest_prices: dict[str, dict[str, object]] = Field(default_factory=dict)
    contributors: Optional[int] = None
    accuracy: Optional[int] = None
    distance_km: Optional[float] = None


class PriceBase(BaseModel):
    station_id: str
    fuel_type: str
    price: float
    observed_at: datetime
    notes: Optional[str] = None


class PriceCreate(PriceBase):
    pass


class PriceUpdate(BaseModel):
    fuel_type: Optional[str] = None
    price: Optional[float] = None
    observed_at: Optional[datetime] = None
    notes: Optional[str] = None


class PriceOut(PriceBase):
    id: str
    reported_by: Optional[str] = None
    is_active: bool = True
    confirmation_count: int = 0


class UserProfileBase(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileOut(UserProfileBase):
    id: str
    reputation: int = 0
    role: str = "user"
    created_at: Optional[datetime] = None
    points: Optional[int] = None
    contributionCount: Optional[int] = None
    verified_count: Optional[int] = None
    accuracy: Optional[int] = None


