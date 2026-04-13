"""add family member body report

Revision ID: 0007_add_family_member_body_report
Revises: 0006_add_family_member_signature
Create Date: 2026-03-17 09:40:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_add_family_member_body_report"
down_revision = "0006_add_family_member_signature"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("family_members") as batch_op:
        batch_op.add_column(sa.Column("body_report", sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("family_members") as batch_op:
        batch_op.drop_column("body_report")
