import { qc, RecipeCardData, recipes_DummyData } from "@/lib/state";
import { useMutation, useQuery } from "@tanstack/react-query"
import { recipesAPI } from "@/services/api";


export function useRecipe(id?: number) {
    return useQuery({
        queryKey: ["recipes", id],
        queryFn: async () => {
            const response = await recipesAPI.getById(id!);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useAllRecipes() {
    return useQuery({
        queryKey: ["recipes"],
        queryFn: async () => {
            const response = await recipesAPI.getAll();
            return response.data;
        },
    });
}

export function useAddRecipe() {
    return useMutation({
        mutationFn: async (recipe: RecipeCardData) => {
            qc.setQueryData(["recipes", recipe.id], recipe);
            await qc.invalidateQueries({ queryKey: ["recipeIds"] });
        },
    });
}

export function useRemoveRecipe() {
    return useMutation({
        mutationFn: async (id: number) => {
            qc.removeQueries({ queryKey: ["recipes", id] });
            qc.setQueryData(["planIds"], (ids: number[] | undefined) =>
                ids?.filter((it) => it !== id)
            );
            qc.setQueryData(["feedIds"], (ids: number[] | undefined) =>
                ids?.filter((it) => it !== id)
            );
            await qc.invalidateQueries({ queryKey: ["recipeIds"] });
        },
    });
}

export function useUpdateRecipe() {
    return useMutation({
        mutationFn: async (recipe: RecipeCardData) => {
            qc.setQueryData(["recipes", recipe.id], recipe);
            await qc.invalidateQueries({ queryKey: ["recipeIds"] });
        },
    });
}

export function useRecipeIds() {
    return useQuery({
        queryKey: ["recipeIds"],
        queryFn: async () => {
            const response = await recipesAPI.getAll();
            console.log(response.data);
            console.log("Am I executing?");
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
            return response.data.map(r => r.id);
        },
    });
}

export function usePlanIds() {
    return useQuery({
        queryKey: ["planIds"],
        queryFn: () => qc.getQueryData(["planIds"]) as number[],
        enabled: true,
        initialData: [] as number[],
    });
}

export function useAddToPlan() {
    return useMutation({
        mutationFn: async (id: number) => {
            qc.setQueryData(["planIds"], (ids: number[]) => [...ids, id])
            await qc.invalidateQueries({ queryKey: ["planIds"] });
        },
    });
}

export function useRemoveFromPlan() {
    return useMutation({
        mutationFn: async (id: number) => {
            qc.setQueryData(["planIds"], (ids: number[]) => ids.filter((it) => it !== id))
            await qc.invalidateQueries({ queryKey: ["planIds"] });
        },
    });
}
