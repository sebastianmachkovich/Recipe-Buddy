"""Recipe Buddy FastAPI Application - Minimal Setup."""


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
import json
from app.database import *
from app.models import Recipe
db = next(get_db())

#Create tables if they don't exist
Recipe.metadata.create_all(bind=engine)

#Test Recipes
"""
soup_recipe = Recipe(
    name="Squash and Lentil Soup",
    description="A hearty soup made with lentils, vegetables, and spices.",
    image_url="https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
    rating=0,
    ingredients=json.dumps([
        {"id": 1, "name": "Lentils", "amount": 1, "unit": "unit"},
        {"id": 2, "name": "Onions", "amount": 1, "unit": "unit"},
        {"id": 3, "name": "Carrots", "amount": 1, "unit": "unit"},
        {"id": 4, "name": "Potatoes", "amount": 1, "unit": "unit"},
        {"id": 5, "name": "Garlic", "amount": 1, "unit": "unit"},
        {"id": 6, "name": "Ginger", "amount": 1, "unit": "unit"},
        {"id": 7, "name": "Chili Peppers", "amount": 1, "unit": "unit"},
    ]),
    steps=json.dumps([
        "Step 1: Prep vegetables",
        "Step 2: Cook lentils",
        "Step 3: Combine and simmer"
    ])
)

# add and commit
db.add(soup_recipe)
db.commit()

# close session
db.close()

print("Recipe added successfully!")
"""
recipe = db.query(Recipe).first()

# Initialize FastAPI app
app = FastAPI(
    title="Recipe Buddy API",
    description="AI-powered recipe suggestion API",
    version="1.0.0"
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Recipe Buddy API",
        "status": "running",
        "docs": "/docs",
        "testdata": recipe.name if recipe else "No recipes found"
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "ready"}

@app.get("/api/test")
def test_endpoint():
    """Test endpoint to verify API is working."""
    return {"message": "API is working! Start building your features here."}

if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Recipe Buddy Backend...")
    print("📍 Server: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
