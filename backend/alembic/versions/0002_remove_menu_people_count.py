"""remove menu people_count

Revision ID: 0002_remove_menu_people_count
Revises: 0001_init
Create Date: 2026-03-13 21:20:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_remove_menu_people_count"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("menus") as batch_op:
        batch_op.drop_column("people_count")


def downgrade() -> None:
    with op.batch_alter_table("menus") as batch_op:
        batch_op.add_column(sa.Column("people_count", sa.Integer(), nullable=False, server_default="3"))
