import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/AuthProvider";

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ first_name:"", last_name:"", email:"", phone:"", message:"" });
  const [busy, setBusy] = useState(false);
  const onChange = (e:any)=> setForm((f)=>({...f,[e.target.name]: e.target.value}));

  const submit = async () => {
    setBusy(true);
    await supabase.from("contact_messages").insert({
      user_id: user?.id || null,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      message: form.message
    });
    setBusy(false);
    alert("Thanks! We'll be in touch.");
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Contact us</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input name="first_name" placeholder="First name" onChange={onChange} />
        <Input name="last_name"  placeholder="Last name"  onChange={onChange} />
        <Input name="email"      placeholder="Email *"    className="sm:col-span-1" onChange={onChange} />
        <Input name="phone"      placeholder="Phone"      className="sm:col-span-1" onChange={onChange} />
        <Textarea name="message" placeholder="Message *"  className="sm:col-span-2 h-40" onChange={onChange}/>
      </div>
      <Button onClick={submit} disabled={busy} className="w-40">Submit</Button>
    </div>
  );
}
