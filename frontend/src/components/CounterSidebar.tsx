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
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import EditRecipeDialogProvider from "./EditRecipeDialogProvider";
import { usePlanIds, useRecipe, useRemoveFromPlan } from "@/hooks/queries";

export default function CounterSidebar() {
  const { data: recipeIdsOnCounter } = usePlanIds();
  return (
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
              {recipeIdsOnCounter?.map((id) => (
                <EditRecipeSidebarMenuButton recipeId={id} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="default" className="w-full">
          Let Me Cook!
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function EditRecipeSidebarMenuButton({ recipeId }: { recipeId: number }) {
  const { data: recipe } = useRecipe(recipeId);
  const { mutate: removeFromPlan } = useRemoveFromPlan();
  return (
    <SidebarMenuItem key={recipeId}>
      <EditRecipeDialogProvider recipeId={recipeId}>
        <SidebarMenuButton>
          {recipe!.title}
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="ml-auto transition-colors rounded-sm dark:hover:bg-[#403b3a]"
            onClick={(e) => {
              e.stopPropagation();
              removeFromPlan(recipeId);
            }}
          >
            <X className="h-6 w-6" />
          </Button>
        </SidebarMenuButton>
      </EditRecipeDialogProvider>
    </SidebarMenuItem>
  );
}
