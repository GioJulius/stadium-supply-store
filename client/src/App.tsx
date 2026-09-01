import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import Contact from "@/pages/Contact";
import Reviews from "@/pages/Reviews";
import HowItWorks from "@/pages/HowItWorks";
import Shipping from "@/pages/Shipping";
import NotFound from "@/pages/NotFound";
import Policy from "@/pages/Policy";
import ProductDetail from "@/pages/ProductDetail";
import Shop from "@/pages/Shop";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/contact" component={Contact} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/product/:handle" component={ProductDetail} />
      <Route path="/returns">{() => <Policy slug="returns" />}</Route>
      <Route path="/privacy">{() => <Policy slug="privacy" />}</Route>
      <Route path="/terms">{() => <Policy slug="terms" />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
