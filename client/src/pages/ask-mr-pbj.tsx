// PBJ Health - Ask Mr. PBJ Page
// Generate summaries and answer user questions
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardCard } from "@/components/DashboardCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/auth/AuthProvider";
import { ArrowLeft, MessageSquare, Calendar, TrendingUp, Send } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AskMrPBJ() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");

  const handleAsk = async (windowDays?: number, customQuestion?: string) => {
    if (!user?.id) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: customQuestion || `Show me ${windowDays === 1 ? "yesterday's" : `${windowDays}-day`} analysis`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/coach/analyze', {
        windowDays: windowDays || 7,
        question: customQuestion,
      });
      const result = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: result.message || "Analysis complete.",
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

        <Tabs defaultValue="ask" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ask">Ask Mr. PBJ</TabsTrigger>
            <TabsTrigger value="chats">Previous Chats</TabsTrigger>
          </TabsList>

          <TabsContent value="ask" className="space-y-6">
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
              
              {/* Free text input */}
              <div className="mt-6 flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && question.trim()) {
                      handleAsk(7, question);
                      setQuestion("");
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  onClick={() => {
                    if (question.trim()) {
                      handleAsk(7, question);
                      setQuestion("");
                    }
                  }}
                  disabled={loading || !question.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
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
          </TabsContent>

          <TabsContent value="chats">
            <DashboardCard title="Previous Chats">
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chat history feature coming soon</p>
                <p className="text-xs mt-2">Previous conversations will appear here</p>
              </div>
            </DashboardCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
