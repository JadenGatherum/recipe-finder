import { useContext } from "react";
import { RecipesContext, type RecipesContextValue } from "../context/recipes-context";

export function useRecipesContext(): RecipesContextValue {
  const ctx = useContext(RecipesContext);
  if (!ctx) {
    throw new Error("useRecipesContext must be used within RecipesProvider");
  }
  return ctx;
}
