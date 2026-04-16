import { useParams } from "react-router-dom";
import { RecipeDetailScreen } from "./RecipeDetailScreen";

/** Remount detail when :id changes so fetch state resets without sync setState in an effect. */
export function RecipeDetailRoute() {
  const { id } = useParams();
  return <RecipeDetailScreen key={id ?? ""} />;
}
