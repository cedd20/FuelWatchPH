from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.rate_limit import limiter

app = FastAPI(title="FuelWatchPH Backend")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
