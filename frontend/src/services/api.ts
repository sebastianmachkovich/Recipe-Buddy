/// <reference types="vite/client" />

import axios from "axios";
import { router } from "@/main";
import {
  mutationOptions,
  QueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { redirect, UseNavigateResult } from "@tanstack/react-router";
import { toast } from "sonner";
import { useOptimisticMutation } from "tanstack-query-optimistic-updates";
import { useAtom } from "jotai";
import { savedRecipesMappingAtom } from "@/routes/home";

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
  description: string;
  imgUrl?: string;
  rating: number;
  inPlan: boolean;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RecipeIngredient {
  id: number;
  name: string;
  amount: number;
  unit: IngredientUnit;
}

export type RecipeStepType = "prep" | "background" | "blocking" | "untimed";

export interface RecipeStep {
  id: number;
  type: RecipeStepType;
  description: string;
  time?: number;
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

// AI-generated recipes use the same shape as a saved `Recipe`, minus the
// server-assigned `id` (the client mints a temporary id when consuming).
export type AIRecipe = Omit<Recipe, "id">;

export interface AIRecipeRequest {
  ingredients: string[] | string;
  max_recipes?: number;
  cuisine_preference?: string;
  dietary_preference?: string;
}

export interface AIRecipeResponse {
  recipes: AIRecipe[];
  model: string;
}

export interface AIImageRecipeResponse {
  detected_ingredients: string[];
  recipes: AIRecipe[];
  vision_model: string;
  recipe_model: string;
}

export interface AIResponseData {
  recipes: Recipe[];
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
    toast.error("Failed to login", { description: error.message });
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
    toast.error("Failed to signup", { description: error.message });
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
    toast.error("Failed to logout", { description: error.message });
  },
});

export interface Preference {
  value: string;
}

export const cuisineQuery = queryOptions({
  queryKey: ["cuisine"],
  async queryFn() {
    const response = await api.get<Preference>("/cuisines/");
    return response.data;
  },
});

export const updateCuisineMutation = mutationOptions({
  mutationFn: (value: string) =>
    api.put<Preference>("/cuisines/", { value }),
  onSuccess({ data }, _variables, _onMutateResult, context) {
    context.client.setQueryData(["cuisine"], data);
    toast.success("Cuisine preferences saved");
  },
  onError(error) {
    toast.error("Failed to update cuisine preferences", {
      description: error.message,
    });
  },
});

export const dietaryQuery = queryOptions({
  queryKey: ["dietary"],
  async queryFn() {
    const response = await api.get<Preference>("/dietary/");
    return response.data;
  },
});

export const updateDietaryMutation = mutationOptions({
  mutationFn: (value: string) =>
    api.put<Preference>("/dietary/", { value }),
  onSuccess({ data }, _variables, _onMutateResult, context) {
    context.client.setQueryData(["dietary"], data);
    toast.success("Dietary preferences saved");
  },
  onError(error) {
    toast.error("Failed to update dietary restrictions", {
      description: error.message,
    });
  },
});

export function useAddRecipe() {
  const { mutate: addRecipe, mutateAsync: addRecipeAsync } =
    useOptimisticMutation(
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
  return { addRecipe, addRecipeAsync };
}

export function useRemoveRecipe() {
  const [savedRecipes, setSavedRecipes] = useAtom(savedRecipesMappingAtom);
  const { mutate: removeRecipe } = useOptimisticMutation(
    {
      mutationFn: (id: number) => api.delete(`/recipes/${id}`),
      onError(error) {
        toast.error("Failed to remove recipe", { description: error.message });
      },
      onSuccess(data, id, onMutateResult, context) {
        const idx = savedRecipes.findIndex((it) => it.savedId === id);
        if (idx >= 0) {
          setSavedRecipes((prev) => prev.toSpliced(idx, 1));
        }
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

function* saveTmpIdGen() {
  let id = 0;
  while (true) {
    --id;
    yield id;
  }
  return 0;
}

const saveTmpId = saveTmpIdGen();

// The AI endpoint already returns Recipe-shaped objects (minus id).
// All we need to do client-side is mint a temporary id so React Query and the
// rest of the recipe UI can treat them like any other Recipe.
function aiRecipeToRecipe(recipe: AIRecipe): Recipe {
  return {
    id: saveTmpId.next().value,
    ...recipe,
  };
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
        recipes: response.data.recipes.map(aiRecipeToRecipe),
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
        recipes: response.data.recipes.map(aiRecipeToRecipe),
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
    const description =
      error.message ?? "Something went wrong. Please try again.";
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

export function useSaveAIRecipe() {
  const [savedRecipes, setSavedRecipes] = useAtom(savedRecipesMappingAtom);
  const { addRecipeAsync } = useAddRecipe();
  const { mutate: saveRecipe } = useOptimisticMutation(
    {
      mutationFn: async ({ id, ...recipe }: Recipe) =>
        await addRecipeAsync(recipe),
      onMutate(variables, context) {
        setSavedRecipes((prev) => [...prev, { genId: variables.id }]);
        return { prevQueryData: variables };
      },
      onSuccess({ data }, oldRecipe, onMutateResult, context) {
        const idx = savedRecipes.findIndex((it) => it.genId === oldRecipe.id);
        setSavedRecipes((prev) =>
          prev.with(idx, { genId: oldRecipe.id, savedId: data.id }),
        );
      },
      optimisticUpdateOptions: {
        queryKey: ["aiRecipes"],
        getOptimisticState({
          prevQueryData,
          variables: recipe,
        }): AIResponseData {
          const idx = prevQueryData!.recipes.findIndex(
            (it) => it.name === recipe.name,
          );
          return {
            ...prevQueryData,
            recipes: prevQueryData.recipes.with(idx, { ...recipe }),
          };
        },
      },
    },
    qc,
  );
  return { saveRecipe };
}
