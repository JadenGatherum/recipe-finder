import type { Recipe, RecipeSummary } from "../types";

const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function errToString(e: unknown): string {
  if (e && typeof e === "object" && "kind" in e) {
    const o = e as { kind: string; message?: string; status?: number; statusText?: string };
    if (o.kind === "http") return `Request failed (${o.status ?? "?"} ${o.statusText ?? ""})`.trim();
    if (o.kind === "network") return o.message ?? "Network error";
    if (o.kind === "parse") return o.message ?? "Could not read response";
  }
  return String(e);
}

export async function searchRecipesByIngredients(ingredients: string[]): Promise<Result<RecipeSummary[]>> {
  if (!apiKey) {
    return { ok: false, error: "Missing VITE_SPOONACULAR_API_KEY in .env" };
  }
  const ingredientsParam = ingredients.map((s) => s.trim()).filter(Boolean).join(",");
  if (!ingredientsParam) {
    return { ok: false, error: "Add at least one ingredient." };
  }
  const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
    ingredientsParam,
  )}&number=12&apiKey=${apiKey}`;

  const result = await fetchJsonUnknown(url);
  if (result.ok === false) {
    return { ok: false, error: errToString(result.error) };
  }
  const parsed = parseFindByIngredients(result.data);
  return { ok: true, data: parsed };
}

export async function fetchRecipeById(id: number): Promise<Result<Recipe>> {
  if (!apiKey) {
    return { ok: false, error: "Missing VITE_SPOONACULAR_API_KEY in .env" };
  }
  const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${apiKey}`;
  const result = await fetchJsonUnknown(url);
  if (result.ok === false) {
    return { ok: false, error: errToString(result.error) };
  }
  const recipe = parseRecipeInformation(result.data);
  if (!recipe) {
    return { ok: false, error: "Could not parse recipe from API." };
  }
  return { ok: true, data: recipe };
}

function parseFindByIngredients(data: unknown): RecipeSummary[] {
  if (!Array.isArray(data)) return [];
  const out: RecipeSummary[] = [];
  for (const x of data) {
    if (typeof x !== "object" || x === null) continue;
    const o = x as Record<string, unknown>;
    if (typeof o.id !== "number" || typeof o.title !== "string") continue;
    out.push({
      id: o.id,
      title: o.title,
      image: typeof o.image === "string" ? o.image : "",
    });
  }
  return out;
}

function parseRecipeInformation(data: unknown): Recipe | null {
  if (typeof data !== "object" || data === null) return null;
  const o = data as Record<string, unknown>;
  if (typeof o.id !== "number" || typeof o.title !== "string") return null;

  const image = typeof o.image === "string" ? o.image : "";
  const readyInMinutes = typeof o.readyInMinutes === "number" ? o.readyInMinutes : 0;
  const servings = typeof o.servings === "number" ? o.servings : 1;

  const diets: string[] = [];
  if (Array.isArray(o.diets)) {
    for (const d of o.diets) {
      if (typeof d === "string") diets.push(d);
    }
  } else {
    if (o.vegetarian === true) diets.push("vegetarian");
    if (o.vegan === true) diets.push("vegan");
    if (o.glutenFree === true) diets.push("gluten free");
    if (o.dairyFree === true) diets.push("dairy free");
  }

  const ingredients: Recipe["ingredients"] = [];
  if (Array.isArray(o.extendedIngredients)) {
    for (const ing of o.extendedIngredients) {
      if (typeof ing !== "object" || ing === null) continue;
      const e = ing as Record<string, unknown>;
      const id = typeof e.id === "number" ? e.id : 0;
      const name = typeof e.name === "string" ? e.name : "Ingredient";
      const amount = typeof e.amount === "number" ? e.amount : 0;
      const unit = typeof e.unit === "string" ? e.unit : "";
      ingredients.push({ id, name, amount, unit });
    }
  }

  const instructionSteps: Recipe["instructionSteps"] = [];
  if (Array.isArray(o.analyzedInstructions)) {
    for (const block of o.analyzedInstructions) {
      if (typeof block !== "object" || block === null) continue;
      const b = block as Record<string, unknown>;
      if (!Array.isArray(b.steps)) continue;
      for (const s of b.steps) {
        if (typeof s !== "object" || s === null) continue;
        const st = s as Record<string, unknown>;
        const number = typeof st.number === "number" ? st.number : instructionSteps.length + 1;
        const step = typeof st.step === "string" ? st.step : "";
        if (step) instructionSteps.push({ number, step });
      }
    }
  }

  const nutrition = parseNutrition(o.nutrition);

  return {
    id: o.id,
    title: o.title,
    image,
    readyInMinutes,
    servings,
    diets,
    nutrition,
    ingredients,
    instructionSteps,
  };
}

function parseNutrition(n: unknown): Recipe["nutrition"] {
  const fallback: Recipe["nutrition"] = {
    calories: 0,
    protein: "—",
    fat: "—",
    carbs: "—",
  };
  if (typeof n !== "object" || n === null) return fallback;
  const nutrients = (n as { nutrients?: unknown }).nutrients;
  if (!Array.isArray(nutrients)) return fallback;

  const list = nutrients as Array<{ name?: string; amount?: number; unit?: string }>;
  const find = (needle: string) =>
    list.find((x) => typeof x.name === "string" && x.name.toLowerCase() === needle.toLowerCase());

  const cal = find("Calories");
  const protein = find("Protein");
  const fat = find("Fat");
  const carbs = find("Carbohydrates");

  return {
    calories: cal?.amount != null ? Math.round(cal.amount) : 0,
    protein:
      protein && protein.amount != null
        ? `${Math.round(protein.amount * 10) / 10}${protein.unit ?? "g"}`
        : "—",
    fat: fat && fat.amount != null ? `${Math.round(fat.amount * 10) / 10}${fat.unit ?? "g"}` : "—",
    carbs:
      carbs && carbs.amount != null ? `${Math.round(carbs.amount * 10) / 10}${carbs.unit ?? "g"}` : "—",
  };
}

type FetchError =
  | { kind: "network"; message: string }
  | { kind: "http"; status: number; statusText: string }
  | { kind: "parse"; message: string };

type FetchResult<T> = { ok: true; data: T } | { ok: false; error: FetchError };

async function fetchJsonUnknown(url: string): Promise<FetchResult<unknown>> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        ok: false,
        error: { kind: "http", status: res.status, statusText: res.statusText },
      };
    }
    try {
      const data: unknown = await res.json();
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: { kind: "parse", message: String(e) } };
    }
  } catch (e) {
    return { ok: false, error: { kind: "network", message: String(e) } };
  }
}
