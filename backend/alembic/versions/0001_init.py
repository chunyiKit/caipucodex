"""initial schema

Revision ID: 0001_init
Revises:
Create Date: 2026-03-11 11:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "recipes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cooking_time", sa.Integer(), nullable=True),
        sa.Column("difficulty", sa.String(length=10), nullable=False, server_default="中等"),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(op.f("ix_recipes_name"), "recipes", ["name"], unique=False)
    op.create_index(op.f("ix_recipes_category"), "recipes", ["category"], unique=False)

    op.create_table(
        "menus",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=100), nullable=True),
        sa.Column("menu_date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("people_count", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("is_ai_generated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("ai_preferences", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.String(length=50), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index(op.f("ix_ingredients_recipe_id"), "ingredients", ["recipe_id"], unique=False)

    op.create_table(
        "cooking_steps",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index(op.f("ix_cooking_steps_recipe_id"), "cooking_steps", ["recipe_id"], unique=False)

    op.create_table(
        "menu_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("menu_id", sa.Integer(), sa.ForeignKey("menus.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recipe_id", sa.Integer(), sa.ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("recipe_name", sa.String(length=100), nullable=False),
        sa.Column("recipe_category", sa.String(length=20), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("cooking_time", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("ai_reason", sa.String(length=200), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index(op.f("ix_menu_items_menu_id"), "menu_items", ["menu_id"], unique=False)
    op.create_index(op.f("ix_menu_items_recipe_id"), "menu_items", ["recipe_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_menu_items_recipe_id"), table_name="menu_items")
    op.drop_index(op.f("ix_menu_items_menu_id"), table_name="menu_items")
    op.drop_table("menu_items")
    op.drop_index(op.f("ix_cooking_steps_recipe_id"), table_name="cooking_steps")
    op.drop_table("cooking_steps")
    op.drop_index(op.f("ix_ingredients_recipe_id"), table_name="ingredients")
    op.drop_table("ingredients")
    op.drop_table("menus")
    op.drop_index(op.f("ix_recipes_category"), table_name="recipes")
    op.drop_index(op.f("ix_recipes_name"), table_name="recipes")
    op.drop_table("recipes")
