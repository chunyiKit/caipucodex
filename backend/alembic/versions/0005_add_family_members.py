"""add family members

Revision ID: 0005_add_family_members
Revises: 0004_add_recipe_kcal
Create Date: 2026-03-16 10:55:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0005_add_family_members"
down_revision = "0004_add_recipe_kcal"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "family_members",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_family_members_name"), "family_members", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_family_members_name"), table_name="family_members")
    op.drop_table("family_members")
