import { useMemo, useState } from "react";
import { RecipeCard } from "../components/RecipeCard";
import { useFavorites } from "../hooks/useFavorites";

export function FavoritesScreen() {
  const { savedRecipes, starredRecipes, removeFromSaved, toggleStar, isStarred } = useFavorites();
  const [starredOnly, setStarredOnly] = useState(false);

  const list = useMemo(
    () => (starredOnly ? starredRecipes : savedRecipes),
    [starredOnly, starredRecipes, savedRecipes],
  );

  return (
    <div className="screen screen--favorites">
      <h1 className="screen__title">Saved recipes</h1>
      <p className="screen__lead">Recipes are stored in this browser.</p>

      <div className="favorites-toolbar">
        <label className="toggle">
          <input
            type="checkbox"
            checked={starredOnly}
            onChange={(e) => setStarredOnly(e.target.checked)}
          />
          Show starred only
        </label>
      </div>

      {list.length === 0 ? (
        <p className="muted empty-state">
          {starredOnly
            ? "No starred recipes yet. Star some from your saved list."
            : "No saved recipes yet. Save some from search or detail."}
        </p>
      ) : (
        <div className="recipe-grid">
          {list.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              starred={isStarred(r.id)}
              action={
                <div className="card-actions">
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => removeFromSaved(r.id)}
                  >
                    Remove
                  </button>
                  <button type="button" className="btn btn--small" onClick={() => toggleStar(r)}>
                    {isStarred(r.id) ? "★" : "☆"}
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
