"use client";

// Anima o valor de um StatTile contando de 0 até o número real quando o card entra na tela.
// Recebe o número puro (não uma string já formatada) porque assim dá pra interpolar o valor
// quadro a quadro — decimals/prefix/suffix controlam a formatação final, do mesmo jeito que
// chart-utils.ts usa um preset em vez de função (funções não atravessam a fronteira
// Server -> Client Component como prop).

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const formatted = `${prefix}${value.toFixed(decimals)}${suffix}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;

    if (reduceMotion) {
      el.textContent = formatted;
      return;
    }

    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(latest) {
        el.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals, prefix, suffix, reduceMotion, formatted]);

  // Renderiza o valor final de cara (SSR e primeiro paint no cliente batem, sem mismatch de
  // hidratação) — só quando entra na tela é que o efeito acima reescreve o texto pra fazer a
  // contagem de 0 até aqui. Sem JS ou com prefers-reduced-motion, o valor certo já está ali.
  //
  // Sem tabular-nums de propósito: é um número grande e isolado (não uma coluna que precisa
  // alinhar), e os dígitos tabulares desse font ficam mais largos que os proporcionais — larga
  // o suficiente pra empurrar "% a.a." pra segunda linha no card da Selic. Ver marks-and-anatomy
  // da skill de dataviz: figura isolada usa proporcional, tabular é só pra coluna/eixo.
  return <span ref={ref}>{formatted}</span>;
}
