import { Hero } from "@/components/hero";
import { SabiosAntiguos } from "@/components/sabios";
import { DosCajas } from "@/components/juegos/dos-cajas";
import { DesafioVirtudes } from "@/components/juegos/desafio-virtudes";
import { MisionesDiarias } from "@/components/juegos/misiones";
import { EscudoEstoico } from "@/components/escudo-estoico";

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-50/50 dark:bg-zinc-950">
      <Hero />
      <main className="mx-auto max-w-6xl space-y-12 p-4 pb-24 md:space-y-16 md:p-8">
        <SabiosAntiguos />
        <DosCajas />
        <DesafioVirtudes />
        <MisionesDiarias />
        <EscudoEstoico />
      </main>
    </div>
  );
}
