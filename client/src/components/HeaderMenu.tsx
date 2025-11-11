import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";
import { LogOut, MessageCircle, Moon, Sun, User, Mail } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function HeaderMenu() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
          <MenuItem icon={User} label="Profile" href="/profile-detailed" />
          <MenuItem icon={MessageCircle} label="Contact Us" href="/contact" />
          <MenuItem
            icon={theme === "light" ? Moon : Sun}
            label={theme === "light" ? "Dark Mode" : "Light Mode"}
            onClick={toggleTheme}
          />
          <div className="border-t my-1" />
          <MenuItem icon={LogOut} label="Logout" onClick={signOut} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, href, onClick }: any) {
  return (
    <button
      onClick={onClick ?? (() => (window.location.href = href))}
      className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent gap-2"
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
