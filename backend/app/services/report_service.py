from app.core.config import settings
from app.models.schemas import PriceReportIn, PriceReportOut
from app.constants import FUEL_TYPES
from typing import Dict, Any
import asyncio

# Simple in-memory store used when no Supabase keys are provided.
_IN_MEMORY_STORE: list[Dict[str, Any]] = []
_ID_COUNTER = 1


async def save_report(report: PriceReportIn) -> PriceReportOut:
    """Save a price report.

    If `SUPABASE_SERVICE_ROLE_KEY` is set, this function should call Supabase
    or an external DB. For this scaffold, we fall back to an in-memory store.
    """
    global _ID_COUNTER
    # Basic server-side validation (additional rules + anti-abuse go here)
    if report.fuel_type not in FUEL_TYPES:
        raise ValueError(f"Unsupported fuel_type: {report.fuel_type}")

    # TODO: replace this with Supabase persistence using the service role key.
    # The scaffold keeps an in-memory path so local tests can run without a DB.
    await asyncio.sleep(0)
    entry = report.model_dump()
    entry["id"] = _ID_COUNTER
    _ID_COUNTER += 1
    _IN_MEMORY_STORE.append(entry)
    return PriceReportOut(**entry)
