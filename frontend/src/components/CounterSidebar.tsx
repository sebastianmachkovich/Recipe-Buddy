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
import { recipesOnCounterAtom } from "@/lib/state";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useAtom } from "jotai";
import EditRecipeDialogProvider from "./EditRecipeDialogProvider";

export default function CounterSidebar() {
  const [recipesOnCounter, setRecipesOnCounter] = useAtom(recipesOnCounterAtom);
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
              {recipesOnCounter.map((item, i) => (
                <SidebarMenuItem key={item.id}>
                  <EditRecipeDialogProvider recipe={item}>
                    <SidebarMenuButton>
                      {item.title}
                      <Button
                        asChild
                        variant="ghost"
                        size="icon-lg"
                        className="ml-auto transition-colors rounded-sm dark:hover:bg-[#403b3a]"
                        onClick={() => {
                          setRecipesOnCounter(
                            recipesOnCounter
                              .slice(0, i)
                              .concat(recipesOnCounter.slice(i + 1)),
                          );
                        }}
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
