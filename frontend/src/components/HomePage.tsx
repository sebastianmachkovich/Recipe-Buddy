import { recipesAtom, recommendationIdsAtom } from "@/lib/state";
import RecommentationCard from "./RecommendationCard";
import { useAtomValue } from "jotai";

export default function HomePage() {
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
