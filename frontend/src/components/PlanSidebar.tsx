import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { EditRecipeDialogProvider } from "./EditRecipeDialogProvider";
import { useAllRecipes, useUpdateRecipe } from "@/hooks/queries";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { allRecipesQuery, qc, Recipe } from "@/services/api";
import { setupWalkthrough } from "@/state/walkthrough";
import { useState } from "react";

export function PlanSidebar() {
  const shouldBeHidden = useRouterState({
    select: (state) =>
      state.location.pathname === "/" ||
      state.location.pathname === "/walkthrough",
  });
  const { data: recipes } = useAllRecipes(!shouldBeHidden);
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  return (
    <SidebarProvider
      defaultOpen={true}
      className={cn(
        "w-fit overflow-hidden max-h-dvh",
        shouldBeHidden ? "hidden" : "",
      )}
    >
      <Sidebar
        collapsible="icon"
        variant="sidebar"
        side="right"
        className="group"
      >
        <SidebarContent className="flex flex-col gap-2">
          <SidebarGroup>
            <SidebarGroupLabel>Plan</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recipes
                  ?.filter((it) => it.inPlan)
                  .map((it) => (
                    <EditRecipeSidebarMenuButton key={it.id} recipe={it} />
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button
            variant="default"
            className="w-full"
            disabled={isStarting || !(recipes ?? []).some((it) => it.inPlan)}
            onClick={async () => {
              setIsStarting(true);
              try {
                const recipes = await qc.ensureQueryData(allRecipesQuery);
                const plannedRecipes = recipes.filter((it) => it.inPlan);
                if (plannedRecipes.length === 0) {
                  return;
                }
                setupWalkthrough(plannedRecipes);
                await navigate({ to: "/walkthrough" });
              } finally {
                setIsStarting(false);
              }
            }}
          >
            {isStarting ? "Starting..." : "Let Me Cook!"}
          </Button>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

function EditRecipeSidebarMenuButton({ recipe }: { recipe: Recipe }) {
  const { updateRecipe } = useUpdateRecipe();
  return (
    <SidebarMenuItem key={recipe.id}>
      <EditRecipeDialogProvider recipe={recipe}>
        <SidebarMenuButton>
          {recipe?.name}
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="ml-auto transition-colors rounded-sm dark:hover:bg-[#403b3a]"
            onClick={(e) => {
              e.stopPropagation();
              updateRecipe({ ...recipe!, inPlan: false });
            }}
          >
            <X className="h-6 w-6" />
          </Button>
        </SidebarMenuButton>
      </EditRecipeDialogProvider>
    </SidebarMenuItem>
  );
}
