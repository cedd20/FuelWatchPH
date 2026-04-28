from app.core.config import settings
from app.models.schemas import PriceReportIn, PriceReportOut
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
    # TODO: implement server-side validation and persistence to Supabase
    if settings.supabase_service_role_key is None or settings.supabase_url is None:
        # Simulate async work
        await asyncio.sleep(0)
        entry = report.model_dump()
        entry["id"] = _ID_COUNTER
        _ID_COUNTER += 1
        _IN_MEMORY_STORE.append(entry)
        return PriceReportOut(**entry)

    # If keys are present, a real implementation would go here.
    raise NotImplementedError("Supabase persistence not implemented in scaffold")
