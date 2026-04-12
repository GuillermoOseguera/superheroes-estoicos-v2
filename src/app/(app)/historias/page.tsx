"use client";

import { VisorHistorias } from "@/components/juegos/visor-historias";

export default function HistoriasPage() {
  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Biblioteca</div>
      </div>

      <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        📚 Biblioteca de los Sabios
      </h2>
      <p style={{ color: "#64748b", marginBottom: 28 }}>
        Explora las historias de los grandes héroes estoicos.
      </p>

      <VisorHistorias />
    </div>
  );
}
