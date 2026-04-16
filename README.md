# Recipe Finder

Single-page React + TypeScript app (Vite) that searches Spoonacular for recipes by ingredients, shows full recipe details (nutrition, ingredients, steps), and lets you save favorites and star recipes. Saved and starred data persist in **localStorage** for this browser.

## Run locally

1. **Node.js** 20+ recommended.

2. Create a `.env` file in the project root:

   ```bash
   VITE_SPOONACULAR_API_KEY=your_key_here
   ```

   Get a key from [Spoonacular](https://spoonacular.com/food-api). The app reads the key only via `import.meta.env.VITE_SPOONACULAR_API_KEY` (never commit the real key).

3. Install and start:

   ```bash
   npm install
   npm run dev
   ```

4. Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## API and data flow

- **Spoonacular**
  - `GET /recipes/findByIngredients` — search by a list of ingredients (comma-separated in the query).
  - `GET /recipes/{id}/information?includeNutrition=true` — full recipe + nutrition for the detail view and when saving from a card.
- Responses are parsed into app types (`RecipeSummary`, `Recipe`, etc.). API helpers return a `Result<T>` union (`ok` + `data` or `error` string) for predictable error handling in the UI.

## Features

- **Search** — Add ingredients one at a time (chips), then search; results as a responsive card grid with save.
- **Recipe detail** — Image, title, time, servings, diets, nutrition, ingredients, instructions; save and star (star enabled only after the recipe is saved).
- **Saved** (`/favorites`) — All saved recipes; optional “starred only” filter; remove or toggle star.
- **Persistence** — `recipe_finder_saved` and `recipe_finder_starred` in `localStorage`.
- **Routing** — `/`, `/recipe/:id`, `/favorites` via React Router.

## Project layout

- `src/utils/api.ts` — Spoonacular calls + `Result` helpers  
- `src/hooks/useRecipeSearch.ts` — search UI state (`useReducer`)  
- `src/context/RecipesProvider.tsx` — saved/starred state (`useReducer`) + persistence  
- `src/hooks/useFavorites.ts` — thin wrapper around the recipes context  
- `src/screens/` — Search, detail, saved list  
- `src/components/` — Layout, cards, spinner  

## Deploy

Build static assets with `npm run build` and host the `dist/` folder on GitHub Pages, Netlify, Vercel, or similar. If the host serves the app from a subpath, set the Vite `base` option in `vite.config.ts` accordingly.
