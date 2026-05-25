import smtplib
from email.message import EmailMessage
from typing import Iterable

from app.core.config import settings


def send_support_email(message: str, sender_email: str | None = None) -> None:
    if not settings.support_smtp_host:
        raise RuntimeError("Support SMTP is not configured")

    if not settings.support_smtp_username or not settings.support_smtp_password:
        raise RuntimeError("Support SMTP credentials are missing")

    from_address = settings.support_email_from or settings.support_smtp_username

    email_message = EmailMessage()
    email_message["Subject"] = settings.support_email_subject
    email_message["From"] = from_address
    email_message["To"] = settings.support_email_to
    if sender_email:
        email_message["Reply-To"] = sender_email

    body_lines = ["FuelWatch support message", ""]
    if sender_email:
        body_lines.extend([f"Reply-To: {sender_email}", ""])
    body_lines.append(message)
    email_message.set_content("\n".join(body_lines))

    smtp_client = smtplib.SMTP_SSL if settings.support_smtp_ssl else smtplib.SMTP
    with smtp_client(settings.support_smtp_host, settings.support_smtp_port, timeout=20) as server:
        if not settings.support_smtp_ssl and settings.support_smtp_starttls:
            server.starttls()
        server.login(settings.support_smtp_username, settings.support_smtp_password)
        server.send_message(email_message)


def send_support_email_with_attachments(
    *,
    subject: str,
    body: str,
    reply_to: str | None = None,
    attachments: Iterable[tuple[str, bytes, str]] = (),
) -> None:
    if not settings.support_smtp_host:
        raise RuntimeError("Support SMTP is not configured")

    if not settings.support_smtp_username or not settings.support_smtp_password:
        raise RuntimeError("Support SMTP credentials are missing")

    from_address = settings.support_email_from or settings.support_smtp_username

    email_message = EmailMessage()
    email_message["Subject"] = subject
    email_message["From"] = from_address
    email_message["To"] = settings.support_email_to
    if reply_to:
        email_message["Reply-To"] = reply_to

    email_message.set_content(body)

    for filename, content, content_type in attachments:
        maintype, subtype = (content_type.split("/", 1) + ["octet-stream"])[:2]
        email_message.add_attachment(
            content,
            maintype=maintype,
            subtype=subtype,
            filename=filename,
        )

    smtp_client = smtplib.SMTP_SSL if settings.support_smtp_ssl else smtplib.SMTP
    with smtp_client(settings.support_smtp_host, settings.support_smtp_port, timeout=20) as server:
        if not settings.support_smtp_ssl and settings.support_smtp_starttls:
            server.starttls()
        server.login(settings.support_smtp_username, settings.support_smtp_password)
        server.send_message(email_message)
