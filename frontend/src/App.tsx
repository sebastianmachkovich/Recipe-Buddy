import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import { useAtomValue } from "jotai";
import { Tab, tabAtom } from "./lib/state";
import RecipesPage from "./components/RecipesPage";
import HomePage from "./components/HomePage";
import CounterSidebar from "./components/CounterSidebar";

export function App() {
  const tab = useAtomValue(tabAtom);
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset className="flex flex-row overflow-hidden">
            <SidebarProvider defaultOpen={true}>
              <main className="flex-1 overflow-y-auto p-4">
                {tab === Tab.Home ? <HomePage /> : <RecipesPage />}
              </main>
              <CounterSidebar />
            </SidebarProvider>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
