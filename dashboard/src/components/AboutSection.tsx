// Seção "Sobre" — quem construiu isso e por quê. Fica perto do fim (depois de já mostrar o
// produto) de propósito: primeiro impressiona com o dado/pipeline, depois convida à conexão.
// Server Component puro (sem interatividade) — só texto, foto e links.
//
// Nunca mencionar empregador atual/anterior por nome nem qualquer situação de emprego aqui —
// decisão explícita do Anthony. O texto abaixo é o primeiro rascunho: ele pode querer
// personalizar mais (um momento específico, um detalhe pessoal) depois.

import Image from "next/image";
import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/icons";

const LINKS = {
  linkedin: "https://www.linkedin.com/in/anthony-gabriel-3858631b9",
  github: "https://github.com/anthonygaab13",
  instagram: "https://www.instagram.com/anthonygb.eu/",
  portfolio: "https://anthonygabriel.vercel.app",
};

export function AboutSection() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/40">
          <Image src="/images/avatar.jpg" alt="Anthony Gabriel" fill sizes="64px" className="object-cover" />
        </div>

        <div className="min-w-0">
          <p className="font-mono text-xs tracking-wider text-primary uppercase">Sobre</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Anthony Gabriel</h3>

          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Depois de alguns anos passando por operações, processos e BI, decidi focar de vez em engenharia de
              dados: entender não só &ldquo;o que aconteceu&rdquo;, mas construir o caminho inteiro, da extração até
              a decisão.
            </p>
            <p>
              Esse pipeline de indicadores do Banco Central é o primeiro de uma série de projetos que pretendo
              construir em público — documentando o processo (erros incluídos), não só o resultado pronto. Quem
              trabalha com câmbio, juros ou inflação no dia a dia sabe como é ter que caçar esses números em fontes
              espalhadas; foi esse tipo de fricção real que me fez querer construir algo assim.
            </p>
            <p>Se você também está migrando de carreira, aprendendo dados ou só curioso sobre o processo, bora trocar ideia.</p>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <a
              href={LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <LinkedinIcon className="size-5" />
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <GithubIcon className="size-5" />
            </a>
            <a
              href={LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              <InstagramIcon className="size-5" />
            </a>
            <div className="ml-auto flex items-center gap-4 text-xs">
              <a href="/bastidores" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Diário de bordo →
              </a>
              <a href={LINKS.portfolio} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                Portfólio completo →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
