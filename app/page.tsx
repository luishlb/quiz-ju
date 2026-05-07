import Image from "next/image";
import { Countdown } from "@/components/ui/Countdown";
import { JuMascot } from "@/components/ui/JuMascot";
import { NameForm } from "@/components/ui/NameForm";
import { TestModeFlag } from "@/components/ui/TestModeFlag";

export default function Landing() {
  return (
      <main className="flex-1 flex flex-col items-center justify-start px-5 py-8 sm:py-12 gap-8 sm:gap-10 max-w-xl mx-auto w-full">
        <TestModeFlag />
        {/* Hero — capa Capricho como polaroid grande */}
        <div className="relative w-full max-w-[340px] mx-auto">
          {/* estrelinhas decorativas */}
          <span
            aria-hidden
            className="absolute -top-3 -left-4 text-3xl rotate-[-18deg] drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)] z-10"
          >
            ✨
          </span>
          <span
            aria-hidden
            className="absolute -top-2 -right-3 text-2xl rotate-[12deg] drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)] z-10"
          >
            💖
          </span>
          <span
            aria-hidden
            className="absolute -bottom-2 left-2 text-2xl rotate-[-8deg] drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)] z-10"
          >
            ⭐
          </span>

          <div className="magazine rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
            <Image
              src="/capa.jpg"
              alt="Capa de revista Capricho — Edição Especial Ju Faz 40"
              width={941}
              height={1672}
              priority
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* Título principal */}
        <div className="text-center space-y-3 -mt-2">
          <h1 className="font-bubble text-rosa-choque text-3xl sm:text-4xl leading-tight drop-shadow-[3px_3px_0_rgba(255,255,255,0.85)]">
            VOCÊ É AMIGA(O)
            <br />
            DE VERDADE
            <br />
            DA JU?
          </h1>
          <p className="font-display text-preto-revista/80 text-base">
            Edição Especial — Ju Faz 40
          </p>
          <p className="font-display text-rosa-choque text-sm uppercase tracking-widest">
            ✨ Teste oficial Capricho ✨
          </p>
        </div>

        {/* Bonequinho saltitante da Ju */}
        <JuMascot mood="feliz" size="md" className="-mb-2" />

        {/* Form do nome */}
        <NameForm />

        {/* Countdown */}
        <div className="w-full mt-2">
          <Countdown />
          <p className="text-center mt-3 font-display text-preto-revista/60 text-xs">
            24 . 04 . 2027 — Ilha do Retiro, Recife
          </p>
        </div>

        {/* Rodapé revista */}
        <div className="text-center mt-4 mb-20 text-[11px] text-preto-revista/50 font-display tracking-wide">
          R$ 4,90 • ANO X • Nº 487 — Tema: NOSTALGIA OBRIGATÓRIA
        </div>
      </main>
  );
}
