"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className="pt-32 pb-32 px-4 sm:px-6 flex-1 flex flex-col justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/home">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex rounded-full p-[2px] rainbow-bg mb-8 cursor-pointer shadow-lg hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/90 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
                </span>
                <span className="text-sm font-semibold text-foreground tracking-wide">Explore live forms happening right now</span>
                <ArrowRight className="w-3.5 h-3.5 text-foreground ml-1" />
              </div>
            </motion.div>
          </Link>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-primary">
            Anonymous voting for your friend group.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Create "most likely to" polls. Set a password. Share the link.
            Find out what everyone really thinks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="px-8 h-12 text-base font-medium rounded-full"
              render={<Link href="/signup" />}
            >
              Start for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 h-12 text-base rounded-full"
              render={<Link href="/home" />}
            >
              Explore Live Forms
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
