// client/src/pages/profile-setup.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PBJ = {
  purple: "#AB13E6",
  gold: "#C38452",
};

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!firstName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
        })
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "Success",
        description: "Profile created successfully!",
      });

      // Navigate to the today page after successful profile setup
      navigate("/today");
    } catch (err) {
      console.error("Profile setup error:", err);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: `linear-gradient(135deg, ${PBJ.purple}22 0%, ${PBJ.gold}22 40%, transparent 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-xl border bg-white overflow-hidden">
          <div
            className="p-6 text-center"
            style={{
              background: `linear-gradient(180deg, ${PBJ.purple}10 0%, ${PBJ.gold}10 100%)`,
            }}
          >
            <div className="text-3xl font-extrabold tracking-tight">
              <span style={{ color: PBJ.purple }}>PBJ</span>{" "}
              <span style={{ color: PBJ.gold }}>LYFE</span>
            </div>
            <div className="mt-2 text-sm text-neutral-600">
              Let's set up your profile
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-neutral-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  className="mt-1"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-neutral-700">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  className="mt-1"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full"
                style={{ background: PBJ.purple }}
              >
                {saving ? "Saving…" : "Complete Setup"}
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500 mt-4">
          <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: PBJ.gold }} />
          Complete your profile to continue
        </div>
      </div>
    </div>
  );
}
