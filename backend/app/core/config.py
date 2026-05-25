from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
ROOT_ENV_FILE = BASE_DIR / ".env"
BACKEND_ENV_FILE = BASE_DIR / "backend" / ".env"


class Settings(BaseSettings):
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    supabase_db_url: str | None = None
    backend_host: str = "127.0.0.1"
    backend_port: int = 8000
    support_email_to: str = "kencas.cyber@gmail.com"
    support_email_subject: str = "FuelWatch Support"
    support_email_from: str | None = None
    support_smtp_host: str | None = None
    support_smtp_port: int = 587
    support_smtp_username: str | None = None
    support_smtp_password: str | None = None
    support_smtp_starttls: bool = True
    support_smtp_ssl: bool = False

    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_ENV_FILE), str(ROOT_ENV_FILE)),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
