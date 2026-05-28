import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t border-[#1A1A1A] bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-6 h-6 rounded-md overflow-hidden group-hover:scale-110 transition-transform">
              <Image src="/ezicon.png" alt="eZForms Logo" width={24} height={24} className="object-cover" />
            </div>
            <span
              className="text-sm font-extrabold tracking-tight text-white"
              style={{ fontFamily: "var(--font-display, var(--font-sans))" }}
            >
              eZForms
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-[#A1A1A1]">
            <Link href="/home" className="hover:text-white transition-colors duration-200">
              Live Forms
            </Link>
            <Link href="/login" className="hover:text-white transition-colors duration-200">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors duration-200">
              Sign up
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-xs text-[#444748]">
            © {new Date().getFullYear()} eZForms
          </p>
        </div>
      </div>
    </footer>
  );
}
