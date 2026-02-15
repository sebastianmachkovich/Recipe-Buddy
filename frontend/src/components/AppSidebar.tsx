import { House, ReceiptText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAtom } from "jotai";
import { Tab, tabAtom } from "@/lib/state";

type SidebarItem = {
  tab: Tab;
  icon: React.ReactNode;
};

const sidebarItems: SidebarItem[] = [
  {
    tab: Tab.Home,
    icon: <House className="size-4 shrink-0" />,
  },
  {
    tab: Tab.Recipes,
    icon: <ReceiptText className="size-4 shrink-0" />,
  },
];

export default function AppSidebar() {
  const [tab, setTab] = useAtom(tabAtom);
  return (
    <Sidebar collapsible="icon" variant="sidebar" className="group">
      <SidebarContent className="flex flex-col gap-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    isActive={item.tab === tab}
                    tooltip={item.tab}
                    onClick={() => setTab(item.tab)}
                  >
                    {item.icon}
                    <span className="truncate">{item.tab}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
