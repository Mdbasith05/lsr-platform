from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models import ProfileModel, utc_now
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.schemas import ProfileResponse, ProfileUpdate

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Returns the advocate profile bound to the authenticated Supabase user.
    If the user has not completed chamber setup yet, auto-provisions a clean profile
    record seeded from verified Supabase Auth JWT claims without mock data.
    """
    profile = db.query(ProfileModel).filter(ProfileModel.id == user.user_id).first()
    if not profile:
        meta = user.user_metadata if isinstance(user.user_metadata, dict) else {}
        name = meta.get("full_name") or meta.get("name") or (user.name if user.name != "Empaneled Advocate" else (user.email.split("@")[0].replace(".", " ").title() if user.email else ""))
        bar_number = meta.get("bar_enrollment_number", "")
        chamber = meta.get("chamber_name", "")
        phone = meta.get("phone", "")
        address = meta.get("address") or meta.get("chamber_address", "")

        now = utc_now()
        profile = ProfileModel(
            id=user.user_id,
            full_name=name or (user.email.split("@")[0].title() if user.email else ""),
            email=user.email,
            bar_enrollment_number=bar_number,
            chamber_name=chamber,
            chamber_address=address,
            phone=phone,
            role=user.role or "Senior Empaneled Advocate",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return ProfileResponse(
        id=profile.id,
        fullName=profile.full_name,
        email=profile.email or user.email,
        barEnrollmentNumber=profile.bar_enrollment_number or "",
        chamberName=profile.chamber_name or "",
        chamberAddress=profile.chamber_address or "",
        phone=profile.phone or "",
        role=profile.role or "Senior Empaneled Advocate",
        createdAt=profile.created_at.isoformat() if profile.created_at else None,
        updatedAt=profile.updated_at.isoformat() if profile.updated_at else None,
    )


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Creates or updates the advocate profile linked strictly to the authenticated user ID.
    Guarantees tenant isolation: user can NEVER modify or impersonate another advocate.
    """
    profile = db.query(ProfileModel).filter(ProfileModel.id == user.user_id).first()
    now = utc_now()

    if not profile:
        # Create profile record for the authenticated user
        full_name = payload.fullName or user.name or (user.email.split("@")[0].title() if user.email else "")
        profile = ProfileModel(
            id=user.user_id,
            full_name=full_name,
            email=user.email,
            bar_enrollment_number=payload.barEnrollmentNumber or "",
            chamber_name=payload.chamberName or "",
            chamber_address=payload.chamberAddress or "",
            phone=payload.phone or "",
            role=user.role or "Senior Empaneled Advocate",
            created_at=now,
            updated_at=now,
        )
        db.add(profile)
    else:
        if payload.fullName is not None:
            profile.full_name = payload.fullName
        if payload.barEnrollmentNumber is not None:
            profile.bar_enrollment_number = payload.barEnrollmentNumber
        if payload.chamberName is not None:
            profile.chamber_name = payload.chamberName
        if payload.chamberAddress is not None:
            profile.chamber_address = payload.chamberAddress
        if payload.phone is not None:
            profile.phone = payload.phone
        # Email is always anchored to verified Supabase Auth identity
        profile.email = user.email or profile.email
        profile.updated_at = now

    db.commit()
    db.refresh(profile)

    return ProfileResponse(
        id=profile.id,
        fullName=profile.full_name,
        email=profile.email,
        barEnrollmentNumber=profile.bar_enrollment_number,
        chamberName=profile.chamber_name,
        chamberAddress=profile.chamber_address,
        phone=profile.phone,
        role=profile.role,
        createdAt=profile.created_at.isoformat() if profile.created_at else None,
        updatedAt=profile.updated_at.isoformat() if profile.updated_at else None,
    )
