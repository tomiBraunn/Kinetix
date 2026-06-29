import type { ReactNode } from "react";
import { motion } from "framer-motion";

type AuthCardProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

// Staggered waterfall reveal: parent orchestrates, children fade+rise in
// sequence (skill section 4). Spring physics, no linear easing.
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 },
  },
};

export default function AuthCard({ icon, title, children }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="w-full max-w-[544px] rounded-[2.5rem] bg-white/60 backdrop-blur-xl px-8 py-9 shadow-[0_24px_60px_-20px_rgba(43,49,156,0.18)] ring-1 ring-primary/5"
    >
      <motion.div className="w-full flex flex-col" variants={container} initial="hidden" animate="show">
        <motion.header
          variants={item}
          className="flex items-center gap-2.5 mb-8"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#C4D8F0]">
            {icon}
          </span>
          <h1 className="text-primary text-[30px] font-black leading-none tracking-tight">
            {title}
          </h1>
        </motion.header>
        {children}
      </motion.div>
    </motion.div>
  );
}
