"use client";

import { DesafioVirtudes } from "@/components/juegos/desafio-virtudes";
import Link from "next/link";

export default function DesafioVirtudesPage() {
  return (
    <div>
      <div className="main-header" style={{ marginLeft: -24, marginRight: -24, marginTop: -24, marginBottom: 24, padding: "16px 24px" }}>
        <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>ACADEMIA ESTOICA GOPLEMMINGS</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>Sala de Entrenamiento</div>
      </div>
      <Link href="/juegos" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 13, marginBottom: 20 }}>
        ← Volver a los Juegos
      </Link>
      <DesafioVirtudes />
    </div>
  );
}
