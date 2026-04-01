/// <reference types="vite/client" />

import axios from "axios";
import { mutationOptions, QueryClient, queryOptions} from "@tanstack/react-query";
import { UseNavigateResult } from "@tanstack/react-router";
import { toast } from "sonner";

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
  imgUrl?: string;
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

export type RecipeWritePayload = Omit<Recipe, "id" | "imgUrl">;

// // Ingredient API
// export const ingredientsAPI = {
//   getAll: (search?: string) =>
//     api.get<Ingredient[]>("/ingredients/", { params: { search } }),
//
//   getById: (id: number) => api.get<Ingredient>(`/ingredients/${id}`),
//
//   create: (data: { name: string; category?: string }) =>
//     api.post<Ingredient>("/ingredients/", data),
// };

// // Pantry API
// export const pantryAPI = {
//   getAll: () => api.get<PantryItem[]>("/pantry/"),
//
//   add: (data: {
//     ingredient_id: number;
//     quantity?: string;
//     unit?: string;
//     expiry_date?: string;
//   }) => api.post<PantryItem>("/pantry/", data),
//
//   remove: (id: number) => api.delete(`/pantry/${id}`),
// };

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

export function getAuthStatus() {
  return api.get<AuthStatusResponse>("/auth/status");
}

export const currentUserQuery = queryOptions({
  queryKey: ["currentUser"],
  async queryFn() {
    const response = await getAuthStatus();
    return response.data.user;
  },
  retry: false,
});

export const loginMutation = mutationOptions({
  async mutationFn(payload: { email: string; password: string }) {
    const response = await api.post<AuthUser>("/auth/login", payload);
    return response.data;
  },
  async onSuccess(user, variables, onMutateResult, context) {
    context.client.setQueryData(["currentUser"], user);
    await context.client.invalidateQueries({ queryKey: ["planIds"] });
    await context.client.invalidateQueries({ queryKey: ["recipeIds"] });
    await context.client.invalidateQueries({ queryKey: ["feedIds"] });
  },
  onError(error, payload, onMutateResult, context) {
    // TODO: Notify user.
  },
});

export const signupMutation = mutationOptions({
  async mutationFn(payload: { email: string; password: string }) {
    const response = await api.post<AuthUser>("/auth/signup", payload);
    return response.data;
  },
  async onSuccess(user, variables, onMutateResult, context) {
    context.client.setQueryData(["currentUser"], user);
    await context.client.invalidateQueries({ queryKey: ["planIds"] });
    await context.client.invalidateQueries({ queryKey: ["recipeIds"] });
    await context.client.invalidateQueries({ queryKey: ["feedIds"] });
  },
  onError(error, payload, onMutateResult, context) {
    // TODO: Notify user.
  },
});

export const logoutMutation = mutationOptions({
  mutationFn: () => api.post<{ message: string }>("/auth/logout"),
  async onMutate(navigate: UseNavigateResult<string>) {
    await navigate({ to: "/" });
  },
  onSuccess(data, variables, onMutateResult, context) {
    context.client.removeQueries({ queryKey: ["currentUser"] });
    context.client.removeQueries({ queryKey: ["planIds"] });
    context.client.removeQueries({ queryKey: ["recipeIds"] });
    context.client.removeQueries({ queryKey: ["feedIds"] });
  },
  async onError(error, variables, onMutateResult, context) {
      // TODO: Notify user.
  },
});

export const recipeQuery = (id: number) => queryOptions({
  queryKey: ["recipes", id],
  async queryFn() {
    const response = await api.get<Recipe>(`/recipes/${id}`);
    const imageResponse = await api.get<Blob>(`${API_URL}/recipes/${id}/image`, { responseType: "blob" });
    return {
      ...response.data,
      imgUrl: URL.createObjectURL(imageResponse.data),
    };
  },
  enabled: !!id,
});

export const allRecipesQuery = queryOptions({
  queryKey: ["recipes"],
  async queryFn() {
    const response = await api.get<Recipe[]>("/recipes/");
    return response.data;
  },
});

export const addRecipeMutation = mutationOptions({
  mutationFn: ({ id, imgUrl, ...rest }: Recipe) => api.post<Recipe>("/recipes/", rest),
  onMutate(value, context) {
    context.client.setQueryData(["recipes", value.id], value);
    context.client.setQueryData<number[]>(["recipeIds"], (ids) => [...(ids || []), value.id]);
    context.client.setQueryData<number[]>(["planIds"], (ids) => [...(ids || []), value.id]);
    return { prevRecipeIds: context.client.getQueryData<number[]>(["recipeIds"]) };
  },
  onSuccess(data, variables, onMutateResult, context) {
    // Clean up the temp-ID cache entry
    context.client.removeQueries({ queryKey: ["recipes", variables.id] });
  },
  onError(error, variables, onMutateResult, context) {
    context.client.removeQueries({ queryKey: ["recipes", variables.id] });
    context.client.setQueryData<number[]>(["recipeIds"], onMutateResult?.prevRecipeIds);
    toast.error("Failed to create recipe", { description: error.message });
  },
  onSettled(data, error, variables, onMutateResult, context) {
    if (data) {
      context.client.invalidateQueries({ queryKey: ["recipes", data.data.id] });
    }
    context.client.invalidateQueries({ queryKey: ["recipeIds"] });
    context.client.invalidateQueries({ queryKey: ["planIds"] });
  },
});

