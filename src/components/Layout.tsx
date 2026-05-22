import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Activity, Settings } from "lucide-react";
import { cn } from "../lib/utils";
import React from "react";

const navItems = [
  { name: "工作台", path: "/", icon: Home },
  { name: "ECO", path: "/training", icon: Compass },
  { name: "模拟演练", path: "/sim", icon: Activity },
  { name: "设置", path: "/settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-offwhite text-gray-900 transition-colors duration-300">
      {/* Sidebar (Desktop) - Clean light style like macOS/iPadOS */}
      <aside className="hidden md:flex flex-col w-64 bg-transparent shrink-0 z-10 px-4 py-8 border-r border-gray-200/50">
        <div className="flex items-center gap-3 mb-10 px-4">
          <div className="w-10 h-10 bg-gradient-to-br from-aviation to-blue-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 shrink-0">
            Atc Master
          </h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-[15px] font-medium group",
                  isActive
                    ? "bg-white shadow-sm text-aviation"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-aviation" : "text-gray-400 group-hover:text-gray-600")} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto p-4 mx-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
           <div className="flex flex-col">
             <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Session</span>
             <span className="text-sm font-bold text-gray-800 tracking-tight">ZGGG_TWR</span>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full pb-safe md:pb-0 relative scroll-smooth flex justify-center bg-offwhite portrait:pb-0">
        <div className="w-full max-w-6xl px-4 py-4 md:px-8 md:py-6 mt-safe mb-[65px] md:mb-0">
          {children}
        </div>
      </main>

      {/* Edge-to-edge Bottom Bar (Mobile) - iOS style blur */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[65px] pb-safe z-50 glass-panel border-t border-gray-200/50 flex justify-around items-center px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-2 pb-1"
            >
              <item.icon 
                className={cn("w-6 h-6 transition-transform duration-200", isActive ? "text-aviation scale-110" : "text-gray-400")} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-aviation" : "text-gray-400")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
