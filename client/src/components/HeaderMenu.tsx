import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { LogOut, MessageCircle, Moon, Sun, User, Mail } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function HeaderMenu() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name,last_name,profile_color")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data || {}));
  }, [user]);

  const initials = `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() || "JL";
  const color = profile?.profile_color || "#AB13E6";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
        style={{ backgroundColor: color }}
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border rounded-lg shadow-lg py-1 z-50">
          <MenuItem icon={User} label="Profile" onClick={() => { setOpen(false); navigate("/profile-detailed"); }} />
          <MenuItem icon={MessageCircle} label="Contact Us" onClick={() => { setOpen(false); navigate("/contact"); }} />
          <MenuItem
            icon={theme === "light" ? Moon : Sun}
            label={theme === "light" ? "Dark Mode" : "Light Mode"}
            onClick={() => { toggleTheme(); setOpen(false); }}
          />
          <div className="border-t my-1" />
          <MenuItem icon={LogOut} label="Logout" onClick={() => { setOpen(false); signOut(); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent gap-2"
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
