# app/create_tables.py
from ..database import engine, Base
from ..models import Recipe, User

# Create all tables defined with Base subclasses
Base.metadata.create_all(bind=engine)

print("✅ Tables created successfully!")