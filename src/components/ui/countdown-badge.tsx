"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function CountdownBadge({ expiresAt }: { expiresAt: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const target = new Date(expiresAt).getTime();
    
    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (h > 0) {
        setTimeLeft(`${h}h ${m}m left`);
      } else {
        setTimeLeft(`${m}m left`);
      }
    };

    update();
    // Update every minute
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const isExpired = timeLeft === "Expired";

  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded border ${
      isExpired 
        ? "bg-[#EA4335]/10 border-[#EA4335]/20 text-[#EA4335]" 
        : "bg-[#FBBC05]/10 border-[#FBBC05]/20 text-[#FBBC05]"
    }`}>
      {!isExpired && <Clock className="w-3 h-3" />}
      {timeLeft || "..."}
    </span>
  );
}
