import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import Layout from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageTransition } from "./components/PageTransition";
import { supabase } from "./services/supabaseClient";
import { handleAutoOnboarding, syncUserRecords } from "./services/authService";

const Home = lazy(() => import("./pages/Home"));
const Training = lazy(() => import("./pages/Training"));
const Sim = lazy(() => import("./pages/Sim"));
const Settings = lazy(() => import("./pages/Settings"));

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}><Home /></Suspense></PageTransition>} />
        <Route path="/training" element={<PageTransition><Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}><Training /></Suspense></PageTransition>} />
        <Route path="/sim" element={<PageTransition><Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}><Sim /></Suspense></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Loading...</div>}><Settings /></Suspense></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await handleAutoOnboarding(session.user);
        await syncUserRecords(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await handleAutoOnboarding(session.user);
        await syncUserRecords(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <AnimatedRoutes />
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
