"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/animations/motion-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart3, Users, Trophy, Copy, Check, ArrowLeft, Lock, PieChart as PieChartIcon } from "lucide-react";
import type { Form, Participant, Question } from "@/lib/types/database";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

interface VoteCount {
  participant_id: string;
  participant_name: string;
  count: number;
}

interface QuestionResults {
  question: Question;
  votes: VoteCount[];
  total: number;
}

type Stage = "loading" | "private" | "password" | "results" | "error";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;

  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResults[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  const [copied, setCopied] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fetchResults = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    
    if (currentUser) setUser({ id: currentUser.id, email: currentUser.email || "" });

    // Fetch form details
    const { data: formData } = await supabase
      .from("forms")
      .select("*")
      .eq("id", formId)
      .single();

    if (!formData) {
      setError("Form not found.");
      setStage("error");
      return;
    }
    setForm(formData);

    // Privacy Check
    const isCreator = currentUser && currentUser.id === formData.creator_id;
    if (!isCreator) {
      if (!formData.is_public_results) {
        setStage("private");
        return;
      }
      if (formData.password) {
        const storedAuth = sessionStorage.getItem(`ezforms-auth-${formId}`);
        if (storedAuth !== "true") {
          setStage("password");
          return;
        }
      }
    }

    // Fetch participants
    const { data: parts } = await supabase
      .from("participants")
      .select("*")
      .eq("form_id", formId);
    setParticipants(parts || []);

    // Fetch questions
    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .eq("form_id", formId)
      .order("sort_order");

    // Fetch total responses
    const { count: respCount } = await supabase
      .from("responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", formId);
    setTotalResponses(respCount || 0);

    // Fetch all answers
    const { data: answers } = await supabase
      .from("answers")
      .select("question_id, selected_participant_id")
      .in(
        "question_id",
        (questions || []).map((q: Question) => q.id)
      );

    // Build results per question
    const results: QuestionResults[] = (questions || []).map((q: Question) => {
      const qAnswers = (answers || []).filter(
        (a: { question_id: string; selected_participant_id: string }) => a.question_id === q.id
      );

      const voteCounts = new Map<string, number>();
      qAnswers.forEach((a: { question_id: string; selected_participant_id: string }) => {
        const current = voteCounts.get(a.selected_participant_id) || 0;
        voteCounts.set(a.selected_participant_id, current + 1);
      });

      const votes: VoteCount[] = (parts || [])
        .map((p: Participant) => ({
          participant_id: p.id,
          participant_name: p.name,
          count: voteCounts.get(p.id) || 0,
        }))
        .sort((a: VoteCount, b: VoteCount) => b.count - a.count);

      return {
        question: q,
        votes,
        total: qAnswers.length,
      };
    });

    setQuestionResults(results);
    setStage("results");
  }, [formId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    if (stage !== "results") return;

    const supabase = createClient();
    const channel = supabase
      .channel(`results-${formId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "responses", filter: `form_id=eq.${formId}` },
        () => fetchResults()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "answers" },
        () => fetchResults()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formId, fetchResults, stage]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (passwordInput === form?.password) {
      sessionStorage.setItem(`ezforms-auth-${formId}`, "true");
      fetchResults();
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/form/${formId}/fill`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const barColors = ["#ffffff", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"
        />
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Form not found</h1>
          <Button variant="outline" render={<Link href="/dashboard" />}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "private") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm glass rounded-xl p-8 border border-border">
            <Lock className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-xl font-bold mb-2">Results are Private</h1>
            <p className="text-sm text-muted-foreground mb-6">
              The creator of this form has kept the results private.
            </p>
            <Button variant="outline" render={<Link href="/" />}>
              Go Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (stage === "password") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm">
          <FadeInUp>
            <div className="glass rounded-xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Lock className="w-6 h-6 text-foreground" />
              </div>
              <h1 className="text-xl font-bold text-center mb-2">{form?.title}</h1>
              <p className="text-sm text-center text-muted-foreground mb-6">
                Enter the password to view results.
              </p>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="text-center bg-secondary/50 h-12"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive text-center">{passwordError}</p>
                  )}
                  <Button type="submit" className="w-full h-12">
                    Unlock Results
                  </Button>
                </div>
              </form>
            </div>
          </FadeInUp>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <FadeInUp>
            <div className="mb-8 border-b border-border pb-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground mb-4"
                render={<Link href="/dashboard" />}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to dashboard
              </Button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{form?.title}</h1>
                  {form?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-secondary p-1 rounded-lg border border-border">
                    <Button
                      variant={chartType === "bar" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => setChartType("bar")}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={chartType === "pie" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => setChartType("pie")}
                    >
                      <PieChartIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyShareLink}
                    className="h-10 border-border shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1.5 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1.5" />
                    )}
                    {copied ? "Copied!" : "Share"}
                  </Button>
                </div>
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {participants.length} participants
                </span>
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  {totalResponses} responses
                </span>
                {form?.is_active && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" />
                    Live
                  </Badge>
                )}
                {!form?.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Finished
                  </Badge>
                )}
              </div>
            </div>
          </FadeInUp>

          {totalResponses === 0 ? (
            <FadeInUp delay={0.1}>
              <div className="glass rounded-xl p-8 text-center border border-border">
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No votes yet</h2>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  Share the link with your friends to start collecting votes.
                </p>
                <Button onClick={copyShareLink}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy share link
                </Button>
              </div>
            </FadeInUp>
          ) : (
            <StaggerContainer className="space-y-6">
              {questionResults.map((qr, qi) => {
                const maxVotes = Math.max(...qr.votes.map((v) => v.count), 1);
                const winner = qr.votes[0];
                const hasWinner = winner && winner.count > 0;
                
                // Data for pie chart
                const pieData = qr.votes.filter(v => v.count > 0).map((v) => ({
                  name: v.participant_name,
                  value: v.count
                }));

                return (
                  <StaggerItem key={qr.question.id}>
                    <div className="glass rounded-xl p-6 border border-border">
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <h3 className="font-semibold text-base">
                          {qr.question.question_text}
                        </h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {qr.total} vote{qr.total !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {hasWinner && chartType === "bar" && (
                        <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-md bg-secondary border border-border w-fit">
                          <Trophy className="w-3.5 h-3.5 text-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            {winner.participant_name} is leading
                          </span>
                        </div>
                      )}

                      {chartType === "bar" ? (
                        <div className="space-y-3">
                          {qr.votes.map((vote, vi) => {
                            const percentage = qr.total > 0
                              ? Math.round((vote.count / qr.total) * 100)
                              : 0;

                            return (
                              <div key={vote.participant_id}>
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                  <span className="font-medium flex items-center gap-1.5">
                                    {vi === 0 && vote.count > 0 && (
                                      <Trophy className="w-3 h-3 text-foreground" />
                                    )}
                                    {vote.participant_name}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {vote.count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="h-3 rounded-full bg-secondary overflow-hidden border border-border/50">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: barColors[vi % barColors.length] }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${maxVotes > 0 ? (vote.count / maxVotes) * 100 : 0}%` }}
                                    transition={{ duration: 0.8, delay: qi * 0.1 + vi * 0.05, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="h-[250px] w-full mt-4">
                          {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={90}
                                  paddingAngle={5}
                                  dataKey="value"
                                  animationDuration={1000}
                                  stroke="var(--card)"
                                  strokeWidth={2}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  formatter={(value: any) => [`${value} votes`, undefined]}
                                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                                  itemStyle={{ color: 'var(--foreground)' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                              No data to display
                            </div>
                          )}
                          <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {pieData.map((entry, index) => (
                              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: barColors[index % barColors.length] }} />
                                <span>{entry.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>
      </main>
    </div>
  );
}
