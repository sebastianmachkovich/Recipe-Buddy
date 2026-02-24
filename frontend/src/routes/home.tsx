import { recipesAtom, recommendationIdsAtom } from "@/lib/state";
import RecommentationCard from "@/components/RecommendationCard";
import { useAtomValue } from "jotai";
import { createFileRoute } from "@tanstack/react-router";

function HomePage() {
  const recipes = useAtomValue(recipesAtom);
  const recommendations = useAtomValue(recommendationIdsAtom);
  return (
    <div className="mx-auto p-6 flex flex-col items-center gap-6">
      {recommendations.map((id, i) => (
        <RecommentationCard
          key={i}
          recipe={recipes.find((recipe) => recipe.id === id)!}
          orientation={i % 2 === 0}
        />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/home")({ component: HomePage });
