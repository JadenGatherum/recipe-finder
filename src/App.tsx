import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./recipe-app.css";
import { RecipesProvider } from "./context/RecipesProvider";
import { Layout } from "./components/Layout";
import { FavoritesScreen } from "./screens/FavoritesScreen";
import { RecipeDetailRoute } from "./screens/RecipeDetailRoute";
import { SearchScreen } from "./screens/SearchScreen";

function App() {
  return (
    <BrowserRouter>
      <RecipesProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<SearchScreen />} />
            <Route path="/recipe/:id" element={<RecipeDetailRoute />} />
            <Route path="/favorites" element={<FavoritesScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </RecipesProvider>
    </BrowserRouter>
  );
}

export default App;
