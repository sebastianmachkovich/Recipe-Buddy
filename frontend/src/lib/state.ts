import { atom } from "jotai";


export const enum Tab {
    Home = "Home",
    Recipes = "Recipes",
}

export type RecipeCardData = {
  id: number;
  title: string;
  description: string;
  imgUrl: string;
  ingredients: Ingredient[];
};

export enum IngredientUnit {
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


export const tabAtom = atom(Tab.Home);
export const recipesOnCounterAtom = atom([] as RecipeCardData[]);
