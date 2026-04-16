import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Spinner } from "../components/Spinner";
import { useFavorites } from "../hooks/useFavorites";
import type { Recipe } from "../types";
import { fetchRecipeById } from "../utils/api";

/** Spoonacular often includes "1. " at the start of each step; `<ol>` already numbers items. */
function stripLeadingStepNumber(text: string): string {
  return text.replace(/^\s*\d+\.\s*/, "").trim();
}

export function RecipeDetailScreen() {
  const { id } = useParams();
  const idNum = Number(id);
  const invalidId = id === undefined || !Number.isFinite(idNum);
  const location = useLocation();

  const from =
    location.state && typeof location.state === "object" && "from" in location.state
      ? (location.state as { from?: unknown }).from
      : undefined;
  const backTo = typeof from === "string" && from.length > 0 ? from : "/";
  const backLabel = backTo === "/favorites" ? "Saved" : "Search";

  const { addToSaved, toggleStar, isSaved, isStarred } = useFavorites();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(() => !invalidId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidId) return;

    let cancelled = false;

    void (async () => {
      const res = await fetchRecipeById(idNum);
      if (cancelled) return;
      if (res.ok === true) {
        setRecipe(res.data);
        setError(null);
      } else {
        setError(res.error);
        setRecipe(null);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [idNum, invalidId]);

  const handleRetry = () => {
    if (invalidId) return;
    setLoading(true);
    setError(null);
    void (async () => {
      const res = await fetchRecipeById(idNum);
      if (res.ok === true) {
        setRecipe(res.data);
      } else {
        setError(res.error);
        setRecipe(null);
      }
      setLoading(false);
    })();
  };

  if (invalidId) {
    return (
      <div className="screen">
        <p className="error-banner">Invalid recipe id.</p>
        <p>
          <Link to={backTo}>{`Back to ${backLabel.toLowerCase()}`}</Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="screen">
        <Spinner label="Loading recipe…" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="screen">
        <p className="error-banner">{error ?? "Recipe not found."}</p>
        <button type="button" className="btn btn--secondary" onClick={handleRetry}>
          Try again
        </button>
        <p>
          <Link to={backTo}>{`Back to ${backLabel.toLowerCase()}`}</Link>
        </p>
      </div>
    );
  }

  const img = recipe.image || `https://img.spoonacular.com/recipes/${recipe.id}-312x231.jpg`;
  const saved = isSaved(recipe.id);

  return (
    <div className="screen screen--detail">
      <Link to={backTo} className="back-link">
        {`← Back to ${backLabel.toLowerCase()}`}
      </Link>

      <div className="detail-hero">
        <img src={img} alt="" className="detail-hero__image" />
        <div className="detail-hero__text">
          <h1 className="detail-title">{recipe.title}</h1>
          <p className="detail-meta">
            {recipe.readyInMinutes} min · {recipe.servings} servings
          </p>
          {recipe.diets.length > 0 ? (
            <p className="detail-diets">{recipe.diets.join(" · ")}</p>
          ) : null}
          <div className="detail-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => addToSaved(recipe)}
              disabled={saved}
            >
              {saved ? "Saved" : "Save recipe"}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={!saved}
              onClick={() => toggleStar(recipe)}
              title={!saved ? "Save the recipe before starring" : undefined}
            >
              {isStarred(recipe.id) ? "★ Starred" : "☆ Star"}
            </button>
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h2>Nutrition (per serving)</h2>
        <ul className="detail-nutrition">
          <li>
            <span>Calories</span> <strong>{recipe.nutrition.calories}</strong>
          </li>
          <li>
            <span>Protein</span> <strong>{recipe.nutrition.protein}</strong>
          </li>
          <li>
            <span>Carbs</span> <strong>{recipe.nutrition.carbs}</strong>
          </li>
          <li>
            <span>Fat</span> <strong>{recipe.nutrition.fat}</strong>
          </li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>Ingredients</h2>
        <ul className="detail-ingredients">
          {recipe.ingredients.map((ing, i) => (
            <li key={`${ing.id}-${ing.name}-${i}`}>
              {ing.amount} {ing.unit} {ing.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h2>Instructions</h2>
        {recipe.instructionSteps.length === 0 ? (
          <p className="muted">No step-by-step instructions were provided for this recipe.</p>
        ) : (
          <ol className="detail-steps">
            {recipe.instructionSteps.map((s, i) => (
              <li key={`${s.number}-${i}`}>{stripLeadingStepNumber(s.step)}</li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
