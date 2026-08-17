#!/bin/bash
# ══════════════════════════════════════════════════
#  Academia Estoica — Lanzador Directo
# ══════════════════════════════════════════════════

PROJECT_DIR="/Volumes/T9Gop/Goplemmings Inteligencia Artificial/Estoicos/superheroes-estoicos-v2"

if [ -f "$PROJECT_DIR/lanzar-academia.sh" ]; then
    bash "$PROJECT_DIR/lanzar-academia.sh"
    echo ""
    echo "✅ Lanzador completado."
    echo "   Se abrirá una nueva ventana de Terminal para el servidor."
    echo "   Y el navegador se abrirá en http://localhost:3000"
    echo ""
    echo "👉 Puedes cerrar esta ventana."
    echo ""
else
    echo "❌ Error: No se encontró el script lanzar-academia.sh en $PROJECT_DIR"
    read -n 1 -s -p "Presiona cualquier tecla para salir..."
fi
