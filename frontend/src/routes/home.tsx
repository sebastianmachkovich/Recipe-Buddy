import RecommentationCard from "@/components/RecommendationCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Camera, Sparkles, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useFeedIds } from "@/hooks/queries";
import {
  AIImageRecipeResponse,
  AIRecipeResponse,
  AIRecipeSuggestion,
  aiAPI,
} from "@/services/api";

function getApiErrorMessage(error: unknown): string | null {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response
    ?.data?.detail;

  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const items = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
    return items.length > 0 ? items.join("; ") : null;
  }
  if (typeof detail === "object") {
    if ("msg" in (detail as Record<string, unknown>)) {
      const msg = (detail as { msg?: unknown }).msg;
      if (typeof msg === "string") return msg;
    }
    return "Request failed. Please try again.";
  }
  return null;
}

function HomePage() {
  const { data: recommendations, isLoading } = useFeedIds();
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [activeModelLabel, setActiveModelLabel] = useState("");
  const [aiResult, setAiResult] = useState<AIRecipeSuggestion[] | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const ingredientList = useMemo(
    () =>
      ingredientsInput
        .split(/,|\n/g)
        .map((item) => item.trim())
        .filter(Boolean),
    [ingredientsInput],
  );

  const aiRecipesMutation = useMutation({
    mutationFn: async () => {
      const response = await aiAPI.generateRecipes({
        ingredients: ingredientList,
        max_recipes: 5,
      });
      return response.data;
    },
    onSuccess: (data: AIRecipeResponse) => {
      setDetectedIngredients([]);
      setActiveModelLabel(data.model);
      setAiResult(data.recipes);
    },
  });

  const aiImageRecipesMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("max_recipes", "5");

      const response = await aiAPI.generateRecipesFromImage(formData);
      return response.data;
    },
    onSuccess: (data: AIImageRecipeResponse) => {
      setDetectedIngredients(data.detected_ingredients);
      setIngredientsInput(data.detected_ingredients.join(", "));
      setActiveModelLabel(`${data.vision_model} → ${data.recipe_model}`);
      setAiResult(data.recipes);
    },
  });

  const handleGenerate = () => {
    if (ingredientList.length === 0 || aiRecipesMutation.isPending) {
      return;
    }
    aiRecipesMutation.mutate();
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || aiImageRecipesMutation.isPending) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
    aiImageRecipesMutation.mutate(file, {
      onSettled: () => {
        event.target.value = "";
      },
    });
  };

  const isAnyMutationPending =
    aiRecipesMutation.isPending || aiImageRecipesMutation.isPending;

  const aiErrorMessage =
    getApiErrorMessage(aiImageRecipesMutation.error) ||
    getApiErrorMessage(aiRecipesMutation.error) ||
    "Could not generate recipes right now.";

  if (isLoading || !recommendations) return <div>Loading...</div>;
  return (
    <div className="mx-auto p-6 flex flex-col items-center gap-6 w-full">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Recipe Generator
          </CardTitle>
          <CardDescription>
            Add ingredients manually, upload a picture, or take a photo to auto-detect ingredients.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            id="upload-photo-input"
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="absolute -left-[9999px] h-px w-px opacity-0"
            onChange={handleImageSelect}
          />
          <input
            id="take-photo-input"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="absolute -left-[9999px] h-px w-px opacity-0"
            onChange={handleImageSelect}
          />

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" disabled={isAnyMutationPending}>
              <label htmlFor="upload-photo-input" className="cursor-pointer">
                <Upload className="size-4" /> Upload Photo
              </label>
            </Button>
            <Button asChild variant="outline" disabled={isAnyMutationPending}>
              <label htmlFor="take-photo-input" className="cursor-pointer">
                <Camera className="size-4" /> Take Photo
              </label>
            </Button>
          </div>

          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Uploaded ingredient preview"
              className="w-full max-h-64 object-cover rounded-md border"
            />
          )}

          <Textarea
            value={ingredientsInput}
            onChange={(event) => setIngredientsInput(event.target.value)}
            placeholder="Example: chickpeas, tomato, onion, garlic, cumin"
            className="min-h-28"
          />
          <Button
            onClick={handleGenerate}
            disabled={ingredientList.length === 0 || isAnyMutationPending}
          >
            {isAnyMutationPending ? "Generating..." : "Generate Recipes"}
          </Button>

          {(aiRecipesMutation.isError || aiImageRecipesMutation.isError) && (
            <p className="text-sm text-destructive">
              {aiErrorMessage}
            </p>
          )}

          {detectedIngredients.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Detected ingredients</p>
              <p className="text-sm text-muted-foreground">
                {detectedIngredients.join(", ")}
              </p>
            </div>
          )}

          {aiResult && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Generated by {activeModelLabel}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {aiResult.map(
                  (recipe: AIRecipeSuggestion, index: number) => (
                    <Card key={`${recipe.name}-${index}`}>
                      <CardHeader>
                        <CardTitle>{recipe.name}</CardTitle>
                        <CardDescription>{recipe.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="font-medium">Ingredients</p>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {recipe.ingredients.map((ingredient, ingredientIndex) => (
                              <li key={`${ingredient}-${ingredientIndex}`}>
                                {ingredient}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">Steps</p>
                          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                            {recipe.steps.map((step, stepIndex) => (
                              <li key={`${stepIndex}-${step}`}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {recommendations.map((id, i) => (
        <RecommentationCard key={i} recipeId={id} orientation={i % 2 === 0} />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/home")({ component: HomePage });
