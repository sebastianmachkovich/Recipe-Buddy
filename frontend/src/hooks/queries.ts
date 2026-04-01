import { useMutation, useQuery } from "@tanstack/react-query";
import {
    addRecipeMutation,
    addToPlanMutation,
    allRecipesQuery,
    currentUserQuery,
    loginMutation,
    logoutMutation,
    planIdsQuery,
    qc,
    recipeIdsQuery,
    recipeQuery,
    removeFromPlanMutation,
    removeRecipeMutation,
    signupMutation,
    updateRecipeMutation,
    uploadImageMutation
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
export const useRecipeIds = () => useQuery(recipeIdsQuery, qc);

// Plan Hooks
export const usePlanIds = (isAuthPage: boolean) => useQuery(planIdsQuery(isAuthPage), qc);
export const useAddToPlan = () => useMutation(addToPlanMutation, qc);
export const useRemoveFromPlan = () => useMutation(removeFromPlanMutation, qc);

// Hooks that should be removed
export const useUploadImage = () => useMutation(uploadImageMutation, qc);
