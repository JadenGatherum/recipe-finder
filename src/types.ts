export interface RecipeSummary {
  id: number;
  title: string;
  image: string;
}

export interface Recipe extends RecipeSummary {
  readyInMinutes: number;
  servings: number;
  diets: string[];
  nutrition: Nutrition;
  ingredients: Ingredient[];
  instructionSteps: InstructionStep[];
}

export interface Nutrition {
  calories: number;
  protein: string;
  fat: string;
  carbs: string;
}

export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
}

export interface InstructionStep {
  number: number;
  step: string;
}
