from app.database import *
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Recipe
#Use this script data into the database.
db = next(get_db())

recipes_data = [
    {
        "name": "Spaghetti Carbonara",
        "description": "A classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.",
        "rating": 4,
        "ingredients": [
            {"id": 1, "name": "Eggs", "amount": 2, "unit": "unit"},
            {"id": 2, "name": "Cheese", "amount": 1, "unit": "oz"},
        ],
        "steps": [
            {"id": 1, "description": "Cook spaghetti", "time": {"hours": 1, "minutes": 30}},
            {"id": 2, "description": "Cook eggs", "time": {"hours": 1, "minutes": 30}},
        ],
    },
    {
        "name": "Chicken Tikka Masala",
        "description": "Tender chicken in a creamy, spiced tomato sauce served with basmati rice.",
        "rating": 3,
        "ingredients": [
            {"id": 1, "name": "Chicken", "amount": 1, "unit": "lb"},
            {"id": 2, "name": "Tomato Sauce", "amount": 1, "unit": "cup"},
        ],
        "steps": [
            {"id": 1, "description": "Marinate chicken", "time": {"hours": 0, "minutes": 30}},
            {"id": 2, "description": "Simmer in sauce", "time": {"hours": 1, "minutes": 0}},
        ],
    },
    {
        "name": "Beef Tacos",
        "description": "Seasoned ground beef in crispy corn tortillas with fresh toppings and salsa.",
        "rating": 5,
        "ingredients": [
            {"id": 1, "name": "Ground Beef", "amount": 1, "unit": "lb"},
            {"id": 2, "name": "Tortillas", "amount": 8, "unit": "unit"},
        ],
        "steps": [
            {"id": 1, "description": "Cook beef", "time": {"hours": 0, "minutes": 20}},
            {"id": 2, "description": "Assemble tacos", "time": {"hours": 0, "minutes": 10}},
        ],
    },
    {
        "name": "Caesar Salad",
        "description": "Crisp romaine lettuce with parmesan, croutons, and creamy Caesar dressing.",
        "rating": 4,
        "ingredients": [
            {"id": 1, "name": "Romaine Lettuce", "amount": 1, "unit": "head"},
            {"id": 2, "name": "Parmesan", "amount": 0.5, "unit": "cup"},
        ],
        "steps": [
            {"id": 1, "description": "Chop lettuce", "time": {"hours": 0, "minutes": 10}},
            {"id": 2, "description": "Toss with dressing", "time": {"hours": 0, "minutes": 5}},
        ],
    },
    {
        "name": "Margherita Pizza",
        "description": "Traditional Neapolitan pizza with fresh mozzarella, tomatoes, and basil.",
        "rating": 5,
        "ingredients": [
            {"id": 1, "name": "Pizza Dough", "amount": 1, "unit": "unit"},
            {"id": 2, "name": "Mozzarella", "amount": 8, "unit": "oz"},
        ],
        "steps": [
            {"id": 1, "description": "Prepare dough", "time": {"hours": 1, "minutes": 0}},
            {"id": 2, "description": "Bake pizza", "time": {"hours": 0, "minutes": 15}},
        ],
    },
    {
        "name": "Grilled Salmon",
        "description": "Fresh Atlantic salmon fillet with lemon herb butter and steamed vegetables.",
        "rating": 2,
        "ingredients": [
            {"id": 1, "name": "Salmon Fillet", "amount": 2, "unit": "unit"},
            {"id": 2, "name": "Lemon", "amount": 1, "unit": "unit"},
        ],
        "steps": [
            {"id": 1, "description": "Season salmon", "time": {"hours": 0, "minutes": 10}},
            {"id": 2, "description": "Grill salmon", "time": {"hours": 0, "minutes": 15}},
        ],
    },
    {
        "name": "Mushroom Risotto",
        "description": "Creamy Italian rice dish with mixed wild mushrooms and parmesan cheese.",
        "rating": 3,
        "ingredients": [
            {"id": 1, "name": "Arborio Rice", "amount": 1, "unit": "cup"},
            {"id": 2, "name": "Mushrooms", "amount": 2, "unit": "cup"},
            {"id": 3, "name": "Parmesan", "amount": 0.5, "unit": "cup"},
        ],
        "steps": [
            {"id": 1, "description": "Sauté mushrooms", "time": {"hours": 0, "minutes": 10}},
            {"id": 2, "description": "Cook rice gradually with broth", "time": {"hours": 0, "minutes": 30}},
            {"id": 3, "description": "Finish with cheese", "time": {"hours": 0, "minutes": 5}},
        ],
    },
    {
        "name": "BBQ Ribs",
        "description": "Slow-cooked pork ribs with tangy barbecue sauce and coleslaw.",
        "rating": 4,
        "ingredients": [
            {"id": 1, "name": "Pork Ribs", "amount": 2, "unit": "lb"},
            {"id": 2, "name": "BBQ Sauce", "amount": 1, "unit": "cup"},
        ],
        "steps": [
            {"id": 1, "description": "Season ribs", "time": {"hours": 0, "minutes": 15}},
            {"id": 2, "description": "Slow cook", "time": {"hours": 4, "minutes": 0}},
            {"id": 3, "description": "Apply sauce and finish", "time": {"hours": 0, "minutes": 20}},
        ],
    },
]

# Insert into DB
for recipe_data in recipes_data:
    recipe = Recipe(
        name=recipe_data["name"],
        description=recipe_data["description"],
        rating=recipe_data["rating"],
        ingredients=recipe_data["ingredients"],
        steps=recipe_data["steps"],
    )
    db.add(recipe)

db.commit()
db.close()

print("Recipes inserted successfully.")
