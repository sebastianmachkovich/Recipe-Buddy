import { qc, RecipeCardData, recipes_DummyData } from "@/lib/state";
import { useMutation, useQuery } from "@tanstack/react-query"

export function useRecipe(id?: number) {
    return useQuery({
        queryKey: ["recipes", id],
        queryFn: () => id === undefined
            ? undefined
            : qc.getQueryData(["recipes", id]) as RecipeCardData,
        enabled: !!id,
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
        queryFn: () => qc.getQueriesData({ queryKey: ["recipes"] })
            .map(([, data]) => (data as RecipeCardData)?.id)
            .filter((it) => it > 0),
        enabled: true,
        initialData: recipes_DummyData.map((it) => it.id),
    });
}

export function useFeedIds() {
    return useQuery({
        queryKey: ["feedIds"],
        queryFn: () => qc.getQueryData(["feedIds"]) as number[],
        enabled: true,
        initialData: [1, -1, 5] as number[],
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
