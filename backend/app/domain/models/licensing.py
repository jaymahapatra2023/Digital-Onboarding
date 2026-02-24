"""Pydantic request/response schemas for licensing verification endpoints."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class VerifyStatusRequest(BaseModel):
    ssn: str = Field(..., pattern=r"^\d{3}-?\d{2}-?\d{4}$")
    producer_name: str
    producer_id: str


class RemediationInfo(BaseModel):
    title: str
    steps: list[str]
    contact: str


class VerifyStatusResponse(BaseModel):
    status: Literal["active", "not_found", "not_active", "expired"]
    details: dict | None = None
    remediation: RemediationInfo | None = None


class VerifyCodeRequest(BaseModel):
    ssn: str = Field(..., pattern=r"^\d{3}-?\d{2}-?\d{4}$")
    producer_name: str
    producer_id: str


class VerifyCodeResponse(BaseModel):
    found: bool
    compensable_code: str | None = None
    details: dict | None = None
