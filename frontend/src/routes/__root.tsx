import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
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
import CounterSidebar from "@/components/CounterSidebar";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import "../index.css";

const sidebarItems = [
  {
    label: "Home",
    icon: <House className="size-4 shrink-0" />,
    route: "/home",
  },
  {
    label: "Recipes",
    icon: <ReceiptText className="size-4 shrink-0" />,
    route: "/recipes",
  },
];

function AppSidebarButton({
  label,
  icon,
  route,
}: {
  label: string;
  icon: React.ReactNode;
  route: string;
}) {
  return (
    <SidebarMenuItem key={route}>
      <Link to={route}>
        <SidebarMenuButton tooltip={label} className="cursor-pointer">
          {icon}
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <Sidebar collapsible="icon" variant="sidebar" className="group">
            <SidebarContent className="flex flex-col gap-2">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <AppSidebarButton
                        label={item.label}
                        icon={item.icon}
                        route={item.route}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <SidebarInset className="flex flex-row overflow-hidden">
            <SidebarProvider defaultOpen={true}>
              <main className="flex-1 overflow-y-auto p-4">
                <Outlet />
                <TanStackRouterDevtools />
              </main>
              <CounterSidebar />
            </SidebarProvider>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
