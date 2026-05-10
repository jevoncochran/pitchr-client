import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdViewKanban,
  MdTimeline,
  MdSettings,
  MdKeyboardArrowDown,
  MdPermContactCalendar,
} from "react-icons/md";
import { AuthContext } from "../context/auth/AuthContext";

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard size={22} /> },
  { to: "/leads", label: "Leads", icon: <MdPeople size={22} /> },
  { to: "/contacts", label: "Contacts", icon: <MdPermContactCalendar size={22} /> },
  { to: "/pipeline", label: "Pipeline", icon: <MdViewKanban size={22} /> },
  { to: "/sequence", label: "Tasks", icon: <MdTimeline size={22} /> },
  { to: "/settings", label: "Settings", icon: <MdSettings size={22} /> },
];

const InternalLayout = ({ children }: Props) => {
  const auth = useContext(AuthContext);
  const user = auth?.user as { firstName: string; lastName: string } | null;
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "??";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 flex-col bg-[#080D12] px-4 py-8 h-screen">
        {/* Logo */}
        <div className="px-3 mb-9">
          <p className="text-white text-[15px] font-extrabold uppercase tracking-[0.24em]">
            PITCHR<span className="text-green-primary">.</span>
          </p>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center gap-4 rounded-xl px-4 h-[52px] text-[15px] font-semibold transition-all duration-200 overflow-hidden ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-green-primary" />
                  )}

                  <span className="flex items-center justify-center">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom profile */}
        <div className="mt-auto pt-6">
          <div className="border-t border-white/10 pt-6">
            <button className="w-full flex items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-white/5 transition">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-sm font-bold">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {fullName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  Intercon Visuals
                </p>
              </div>

              <MdKeyboardArrowDown className="text-green-primary" size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 h-screen">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-[#080D12] border-t border-white/10 px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center rounded-xl py-2 gap-1 text-[10px] font-semibold transition ${
                isActive
                  ? "bg-white text-[#111827]"
                  : "text-slate-400 hover:text-white"
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
