#!/usr/bin/env python3

from __future__ import annotations

from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text

from app.config import BASE_DIR, get_settings

RECOVERABLE_ERROR_MARKERS = (
    "DuplicateTable",
    "already exists",
    "DuplicateColumn",
    "duplicate column",
)


def build_alembic_config() -> tuple[Config, str]:
    settings = get_settings()
    config = Config(str(BASE_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BASE_DIR / "alembic"))
    config.set_main_option("sqlalchemy.url", settings.database_url)
    head_revision = ScriptDirectory.from_config(config).get_current_head()
    if not head_revision:
        raise RuntimeError("Unable to resolve Alembic head revision")
    return config, head_revision


def ensure_version_table_capacity(database_url: str, head_revision: str) -> None:
    engine = create_engine(database_url, future=True)
    try:
        inspector = inspect(engine)
        if "alembic_version" not in inspector.get_table_names():
            return

        if not engine.dialect.name.startswith("postgresql"):
            return

        required_length = max(64, len(head_revision))
        with engine.begin() as connection:
            result = connection.execute(
                text(
                    """
                    select character_maximum_length
                    from information_schema.columns
                    where table_schema = current_schema()
                      and table_name = 'alembic_version'
                      and column_name = 'version_num'
                    """
                )
            ).scalar_one_or_none()

            if result is None or result >= required_length:
                return

            connection.execute(
                text(f"ALTER TABLE alembic_version ALTER COLUMN version_num TYPE VARCHAR({required_length})")
            )
            print(f"Expanded alembic_version.version_num to VARCHAR({required_length}).")
    finally:
        engine.dispose()


def is_recoverable_migration_error(error: Exception) -> bool:
    message = str(error)
    return any(marker in message for marker in RECOVERABLE_ERROR_MARKERS)


def main() -> int:
    config, head_revision = build_alembic_config()
    database_url = config.get_main_option("sqlalchemy.url")

    ensure_version_table_capacity(database_url, head_revision)

    try:
        command.upgrade(config, "head")
        print(f"Database migrated to {head_revision}.")
        return 0
    except Exception as error:
        if not is_recoverable_migration_error(error):
            raise

        print("Detected existing schema without matching Alembic revision; stamping database to head.")
        ensure_version_table_capacity(database_url, head_revision)
        command.stamp(config, head_revision)
        print(f"Database stamped to {head_revision}.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
