"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { FadeInUp } from "@/components/animations/motion-wrapper";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || email.trim() === "") {
      setError("Please enter your email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (username.length < 5) {
      setError("Username must be at least 5 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Check if username is taken
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (existingUser) {
        setError("This username is already taken.");
        setLoading(false);
        return;
      }

      // Sign up the user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Create profile entry if it doesn't exist
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          email,
        });

        if (profileError && !profileError.message.includes("duplicate")) {
          console.error("Profile creation error:", profileError);
        }
      }

      // If email verification is enabled, session will be null
      if (data.user && !data.session) {
        setSuccessMsg("Account created! Please check your email to verify your account.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground px-4 py-2 rounded-full border border-border/50 shadow-sm transition-all z-10 hover:shadow-md hover:border-border">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="w-full max-w-md">
          <FadeInUp>
            <div className="glass rounded-2xl p-8 text-center border-primary/50 bg-primary/5">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Check your email</h2>
              <p className="text-muted-foreground mb-8">
                {successMsg}
              </p>
              <Button className="w-full h-11 gradient-bg text-white border-0" onClick={() => router.push("/login")}>
                Return to log in
              </Button>
            </div>
          </FadeInUp>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[120px] bg-purple-accent pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-[100px] bg-coral pointer-events-none" />

      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm font-medium bg-secondary/80 hover:bg-secondary text-secondary-foreground px-4 py-2 rounded-full border border-border/50 shadow-sm transition-all z-10 hover:shadow-md hover:border-border">
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      <div className="w-full max-w-md">
        <FadeInUp>
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
              <Image src="/ezicon.png" alt="eZForms Logo" width={40} height={40} className="object-cover" />
            </div>
            <span className="text-xl font-bold">
              eZ<span className="text-primary font-bold">Forms</span>
            </span>
          </Link>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <div className="glass rounded-2xl p-8 glow-gradient">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-sm text-muted-foreground">
                Start creating voting forms for your squad
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-input border-border focus:border-primary/50 focus:ring-primary/20"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gradient-bg text-white border-0 hover:opacity-90 transition-opacity font-medium"
              >
                {loading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </FadeInUp>
      </div>
    </div>
  );
}
