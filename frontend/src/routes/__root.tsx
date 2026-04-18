import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset } from "@/components/ui/sidebar";
import { PlanSidebar } from "@/components/PlanSidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";

import "../index.css";
import { qc } from "@/services/api";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "sonner";

function RootLayout() {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider defaultTheme="dark">
        <Toaster position="bottom-right" />
        <TooltipProvider>
          <div className="w-full flex overflow-hidden max-h-dvh">
            <AppSidebar />
            <SidebarInset className="w-full">
              <div className="flex overflow-hidden">
                <div className="flex flex-1 flex-col gap-4 overflow-scroll scrollbar-hidden">
                  <Outlet />
                </div>
                <PlanSidebar />
              </div>
            </SidebarInset>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
