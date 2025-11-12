import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardCard } from "@/components/DashboardCard";
import { useAuth } from "@/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ContactPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ first_name:"", last_name:"", email:"", phone:"", message:"" });
  const [busy, setBusy] = useState(false);
  const onChange = (e:any)=> setForm((f)=>({...f,[e.target.name]: e.target.value}));

  const submit = async () => {
    if (!form.email || !form.message) {
      toast({
        title: "Error",
        description: "Email and message are required",
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    try {
      await apiRequest('POST', '/api/contact', {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      });
      
      toast({
        title: "Message sent",
        description: "Thanks! We'll be in touch soon.",
      });
      
      // Navigate to home after successful submit
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        
        <DashboardCard title="Send us a message" description="We'll get back to you as soon as possible">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="first_name" placeholder="First name" onChange={onChange} value={form.first_name} />
            <Input name="last_name"  placeholder="Last name"  onChange={onChange} value={form.last_name} />
            <Input name="email" type="email" placeholder="Email *" className="sm:col-span-1" onChange={onChange} value={form.email} required />
            <Input name="phone" placeholder="Phone" className="sm:col-span-1" onChange={onChange} value={form.phone} />
            <Textarea name="message" placeholder="Message *" className="sm:col-span-2 h-40" onChange={onChange} value={form.message} required />
          </div>
          <Button onClick={submit} disabled={busy} className="w-40 mt-4">
            {busy ? "Sending..." : "Submit"}
          </Button>
        </DashboardCard>
      </div>
    </div>
  );
}
