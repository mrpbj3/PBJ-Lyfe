"use client";

import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { DashboardCard } from '@/components/DashboardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { subject: string; message: string; email?: string }) => {
      const response = await apiRequest('POST', '/api/contact', data);
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Message sent!',
        description: 'We\'ll get back to you as soon as possible.',
        className: 'bg-green-500 text-white border-green-600'
      });
      setSubject('');
      setMessage('');
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
        className: 'bg-red-500 text-white border-red-600'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    mutation.mutate({ 
      subject, 
      message,
      email: user?.email
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/today">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
        
        <DashboardCard title="Send us a message">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll respond to your account email
              </p>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                rows={6}
              />
            </div>

            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </DashboardCard>
        
        <DashboardCard title="Other ways to reach us" className="mt-6">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:support@pbjlyfe.com" className="text-primary hover:underline">
                support@pbjlyfe.com
              </a>
            </p>
            <p className="text-muted-foreground">
              We typically respond within 24-48 hours.
            </p>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
