import RecommentationCard from "@/components/RecommendationCard";
import { createFileRoute } from "@tanstack/react-router";
import { useFeedIds } from "@/hooks/queries";

function HomePage() {
  const { data: recommendations, isLoading } = useFeedIds();

  if (isLoading || !recommendations) return <div>Loading...</div>;
  return (
    <div className="mx-auto p-6 flex flex-col items-center gap-6">
      {recommendations.map((id, i) => (
        <RecommentationCard key={i} recipeId={id} orientation={i % 2 === 0} />
      ))}
    </div>
  );
}

export const Route = createFileRoute("/home")({ component: HomePage });
