import CaseDetail from "@/pages/CaseDetail";
import Cases from "@/pages/Cases";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { BASE } from "./lib/base";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cases" component={Cases} />
      <Route path="/cases/:slug" component={CaseDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <WouterRouter base={BASE}>
        <Router />
      </WouterRouter>
    </ErrorBoundary>
  );
}

export default App;
