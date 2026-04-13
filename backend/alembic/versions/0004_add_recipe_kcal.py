"""add recipe kcal

Revision ID: 0004_add_recipe_kcal
Revises: 0003_menu_ingredient_purchases
Create Date: 2026-03-14 12:10:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_add_recipe_kcal"
down_revision = "0003_menu_ingredient_purchases"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("recipes") as batch_op:
        batch_op.add_column(sa.Column("kcal", sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("recipes") as batch_op:
        batch_op.drop_column("kcal")
