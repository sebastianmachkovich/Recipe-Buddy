from sqlalchemy import text

from ..database import engine


MIGRATION_SQL = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS cuisine_preference TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS dietary_preference TEXT",
]


if __name__ == "__main__":
    with engine.begin() as connection:
        for statement in MIGRATION_SQL:
            connection.execute(text(statement))
    print("User preference columns are ready.")
