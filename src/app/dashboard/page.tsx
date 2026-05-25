"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { FadeInUp, StaggerContainer, StaggerItem } from "@/components/animations/motion-wrapper";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Users,
  MessageSquare,
  BarChart3,
  Copy,
  ExternalLink,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  PowerOff,
  UserX
} from "lucide-react";
import type { Form } from "@/lib/types/database";

interface FormWithCounts extends Form {
  participant_count: number;
  question_count: number;
  response_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [forms, setForms] = useState<FormWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      router.push("/login");
      return;
    }

    setUser({ id: currentUser.id, email: currentUser.email || "" });

    // Fetch forms with counts
    const { data: formsData } = await supabase
      .from("forms")
      .select("*")
      .eq("creator_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (formsData) {
      const formsWithCounts: FormWithCounts[] = await Promise.all(
        formsData.map(async (form: Form) => {
          const [participants, questions, responses] = await Promise.all([
            supabase
              .from("participants")
              .select("id", { count: "exact", head: true })
              .eq("form_id", form.id),
            supabase
              .from("questions")
              .select("id", { count: "exact", head: true })
              .eq("form_id", form.id),
            supabase
              .from("responses")
              .select("id", { count: "exact", head: true })
              .eq("form_id", form.id),
          ]);

          return {
            ...form,
            participant_count: participants.count || 0,
            question_count: questions.count || 0,
            response_count: responses.count || 0,
          };
        })
      );

      setForms(formsWithCounts);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const copyShareLink = (formId: string) => {
    const url = `${window.location.origin}/form/${formId}/fill`;
    navigator.clipboard.writeText(url);
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to permanently delete this form?")) return;
    const supabase = createClient();
    await supabase.from("forms").delete().eq("id", formId);
    fetchForms();
  };

  const handleFinishForm = async (formId: string) => {
    if (!confirm("Are you sure you want to finish this form? It will be closed for new votes.")) return;
    const supabase = createClient();
    await supabase.from("forms").update({ is_active: false }).eq("id", formId);
    fetchForms();
  };

  const handleTogglePrivacy = async (formId: string, currentPublicState: boolean) => {
    const supabase = createClient();
    await supabase.from("forms").update({ is_public_results: !currentPublicState }).eq("id", formId);
    fetchForms();
  };

  const handleDeleteAccount = async () => {
    if (!confirm("DANGER: Are you sure you want to permanently delete your account and all forms? This cannot be undone.")) return;
    
    // Deleting account via Supabase Auth usually requires backend admin API or calling a custom edge function.
    // For MVP purposes, if RLS is configured or if we just want to mock the UX:
    // await supabase.rpc('delete_user'); // (Assuming such an RPC existed)
    
    // In many minimal setups, users can't delete themselves directly from the client without an RPC function.
    // We will just alert the user that this requires backend admin support for the standard supabase setup.
    alert("Account deletion requested. (For the MVP, please delete the user manually in the Supabase Auth dashboard as client-side user deletion requires a backend Edge Function).");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <FadeInUp>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-border pb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Your forms</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {forms.length === 0
                    ? "Create your first voting form to get started"
                    : `${forms.length} form${forms.length !== 1 ? "s" : ""} created`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:opacity-90"
                  render={<Link href="/form/create" />}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New form
                </Button>
              </div>
            </div>
          </FadeInUp>

          {/* Forms Grid */}
          {forms.length === 0 ? (
            <FadeInUp delay={0.1}>
              <div className="flex flex-col items-center justify-center py-20 bg-card border border-dashed border-border rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">No forms yet</h2>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Create your first voting form and share it with your friends to get the chaos started.
                </p>
                <Button
                  className="bg-primary text-primary-foreground hover:opacity-90"
                  render={<Link href="/form/create" />}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first form
                </Button>
              </div>
            </FadeInUp>
          ) : (
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {forms.map((form) => (
                <StaggerItem key={form.id}>
                  <div className="group p-5 rounded-xl bg-card border border-border hover:border-primary transition-all flex flex-col h-full">
                    {/* Status + Title */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1">
                        {form.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={
                          form.is_active
                            ? "bg-success/10 text-success border-success/20 text-xs shrink-0"
                            : "bg-muted text-muted-foreground text-xs shrink-0"
                        }
                      >
                        {form.is_active ? "Live" : "Finished"}
                      </Badge>
                    </div>

                    {form.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {form.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6 mt-auto">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {form.participant_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        {form.response_count} votes
                      </span>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        render={<Link href={`/form/${form.id}/results`} />}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Results
                      </Button>
                      {form.is_active && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => copyShareLink(form.id)}
                            title="Copy share link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0"
                            render={<Link href={`/form/${form.id}/fill`} target="_blank" />}
                            title="Open form"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Secondary Management Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleTogglePrivacy(form.id, form.is_public_results)}
                        title={form.is_public_results ? "Make Results Private" : "Make Results Public"}
                      >
                        {form.is_public_results ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                        {form.is_public_results ? "Public" : "Private"}
                      </Button>
                      
                      {form.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-warning hover:text-warning hover:bg-warning/10"
                          onClick={() => handleFinishForm(form.id)}
                          title="Finish Form"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteForm(form.id)}
                        title="Delete Form"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </div>
  );
}
