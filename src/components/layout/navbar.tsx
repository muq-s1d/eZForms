"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user?: { email: string } | null;
  onLogout?: () => void;
}

export function Navbar({ user: initialUser, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localUser, setLocalUser] = useState<{ email: string } | null>(initialUser || null);
  const router = useRouter();

  useEffect(() => {
    // If the component is rendered in another tab or the prop wasn't passed (like on landing page)
    // we fetch the user state directly from Supabase.
    async function fetchUser() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setLocalUser({ email: session.user.email || "" });
      } else {
        setLocalUser(null);
      }
    }
    
    // Always fetch on mount to sync tabs
    fetchUser();

    // Listen for auth state changes (e.g. login/logout in other tabs)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLocalUser({ email: session.user.email || "" });
      } else {
        setLocalUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync prop changes if they happen
  useEffect(() => {
    if (initialUser) {
      setLocalUser(initialUser);
    }
  }, [initialUser]);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={localUser ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              eZ<span className="text-primary font-bold">Forms</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/home" />}>
              Live Forms
            </Button>
            {localUser ? (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" render={<Link href="/form/create" />}>
                  Create Form
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <span className="text-sm text-muted-foreground mr-2">
                  {localUser.email}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-border hover:border-primary/50"
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Log in
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground border-0 hover:opacity-90" render={<Link href="/signup" />}>
                  Sign up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden glass-strong border-t border-border"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              <Link
                href="/home"
                className="px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm"
                onClick={() => setMobileOpen(false)}
              >
                Live Forms
              </Link>
              {localUser ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/form/create"
                    className="px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Create Form
                  </Link>
                  <div className="h-px bg-border my-1" />
                  <p className="px-4 text-xs text-muted-foreground">
                    {localUser.email}
                  </p>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-left text-destructive"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm text-center font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
