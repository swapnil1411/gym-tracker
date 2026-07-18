"use client";

import { useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import BottomNav, { type Tab } from "@/components/BottomNav";
import DailyTracker from "@/components/DailyTracker";
import Dashboard from "@/components/Dashboard";
import PlanEditor from "@/components/PlanEditor";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("today");

  if (loading) {
    return (
      <main className="flex min-h-screen w-full max-w-app items-center justify-center">
        <div className="animate-fadeIn font-display text-[15px] font-black tracking-[.14em] text-muted">
          GYM<span className="text-accent">·</span>LOG
        </div>
      </main>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="relative flex w-full max-w-app flex-col overflow-x-hidden">
      {/* pb-24 keeps the last card clear of the fixed bottom nav */}
      <main className="flex min-h-screen flex-col pb-24">
        {tab === "today" && <DailyTracker />}
        {tab === "plan" && <PlanEditor />}
        {tab === "stats" && <Dashboard />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
