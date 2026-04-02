"use client";

import { type LucideIcon } from "lucide-react";

export interface RoleCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "indigo" | "amber" | "emerald" | "violet";
  stepCount: number;
  isActive: boolean;
  onClick: () => void;
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    bgActive: "bg-indigo-600",
    border: "border-indigo-100",
    borderActive: "border-indigo-600",
    iconBg: "bg-indigo-100",
    iconBgActive: "bg-indigo-500",
    iconColor: "text-indigo-600",
    iconColorActive: "text-white",
    textColor: "text-indigo-600",
    textColorActive: "text-white",
    descColor: "text-gray-600",
    descColorActive: "text-indigo-100",
    badge: "bg-indigo-100 text-indigo-700",
    badgeActive: "bg-indigo-500 text-white",
    glow: "hover:shadow-indigo-200/60",
  },
  amber: {
    bg: "bg-amber-50",
    bgActive: "bg-amber-600",
    border: "border-amber-100",
    borderActive: "border-amber-600",
    iconBg: "bg-amber-100",
    iconBgActive: "bg-amber-500",
    iconColor: "text-amber-600",
    iconColorActive: "text-white",
    textColor: "text-amber-700",
    textColorActive: "text-white",
    descColor: "text-gray-600",
    descColorActive: "text-amber-100",
    badge: "bg-amber-100 text-amber-700",
    badgeActive: "bg-amber-500 text-white",
    glow: "hover:shadow-amber-200/60",
  },
  emerald: {
    bg: "bg-emerald-50",
    bgActive: "bg-emerald-600",
    border: "border-emerald-100",
    borderActive: "border-emerald-600",
    iconBg: "bg-emerald-100",
    iconBgActive: "bg-emerald-500",
    iconColor: "text-emerald-600",
    iconColorActive: "text-white",
    textColor: "text-emerald-700",
    textColorActive: "text-white",
    descColor: "text-gray-600",
    descColorActive: "text-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
    badgeActive: "bg-emerald-500 text-white",
    glow: "hover:shadow-emerald-200/60",
  },
  violet: {
    bg: "bg-violet-50",
    bgActive: "bg-violet-600",
    border: "border-violet-100",
    borderActive: "border-violet-600",
    iconBg: "bg-violet-100",
    iconBgActive: "bg-violet-500",
    iconColor: "text-violet-600",
    iconColorActive: "text-white",
    textColor: "text-violet-700",
    textColorActive: "text-white",
    descColor: "text-gray-600",
    descColorActive: "text-violet-100",
    badge: "bg-violet-100 text-violet-700",
    badgeActive: "bg-violet-500 text-white",
    glow: "hover:shadow-violet-200/60",
  },
};

export function RoleCard({
  title,
  description,
  icon: Icon,
  color,
  stepCount,
  isActive,
  onClick,
}: RoleCardProps) {
  const c = colorMap[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative w-full rounded-2xl border-2 p-6 text-left
        transition-all duration-300 ease-out cursor-pointer
        hover:scale-[1.03] hover:shadow-xl ${c.glow}
        ${isActive
          ? `${c.bgActive} ${c.borderActive} shadow-lg`
          : `bg-white ${c.border} hover:${c.bg}`
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          inline-flex items-center justify-center rounded-xl p-3
          transition-colors duration-300
          ${isActive ? c.iconBgActive : c.iconBg}
        `}
      >
        <Icon
          className={`h-6 w-6 transition-colors duration-300 ${
            isActive ? c.iconColorActive : c.iconColor
          }`}
        />
      </div>

      {/* Title */}
      <h3
        className={`mt-4 text-lg font-bold transition-colors duration-300 ${
          isActive ? c.textColorActive : "text-gray-900"
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`mt-2 text-sm leading-relaxed transition-colors duration-300 ${
          isActive ? c.descColorActive : c.descColor
        }`}
      >
        {description}
      </p>

      {/* Badge */}
      <div
        className={`
          mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1
          text-xs font-semibold transition-colors duration-300
          ${isActive ? c.badgeActive : c.badge}
        `}
      >
        {stepCount} steps
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-white shadow-md ring-2 ring-current">
          <div className={`h-full w-full rounded-full ${c.bgActive}`} />
        </div>
      )}
    </button>
  );
}
