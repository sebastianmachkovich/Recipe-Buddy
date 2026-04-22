import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addRecipeMutation,
  generateAIRecipesMutation,
  allRecipesQuery,
  currentUserQuery,
  loginMutation,
  logoutMutation,
  qc,
  removeRecipeMutation,
  signupMutation,
  updateRecipeMutation,
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
export const useAddRecipe = () => useMutation(addRecipeMutation, qc);
export const useRemoveRecipe = () => useMutation(removeRecipeMutation, qc);
export const useUpdateRecipe = () => useMutation(updateRecipeMutation, qc);

// AI Hooks
export const useAIRecipes = () => useQuery(aiRecipesQuery, qc);
export const useGenerateAIRecipes = () =>
  useMutation(generateAIRecipesMutation, qc);

