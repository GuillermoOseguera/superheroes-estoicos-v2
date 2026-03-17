"use client";

import Image from "next/image";

export function EscudoEstoico() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 p-6 text-white shadow-xl md:p-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-6 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 md:text-5xl">
          ¡Diseña tu Escudo Estoico! 🛡️
        </h2>
        
        <p className="mb-8 text-lg font-light text-indigo-100 md:text-xl">
          Elías, un verdadero héroe necesita su propio escudo. Observa este ejemplo sagrado
          que representa los 4 superpoderes estoicos: Sabiduría, Templanza, Justicia y Coraje.
        </p>

        <div className="mx-auto mb-10 flex max-w-lg items-center justify-center p-4">
          <div className="group relative w-full overflow-hidden rounded-full shadow-[0_0_50px_rgba(250,204,21,0.3)] transition-all hover:shadow-[0_0_80px_rgba(250,204,21,0.5)]">
             {/* Glow effect */}
            <div className="absolute inset-0 bg-yellow-400 opacity-20 blur-2xl group-hover:opacity-40 transition-opacity"></div>
            
            <Image
              src="/escudo estoico.png"
              alt="Ejemplo de Escudo Estoico"
              width={500}
              height={500}
              className="relative z-10 w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20 shadow-inner">
          <h3 className="mb-4 text-2xl font-bold text-yellow-400">¡Ahora es TU turno!</h3>
          <p className="text-lg text-indigo-50">
            Dibuja tu propio escudo dividido en cuatro partes en una hoja en blanco. En cada parte, dibuja o escribe un símbolo
            para la <strong>Sabiduría</strong> 🦉, el <strong>Coraje</strong> 🦁, la <strong>Justicia</strong> ⚖️ y la <strong>Templanza</strong> 🧘‍♂️.
          </p>
          <p className="mt-4 text-xl font-bold italic text-indigo-200">
            &quot;¡Este será tu escudo de héroe estoico, listo para protegerte y recordarte tus poderes ante cualquier desafío!&quot;
          </p>
        </div>
      </div>
    </section>
  );
}
