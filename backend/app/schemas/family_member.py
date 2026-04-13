from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from .common import ORMModel


class FamilyMemberBodyReport(BaseModel):
    measured_at: str | None = Field(default=None, max_length=40)
    source_device: str | None = Field(default=None, max_length=80)
    source_image_url: str | None = Field(default=None, max_length=500)
    advice: str | None = Field(default=None, max_length=300)
    body_type: str | None = Field(default=None, max_length=40)
    score: int | None = Field(default=None, ge=0, le=100)
    weight_jin: float | None = Field(default=None, ge=0, le=1000)
    weight_delta_jin: float | None = Field(default=None, ge=-200, le=200)
    bmi: float | None = Field(default=None, ge=0, le=100)
    bmi_delta: float | None = Field(default=None, ge=-20, le=20)
    bmi_status: str | None = Field(default=None, max_length=40)
    body_fat_pct: float | None = Field(default=None, ge=0, le=100)
    body_fat_delta: float | None = Field(default=None, ge=-50, le=50)
    body_fat_status: str | None = Field(default=None, max_length=40)
    water_mass_jin: float | None = Field(default=None, ge=0, le=1000)
    fat_mass_jin: float | None = Field(default=None, ge=0, le=1000)
    protein_mass_jin: float | None = Field(default=None, ge=0, le=1000)
    muscle_mass_jin: float | None = Field(default=None, ge=0, le=1000)
    muscle_mass_status: str | None = Field(default=None, max_length=40)
    muscle_rate_pct: float | None = Field(default=None, ge=0, le=100)
    muscle_rate_delta: float | None = Field(default=None, ge=-50, le=50)
    muscle_rate_status: str | None = Field(default=None, max_length=40)
    body_water_pct: float | None = Field(default=None, ge=0, le=100)
    body_water_delta: float | None = Field(default=None, ge=-50, le=50)
    body_water_status: str | None = Field(default=None, max_length=40)
    protein_pct: float | None = Field(default=None, ge=0, le=100)
    protein_delta: float | None = Field(default=None, ge=-50, le=50)
    protein_status: str | None = Field(default=None, max_length=40)
    bone_mass_jin: float | None = Field(default=None, ge=0, le=100)
    bone_mass_delta: float | None = Field(default=None, ge=-20, le=20)
    bone_mass_status: str | None = Field(default=None, max_length=40)
    salt_pct: float | None = Field(default=None, ge=0, le=100)
    salt_delta: float | None = Field(default=None, ge=-20, le=20)
    salt_status: str | None = Field(default=None, max_length=40)
    visceral_fat_level: int | None = Field(default=None, ge=0, le=100)
    visceral_fat_delta: float | None = Field(default=None, ge=-20, le=20)
    visceral_fat_status: str | None = Field(default=None, max_length=40)
    bmr_kcal: int | None = Field(default=None, ge=0, le=10000)
    bmr_delta: float | None = Field(default=None, ge=-5000, le=5000)
    bmr_status: str | None = Field(default=None, max_length=40)
    waist_hip_ratio: float | None = Field(default=None, ge=0, le=10)
    waist_hip_status: str | None = Field(default=None, max_length=40)
    metabolic_age_years: int | None = Field(default=None, ge=0, le=150)
    fat_free_mass_jin: float | None = Field(default=None, ge=0, le=1000)
    fat_free_mass_delta: float | None = Field(default=None, ge=-100, le=100)
    standard_weight_jin: float | None = Field(default=None, ge=0, le=1000)
    weight_control_jin: float | None = Field(default=None, ge=-500, le=500)
    fat_control_jin: float | None = Field(default=None, ge=-500, le=500)
    muscle_control: str | None = Field(default=None, max_length=80)

    @field_validator(
        "measured_at",
        "source_device",
        "source_image_url",
        "advice",
        "body_type",
        "bmi_status",
        "body_fat_status",
        "muscle_mass_status",
        "muscle_rate_status",
        "body_water_status",
        "protein_status",
        "bone_mass_status",
        "salt_status",
        "visceral_fat_status",
        "bmr_status",
        "waist_hip_status",
        "muscle_control",
    )
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class FamilyMemberBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=500)
    height_cm: int | None = Field(default=None, ge=30, le=260)
    signature: str | None = Field(default=None, max_length=200)
    body_report: FamilyMemberBodyReport | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("invalid name")
        return normalized

    @field_validator("avatar_url")
    @classmethod
    def normalize_avatar_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("signature")
    @classmethod
    def normalize_signature(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class FamilyMemberWrite(FamilyMemberBase):
    pass


class FamilyMemberRead(FamilyMemberBase, ORMModel):
    id: int
    created_at: datetime
    updated_at: datetime
