import React, { useContext, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdViewKanban,
  MdTimeline,
  MdSettings,
  MdKeyboardArrowDown,
  MdPermContactCalendar,
  MdRoute,
  MdInsights,
  MdMoreHoriz,
} from "react-icons/md";
import { AuthContext } from "../features/auth/AuthContext";

interface Props {
  children: React.ReactNode;
}

const dashboard = { to: "/dashboard", label: "Dashboard", icon: <MdDashboard size={22} /> };
const leads = { to: "/leads", label: "Leads", icon: <MdPeople size={22} /> };
const contacts = { to: "/contacts", label: "Contacts", icon: <MdPermContactCalendar size={22} /> };
const pipeline = { to: "/pipeline", label: "Pipeline", icon: <MdViewKanban size={22} /> };
const analytics = { to: "/analytics", label: "Analytics", icon: <MdInsights size={22} /> };
const sessions = { to: "/sessions", label: "Sessions", icon: <MdRoute size={22} /> };
const tasks = { to: "/sequence", label: "Tasks", icon: <MdTimeline size={22} /> };
const settings = { to: "/settings", label: "Settings", icon: <MdSettings size={22} /> };

/** Desktop sidebar: every page */
const navItems = [dashboard, leads, contacts, pipeline, analytics, sessions, tasks, settings];

/** Phone: the pages used most in the field get a tab; the rest live under More */
const mobileTabs = [dashboard, leads, sessions, tasks];
const moreItems = [contacts, pipeline, analytics, settings];

const InternalLayout = ({ children }: Props) => {
  const auth = useContext(AuthContext);
  const user = auth?.user as { firstName: string; lastName: string } | null;
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "??";
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  // The More tab shows as current on any page that lives under it
  const onMorePage = moreItems.some(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );

  // Close the sheet after navigating, and on Escape
  useEffect(() => setMoreOpen(false), [pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

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
        <nav aria-label="Main" className="flex flex-col gap-2">
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

      {/* Phone layers, bottom to top: page content, a page's own sheet (z-10, e.g. a
          session's stops), the More sheet (z-20), the tab bar (z-30), then every
          popup and dialog (z-40 and up), so a popup's buttons are never hidden */}

      {/* Mobile "More" sheet: the pages without a tab, plus who's signed in */}
      {moreOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="more-sheet"
            role="dialog"
            aria-label="More"
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-[#080D12] px-4 pt-5 pb-28"
          >
            <div className="flex items-center gap-3 px-2 pb-4 mb-2 border-b border-white/10">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-sm font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{fullName}</p>
                <p className="truncate text-xs text-slate-400">Intercon Visuals</p>
              </div>
            </div>
            <nav aria-label="More pages" className="flex flex-col gap-1">
              {moreItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-xl px-4 h-[52px] text-[15px] font-semibold transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/8 hover:text-white"
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        aria-label="Tabs"
        className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden bg-[#080D12] border-t border-white/10 px-2 py-2"
      >
        {mobileTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center rounded-xl py-2 gap-1 text-[11px] font-semibold transition ${
                isActive && !moreOpen
                  ? "bg-white text-[#111827]"
                  : "text-slate-400 hover:text-white"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-controls="more-sheet"
          className={`flex flex-1 flex-col items-center justify-center rounded-xl py-2 gap-1 text-[11px] font-semibold transition ${
            moreOpen || onMorePage
              ? "bg-white text-[#111827]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MdMoreHoriz size={22} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};

export default InternalLayout;
