/// <reference types="vite/client" />

import axios from "axios";
import { QueryClient } from "@tanstack/react-query";

const browserHost =
  typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_URL = import.meta.env.VITE_API_URL || `http://${browserHost}:8000`;

export const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
}

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  imgUrl: string | null;
  hasImage?: boolean;
  rating: number | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RecipeIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string | null;
}

export interface RecipeStep {
  id: number;
  description: string;
  time?: {
    hours: number;
    minutes: number;
  };
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

export interface AuthUser {
  id: number;
  email: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export type RecipeWritePayload = Omit<Recipe, "id">;

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

  getImageUrl: (id: number) => `${API_URL}/recipes/${id}/image`,

  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<{
      recipe_id: number;
      filename: string | null;
      mime: string | null;
      size_bytes: number | null;
    }>(`/recipes/${id}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  create: (data: RecipeWritePayload) => api.post<Recipe>("/recipes/", data),

  update: (id: number, data: RecipeWritePayload) =>
    api.put<Recipe>(`/recipes/${id}`, data),

  delete: (id: number) => api.delete(`/recipes/${id}`),
};

export const authAPI = {
  signup: (data: { email: string; password: string }) =>
    api.post<AuthUser>("/auth/signup", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthUser>("/auth/login", data),

  logout: () => api.post<{ message: string }>("/auth/logout"),

  me: () => api.get<AuthUser>("/auth/me"),

  status: () => api.get<AuthStatusResponse>("/auth/status"),
};

export const planAPI = {
  getAll: () => api.get<number[]>("/plan/"),
  add: (recipeId: number) =>
    api.post<{ recipe_id: number }>(`/plan/${recipeId}`),
  remove: (recipeId: number) =>
    api.delete<{ deleted: boolean }>(`/plan/${recipeId}`),
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
