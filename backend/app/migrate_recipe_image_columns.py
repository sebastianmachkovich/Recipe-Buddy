from sqlalchemy import text

from .database import engine


MIGRATION_SQL = [
    "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_data BYTEA",
    "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_mime VARCHAR(100)",
    "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255)",
    "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_size_bytes INTEGER",
]


if __name__ == "__main__":
    with engine.begin() as connection:
        for statement in MIGRATION_SQL:
            connection.execute(text(statement))
    print("Recipe image columns are ready.")
