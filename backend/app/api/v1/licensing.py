"""Licensing verification endpoints with deterministic hash-based mocks.

SSNs are processed in-memory only and never persisted.  The response
never echoes back the SSN.
"""

from __future__ import annotations

import hashlib
from datetime import date, timedelta

from fastapi import APIRouter

from app.domain.models.licensing import (
    RemediationInfo,
    VerifyCodeRequest,
    VerifyCodeResponse,
    VerifyStatusRequest,
    VerifyStatusResponse,
)

router = APIRouter(prefix="/licensing", tags=["licensing"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_STATES = [
    "California", "Texas", "New York", "Florida", "Illinois",
    "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan",
]

_REMEDIATION: dict[str, RemediationInfo] = {
    "not_found": RemediationInfo(
        title="Producer Not Found in Licensing Database",
        steps=[
            "Verify the Social Security Number was entered correctly.",
            "Confirm the producer is licensed in the correct state.",
            "If this is a newly issued license, allow 24-48 hours for database updates.",
            "Contact your state Department of Insurance for verification.",
        ],
        contact="Licensing Support: licensing-support@example.com | (800) 555-0101",
    ),
    "not_active": RemediationInfo(
        title="License Currently Not Active",
        steps=[
            "Check for any pending suspensions or disciplinary actions.",
            "Verify all continuing education (CE) credits are up to date.",
            "Submit a reinstatement application to the state Department of Insurance.",
            "Allow 5-10 business days for reinstatement processing.",
        ],
        contact="Licensing Compliance: compliance@example.com | (800) 555-0102",
    ),
    "expired": RemediationInfo(
        title="License Has Expired — Renewal Required",
        steps=[
            "Complete all required continuing education (CE) credits for renewal.",
            "Submit a license renewal application to the state Department of Insurance.",
            "Pay any applicable renewal fees and late penalties.",
            "Allow 3-5 business days for renewal processing after submission.",
        ],
        contact="License Renewal Desk: renewals@example.com | (800) 555-0103",
    ),
}


def _ssn_hash(ssn: str) -> int:
    """Return a stable integer derived from the SSN."""
    normalized = ssn.replace("-", "")
    return int(hashlib.sha256(normalized.encode()).hexdigest(), 16)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/verify-status", response_model=VerifyStatusResponse)
async def verify_licensing_status(body: VerifyStatusRequest) -> VerifyStatusResponse:
    """Verify a producer's licensing and appointment status.

    Uses a deterministic hash of the SSN so the same input always returns
    the same result.  Distribution: ~65% active, ~15% not_found,
    ~12% not_active, ~8% expired.
    """
    h = _ssn_hash(body.ssn)
    bucket = h % 100

    if bucket < 65:
        state = _STATES[h % len(_STATES)]
        license_number = f"LIC-{h % 10_000_000:07d}"
        expiration = (date.today() + timedelta(days=365 + (h % 730))).isoformat()
        return VerifyStatusResponse(
            status="active",
            details={
                "state": state,
                "license_number": license_number,
                "expiration": expiration,
            },
        )

    if bucket < 80:
        return VerifyStatusResponse(
            status="not_found",
            remediation=_REMEDIATION["not_found"],
        )

    if bucket < 92:
        return VerifyStatusResponse(
            status="not_active",
            remediation=_REMEDIATION["not_active"],
        )

    return VerifyStatusResponse(
        status="expired",
        remediation=_REMEDIATION["expired"],
    )


@router.post("/verify-code", response_model=VerifyCodeResponse)
async def verify_compensable_code(body: VerifyCodeRequest) -> VerifyCodeResponse:
    """Look up a producer's compensable code.

    Uses a deterministic hash of the SSN.  ~90% found, ~10% not found.
    """
    h = _ssn_hash(body.ssn)
    bucket = h % 100

    if bucket < 90:
        code = f"BC-{h % 1_000_000:06d}"
        state = _STATES[h % len(_STATES)]
        return VerifyCodeResponse(
            found=True,
            compensable_code=code,
            details={
                "name": body.producer_name,
                "broker_code": code,
                "company": "National Benefits Group LLC",
                "address": f"1234 Insurance Blvd, Suite {100 + h % 900}, Sacramento, {state} 95814",
            },
        )

    return VerifyCodeResponse(found=False)
