import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "wouter";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();

  return (
    <motion.div
      key={location}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen w-full flex flex-col"
    >
      <main className="flex-1 w-full relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-[1600px] mx-auto">
        {children}
      </main>
    </motion.div>
  );
}
