import { useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { ContentProvider } from "@/lib/use-content";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PageTransition } from "@/components/layout/PageTransition";
import { Y2KBackdrop } from "@/components/layout/Y2KBackdrop";

import Entry from "@/pages/entry";
import Home from "@/pages/home";
import WorkIndex from "@/pages/work/index";
import CaseStudy from "@/pages/work/case-study";
import About from "@/pages/about";
import Studio from "@/pages/studio";
import StudioDetail from "@/pages/studio-detail";
import Contact from "@/pages/contact";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function CustomCursor() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div className="custom-cursor-dot" style={{ left: mousePos.x, top: mousePos.y }} />
      <div className="custom-cursor-ring" style={{ left: mousePos.x, top: mousePos.y }} />
    </>
  );
}

/**
 * Resets window scroll on every in-app navigation, and emulates
 * Back/Forward scroll restoration manually (since the browser's own
 * restoration races SPA rendering and lands on a not-yet-rendered
 * page).
 *
 * Strategy:
 * - Set `history.scrollRestoration = "manual"` to disable native
 *   restoration entirely.
 * - Listen to `popstate` to flag the next location change as a POP
 *   (Back/Forward) navigation.
 * - On every location change, save the scrollY of the page we're
 *   leaving keyed by its pathname. If the change was a POP, restore
 *   the saved scrollY for the new pathname; otherwise scroll to top.
 *   Note: positions are keyed by pathname, not by history entry, so
 *   visiting the same path multiple times with different scroll
 *   positions will only remember the most recent value — adequate
 *   for this portfolio's flat route graph.
 * - Scroll writes run inside `requestAnimationFrame` to defer past
 *   the React commit so the new route's content is in the DOM. This
 *   is not a hard guarantee against a one-frame flash in every
 *   browser, but is sufficient alongside the existing 0.6s
 *   PageTransition fade.
 */
function ScrollManager() {
  const [location] = useLocation();
  const prevLocation = useRef(location);
  const positions = useRef<Map<string, number>>(new Map());
  const isPop = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const onPop = () => { isPop.current = true; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    positions.current.set(prevLocation.current, window.scrollY);
    const wasPop = isPop.current;
    isPop.current = false;
    const targetY = wasPop ? (positions.current.get(location) ?? 0) : 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
    });
    prevLocation.current = location;
  }, [location]);

  return null;
}

function WithLayout({
  children,
  showBottomNav = true,
}: {
  children: React.ReactNode;
  showBottomNav?: boolean;
}) {
  return (
    <>
      <Navbar />
      <div className="relative flex flex-col min-h-screen bg-background px-6 md:px-12 lg:px-16 pt-[88px] md:pt-[100px] pb-24 md:pb-28 overflow-x-clip">
        <Y2KBackdrop />
        <div className="relative z-10 flex flex-col flex-1">
          {children}
          <Footer />
        </div>
      </div>
      {showBottomNav && <BottomNav />}
    </>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <Entry />
      </Route>
      <Route path="/home">
        <WithLayout><PageTransition><Home /></PageTransition></WithLayout>
      </Route>
      <Route path="/work">
        <WithLayout><PageTransition><WorkIndex /></PageTransition></WithLayout>
      </Route>
      <Route path="/work/:slug">
        <WithLayout><PageTransition><CaseStudy /></PageTransition></WithLayout>
      </Route>
      <Route path="/art">
        {/* Old Art route consolidated into Studio — keep redirect so any
            saved/shared links continue to land in the right place. */}
        <Redirect to="/studio" />
      </Route>
      <Route path="/about">
        <WithLayout><PageTransition><About /></PageTransition></WithLayout>
      </Route>
      <Route path="/studio/:slug">
        <WithLayout><PageTransition><StudioDetail /></PageTransition></WithLayout>
      </Route>
      <Route path="/studio">
        <WithLayout><PageTransition><Studio /></PageTransition></WithLayout>
      </Route>
      <Route path="/contact">
        <WithLayout><PageTransition><Contact /></PageTransition></WithLayout>
      </Route>
      <Route path="/admin">
        <WithLayout showBottomNav={false}><PageTransition><Admin /></PageTransition></WithLayout>
      </Route>
      <Route>
        <WithLayout><PageTransition><NotFound /></PageTransition></WithLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ContentProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollManager />
            <div className="grain-overlay" />
            <CustomCursor />
            <AppRoutes />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
        </ContentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
