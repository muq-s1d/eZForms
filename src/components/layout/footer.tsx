import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
              <Image src="/ezicon.png" alt="eZForms Logo" width={24} height={24} className="object-cover" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              eZ<span className="text-primary font-bold">Forms</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>

          {/* Credit */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} eZForms. Made for fun.
          </p>
        </div>
      </div>
    </footer>
  );
}
