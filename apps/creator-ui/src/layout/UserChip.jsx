// @ts-nocheck
import React, { useState } from "react";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useSelector } from "react-redux";

export default function UserChip() {
  const user = useSelector((state) => state.auth?.user);
  const name = user?.name || "Karan";
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("Free Plan");

  const action = (label) => {
    setStatus(label);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-left">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500 text-sm font-bold">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="text-xs font-medium text-slate-400">{status}</p>
        </div>
        <ChevronDown size={16} className={`text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] p-1 shadow-2xl">
          <MenuButton icon={User} label="View mock profile" onClick={() => action("Profile opened")} />
          <MenuButton icon={Settings} label="Settings" onClick={() => action("Settings opened")} />
          <MenuButton icon={LogOut} label="Sign out mock" onClick={() => action("Signed out mock")} />
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
      <Icon size={14} /> {label}
    </button>
  );
}
