import { SidebarProvider } from "@/components/ui/sidebar";
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
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useLogout } from "@/hooks/queries";
import { cn } from "@/lib/utils";

// Null item is a spacer.
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
  null,
  {
    label: "Profile",
    icon: <User className="size-4 shrink-0" />,
    route: "/profile",
  },
];

function Spacer() {
  return <div className="h-full"></div>;
}

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

function LogoutButton() {
  const navigate = useNavigate();
  const { mutate: logout, isPending: isLoggingOut } = useLogout(navigate);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  return (
    <SidebarMenuItem>
      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <SidebarMenuItem key={"/"}>
          <SidebarMenuButton
            tooltip={"Log out"}
            className="cursor-pointer"
            onClick={() => setIsLogoutDialogOpen(true)}
            aria-label="Log out"
            disabled={isLoggingOut}
          >
            <LogOut className="size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
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
  );
}

export function AppSidebar() {
  const isAuthPage = useRouterState({
    select: (state) => state.location.pathname === "/",
  });

  return (
    <SidebarProvider
      defaultOpen={false}
      className={cn(
        "w-fit overflow-hidden max-h-dvh",
        isAuthPage ? "hidden" : "",
      )}
    >
      <Sidebar collapsible="icon" className="group">
        <SidebarContent>
          <SidebarGroup className="h-full">
            <SidebarGroupContent className="h-full">
              <SidebarMenu className="h-full">
                {sidebarItems.map((item, i) =>
                  !item ? (
                    <Spacer key={i} />
                  ) : (
                    <AppSidebarButton
                      key={i}
                      label={item.label}
                      icon={item.icon}
                      route={item.route}
                    />
                  ),
                )}
                <LogoutButton />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
