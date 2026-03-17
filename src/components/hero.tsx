import Image from "next/image";

export function Hero() {
  return (
    <header className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-center text-white shadow-lg md:p-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center md:flex-row md:text-left">
        <div className="relative mb-6 h-32 w-32 shrink-0 md:mb-0 md:mr-8 md:h-48 md:w-48">
          <Image
            src="/logo.png"
            alt="Logo Estoico"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="mb-4 text-4xl font-black drop-shadow-sm md:text-5xl">
            ¡Conviértete en un Superhéroe de la Mente! 🦸‍♂️🧠
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-light drop-shadow-sm md:mx-0 md:text-xl">
            Elias: Descubre los secretos de los Estoicos: sabios antiguos que
            eran como superhéroes de la vida real.
          </p>
        </div>
      </div>
    </header>
  );
}
