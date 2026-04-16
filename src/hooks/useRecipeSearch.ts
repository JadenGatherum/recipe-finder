import { useCallback, useReducer } from "react";
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

const initialSearchState: SearchState = {
  inputValue: "",
  ingredients: [],
  results: [],
  isLoading: false,
  error: null,
  hasSearched: false,
};

type SearchAction =
  | { type: "SET_INPUT"; value: string }
  | { type: "ADD_INGREDIENT"; ingredient: string }
  | { type: "REMOVE_INGREDIENT"; index: number }
  | { type: "SEARCH_START" }
  | { type: "SEARCH_SUCCESS"; results: RecipeSummary[] }
  | { type: "SEARCH_ERROR"; message: string };

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
    default:
      return state;
  }
}

function isValidIngredientToken(value: string): boolean {
  return !/[0-9]/.test(value);
}

export function useRecipeSearch() {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);

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
    if (!result.ok) {
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
