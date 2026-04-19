import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addRecipeMutation,
  generateAIRecipesMutation,
  allRecipesQuery,
  currentUserQuery,
  loginMutation,
  logoutMutation,
  qc,
  recipeQuery,
  removeRecipeMutation,
  signupMutation,
  updateRecipeMutation,
  aiRecipesQuery,
  uploadImageMutation,
} from "@/services/api";

// User / Auth Hooks
export const useCurrentUser = () => useQuery(currentUserQuery, qc);
export const useSignup = () => useMutation(signupMutation, qc);
export const useLogin = () => useMutation(loginMutation, qc);
export const useLogout = () => useMutation(logoutMutation, qc);

// Recipe Hooks
export const useRecipe = (id: number) => useQuery(recipeQuery(id), qc);
export const useAllRecipes = () => useQuery(allRecipesQuery, qc);
export const useAddRecipe = () => useMutation(addRecipeMutation, qc);
export const useRemoveRecipe = () => useMutation(removeRecipeMutation, qc);
export const useUpdateRecipe = () => useMutation(updateRecipeMutation, qc);

// AI Hooks
export const useAIRecipes = () => useQuery(aiRecipesQuery, qc);
export const useGenerateAIRecipes = () =>
  useMutation(generateAIRecipesMutation, qc);

// Image Hooks
export const useUploadImage = () => useMutation(uploadImageMutation, qc);