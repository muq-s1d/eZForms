"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user?: { email: string } | null;
  onLogout?: () => void;
}

export function Navbar({ user: initialUser, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localUser, setLocalUser] = useState<{ email: string } | null>(initialUser || null);
  // ── Hide-on-scroll: zero-rerender RAF-throttled approach ──
  // We manipulate the DOM classList directly (no React state) so scroll
  // events never trigger component rerenders — pure GPU work only.
  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const SCROLL_THRESHOLD = 100; // px before hide logic activates

    const handleScroll = () => {
      // RAF throttle: only one calculation per animation frame
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const nav = navRef.current;

        if (nav) {
          const scrollingDown = currentScrollY > lastScrollY.current;
          const pastThreshold = currentScrollY > SCROLL_THRESHOLD;

          if (scrollingDown && pastThreshold) {
            nav.classList.add("navbar-hidden");
          } else {
            nav.classList.remove("navbar-hidden");
          }
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    // passive: true — browser won’t wait for JS before scrolling
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setLocalUser({ email: session.user.email || "" });
      } else {
        setLocalUser(null);
      }
    }
    fetchUser();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLocalUser({ email: session.user.email || "" });
      } else {
        setLocalUser(null);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (initialUser) setLocalUser(initialUser);
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

  const navLinks = [
    { href: "/home", label: "Live Forms" },
    ...(localUser
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/form/create", label: "Create Form" },
        ]
      : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div ref={navRef} className="navbar-float px-6 flex items-center justify-between h-[60px]">
      {/* Logo */}
      <Link
        href={localUser ? "/dashboard" : "/"}
        className="flex items-center gap-2.5 group shrink-0"
      >
        <div className="w-7 h-7 rounded-lg overflow-hidden group-hover:scale-110 transition-transform duration-200">
          <Image src="/ezicon.png" alt="eZForms Logo" width={28} height={28} className="object-cover" />
        </div>
        <span
          className="text-[17px] font-extrabold tracking-tight text-white"
          style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
        >
          eZForms
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(link.href)
                ? "text-white bg-white/10"
                : "text-[#A1A1A1] hover:text-white hover:bg-white/5"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Desktop Auth Actions */}
      <div className="hidden md:flex items-center gap-3">
        {localUser ? (
          <>
            <span className="text-xs text-[#A1A1A1] max-w-[160px] truncate">
              {localUser.email}
            </span>
            <div className="w-px h-4 bg-[#1A1A1A]" />
            <button
              onClick={handleLogout}
              className="btn-obsidian-ghost text-sm px-4 py-1.5 rounded-lg"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm text-[#A1A1A1] hover:text-white transition-colors px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-obsidian-primary text-sm px-4 py-1.5 rounded-lg inline-block"
            >
              Sign up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Toggle */}
      <button
        className="md:hidden p-2 rounded-lg text-[#A1A1A1] hover:text-white hover:bg-white/5 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu — rendered outside the fixed pill so it drops below */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-[72px] left-0 right-0 bg-[#0A0A0A] shadow-2xl border border-[#262626] rounded-xl mx-0 overflow-hidden md:hidden z-50"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive(link.href)
                      ? "text-white bg-white/10"
                      : "text-[#A1A1A1] hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-[#1A1A1A] my-2" />
              {localUser ? (
                <>
                  <p className="px-4 text-xs text-[#A1A1A1] truncate">{localUser.email}</p>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="px-4 py-2.5 rounded-lg text-sm text-left text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2.5 rounded-lg text-sm text-[#A1A1A1] hover:text-white hover:bg-white/5 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="mx-4 mt-1 py-2.5 rounded-lg text-sm text-center font-semibold btn-obsidian-primary"
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
    </div>
  );
}