export const removeRecipeMutation = mutationOptions({
  async mutationFn(id: number) {
      await api.delete(`/recipes/${id}`);
      return id;
  },
  async onMutate(id, context) {
    context.client.cancelQueries({ queryKey: ["recipes", id] });
    context.client.cancelQueries({ queryKey: ["recipeIds"] });
    context.client.cancelQueries({ queryKey: ["planIds"] });
    const prevRecipe = context.client.getQueryData<number>(["recipes", id]);
    const prevRecipeIds = context.client.getQueryData<number[]>(["recipeIds"]);
    const prevPlanIds = context.client.getQueryData<number[]>(["planIds"]);
    context.client.setQueryData(["recipes", id], undefined);
    context.client.setQueryData<number[]>(["recipeIds"], (ids: number[] | undefined) =>
        ids?.filter((it) => it !== id)
    );
    context.client.setQueryData<number[]>(["planIds"], (ids: number[] | undefined) =>
        ids?.filter((it) => it !== id)
    );
    return { prevRecipe, prevRecipeIds, prevPlanIds };
  },
  onError(error, id, onMutateResult, context) {
    context.client.setQueryData(["recipes", id], onMutateResult?.prevRecipe);
    context.client.setQueryData<number[]>(["recipeIds"], onMutateResult?.prevRecipeIds);
    context.client.setQueryData<number[]>(["planIds"], onMutateResult?.prevPlanIds);
    // TODO: Notify user.
  },
  async onSettled(data, error, id, onMutateResult, context) {
    context.client.invalidateQueries({ queryKey: ["recipes", id] });
    context.client.invalidateQueries({ queryKey: ["recipeIds"] });
    context.client.invalidateQueries({ queryKey: ["planIds"] });
  },
});

export const updateRecipeMutation = mutationOptions({
  mutationFn: ({ id, imgUrl, ...rest }: Recipe) => api.put<Recipe>(`/recipes/${id}`, rest),
  async onMutate(value, context) {
    await context.client.cancelQueries({ queryKey: ["recipes", value.id] });
    const prevRecipe = context.client.getQueryData<Recipe>(["recipes", value.id]);
    context.client.setQueryData(["recipes", value.id], value);
    return { prevRecipe };
  },
  onSuccess(data, variables, context) {
    toast.success("Recipe updated");
  },
  onError(error, variables, onMutateResult, context) {
    context.client.setQueryData(["recipes", variables.id], onMutateResult?.prevRecipe);
    toast.error("Failed to update recipe", { description: error.message });
  },
  onSettled(data, error, variables, onMutateResult, context) {
    context.client.invalidateQueries({ queryKey: ["recipes", variables.id] });
    context.client.invalidateQueries({ queryKey: ["recipeIds"] });
  },
});

export const recipeIdsQuery = queryOptions({
  queryKey: ["recipeIds"],
  async queryFn() {
    const response = await api.get<Recipe[]>("/recipes/");
    return response.data.map((recipe) => recipe.id);
  },
});

export const planIdsQuery = (isAuthPage: boolean) => queryOptions({
  queryKey: ["planIds"],
  async queryFn() {
    if (isAuthPage) return [];
    const response = await api.get<number[]>("/plan/");
    return response.data;
  },
});

export const addToPlanMutation = mutationOptions({
  mutationFn: (id: number) => api.post<{ recipe_id: number }>(`/plan/${id}`),
  async onMutate(value, context) {
    await context.client.cancelQueries({ queryKey: ["planIds"] });
    const prev = context.client.getQueryData<number[]>(["planIds"]);
    context.client.setQueryData<number[]>(
      ["planIds"],
      (ids) => [...(ids || []), value]
    );
    return { prev };
  },
  onError(error, value, onMutateResult, context) {
    context.client.setQueryData<number[]>(
      ["planIds"],
      onMutateResult?.prev
    );
    // TODO: Notify user.
  },
  async onSettled(data, error, variables, onMutateResult, context) {
    await context.client.invalidateQueries({ queryKey: ["planIds"] });
  },
});

export const removeFromPlanMutation = mutationOptions({
  mutationFn: (id: number) => api.delete<{ deleted: boolean }>(`/plan/${id}`),
  async onMutate(value, context) {
    await context.client.cancelQueries({ queryKey: ["planIds"] });
    const prev = context.client.getQueryData<number[]>(["planIds"]);
    context.client.setQueryData<number[]>(
      ["planIds"],
      (ids) => ids?.filter((it) => it !== value)
    );
    return { prev };
  },
  onError(error, value, onMutateResult, context) {
    context.client.setQueryData<number[]>(
      ["planIds"],
      onMutateResult?.prev
    );
    // TODO: Notify user.
  },
  async onSettled(data, error, variables, onMutateResult, context) {
    await context.client.invalidateQueries({ queryKey: ["planIds"] });
  },
});

export const uploadImageMutation = mutationOptions({
  mutationFn: ({ recipeId, file }: { recipeId: number; file: File }) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<{
      recipe_id: number;
      filename: string | null;
      mime: string | null;
      size_bytes: number | null;
    }>(`/recipes/${recipeId}/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  async onMutate(variables, context) {
    await context.client.cancelQueries({ queryKey: ["recipes", variables.recipeId] });
    const prevRecipe = context.client.getQueryData<number>(["recipes", variables.recipeId]);
    context.client.setQueryData(["recipes", variables.recipeId], (prev: Recipe | undefined) =>
      prev ? { ...prev, imgUrl: URL.createObjectURL(variables.file) } : prev,
    );
    return { prevRecipe };
  },
  onError(error, variables, onMutateResult, context) {
    context.client.setQueryData(["recipes", variables.recipeId], onMutateResult?.prevRecipe);
    // TODO: Notify user.
  },
  async onSettled(data, error, variables, onMutateResult, context) {
    await context.client.invalidateQueries({ queryKey: ["recipes", variables.recipeId] });
  },
});
