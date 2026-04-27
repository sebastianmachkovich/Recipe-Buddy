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
import { Recipe } from "@/services/api";

export function PlanSidebar() {
  const shouldBeHidden = useRouterState({
    select: (state) =>
      state.location.pathname === "/" ||
      state.location.pathname === "/walkthrough",
  });
  const { data: recipes } = useAllRecipes(!shouldBeHidden);
  const navigate = useNavigate();

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
            onClick={() => {
              navigate({ to: "/walkthrough" });
            }}
          >
            Let Me Cook!
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
