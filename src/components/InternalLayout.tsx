import React from "react";
import { NavLink } from "react-router-dom";
import { MdDashboard, MdPeople, MdBarChart, MdViewKanban } from "react-icons/md";

interface Props {
  children: React.ReactNode;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard size="1.2em" /> },
  { to: "/leads", label: "Leads", icon: <MdPeople size="1.2em" /> },
  { to: "/pipeline", label: "Pipeline", icon: <MdViewKanban size="1.2em" /> },
  { to: "/analytics", label: "Analytics", icon: <MdBarChart size="1.2em" /> },
];

const InternalLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen">
      <div className="bg-charcoal w-[180px] flex-shrink-0 flex flex-col py-6 px-3">
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
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

export default InternalLayout;
