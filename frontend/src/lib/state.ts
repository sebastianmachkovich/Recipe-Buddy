import { QueryClient } from "@tanstack/react-query";

export type RecipeCardData = {
  id: number;
  name: string;
  description: string;
  imgUrl: string;
  ingredients: Ingredient[];
  steps: Step[];
};

export enum IngredientUnit {
    unit = "unit",
    L = "L",
    mL = "mL",
    g = "g",
    kg = "kg",
    oz = "oz",
    tsp = "tsp",
    Tbsp = "Tbsp",
    fl_oz = "fl oz",
    cup = "cup",
    pt = "pt",
    qt = "qt",
    gal = "gal",
};

export type Ingredient = {
    id: number;
    name: string;
    amount: number;
    unit?: IngredientUnit;
};

export type Step = {
    id: number;
    description: string;
    time?: {
        hours: number;
        minutes: number;
    }
};

export const recipes_DummyData = [
    {
        id: 1,
        name: "Spaghetti Carbonara",
        description:
        "A classic Italian pasta dish with eggs, cheese, pancetta, and black pepper.",
        imgUrl:
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop",
        ingredients: [
            { id: 1, name: "Eggs", amount: 2, unit: IngredientUnit.unit },
            { id: 2, name: "Cheese", amount: 1, unit: IngredientUnit.oz },
        ],
        steps: [
            {
                id: 1,
                description: "Cook spaghetti",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
            {
                id: 2,
                description: "Cook eggs",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
        ],
    } as RecipeCardData,
    {
        id: 2,
        name: "Chicken Tikka Masala",
        description:
        "Tender chicken in a creamy, spiced tomato sauce served with basmati rice.",
        imgUrl:
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
    {
        id: 3,
        name: "Beef Tacos",
        description:
        "Seasoned ground beef in crispy corn tortillas with fresh toppings and salsa.",
        imgUrl:
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
    {
        id: 4,
        name: "Caesar Salad",
        description:
        "Crisp romaine lettuce with parmesan, croutons, and creamy Caesar dressing.",
        imgUrl:
        "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
    {
        id: 5,
        name: "Margherita Pizza",
        description:
        "Traditional Neapolitan pizza with fresh mozzarella, tomatoes, and basil.",
        imgUrl:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
    {
        id: 6,
        name: "Grilled Salmon",
        description:
        "Fresh Atlantic salmon fillet with lemon herb butter and steamed vegetables.",
        imgUrl:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
    {
        id: 7,
        name: "Mushroom Risotto",
        description:
        "Creamy Italian rice dish with mixed wild mushrooms and parmesan cheese. asldfj sad lsajfljsdf  lak  lkjsldflskd jflsl alk sld fkdsl jflkds jfls jlskd jfksld jflksjlsj flsjf oiwejfowlskdfmlkxjiod   jo welf sld jfsldk jwoie jlsdk jslk jiojfwiojdslkf jliweljfowijfldkj dlskjdiwejfldksd jkdsl jfoi",
        imgUrl:
        "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
    {
        id: 8,
        name: "BBQ Ribs",
        description:
        "Slow-cooked pork ribs with tangy barbecue sauce and coleslaw.",
        imgUrl:
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
        ingredients: [],
        steps: [],
    },
];

export const aiGeneratedRecipes_DummyData = [
    {
        id: -1,
        name: "Squash and Lentil Soup",
        description:
        "A hearty soup made with lentils, vegetables, and spices.",
        imgUrl:
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
        ingredients: [
            { id: 1, name: "Lentils", amount: 1, unit: IngredientUnit.unit },
            { id: 2, name: "Onions", amount: 1, unit: IngredientUnit.unit },
            { id: 3, name: "Carrots", amount: 1, unit: IngredientUnit.unit },
            { id: 4, name: "Potatoes", amount: 1, unit: IngredientUnit.unit },
            { id: 5, name: "Garlic", amount: 1, unit: IngredientUnit.unit },
            { id: 6, name: "Ginger", amount: 1, unit: IngredientUnit.unit },
            { id: 7, name: "Chili Peppers", amount: 1, unit: IngredientUnit.unit },
        ],
        steps: [
            {
                id: 1,
                description: "Cook lentils",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
            {
                id: 2,
                description: "Cook vegetables",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
        ],
    },
    {
        id: -2,
        name: "Chicken and Vegetable Stir Fry",
        description:
        "A flavorful stir fry made with chicken, vegetables, and spices.",
        imgUrl:
        "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&h=300&fit=crop",
        ingredients: [
            { id: 1, name: "Chicken", amount: 1, unit: IngredientUnit.unit },
            { id: 2, name: "Onions", amount: 1, unit: IngredientUnit.unit },
            { id: 3, name: "Carrots", amount: 1, unit: IngredientUnit.unit },
            { id: 4, name: "Potatoes", amount: 1, unit: IngredientUnit.unit },
            { id: 5, name: "Garlic", amount: 1, unit: IngredientUnit.unit },
            { id: 6, name: "Ginger", amount: 1, unit: IngredientUnit.unit },
            { id: 7, name: "Chili Peppers", amount: 1, unit: IngredientUnit.unit },
        ],
        steps: [
            {
                id: 1,
                description: "Cook chicken",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
            {
                id: 2,
                description: "Cook vegetables",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
            {
                id: 3,
                description: "Cook stir fry",
                time: {
                    hours: 1,
                    minutes: 30,
                },
            },
        ],
    },
]


export const qc = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            gcTime: Infinity,
        },
    },
});
// TODO: Replace this with a real request when the app loads.
// Note: The AI suggestions and user recipes are stored in the same cache key.
//       This is fine because all AI suggestions have negative IDs, and all
//       user recipes have positive IDs.
recipes_DummyData.forEach((it) => qc.setQueryData(["recipes", it.id], it));
aiGeneratedRecipes_DummyData.forEach((it) =>
  qc.setQueryData(["recipes", it.id], it),
);
qc.setQueryData(["feedIds"], [1, -1, 5] as number[]);
qc.setQueryData(["planIds"], [] as number[]);
