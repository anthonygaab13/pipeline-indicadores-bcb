"use client";

// Anima a entrada de uma seção quando ela entra na tela (scroll) — mesmo componente usado
// no portfólio (mesma biblioteca, Motion), pra manter a identidade consistente entre os dois
// projetos. Client Component, mas os "children" continuam podendo ser Server Components: o
// Next.js renderiza o conteúdo no servidor e só entrega pronto pra esse wrapper animar.
//
// Respeita prefers-reduced-motion automaticamente (Motion reduz pra só um fade, sem
// deslocamento, quando o sistema operacional pede isso).

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
