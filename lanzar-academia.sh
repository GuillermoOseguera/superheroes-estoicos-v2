#!/bin/bash
# ══════════════════════════════════════════════════
#  Academia Estoica de Elías — Lanzador
#  Levanta el servidor dev y abre el navegador
# ══════════════════════════════════════════════════

PROJECT_DIR="/Volumes/T9Gop/Goplemmings Inteligencia Artificial/Estoicos/superheroes-estoicos-v2"

# Matar cualquier proceso anterior en puerto 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Abrir Terminal con el servidor corriendo
osascript <<EOF
tell application "Terminal"
    activate
    set win to do script "cd \"$PROJECT_DIR\" && npm run dev"
    set custom title of win to "Academia Estoica — Servidor"
end tell
EOF

# Esperar a que el servidor esté listo
echo "⏳ Esperando que el servidor inicie..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

# Abrir en el navegador predeterminado
open http://localhost:3000
