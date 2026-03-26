import { useMutation, useQuery } from "@tanstack/react-query";
import {
  authAPI,
  planAPI,
  qc,
  recipesAPI,
  type Recipe,
} from "@/services/api";
import { UseNavigateResult } from "@tanstack/react-router";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await authAPI.status();
      return response.data.user;
    },
    retry: false,
  }, qc);
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await authAPI.login(payload);
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
  }, qc);
}

export function useSignup() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const response = await authAPI.signup(payload);
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
  }, qc);
}

export function useLogout(navigate: UseNavigateResult<string>) {
  return useMutation({
    mutationFn: () => authAPI.logout(),
    async onMutate() {
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
  }, qc);
}

export function useRecipe(id?: number) {
  return useQuery({
    queryKey: ["recipes", id],
    queryFn: async () => {
      const response = await recipesAPI.getById(id!);
      return response.data;
    },
    enabled: !!id,
  }, qc);
}

export function useAllRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const response = await recipesAPI.getAll();
      return response.data;
    },
  }, qc);
}

export function useAddRecipe() {
  return useMutation({
    mutationFn: ({ id, ...rest }: Recipe) => recipesAPI.create(rest),
    async onMutate(value, context) {
      await context.client.cancelQueries({ queryKey: ["recipes", value.id] });
      await context.client.cancelQueries({ queryKey: ["recipeIds"] });
      await context.client.cancelQueries({ queryKey: ["planIds"] });
      const prevRecipe = context.client.getQueryData<number>(["recipes", value.id]);
      const prevRecipeIds = context.client.getQueryData<number[]>(["recipeIds"]);
      const prevPlanIds = context.client.getQueryData<number[]>(["planIds"]);
      context.client.setQueryData(["recipes", value.id], value);
      context.client.setQueryData<number[]>(["recipeIds"], (ids) => [...(ids || []), value.id]);
      context.client.setQueryData<number[]>(["planIds"], (ids) => [...(ids || []), value.id]);
      return { prevRecipe, prevRecipeIds, prevPlanIds };
    },
    onError(error, value, onMutateResult, context) {
      context.client.setQueryData(["recipes", value.id], onMutateResult?.prevRecipe);
      context.client.setQueryData<number[]>(["recipeIds"], onMutateResult?.prevRecipeIds);
      context.client.setQueryData<number[]>(["planIds"], onMutateResult?.prevPlanIds);
    },
    async onSettled(data, error, value, onMutateResult, context) {
      await context.client.invalidateQueries({ queryKey: ["recipes", value.id] });
      await context.client.invalidateQueries({ queryKey: ["recipeIds"] });
      await context.client.invalidateQueries({ queryKey: ["planIds"] });
    },
  }, qc);
}

export function useRemoveRecipe() {
  return useMutation({
    mutationFn: async (id: number) => {
        await recipesAPI.delete(id);
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
      await context.client.invalidateQueries({ queryKey: ["recipes", id] });
      await context.client.invalidateQueries({ queryKey: ["recipeIds"] });
      await context.client.invalidateQueries({ queryKey: ["planIds"] });
    },
  }, qc);
}

export function useUpdateRecipe() {
  return useMutation({
    mutationFn: ({ id, ...rest }: Recipe) => recipesAPI.update(id, rest),
    async onMutate(value, context) {
      await context.client.cancelQueries({ queryKey: ["recipes", value.id] });
      await context.client.cancelQueries({ queryKey: ["recipeIds"] });
      await context.client.cancelQueries({ queryKey: ["planIds"] });
      const prevRecipe = context.client.getQueryData<number>(["recipes", value.id]);
      const prevRecipeIds = context.client.getQueryData<number[]>(["recipeIds"]);
      const prevPlanIds = context.client.getQueryData<number[]>(["planIds"]);
      context.client.setQueryData(["recipes", value.id], value);
      context.client.setQueryData<number[]>(["recipeIds"], (ids) => [...(ids || []), value.id]);
      context.client.setQueryData<number[]>(["planIds"], (ids) => [...(ids || []), value.id]);
      return { prevRecipe, prevRecipeIds, prevPlanIds };
    },
    onError(error, value, onMutateResult, context) {
      context.client.setQueryData(["recipes", value.id], onMutateResult?.prevRecipe);
      context.client.setQueryData<number[]>(["recipeIds"], onMutateResult?.prevRecipeIds);
      context.client.setQueryData<number[]>(["planIds"], onMutateResult?.prevPlanIds);
      // TODO: Notify user.
    },
    async onSettled(data, error, value, onMutateResult, context) {
      await context.client.invalidateQueries({ queryKey: ["recipes", value.id] });
      await context.client.invalidateQueries({ queryKey: ["recipeIds"] });
      await context.client.invalidateQueries({ queryKey: ["planIds"] });
    },
  }, qc);
}

export function useRecipeIds() {
  return useQuery({
    queryKey: ["recipeIds"],
    queryFn: async () => {
      const response = await recipesAPI.getAll();
      return response.data.map((recipe) => recipe.id);
    },
  }, qc);
}

export function usePlanIds() {
  return useQuery({
    queryKey: ["planIds"],
    queryFn: async () => {
      const response = await planAPI.getAll();
      return response.data;
    },
  }, qc);
}

export function useAddToPlan() {
  return useMutation({
    mutationFn: (id: number) => planAPI.add(id),
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
  }, qc);
}

export function useRemoveFromPlan() {
  return useMutation({
    mutationFn: (id: number) => planAPI.remove(id),
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
  }, qc);
}

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ recipeId, file }: { recipeId: number; file: File }) => {
      return recipesAPI.uploadImage(recipeId, file);
    },
    async onMutate(variables, context) {
      await context.client.cancelQueries({ queryKey: ["recipes", variables.recipeId] });
      const prevRecipe = context.client.getQueryData<number>(["recipes", variables.recipeId]);
      context.client.setQueryData(["recipes", variables.recipeId], (prev: Recipe | undefined) =>
        prev ? { ...prev, hasImage: true } : prev,
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
  }, qc);
}
