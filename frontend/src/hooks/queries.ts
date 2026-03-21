import { qc, IngredientUnit, RecipeCardData } from "@/lib/state";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  authAPI,
  planAPI,
  recipesAPI,
  type Recipe,
  type RecipeWritePayload,
} from "@/services/api";

function toRecipeCardData(recipe: Recipe): RecipeCardData {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? "",
    imgUrl: recipe.imgUrl ?? "",
    rating: recipe.rating ?? 0,
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit ? (ingredient.unit as IngredientUnit) : undefined,
    })),
    steps: recipe.steps.map((step) => ({
      id: step.id,
      description: step.description,
      time: step.time,
    })),
  };
}

function toRecipeWritePayload(recipe: RecipeCardData): RecipeWritePayload {
  return {
    name: recipe.name,
    description: recipe.description,
    imgUrl: recipe.imgUrl,
    rating: recipe.rating,
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit ?? null,
    })),
    steps: recipe.steps.map((step) => ({
      id: step.id,
      description: step.description,
      time: step.time,
    })),
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await authAPI.status();
      return response.data.user;
    },
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await authAPI.login(payload);
      return response.data;
    },
    onSuccess: async (user) => {
      qc.setQueryData(["currentUser"], user);
      await qc.invalidateQueries({ queryKey: ["planIds"] });
      await qc.invalidateQueries({ queryKey: ["recipeIds"] });
      await qc.invalidateQueries({ queryKey: ["feedIds"] });
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await authAPI.signup(payload);
      return response.data;
    },
    onSuccess: async (user) => {
      qc.setQueryData(["currentUser"], user);
      await qc.invalidateQueries({ queryKey: ["planIds"] });
      await qc.invalidateQueries({ queryKey: ["recipeIds"] });
      await qc.invalidateQueries({ queryKey: ["feedIds"] });
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await authAPI.logout();
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["currentUser"] });
      qc.removeQueries({ queryKey: ["planIds"] });
      qc.removeQueries({ queryKey: ["recipeIds"] });
      qc.removeQueries({ queryKey: ["feedIds"] });
    },
  });
}

export function useRecipe(id?: number) {
  return useQuery({
    queryKey: ["recipes", id],
    queryFn: async () => {
      const response = await recipesAPI.getById(id!);
      return toRecipeCardData(response.data);
    },
    enabled: !!id,
  });
}

export function useAllRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await recipesAPI.getAll();
      return response.data.map(toRecipeCardData);
    },
  });
}

export function useAddRecipe() {
  return useMutation({
    mutationFn: async (recipe: RecipeCardData) => {
      const response = await recipesAPI.create(toRecipeWritePayload(recipe));
      const savedRecipe = toRecipeCardData(response.data);
      qc.setQueryData(["recipes", savedRecipe.id], savedRecipe);
      await qc.invalidateQueries({ queryKey: ["recipeIds"] });
      return savedRecipe;
    },
  });
}

export function useRemoveRecipe() {
  return useMutation({
    mutationFn: async (id: number) => {
      await recipesAPI.delete(id);
      qc.removeQueries({ queryKey: ["recipes", id] });
      qc.setQueryData(["planIds"], (ids: number[] | undefined) =>
        ids?.filter((it) => it !== id),
      );
      qc.setQueryData(["feedIds"], (ids: number[] | undefined) =>
        ids?.filter((it) => it !== id),
      );
      await qc.invalidateQueries({ queryKey: ["recipeIds"] });
    },
  });
}

export function useUpdateRecipe() {
  return useMutation({
    mutationFn: async (recipe: RecipeCardData) => {
      const response = await recipesAPI.update(
        recipe.id,
        toRecipeWritePayload(recipe),
      );
      const savedRecipe = toRecipeCardData(response.data);
      qc.setQueryData(["recipes", savedRecipe.id], savedRecipe);
      await qc.invalidateQueries({ queryKey: ["recipeIds"] });
      return savedRecipe;
    },
  });
}

export function useRecipeIds() {
  return useQuery({
    queryKey: ["recipeIds"],
    queryFn: async () => {
      const response = await recipesAPI.getAll();
      return response.data.map((recipe) => recipe.id);
    },
  });
}
/*
export function useFeedIds() {
    return useQuery({
        queryKey: ["feedIds"],
        queryFn: () => qc.getQueryData(["feedIds"]) as number[],
        enabled: true,
        initialData: [1, -1, 5] as number[],
    });
}
*/
//Homepage reccomendations
export function useFeedIds() {
  return useQuery({
    queryKey: ["feedIds"],
    queryFn: async () => {
      const response = await recipesAPI.getRandom();
      return response.data.map((r) => r.id);
    },
  });
}

export function usePlanIds() {
  return useQuery({
    queryKey: ["planIds"],
    queryFn: async () => {
      const response = await planAPI.getAll();
      return response.data;
    },
  });
}

export function useAddToPlan() {
  return useMutation({
    mutationFn: async (id: number) => {
      await planAPI.add(id);
      await qc.invalidateQueries({ queryKey: ["planIds"] });
    },
  });
}

export function useRemoveFromPlan() {
  return useMutation({
    mutationFn: async (id: number) => {
      await planAPI.remove(id);
      await qc.invalidateQueries({ queryKey: ["planIds"] });
    },
  });
}
