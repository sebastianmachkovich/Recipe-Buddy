import { useUpdateRecipe } from "@/hooks/queries";
import { Recipe } from "@/services/api";
import { Star } from "lucide-react";
import { useState } from "react";

export function StarRating({ recipe }: { recipe: Recipe }) {
  const { updateRecipe } = useUpdateRecipe();
  const [hovered, setHovered] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  function computeHoveredRating(rating: number) {
    if (!hovered) return (recipe?.rating ?? 0) >= rating;
    return hoveredRating >= rating;
  }

  function Icon({ rating }: { rating: number }) {
    return (
      <Star
        size={20}
        className={
          computeHoveredRating(rating) ? "text-star" : "text-muted-foreground"
        }
        onMouseOver={() => setHoveredRating(rating)}
        onClick={(e) => {
          e.stopPropagation();
          updateRecipe({ ...recipe!, rating });
        }}
      />
    );
  }

  return (
    <div
      className="flex flex-row shrink gap-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon rating={1} />
      <Icon rating={2} />
      <Icon rating={3} />
      <Icon rating={4} />
      <Icon rating={5} />
    </div>
  );
}
