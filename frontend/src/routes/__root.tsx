import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { House, LogOut, ReceiptText } from "lucide-react";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import PlanSidebar from "@/components/PlanSidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import "../index.css";
import { qc } from "@/lib/state";
import { authAPI } from "@/services/api";

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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isAuthPage = pathname === "/";
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authAPI.logout();
    } finally {
      qc.removeQueries({ queryKey: ["currentUser"] });
      qc.removeQueries({ queryKey: ["planIds"] });
      qc.removeQueries({ queryKey: ["recipeIds"] });
      qc.removeQueries({ queryKey: ["feedIds"] });
      setIsLoggingOut(false);
      await navigate({ to: "/" });
    }
  }

  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          {isAuthPage ? (
            <main className="min-h-screen bg-background">
              <Outlet />
              <TanStackRouterDevtools />
            </main>
          ) : (
            <SidebarProvider defaultOpen={false}>
              <Sidebar collapsible="icon" variant="sidebar" className="group">
                <SidebarContent className="flex flex-col gap-2">
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {sidebarItems.map((item, i) => (
                          <AppSidebarButton
                            key={i}
                            label={item.label}
                            icon={item.icon}
                            route={item.route}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <div className="p-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="size-4" />
                  </Button>
                </div>
              </Sidebar>
              <SidebarInset className="flex flex-row overflow-hidden">
                <SidebarProvider defaultOpen={true}>
                  <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
                    <TanStackRouterDevtools />
                  </main>
                  <PlanSidebar />
                </SidebarProvider>
              </SidebarInset>
            </SidebarProvider>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
