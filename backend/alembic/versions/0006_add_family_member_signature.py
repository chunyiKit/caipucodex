"""add family member signature

Revision ID: 0006_add_family_member_signature
Revises: 0005_add_family_members
Create Date: 2026-03-16 13:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_add_family_member_signature"
down_revision = "0005_add_family_members"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("family_members") as batch_op:
        batch_op.add_column(sa.Column("signature", sa.String(length=200), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("family_members") as batch_op:
        batch_op.drop_column("signature")
