"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Zap,
  Wallet,
  TrendingUp,
  Shield,
  ChevronRight,
  Cpu,
  LogOut,
  Home,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Wallet, label: "Wallet" },
  { icon: TrendingUp, label: "Yield" },
];

export const Sidebar = () => {
  const [privacyMode, setPrivacyMode] = useState(true);

  return (
    <aside className="w-[220px] h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#022c22] to-[#065f46] flex items-center justify-center shadow-md">
            <span className="font-serif text-xl font-bold text-emerald-50 italic leading-none pt-0.5 pr-0.5">P</span>
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm tracking-tight">Portion</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Yield Spending</p>
          </div>
        </div>
      </div>

      {/* Privacy Mode Toggle */}
      <div className="p-4">
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-accent border border-primary/20 hover:bg-accent/80 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div className="text-left">
              <p className="text-xs font-medium text-foreground">Privacy Mode</p>
              <p className="text-[10px] text-muted-foreground">
                {privacyMode ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${
              privacyMode ? "bg-primary animate-pulse" : "bg-muted-foreground"
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col">
        <p className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        <ul className="space-y-1 mb-auto">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  item.active
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Back to Landing - Pushed to bottom of nav area */}
        <div className="mt-4 pt-4 border-t border-sidebar-border">
           <a href="/landing">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              <Home className="w-4 h-4" />
              <span>Back to Website</span>
            </button>
          </a>
        </div>
      </nav>



      {/* Wallet Connection */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center text-[10px] font-medium text-foreground">
              0x
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">0x7a3...f92e</p>
              <p className="text-[10px] text-primary">Connected</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
};
