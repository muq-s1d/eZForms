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

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      setLoading(false);
    }
  };

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

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-transparent border-border/50 hover:bg-secondary/50 font-medium mb-5 flex items-center justify-center gap-2 text-white"
            >
              <GoogleIcon />
              Sign up with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#121212] px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
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
