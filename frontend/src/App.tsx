import { ComponentExample } from "@/components/component-example";
import { ThemeProvider } from "./components/theme-provider";
import { TooltipProvider } from "./components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import { useAtomValue } from "jotai";
import { Tab, tabAtom } from "./lib/state";
import RecipesPage from "./components/RecipesPage";
import CounterSidebar from "./components/CounterSidebar";

export function App() {
  const tab = useAtomValue(tabAtom);
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <SidebarInset>
            {tab === Tab.Home ? <ComponentExample /> : <RecipesPage />}
          </SidebarInset>
          <CounterSidebar />
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
