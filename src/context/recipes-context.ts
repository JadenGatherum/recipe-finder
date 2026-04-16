import { createContext } from "react";
import type { Recipe } from "../types";

export type RecipesContextValue = {
  savedRecipes: Recipe[];
  starredIds: number[];
  starredRecipes: Recipe[];
  addToSaved: (recipe: Recipe) => void;
  removeFromSaved: (id: number) => void;
  toggleStar: (recipe: Recipe) => void;
  isSaved: (id: number) => boolean;
  isStarred: (id: number) => boolean;
};

export const RecipesContext = createContext<RecipesContextValue | null>(null);
