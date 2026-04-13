"""add menu ingredient purchases

Revision ID: 0003_menu_ingredient_purchases
Revises: 0002_remove_menu_people_count
Create Date: 2026-03-13 23:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0003_menu_ingredient_purchases"
down_revision = "0002_remove_menu_people_count"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "menu_ingredient_purchases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("menu_id", sa.Integer(), sa.ForeignKey("menus.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ingredient_key", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("menu_id", "ingredient_key", name="uq_menu_ingredient_purchase"),
    )
    op.create_index(
        op.f("ix_menu_ingredient_purchases_menu_id"),
        "menu_ingredient_purchases",
        ["menu_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_menu_ingredient_purchases_menu_id"), table_name="menu_ingredient_purchases")
    op.drop_table("menu_ingredient_purchases")
