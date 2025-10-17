from __future__ import annotations
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# --- Alembic config
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- Import your Base metadata here
from app.db import Base, DB_URL  # pulls DB_URL from env or default
# Import models so metadata has tables
from app.models import inventory  # noqa: F401

target_metadata = Base.metadata

def run_migrations_offline():
    url = os.getenv("DB_URL", "sqlite:///./tregu.db")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = os.getenv("DB_URL", "sqlite:///./tregu.db")

    connectable = engine_from_config(
        configuration, prefix="sqlalchemy.", poolclass=pool.NullPool
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
