import Image from "next/image";

interface Layer {
  url: string;
  zIndex: number;
}

interface ModularAvatarProps {
  heroId: string;
  level: number;
}

const HERO_BASES: Record<string, string> = {
  "00000000-0000-0000-0000-000000000001": "/images/avatars/elias_base.png",
  "00000000-0000-0000-0000-000000000002": "/images/avatars/atenea_base.png",
  "00000000-0000-0000-0000-000000000003": "/images/avatars/marco_base.png",
};

export default function ModularAvatar({ heroId, level }: ModularAvatarProps) {
  const baseImage = HERO_BASES[heroId] || "/images/avatars/elias_base.png";

  // Lógica progresiva: Cada 5 niveles desbloquea un aspecto visual nuevo
  const activeLayers: Layer[] = [];

  // Nivel 5: Desbloquea un Escudo Básico
  if (level >= 5) {
    activeLayers.push({
      url: "/images/items/shield_basic.png", // Nota: Esta ruta necesitará el PNG transparente real
      zIndex: 20, 
    });
  }

  // Nivel 10: Desbloquea un Casco
  if (level >= 10) {
    activeLayers.push({
      url: "/images/items/helmet_basic.png",
      zIndex: 30,
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "inherit", 
      }}
    >
      {/* 1. Capa Base: El cuerpo del héroe en Nivel 1 */}
      <Image
        src={baseImage}
        alt="Hero Base"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: "cover", zIndex: 10 }}
        priority
      />

      {/* 2. Capas Superpuestas: Objetos y armaduras según nivel */}
      {activeLayers.map((layer, index) => (
        <div 
          key={index} 
          style={{ 
            position: "absolute", 
            inset: 0, 
            zIndex: layer.zIndex 
          }}
        >
          {/* Cuando tengas las imágenes con fondo transparente de los escudos/cascos,
              estas etiquetas Image las colocarán exactamente sobre las manos/cabeza
              del personaje base, creando la evolución visual */}
          {/* <Image src={layer.url} alt="Layer" fill style={{ objectFit: 'contain' }} /> */}
          
          {/* Overlay temporal para indicar de forma visual que el héroe subió de nivel
              antes de que subas los PNGs transparentes de los objetos */}
          <div style={{
              position:"absolute", 
              bottom: 15, 
              width: "100%", 
              textAlign: "center",
              textShadow: "0 2px 4px rgba(0,0,0,0.8)"
          }}>
              {level >= 10 ? "🛡️ Equipado: Casco y Escudo" : "🛡️ Equipado: Escudo Básico"}
          </div>
        </div>
      ))}
    </div>
  );
}
