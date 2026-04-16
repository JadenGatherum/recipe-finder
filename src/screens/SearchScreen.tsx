import type { FormEvent } from "react";
import { useState } from "react";
import { RecipeCard } from "../components/RecipeCard";
import { Spinner } from "../components/Spinner";
import { useFavorites } from "../hooks/useFavorites";
import { useRecipeSearch } from "../hooks/useRecipeSearch";
import TextInput from "../components/TextInput";
import { fetchRecipeById } from "../utils/api";
import type { RecipeSummary } from "../types";

export function SearchScreen() {
  const {
    inputValue,
    setInputValue,
    ingredients,
    addIngredient,
    removeIngredient,
    results,
    isLoading,
    error,
    hasSearched,
    search,
  } = useRecipeSearch();

  const { addToSaved, isSaved } = useFavorites();
  const [savingId, setSavingId] = useState<number | null>(null);

  const showInputError = inputValue.length > 0 && /[0-9]/.test(inputValue);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (showInputError) return;
    addIngredient();
  };

  const handleSaveCard = async (summary: RecipeSummary) => {
    if (isSaved(summary.id)) return;
    setSavingId(summary.id);
    const res = await fetchRecipeById(summary.id);
    setSavingId(null);
    if (res.ok) {
      addToSaved(res.data);
    }
  };

  return (
    <div className="screen screen--search">
      <h1 className="screen__title">Find recipes by ingredients</h1>
      <p className="screen__lead">Add ingredients one at a time, then search Spoonacular.</p>

      <form className="ingredient-form" onSubmit={handleAdd}>
        <TextInput
          label="Ingredient"
          value={inputValue}
          onChange={setInputValue}
          showError={showInputError}
          errorMessage="Ingredients cannot contain digits."
        />
        <div className="ingredient-form__row">
          <button type="submit" className="btn btn--secondary">
            Add ingredient
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void search()}
            disabled={isLoading || ingredients.length === 0}
          >
            Search recipes
          </button>
        </div>
      </form>

      {ingredients.length > 0 ? (
        <ul className="chip-list" aria-label="Ingredients to use">
          {ingredients.map((ing, index) => (
            <li key={`${ing}-${index}`} className="chip">
              <span>{ing}</span>
              <button
                type="button"
                className="chip__remove"
                onClick={() => removeIngredient(index)}
                aria-label={`Remove ${ing}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No ingredients yet — add one above.</p>
      )}

      {error ? <p className="error-banner">{error}</p> : null}

      {isLoading ? <Spinner label="Searching recipes…" /> : null}

      {!isLoading && !error && results.length === 0 && !hasSearched ? (
        <p className="muted empty-state">Results will appear here after you search.</p>
      ) : null}

      {!isLoading && !error && results.length === 0 && hasSearched ? (
        <p className="muted empty-state">No recipes matched those ingredients. Try different ones.</p>
      ) : null}

      {!isLoading && !error && results.length > 0 ? (
        <>
        <p className="results-caption muted" role="status">
          Top 12 results
          {results.length < 12 ? ` · ${results.length} found` : ""}.
        </p>
        <div className="recipe-grid">
          {results.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              action={
                <button
                  type="button"
                  className="btn btn--small"
                  disabled={isSaved(r.id) || savingId === r.id}
                  onClick={() => void handleSaveCard(r)}
                >
                  {isSaved(r.id) ? "Saved" : savingId === r.id ? "Saving…" : "Save"}
                </button>
              }
            />
          ))}
        </div>
        </>
      ) : null}
    </div>
  );
}
