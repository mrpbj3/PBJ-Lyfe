// PBJ Health - Ask Mr. PBJ Page
// Generate summaries and answer user questions
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DashboardCard } from "@/components/DashboardCard";
import { useAuth } from "@/auth/AuthProvider";
import { askMrPBJ } from "@/lib/aiCoachLogic";
import { ArrowLeft, MessageSquare, Calendar, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AskMrPBJ() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (range: number) => {
    if (!user?.id) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: `Show me ${range === 1 ? "yesterday's" : `${range}-day`} analysis`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    try {
      const result = await askMrPBJ(range, user.id);
      const assistantMessage: Message = {
        role: "assistant",
        content: result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error asking Mr. PBJ:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/today">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Today
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Ask Mr. PBJ</h1>
          <p className="text-muted-foreground">
            Get AI-powered insights and analysis of your health data
          </p>
        </div>

        <DashboardCard title="Quick Analysis" description="Select a time range to analyze">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleAsk(1)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Previous Day
            </Button>
            <Button
              onClick={() => handleAsk(7)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              7 Days
            </Button>
            <Button
              onClick={() => handleAsk(30)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              30 Days
            </Button>
            <Button
              onClick={() => handleAsk(90)}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              90 Days
            </Button>
          </div>
          
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/ask-mr-pbj/history")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View Previous Chats
            </Button>
          </div>
        </DashboardCard>

        {/* Messages */}
        {messages.length > 0 && (
          <DashboardCard title="Conversation">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-primary/10 ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {msg.role === "user" ? "You" : "Mr. PBJ"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="rounded-lg p-4 bg-muted mr-8">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">Mr. PBJ is thinking...</div>
                  </div>
                </div>
              )}
            </div>
          </DashboardCard>
        )}

        {messages.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a time range above to start your analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
