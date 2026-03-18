/// <reference types="vite/client" />

import axios from "axios";

const browserHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_URL = import.meta.env.VITE_API_URL || `http://${browserHost}:8000`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Ingredient {
  id: number;
  name: string;
  category: string | null;
  created_at: string;
}

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  cuisine: string | null;
  created_at: string;
  updated_at: string | null;
  ingredients: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: number;
  name: string;
  category: string | null;
  quantity: string | null;
}

export interface RecipeMatch {
  recipe: Recipe;
  match_percentage: number;
  missing_ingredients: string[];
  matched_ingredients: string[];
}

export interface PantryItem {
  id: number;
  user_id: string;
  ingredient_id: number;
  quantity: string | null;
  unit: string | null;
  expiry_date: string | null;
  ingredient: Ingredient;
  created_at: string;
  updated_at: string | null;
}

export interface AIRecipeSuggestion {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
}

export interface AIRecipeRequest {
  ingredients: string[] | string;
  max_recipes?: number;
  cuisine_preference?: string;
  dietary_preference?: string;
}

export interface AIRecipeResponse {
  recipes: AIRecipeSuggestion[];
  model: string;
}

export interface AIImageRecipeResponse {
  detected_ingredients: string[];
  recipes: AIRecipeSuggestion[];
  vision_model: string;
  recipe_model: string;
}

// Ingredient API
export const ingredientsAPI = {
  getAll: (search?: string) =>
    api.get<Ingredient[]>("/ingredients/", { params: { search } }),

  getById: (id: number) => api.get<Ingredient>(`/ingredients/${id}`),

  create: (data: { name: string; category?: string }) =>
    api.post<Ingredient>("/ingredients/", data),
};

// Recipe API
export const recipesAPI = {
  getAll: () => api.get<Recipe[]>("/recipes/"),

  getById: (id: number) => api.get<Recipe>(`/recipes/${id}`),

  create: (data: any) => api.post<Recipe>("/recipes/", data),

  suggest: (ingredientIds: number[]) =>
    api.post<RecipeMatch[]>("/recipes/suggest", ingredientIds),
};

// Pantry API
export const pantryAPI = {
  getAll: () => api.get<PantryItem[]>("/pantry/"),

  add: (data: {
    ingredient_id: number;
    quantity?: string;
    unit?: string;
    expiry_date?: string;
  }) => api.post<PantryItem>("/pantry/", data),

  remove: (id: number) => api.delete(`/pantry/${id}`),
};

export const aiAPI = {
  generateRecipes: (data: AIRecipeRequest) =>
    api.post<AIRecipeResponse>("/api/ai/recipes", data),

  generateRecipesFromImage: (formData: FormData) =>
    api.post<AIImageRecipeResponse>("/api/ai/recipes/from-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export default api;
