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
import { recipesAtom, recipeIdsOnCounterAtom } from "@/lib/state";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import EditRecipeDialogProvider from "./EditRecipeDialogProvider";

export default function CounterSidebar() {
  const recipes = useAtomValue(recipesAtom);
  const recipeIdsOnCounter = useAtomValue(recipeIdsOnCounterAtom);
  const setRecipeIdsOnCounter = useSetAtom(recipeIdsOnCounterAtom);
  const recipesOnCounter = recipeIdsOnCounter
    .map((id) => recipes.find((r) => r.id === id)!)
    .filter(Boolean);
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
              {recipesOnCounter.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <EditRecipeDialogProvider recipe={item}>
                    <SidebarMenuButton>
                      {item.title}
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-lg"
                        className="ml-auto transition-colors rounded-sm dark:hover:bg-[#403b3a]"
                        onClick={() =>
                          setRecipeIdsOnCounter((ids) =>
                            ids.filter((id) => id !== item.id)
                          )
                        }
                      >
                        <X className="h-6 w-6" />
                      </Button>
                    </SidebarMenuButton>
                  </EditRecipeDialogProvider>
                </SidebarMenuItem>
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
