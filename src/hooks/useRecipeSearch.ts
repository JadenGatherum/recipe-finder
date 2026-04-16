import { useCallback, useEffect, useReducer } from "react";
import { searchRecipesByIngredients } from "../utils/api";
import type { RecipeSummary } from "../types";

type SearchState = {
  inputValue: string;
  ingredients: string[];
  results: RecipeSummary[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
};

const STORAGE_KEY = "recipe_finder_search_state_v1";

const initialSearchState: SearchState = {
  inputValue: "",
  ingredients: [],
  results: [],
  isLoading: false,
  error: null,
  hasSearched: false,
};

type PersistedSearchState = Pick<SearchState, "inputValue" | "ingredients" | "results" | "hasSearched">;

type SearchAction =
  | { type: "SET_INPUT"; value: string }
  | { type: "ADD_INGREDIENT"; ingredient: string }
  | { type: "REMOVE_INGREDIENT"; index: number }
  | { type: "SEARCH_START" }
  | { type: "SEARCH_SUCCESS"; results: RecipeSummary[] }
  | { type: "SEARCH_ERROR"; message: string }
  | { type: "RESTORE"; value: PersistedSearchState };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, inputValue: action.value };
    case "ADD_INGREDIENT": {
      const trimmed = action.ingredient.trim();
      if (!trimmed) return state;
      if (state.ingredients.includes(trimmed)) {
        return { ...state, inputValue: "" };
      }
      return {
        ...state,
        ingredients: [...state.ingredients, trimmed],
        inputValue: "",
      };
    }
    case "REMOVE_INGREDIENT":
      return {
        ...state,
        ingredients: state.ingredients.filter((_, i) => i !== action.index),
      };
    case "SEARCH_START":
      return { ...state, isLoading: true, error: null, hasSearched: true, results: [] };
    case "SEARCH_SUCCESS":
      return { ...state, isLoading: false, results: action.results, error: null, hasSearched: true };
    case "SEARCH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.message,
        hasSearched: true,
        results: [],
      };
    case "RESTORE":
      return {
        ...state,
        inputValue: action.value.inputValue,
        ingredients: action.value.ingredients,
        results: action.value.results,
        hasSearched: action.value.hasSearched,
      };
    default:
      return state;
  }
}

function isValidIngredientToken(value: string): boolean {
  return !/[0-9]/.test(value);
}

function readPersistedState(): PersistedSearchState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const maybe = parsed as Partial<PersistedSearchState>;
    if (!Array.isArray(maybe.ingredients) || !Array.isArray(maybe.results)) return null;

    const ingredients = maybe.ingredients.filter((x): x is string => typeof x === "string");
    const results = maybe.results.filter(
      (r): r is RecipeSummary => !!r && typeof r === "object" && typeof (r as RecipeSummary).id === "number",
    );

    return {
      inputValue: typeof maybe.inputValue === "string" ? maybe.inputValue : "",
      ingredients,
      results,
      hasSearched: typeof maybe.hasSearched === "boolean" ? maybe.hasSearched : false,
    };
  } catch {
    return null;
  }
}

function persistState(state: PersistedSearchState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / disabled storage errors; app still works without persistence.
  }
}

export function useRecipeSearch() {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState, (initial) => {
    const restored = readPersistedState();
    return restored ? searchReducer(initial, { type: "RESTORE", value: restored }) : initial;
  });

  useEffect(() => {
    persistState({
      inputValue: state.inputValue,
      ingredients: state.ingredients,
      results: state.results,
      hasSearched: state.hasSearched,
    });
  }, [state.inputValue, state.ingredients, state.results, state.hasSearched]);

  const setInputValue = useCallback((value: string) => {
    dispatch({ type: "SET_INPUT", value });
  }, []);

  const addIngredient = useCallback(() => {
    if (!isValidIngredientToken(state.inputValue)) return;
    dispatch({ type: "ADD_INGREDIENT", ingredient: state.inputValue });
  }, [state.inputValue]);

  const removeIngredient = useCallback((index: number) => {
    dispatch({ type: "REMOVE_INGREDIENT", index });
  }, []);

  const search = useCallback(async () => {
    if (state.ingredients.length === 0) {
      dispatch({ type: "SEARCH_ERROR", message: "Add at least one ingredient before searching." });
      return;
    }
    dispatch({ type: "SEARCH_START" });
    const result = await searchRecipesByIngredients(state.ingredients);
    if (result.ok === false) {
      dispatch({ type: "SEARCH_ERROR", message: result.error });
      return;
    }
    dispatch({ type: "SEARCH_SUCCESS", results: result.data });
  }, [state.ingredients]);

  return {
    inputValue: state.inputValue,
    setInputValue,
    ingredients: state.ingredients,
    addIngredient,
    removeIngredient,
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    hasSearched: state.hasSearched,
    search,
  };
}
