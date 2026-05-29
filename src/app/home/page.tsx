"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Clock, ArrowLeft, Search, Users } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Form } from "@/lib/types/database";
import { CountdownBadge } from "@/components/ui/countdown-badge";
import { useDebounce } from "@/hooks/use-debounce";
import { Highlight } from "@/components/ui/highlight";

export default function HomePage() {
  const [liveForms, setLiveForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "roster" | "general">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const filteredForms = filter === "all" 
    ? liveForms 
    : liveForms.filter(f => (f.voting_type || "roster") === filter);

  useEffect(() => {
    async function fetchLiveForms() {
      setLoading(true);
      const supabase = createClient();
      let query = supabase
        .from("forms")
        .select("*, responses(count)")
        .eq("is_active", true)
        .eq("is_public_feed", true)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (debouncedSearch) {
        query = query.ilike("title", `%${debouncedSearch}%`);
      }

      const { data } = await query;
      if (data) setLiveForms(data);
      setLoading(false);
    }
    fetchLiveForms();
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col min-h-screen text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto relative">
          
          {/* Desktop Back Button */}
          <div className="mb-6 hidden md:block">
            <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-[#262626] text-sm font-medium text-[#A1A1A1] hover:text-white hover:border-[#444] transition-all group shadow-sm">
               <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
               Back to home
            </Link>
          </div>
          
          <div className="text-center mb-12 flex flex-col items-center">
            {/* Mobile Back Button */}
            <Link href="/" className="md:hidden inline-flex items-center gap-2 text-sm text-[#A1A1A1] hover:text-white transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>

            {/* Realtime Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] border border-[#262626] rounded-full mb-6 shadow-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34A853] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34A853]"></span>
              </span>
              <span className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-widest">Realtime Feed</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" style={{ fontFamily: "var(--font-display, var(--font-sans))" }}>
              Live Forms
            </h1>
            
            {/* Description */}
            <p className="text-[#A1A1A1] text-lg max-w-lg mb-8">
              Explore active forms happening right now. Click on any form to enter the password and cast your votes.
            </p>

            {/* Feed Filters & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mx-auto w-full max-w-2xl">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A1]" />
                <input
                  type="text"
                  placeholder="Search forms by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050505] border border-[#1A1A1A] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#333] transition-colors"
                />
              </div>

              <div className="flex p-1 bg-[#050505] border border-[#1A1A1A] rounded-xl shadow-md shrink-0">
                {(["all", "roster", "general"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative px-5 sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-all z-10 ${
                    filter === f ? "text-black" : "text-[#A1A1A1] hover:text-white"
                  }`}
                >
                  {filter === f && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white rounded-lg z-[-1]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {f === "all" ? "All Forms" : f === "roster" ? "Squad" : "Open"}
                </button>
              ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-xl">
              <p className="text-muted-foreground">No forms match this filter right now.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredForms.map((form) => (
                <Link key={form.id} href={`/form/${form.id}/fill`} className="block group">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="glass-panel p-5 rounded-xl hover:border-[#333] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        <Highlight text={form.title} query={debouncedSearch} />
                      </h3>
                      {form.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {form.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-wide">
                        <span className="flex items-center gap-1 text-[#A1A1A1] bg-[#0A0A0A] px-2 py-1 rounded border border-[#1A1A1A]">
                          <Clock className="w-3 h-3" />
                          {new Date(form.created_at).toLocaleDateString()}
                        </span>
                        
                        <span className="flex items-center gap-1 text-[#A1A1A1] bg-[#0A0A0A] px-2 py-1 rounded border border-[#1A1A1A]">
                          {(!form.voting_type || form.voting_type === 'roster') ? "Squad Vote" : "Open Vote"}
                        </span>
                        
                        <span className="flex items-center gap-1 text-[#A1A1A1] bg-[#0A0A0A] px-2 py-1 rounded border border-[#1A1A1A]">
                          <Users className="w-3 h-3" />
                          {(form as any).responses?.[0]?.count || 0} voted
                        </span>

                        <CountdownBadge expiresAt={form.expires_at || null} />
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-sm font-medium">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span>Join form</span>
                      <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
