"use client";

import { useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import BottomNav, { type Tab } from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import DailyTracker from "@/components/DailyTracker";
import Dashboard from "@/components/Dashboard";
import BodyPage from "@/components/BodyPage";
import RehabPage from "@/components/RehabPage";
import SportsPage from "@/components/SportsPage";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("today");
  /*
   * Body isn't a tab — it's an overlay over the scroll area, opened from the
   * TopBar. Kept as separate state rather than a fifth Tab value so the bottom
   * bar keeps showing which tab you'll return to when you close it.
   */
  const [bodyOpen, setBodyOpen] = useState(false);

  if (loading) {
    return (
      <main className="flex min-h-dvh w-full max-w-app items-center justify-center">
        <div className="animate-fadeIn font-display text-[15px] font-black tracking-[.14em] text-muted">
          GYM<span className="text-accent-text">·</span>LOG
        </div>
      </main>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="app-chrome relative flex h-dvh w-full max-w-app flex-col overflow-hidden sm:my-6 sm:h-[812px] sm:rounded-[42px]">
      <TopBar bodyOpen={bodyOpen} onToggleBody={() => setBodyOpen((b) => !b)} />
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {bodyOpen ? (
          <BodyPage />
        ) : (
          <>
            {tab === "today" && <DailyTracker />}
            {tab === "rehab" && <RehabPage />}
            {tab === "sports" && <SportsPage />}
            {tab === "stats" && <Dashboard />}
          </>
        )}
      </main>
      <BottomNav
        active={tab}
        onChange={(t) => {
          // Picking a tab means you're done with Body, whichever tab it is.
          setBodyOpen(false);
          setTab(t);
        }}
      />
    </div>
  );
}
