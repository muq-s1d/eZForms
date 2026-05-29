"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Clock, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Form } from "@/lib/types/database";

export default function HomePage() {
  const [liveForms, setLiveForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveForms() {
      const supabase = createClient();
      const { data } = await supabase
        .from("forms")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (data) setLiveForms(data);
      setLoading(false);
    }
    fetchLiveForms();
  }, []);

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
            <p className="text-[#A1A1A1] text-lg max-w-lg">
              Explore active forms happening right now. Click on any form to enter the password and cast your votes.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : liveForms.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-xl">
              <p className="text-muted-foreground">No live forms right now.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {liveForms.map((form) => (
                <Link key={form.id} href={`/form/${form.id}/fill`} className="block group">
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="glass-panel p-5 rounded-xl hover:border-[#333] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {form.title}
                      </h3>
                      {form.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {form.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(form.created_at).toLocaleDateString()}
                        </span>
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
