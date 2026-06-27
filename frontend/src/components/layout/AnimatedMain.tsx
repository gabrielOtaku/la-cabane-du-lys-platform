"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function AnimatedMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        exit={{ opacity: 0, filter: "blur(6px)" }}
        transition={{
          clipPath: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
          opacity: { duration: 0.25 },
          filter: { duration: 0.25 },
        }}
        style={{ willChange: "clip-path" }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
