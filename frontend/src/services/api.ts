/// <reference types="vite/client" />

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

export default api;
