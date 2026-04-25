import { useMutation, useQuery } from "@tanstack/react-query";
import {
  generateAIRecipesMutation,
  allRecipesQuery,
  currentUserQuery,
  loginMutation,
  logoutMutation,
  qc,
  signupMutation,
  aiRecipesQuery,
} from "@/services/api";

// User / Auth Hooks
export const useCurrentUser = () => useQuery(currentUserQuery, qc);
export const useSignup = () => useMutation(signupMutation, qc);
export const useLogin = () => useMutation(loginMutation, qc);
export const useLogout = () => useMutation(logoutMutation, qc);

// Recipe Hooks
export const useAllRecipes = (enabled: boolean = true) =>
  useQuery({ ...allRecipesQuery, enabled }, qc);
export { useAddRecipe, useRemoveRecipe, useUpdateRecipe } from "@/services/api";

// AI Hooks
export const useAIRecipes = () => useQuery(aiRecipesQuery, qc);
export const useGenerateAIRecipes = () =>
  useMutation(generateAIRecipesMutation, qc);
