#!/bin/bash
# Copia a src/webshell/_static/ los controles web y los recursos de la plantilla de sitio de V12
# que carga webshell.head() (src/webshell/_lib/head.dk), y escribe src/webshell/_static/ORIGEN.tsv.
# Nadie edita esas copias a mano: se vuelven a sincronizar con este script.
#
# Uso (desde la raíz del repo Induxsoft/webshell):
#   herramientas/sync-webcomponents.sh <commit de webcomponents> [<commit de v12>]
#   herramientas/sync-webcomponents.sh --check
#
# - <commit de webcomponents>: commit (o rama) de Induxsoft/webcomponents; normalmente main.
# - <commit de v12>: commit (o rama) de Induxsoft/v12 del que salen los recursos de la plantilla
#   (src/_templates/sites/v12/); por omisión, main.
# - --check: no escribe nada; sale con 1 si una copia no coincide con ORIGEN.tsv o con el archivo
#   del repo de origen en el commit anotado.
#
# Los repos de origen se clonan (o se actualizan) en $SYNC_CACHE (por omisión ~/.cache/webshell-sync).
# ORIGEN.tsv: archivo (relativo a _static), repo, commit, sha256.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
STATIC="$RAIZ/src/webshell/_static"
ORIGEN="$STATIC/ORIGEN.tsv"
CACHE="${SYNC_CACHE:-$HOME/.cache/webshell-sync}"

# destino (relativo a _static) | repo | ruta en el repo | obligatorio (1) u opcional (0)
LISTA='js/induxsoft.controls.js|webcomponents|src/js/induxsoft.controls.js|1
js/induxsoft.controls.editable.js|webcomponents|src/js/induxsoft.controls.editable.js|1
js/induxsoft.controls.schedule.js|webcomponents|src/js/induxsoft.controls.schedule.js|1
js/induxsoft.controls.opcanva.js|webcomponents|src/js/induxsoft.controls.opcanva.js|1
js/induxsoft.dialogs.js|webcomponents|src/js/induxsoft.dialogs.js|0
css/induxsoft.base.css|webcomponents|src/css/induxsoft.base.css|0
js/induxsoft.v12.ui.js|v12|src/_templates/sites/v12/js/induxsoft.v12.ui.js|1
js/induxsoft.crudl.model.js|v12|src/_templates/sites/v12/js/induxsoft.crudl.model.js|1
js/induxsoft.math.js|v12|src/_templates/sites/v12/js/induxsoft.math.js|1
js/induxsoft.number.fields.js|v12|src/_templates/sites/v12/js/induxsoft.number.fields.js|1
js/suggest_marks.js|v12|src/_templates/sites/v12/js/suggest_marks.js|1
js/lib.js|v12|src/_templates/sites/v12/js/lib.js|1
js/bootstrap.bundle.min.js|v12|src/_templates/sites/v12/js/bootstrap.bundle.min.js|1
css/bootstrap.min.css|v12|src/_templates/sites/v12/css/bootstrap.min.css|1
css/induxsoft.formstyles.css|v12|src/_templates/sites/v12/css/induxsoft.formstyles.css|1
css/induxsoft.v12.styles.css|v12|src/_templates/sites/v12/css/induxsoft.v12.styles.css|1'

repo_local() {
    local r="$1" d="$CACHE/$1"
    mkdir -p "$CACHE"
    if [ -d "$d/.git" ]; then
        git -C "$d" fetch -q origin '+refs/heads/*:refs/remotes/origin/*' >&2
    else
        git clone -q "https://github.com/Induxsoft/$r.git" "$d" >&2
    fi
    echo "$d"
}

resolver() {   # repo, commit o rama -> sha completo
    local d="$1" c="$2"
    git -C "$d" rev-parse --verify -q "origin/$c^{commit}" 2>/dev/null || git -C "$d" rev-parse --verify "$c^{commit}"
}

sha() { sha256sum "$1" | cut -d' ' -f1; }

if [ "${1:-}" = "--check" ]; then
    [ -f "$ORIGEN" ] || { echo "falta $ORIGEN" >&2; exit 1; }
    mal=0
    while IFS=$'\t' read -r archivo repo commit huella; do
        [ "$archivo" = "archivo" ] && continue
        f="$STATIC/$archivo"
        if [ ! -f "$f" ]; then echo "FALTA  $archivo"; mal=1; continue; fi
        if [ "$(sha "$f")" != "$huella" ]; then echo "DISTINTO de ORIGEN.tsv  $archivo"; mal=1; continue; fi
        d="$(repo_local "$repo")"
        ruta="$(echo "$LISTA" | awk -F'|' -v a="$archivo" '$1==a {print $3}')"
        if [ "$(git -C "$d" show "$commit:$ruta" | sha256sum | cut -d' ' -f1)" != "$huella" ]; then
            echo "DISTINTO de $repo@${commit:0:7}  $archivo"; mal=1; continue
        fi
        echo "ok  $archivo  $repo@${commit:0:7}"
    done < "$ORIGEN"
    # El ?v= de webshell.head() sale de @WEBSHELL_VERSION: debe ser la versión de pack.manifest
    vm="$(grep -o '"version" *: *"[^"]*"' "$RAIZ/src/pack.manifest" | sed 's/.*"\([^"]*\)"$/\1/')"
    vh="$(grep -o '@WEBSHELL_VERSION = "[^"]*"' "$RAIZ/src/webshell/_lib/head.dk" | sed 's/.*"\([^"]*\)"$/\1/')"
    if [ "$vm" != "$vh" ]; then echo "VERSIÓN: pack.manifest $vm, _lib/head.dk $vh"; mal=1; else echo "ok  versión $vm"; fi
    exit $mal
fi

[ -n "${1:-}" ] || { sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; exit 2; }
WC="$(repo_local webcomponents)"; V12="$(repo_local v12)"
WC_C="$(resolver "$WC" "$1")"; V12_C="$(resolver "$V12" "${2:-main}")"

tmp="$(mktemp)"
printf 'archivo\trepo\tcommit\tsha256\n' > "$tmp"
while IFS='|' read -r destino repo ruta obligatorio; do
    if [ "$repo" = webcomponents ]; then d="$WC"; c="$WC_C"; else d="$V12"; c="$V12_C"; fi
    if ! git -C "$d" cat-file -e "$c:$ruta" 2>/dev/null; then
        if [ "$obligatorio" = 1 ]; then echo "falta $repo@${c:0:7}:$ruta" >&2; rm -f "$tmp"; exit 1; fi
        if [ -f "$STATIC/$destino" ]; then
            echo "aviso: $destino ya no existe en $repo@${c:0:7}; se deja la copia anterior fuera de ORIGEN.tsv" >&2
        fi
        echo "no existe todavía: $repo@${c:0:7}:$ruta" >&2
        continue
    fi
    mkdir -p "$(dirname "$STATIC/$destino")"
    git -C "$d" show "$c:$ruta" > "$STATIC/$destino"
    printf '%s\t%s\t%s\t%s\n' "$destino" "$repo" "$c" "$(sha "$STATIC/$destino")" >> "$tmp"
    echo "copiado  $destino  $repo@${c:0:7}"
done <<< "$LISTA"
mv "$tmp" "$ORIGEN"
echo "escrito $ORIGEN"
