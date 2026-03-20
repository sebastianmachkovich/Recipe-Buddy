import { QueryClient } from "@tanstack/react-query";

export type RecipeCardData = {
  id: number;
  name: string;
  description: string;
  imgUrl: string;
  rating: number;
  ingredients: Ingredient[];
  steps: Step[];
};

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
};

export type Ingredient = {
    id: number;
    name: string;
    amount: number;
    unit?: IngredientUnit;
};

export type Step = {
    id: number;
    description: string;
    time?: {
        hours: number;
        minutes: number;
    }
};

export const qc = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            gcTime: Infinity,
        },
    },
});
