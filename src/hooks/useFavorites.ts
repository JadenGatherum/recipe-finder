import { useRecipesContext } from "./useRecipesContext";

/** Saved recipes + starred IDs + helpers (backed by RecipesProvider / localStorage). */
export function useFavorites() {
  return useRecipesContext();
}
