from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services import report_service

router = APIRouter()


class PriceReport(BaseModel):
    station_id: int
    fuel_type: str
    price: float
    reported_by: Optional[str] = None
    timestamp: Optional[str] = None


@router.post("/reports")
async def create_report(report: PriceReport):
    """Create a price report. This endpoint is the single write path for the frontend.

    The service will validate and persist (or queue) the report. In production,
    this should call Supabase or another DB via a server-side service key.
    """
    try:
        saved = await report_service.save_report(report)
        return {"status": "ok", "saved": saved}
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
