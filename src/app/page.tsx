"use client";

import { useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import BottomNav, { type Tab } from "@/components/BottomNav";
import DailyTracker from "@/components/DailyTracker";
import Dashboard from "@/components/Dashboard";
import BodyPage from "@/components/BodyPage";
import RehabPage from "@/components/RehabPage";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("today");

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
    <div className="app-chrome relative flex h-dvh w-full max-w-app flex-col overflow-hidden pt-5 sm:my-6 sm:h-[812px] sm:rounded-[42px] sm:pt-7">
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {tab === "today" && <DailyTracker onOpenBody={() => setTab("body")} />}
        {tab === "rehab" && <RehabPage />}
        {tab === "body" && <BodyPage onBack={() => setTab("today")} />}
        {tab === "stats" && <Dashboard />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
