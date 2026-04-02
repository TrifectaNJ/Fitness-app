import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { FitnessProvider } from "@/contexts/FitnessContext";
import { DesignProvider } from "@/contexts/DesignContext";
import { HomePageProvider } from "@/contexts/HomePageContext";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import AppRouter from "@/components/AppRouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

const App = () => {
  useVersionCheck();
  
  return (
    <div className="w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AppProvider>
              <FitnessProvider>
                <DesignProvider>
                  <HomePageProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <AppRouter />
                    </BrowserRouter>
                  </HomePageProvider>
                </DesignProvider>
              </FitnessProvider>
            </AppProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </div>
  );
};

export default App;
