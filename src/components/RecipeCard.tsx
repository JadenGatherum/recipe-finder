import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RecipeSummary } from "../types";

interface RecipeCardProps {
  recipe: RecipeSummary;
  /** Secondary action (e.g. Save) shown on the card */
  action?: ReactNode;
  starred?: boolean;
}

export function RecipeCard({ recipe, action, starred }: RecipeCardProps) {
  const img = recipe.image || `https://img.spoonacular.com/recipes/${recipe.id}-312x231.jpg`;

  return (
    <article className={`recipe-card ${starred ? "recipe-card--starred" : ""}`}>
      <Link to={`/recipe/${recipe.id}`} className="recipe-card__link">
        <div className="recipe-card__image-wrap">
          <img src={img} alt="" className="recipe-card__image" loading="lazy" />
        </div>
        <h3 className="recipe-card__title">{recipe.title}</h3>
      </Link>
      {action ? <div className="recipe-card__actions">{action}</div> : null}
    </article>
  );
}
