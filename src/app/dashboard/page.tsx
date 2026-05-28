"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Users,
  BarChart3,
  Copy,
  ExternalLink,
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  PowerOff,
  UserX,
} from "lucide-react";
import type { Form } from "@/lib/types/database";

interface FormWithCounts extends Form {
  participant_count: number;
  question_count: number;
  response_count: number;
}

/* ── Display font helper ── */
const displayFont = { fontFamily: "var(--font-display, var(--font-sans))" };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [forms, setForms] = useState<FormWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) { router.push("/login"); return; }
    setUser({ id: currentUser.id, email: currentUser.email || "" });

    const { data: formsData } = await supabase
      .from("forms")
      .select("*")
      .eq("creator_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (formsData) {
      const formsWithCounts: FormWithCounts[] = await Promise.all(
        formsData.map(async (form: Form) => {
          const [participants, questions, responses] = await Promise.all([
            supabase.from("participants").select("id", { count: "exact", head: true }).eq("form_id", form.id),
            supabase.from("questions").select("id", { count: "exact", head: true }).eq("form_id", form.id),
            supabase.from("responses").select("id", { count: "exact", head: true }).eq("form_id", form.id),
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

  useEffect(() => { fetchForms(); }, [fetchForms]);

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
    if (!confirm("Close this form for new votes?")) return;
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
    if (!confirm("DANGER: Permanently delete your account and all forms? This cannot be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_user");
    if (error) { alert("Failed to delete account. Ensure the database function is configured."); return; }
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="flex-1 pt-[100px] pb-16 px-5 max-w-6xl mx-auto w-full">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 pb-6 border-b border-[#1A1A1A]"
        >
          <div>
            <h1
              className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white"
              style={displayFont}
            >
              Your forms
            </h1>
            <p className="text-sm text-[#A1A1A1] mt-1.5">
              {forms.length === 0
                ? "Create your first voting form to get started"
                : `${forms.length} form${forms.length !== 1 ? "s" : ""} created`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAccount}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#EA4335]/70 hover:text-[#EA4335] border border-transparent hover:border-[#EA4335]/30 hover:bg-[#EA4335]/5 transition-all duration-200"
            >
              <UserX className="w-4 h-4" />
              Delete Account
            </button>
            <Link
              href="/form/create"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold btn-obsidian-primary"
            >
              <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              New form
            </Link>
          </div>
        </motion.div>

        {/* ── Forms Grid ── */}
        {forms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center py-24 glass-panel rounded-2xl border-dashed"
          >
            <div className="w-14 h-14 rounded-xl border border-[#1A1A1A] bg-[#050505] flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6 text-[#A1A1A1]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No forms yet</h2>
            <p className="text-sm text-[#A1A1A1] mb-7 text-center max-w-xs">
              Create your first voting form and share it with your crew.
            </p>
            <Link
              href="/form/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold btn-obsidian-primary"
            >
              <Plus className="w-4 h-4" />
              Create your first form
            </Link>
          </motion.div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.07 } },
            }}
          >
            {forms.map((form) => (
              <motion.article
                key={form.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="group glass-panel rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden hover:border-[#333] transition-colors duration-300"
              >
                {/* Ambient bloom */}
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/0 group-hover:bg-white/[0.03] blur-2xl transition-colors duration-500 pointer-events-none" />

                {/* Title + Status */}
                <div className="flex items-start justify-between gap-2 z-10">
                  <h2 className="font-semibold text-[15px] leading-snug text-white line-clamp-2 flex-1">
                    {form.title}
                  </h2>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      form.is_active
                        ? "bg-[#34A853]/10 text-[#34A853] border-[#34A853]/25"
                        : "bg-white/5 text-[#A1A1A1] border-[#1A1A1A]"
                    }`}
                  >
                    {form.is_active ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34A853] pulse-live" />
                        Live
                      </>
                    ) : (
                      "Finished"
                    )}
                  </span>
                </div>

                {form.description && (
                  <p className="text-xs text-[#A1A1A1] line-clamp-2 z-10">{form.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-[11px] text-[#A1A1A1] z-10 mt-auto">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {form.participant_count}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {form.response_count} votes
                  </span>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 z-10">
                  <Link
                    href={`/form/${form.id}/results`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-[#A1A1A1] border border-[#1A1A1A] hover:text-white hover:border-[#333] hover:bg-white/5 transition-all duration-200"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Results
                  </Link>
                  {form.is_active && (
                    <>
                      <button
                        onClick={() => copyShareLink(form.id)}
                        title="Copy share link"
                        className="p-2 rounded-lg text-[#A1A1A1] border border-[#1A1A1A] hover:text-white hover:border-[#333] hover:bg-white/5 transition-all duration-200"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/form/${form.id}/fill`}
                        target="_blank"
                        title="Open form"
                        className="p-2 rounded-lg text-[#A1A1A1] border border-[#1A1A1A] hover:text-white hover:border-[#333] hover:bg-white/5 transition-all duration-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </>
                  )}
                </div>

                {/* Secondary row */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1A1A1A] z-10">
                  <button
                    onClick={() => handleTogglePrivacy(form.id, form.is_public_results)}
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#A1A1A1] hover:text-white transition-colors duration-200"
                    title={form.is_public_results ? "Make Private" : "Make Public"}
                  >
                    {form.is_public_results ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {form.is_public_results ? "Public" : "Private"}
                  </button>

                  <div className="flex gap-1">
                    {form.is_active && (
                      <button
                        onClick={() => handleFinishForm(form.id)}
                        title="Close voting"
                        className="p-1.5 rounded-lg text-[#FBBC05] hover:bg-[#FBBC05]/10 transition-all duration-200"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      title="Delete form"
                      className="p-1.5 rounded-lg text-[#EA4335] hover:bg-[#EA4335]/10 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}

            {/* Empty slot CTA */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
              }}
            >
              <Link
                href="/form/create"
                className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#1A1A1A] hover:border-[#333] bg-transparent transition-all duration-300 min-h-[200px] p-6 w-full"
              >
                <div className="w-10 h-10 rounded-full border border-[#1A1A1A] group-hover:border-[#333] bg-[#0A0A0A] flex items-center justify-center text-[#A1A1A1] group-hover:text-white transition-colors duration-200">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm text-[#A1A1A1] group-hover:text-white transition-colors duration-200">
                  Create new form
                </span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
