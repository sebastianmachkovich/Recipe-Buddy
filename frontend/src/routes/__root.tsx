import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { House, LogOut, ReceiptText, User } from "lucide-react";
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

import "../index.css";
import { qc } from "@/services/api";
import { useLogout } from "@/hooks/queries";

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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { mutate: logout, isPending: isLoggingOut } = useLogout(navigate);

  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          {isAuthPage ? (
            <main className="min-h-screen bg-background">
              <Outlet />
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
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <Link to="/profile">
                        <SidebarMenuButton
                          tooltip="Profile"
                          className="cursor-pointer"
                        >
                          <User className="size-4" />
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <AlertDialog
                        open={isLogoutDialogOpen}
                        onOpenChange={setIsLogoutDialogOpen}
                      >
                        <SidebarMenuButton
                          tooltip="Log out"
                          className="cursor-pointer"
                          onClick={() => setIsLogoutDialogOpen(true)}
                          disabled={isLoggingOut}
                          aria-label="Log out"
                        >
                          <LogOut className="size-4" />
                        </SidebarMenuButton>
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Log out?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Would you like to log out or stay signed in?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoggingOut}>
                              Stay signed in
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={isLoggingOut}
                              onClick={() => logout()}
                            >
                              {isLoggingOut ? "Logging out..." : "Log out"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
              </Sidebar>
              <SidebarInset className="flex flex-row overflow-hidden">
                <SidebarProvider defaultOpen={true}>
                  <main className="flex-1 overflow-y-auto p-4">
                    <Outlet />
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
