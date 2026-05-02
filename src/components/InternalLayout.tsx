import React from "react";
import { NavLink } from "react-router-dom";
import { MdDashboard, MdPeople, MdViewKanban, MdTimeline, MdSettings } from "react-icons/md";

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard size="1.2em" /> },
  { to: "/leads",     label: "Leads",     icon: <MdPeople size="1.2em" /> },
  { to: "/pipeline",  label: "Pipeline",  icon: <MdViewKanban size="1.2em" /> },
  { to: "/sequence",  label: "Follow-up", icon: <MdTimeline size="1.2em" /> },
  { to: "/settings",  label: "Settings",  icon: <MdSettings size="1.2em" /> },
];

const InternalLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <div className="hidden md:flex bg-charcoal w-[180px] flex-shrink-0 flex-col py-6 px-3">
        <p className="text-white text-xs font-bold uppercase tracking-widest px-3 mb-6">
          Pitchr
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-white text-charcoal font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Main content ── */}
      {/* pb-20 on mobile leaves room for the bottom nav bar */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </div>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-charcoal border-t border-white/10">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-[10px] transition ${
                isActive
                  ? "text-white font-semibold"
                  : "text-gray-500 hover:text-gray-300"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
};

export default InternalLayout;
