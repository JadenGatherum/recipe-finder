import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Recipe } from "../types";
import { RecipesContext, type RecipesContextValue } from "./recipes-context";

const STORAGE_SAVED = "recipe_finder_saved";
const STORAGE_STARRED = "recipe_finder_starred";

type RecipesState = {
  savedRecipes: Recipe[];
  starredIds: number[];
};

type RecipesAction =
  | { type: "HYDRATE"; savedRecipes: Recipe[]; starredIds: number[] }
  | { type: "ADD_SAVED"; recipe: Recipe }
  | { type: "REMOVE_SAVED"; id: number }
  | { type: "TOGGLE_STAR"; recipe: Recipe };

function recipesReducer(state: RecipesState, action: RecipesAction): RecipesState {
  switch (action.type) {
    case "HYDRATE":
      return { savedRecipes: action.savedRecipes, starredIds: action.starredIds };
    case "ADD_SAVED": {
      if (state.savedRecipes.some((r) => r.id === action.recipe.id)) return state;
      return { ...state, savedRecipes: [...state.savedRecipes, action.recipe] };
    }
    case "REMOVE_SAVED": {
      return {
        savedRecipes: state.savedRecipes.filter((r) => r.id !== action.id),
        starredIds: state.starredIds.filter((sid) => sid !== action.id),
      };
    }
    case "TOGGLE_STAR": {
      const { recipe } = action;
      let savedRecipes = state.savedRecipes;
      if (!savedRecipes.some((r) => r.id === recipe.id)) {
        savedRecipes = [...savedRecipes, recipe];
      }
      const starred = state.starredIds.includes(recipe.id);
      const starredIds = starred
        ? state.starredIds.filter((id) => id !== recipe.id)
        : [...state.starredIds, recipe.id];
      return { ...state, savedRecipes, starredIds };
    }
    default:
      return state;
  }
}

function loadInitialState(): RecipesState {
  try {
    const rawSaved = localStorage.getItem(STORAGE_SAVED);
    const rawStarred = localStorage.getItem(STORAGE_STARRED);
    const savedRecipes = rawSaved ? (JSON.parse(rawSaved) as unknown) : [];
    const starredIds = rawStarred ? (JSON.parse(rawStarred) as unknown) : [];
    if (!Array.isArray(savedRecipes) || !Array.isArray(starredIds)) {
      return { savedRecipes: [], starredIds: [] };
    }
    return {
      savedRecipes: savedRecipes as Recipe[],
      starredIds: starredIds.filter((x): x is number => typeof x === "number"),
    };
  } catch {
    return { savedRecipes: [], starredIds: [] };
  }
}

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(recipesReducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED, JSON.stringify(state.savedRecipes));
      localStorage.setItem(STORAGE_STARRED, JSON.stringify(state.starredIds));
    } catch {
      /* ignore quota errors */
    }
  }, [state.savedRecipes, state.starredIds]);

  const addToSaved = useCallback((recipe: Recipe) => {
    dispatch({ type: "ADD_SAVED", recipe });
  }, []);

  const removeFromSaved = useCallback((id: number) => {
    dispatch({ type: "REMOVE_SAVED", id });
  }, []);

  const toggleStar = useCallback((recipe: Recipe) => {
    dispatch({ type: "TOGGLE_STAR", recipe });
  }, []);

  const isSaved = useCallback(
    (id: number) => state.savedRecipes.some((r) => r.id === id),
    [state.savedRecipes],
  );

  const isStarred = useCallback(
    (id: number) => state.starredIds.includes(id),
    [state.starredIds],
  );

  const starredRecipes = useMemo(
    () => state.savedRecipes.filter((r) => state.starredIds.includes(r.id)),
    [state.savedRecipes, state.starredIds],
  );

  const value = useMemo<RecipesContextValue>(
    () => ({
      savedRecipes: state.savedRecipes,
      starredIds: state.starredIds,
      starredRecipes,
      addToSaved,
      removeFromSaved,
      toggleStar,
      isSaved,
      isStarred,
    }),
    [
      state.savedRecipes,
      state.starredIds,
      starredRecipes,
      addToSaved,
      removeFromSaved,
      toggleStar,
      isSaved,
      isStarred,
    ],
  );

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}
