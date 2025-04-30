import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Index from "./pages/Index";
import Create from "./pages/Create";
import Browse from "./pages/Browse";
import Read from "./pages/Read";
import NotFound from "./pages/NotFound";
import Auth from "./components/auth/Auth";
import Profile from "./pages/Profile";
import StoryEditor from "./pages/StoryEditor";
import StoryManagement from "./pages/StoryManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/create" 
              element={
                <RequireAuth>
                  <Create />
                </RequireAuth>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              } 
            />
            <Route 
              path="/stories" 
              element={
                <RequireAuth>
                  <StoryManagement />
                </RequireAuth>
              } 
            />
            <Route 
              path="/story/edit/:storyId" 
              element={
                <RequireAuth>
                  <StoryEditor />
                </RequireAuth>
              } 
            />
            <Route path="/browse" element={<Browse />} />
            <Route path="/read/:storyId" element={<Read />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
