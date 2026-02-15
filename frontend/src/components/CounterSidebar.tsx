import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { recipesOnCounterAtom } from "@/lib/state";
import { useAtomValue } from "jotai";

export default function CounterSidebar() {
  const recipesOnCounter = useAtomValue(recipesOnCounterAtom);

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      side="right"
      className="group"
    >
      <SidebarContent className="flex flex-col gap-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {recipesOnCounter.map((item) => (
                <SidebarMenuItem key={item.id}>{item.title}</SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
