import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { RecipeCardData } from "./state";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function deepCopyRecipe(
  recipe: RecipeCardData | undefined,
  newId: number,
): RecipeCardData {
  if (recipe) {
    return {
      ...recipe,
      ingredients: recipe.ingredients.map((it) => ({ ...it })),
      steps: recipe.steps.map((it) => ({
        ...it,
        time: it.time ? { ...it.time } : undefined,
      })),
    };
  }
  return {
    id: newId,
    name: "",
    description: "",
    imgUrl: "",
    rating: 0,
    ingredients: [],
    steps: [],
  };
}

