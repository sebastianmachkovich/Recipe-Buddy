/// <reference types="vite/client" />

import axios, { isAxiosError } from "axios";
import { router } from "@/main";
import {
  MutationFunctionContext,
  mutationOptions,
  QueryClient,
  QueryKey,
  queryOptions,
} from "@tanstack/react-query";
import { redirect, UseNavigateResult } from "@tanstack/react-router";
import { toast } from "sonner";
import { useOptimisticMutation } from "tanstack-query-optimistic-updates";

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      qc.clear();
      await router.navigate({ to: "/" });
    }
    return Promise.reject(error);
  },
);

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
  inPlan: boolean;
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

export interface AIResponseData {
  recipes: AIRecipeSuggestion[];
  detected_ingredients: string[];
  activeModelLabel: string;
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

export function validateAuth() {
  const expiresAt = sessionStorage.getItem("authExpiresAt");
  if (!expiresAt || Date.now() > parseInt(expiresAt)) {
    throw redirect({ to: "/" });
  }
}

export const currentUserQuery = queryOptions({
  queryKey: ["currentUser"],
  async queryFn() {
    const response = await api.get<AuthStatusResponse>("/auth/status");
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
    sessionStorage.setItem(
      "authExpiresAt",
      String(Date.now() + 24 * 60 * 60 * 1000),
    );
    context.client.setQueryData(["currentUser"], user);
    await context.client.invalidateQueries({ queryKey: ["recipes"] });
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
    sessionStorage.setItem(
      "authExpiresAt",
      String(Date.now() + 24 * 60 * 60 * 1000),
    );
    context.client.setQueryData(["currentUser"], user);
    await context.client.invalidateQueries({ queryKey: ["recipes"] });
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
    context.client.removeQueries({ queryKey: ["recipes"] });
  },
  async onError(error, variables, onMutateResult, context) {
    // TODO: Notify user.
  },
});

export function useAddRecipe() {
  const { mutate: addRecipe } = useOptimisticMutation(
    {
      mutationFn: (fields: RecipeWritePayload) =>
        api.post<Recipe>("/recipes/", fields),
      onError(error) {
        toast.error("Failed to add recipe", { description: error.message });
      },
      optimisticUpdateOptions: {
        queryKey: ["recipes"],
        getOptimisticState({
          prevQueryData,
          variables,
        }: {
          prevQueryData: Recipe[];
          variables: RecipeWritePayload;
        }) {
          if (!prevQueryData) return [];
          console.log(prevQueryData);
          // Despite the type error, `fields` is supposed to have its `id` field undefined here.
          return prevQueryData
            .concat(variables)
            .sort((a, b) => a.name.localeCompare(b.name));
        },
      },
      onSuccess: ({ data }, variables, { prevQueryData }) => {
        // We fill in the `id` field of the new recipe with the one returned by
        // the server right here.
        qc.setQueryData(["recipes"], (prev: Recipe[]) =>
          prev.with(
            prev.findIndex((it) => it.id === undefined),
            data,
          ),
        );
      },
    },
    qc,
  );
  return { addRecipe };
}

export function useRemoveRecipe() {
  const { mutate: removeRecipe } = useOptimisticMutation(
    {
      mutationFn: (id: number) => api.delete(`/recipes/${id}`),
      onError(error) {
        toast.error("Failed to remove recipe", { description: error.message });
      },
      optimisticUpdateOptions: {
        queryKey: ["recipes"],
        getOptimisticState({
          prevQueryData,
          variables,
        }: {
          prevQueryData: Recipe[];
          variables: number;
        }) {
          if (!prevQueryData) return [];
          return prevQueryData.filter((it) => it.id !== variables);
        },
      },
    },
    qc,
  );
  return { removeRecipe };
}

export function useUpdateRecipe() {
  const { mutate: updateRecipe } = useOptimisticMutation(
    {
      mutationFn: ({ id, ...rest }: Recipe) =>
        api.put<Recipe>(`/recipes/${id}`, rest),
      onError(error) {
        toast.error("Failed to update recipe", { description: error.message });
      },
      optimisticUpdateOptions: {
        queryKey: ["recipes"],
        getOptimisticState({
          prevQueryData,
          variables,
        }: {
          prevQueryData: Recipe[];
          variables: Recipe;
        }) {
          if (!prevQueryData) return [];
          const idx = prevQueryData.findIndex((it) => it.id === variables.id);
          const result = prevQueryData.with(idx, variables);
          if (prevQueryData[idx].name !== result[idx].name) {
            result.sort((a, b) => a.name.localeCompare(b.name));
          }
          return result;
        },
      },
    },
    qc,
  );
  return { updateRecipe };
}

export const allRecipesQuery = queryOptions({
  queryKey: ["recipes"],
  async queryFn() {
    const response = await api.get<Recipe[]>("/recipes/");
    return response.data.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const aiRecipesQuery = queryOptions<AIResponseData>({
  queryKey: ["aiRecipes"],
  enabled: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  retry: false,
  retryOnMount: false,
  initialData: {
    recipes: [],
    detected_ingredients: [],
    activeModelLabel: "",
  },
  async queryFn() {
    return qc.getQueryData(["aiRecipes"])!;
  },
});

// FIXME: Error message normalization should be done on the backend because the
//        frontend should not have to know the implementation details of the
//        backend.  It is very easy to set up exception handlers in the server
//        that take care of this automatically.
function formatApiErrorDetail(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)
      ?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail.trim();
    }
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null && "msg" in item) {
            const msg = (item as { msg?: unknown }).msg;
            return typeof msg === "string" ? msg : null;
          }
          return null;
        })
        .filter((item): item is string => Boolean(item));
      if (parts.length > 0) {
        return parts.join("; ");
      }
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export const generateAIRecipesMutation = mutationOptions({
  mutationKey: ["generateAIRecipes"],
  retry: false,
  async mutationFn(input: string | File): Promise<AIResponseData> {
    if (typeof input === "string") {
      const ingredientList = input
        .split(/,|\n/g)
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await api.post<AIRecipeResponse>("/api/ai/recipes", {
        ingredients: ingredientList,
        max_recipes: 5,
      });
      return {
        detected_ingredients: [],
        activeModelLabel: response.data.model,
        recipes: response.data.recipes,
      };
    } else {
      const formData = new FormData();
      formData.append("image", input);
      formData.append("max_recipes", "5");

      const response = await api.post<AIImageRecipeResponse>(
        "/api/ai/recipes/from-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return {
        detected_ingredients: response.data.detected_ingredients,
        activeModelLabel: `${response.data.vision_model} → ${response.data.recipe_model}`,
        recipes: response.data.recipes,
      };
    }
  },
  onMutate(input, context) {
    context.client.setQueryData<AIResponseData>(["aiRecipes"], {
      recipes: [],
      detected_ingredients: [],
      activeModelLabel: "",
    });
    context.client.invalidateQueries({ queryKey: ["aiRecipes"] });
  },
  onError(error, variables) {
    const description = formatApiErrorDetail(error);
    const title =
      variables instanceof File
        ? "Could not use this photo"
        : "Could not generate recipes";
    toast.error(title, { description });
  },
  onSuccess(data, variables, onMutateResult, context) {
    context.client.setQueryData<AIResponseData>(["aiRecipes"], data);
  },
});
