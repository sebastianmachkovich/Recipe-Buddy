import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Recipe } from "@/services/api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function deepCopyRecipe(
  recipe: Recipe | undefined,
  newId: number,
): Recipe {
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
    rating: 0,
    ingredients: [],
    steps: [],
  };
}

