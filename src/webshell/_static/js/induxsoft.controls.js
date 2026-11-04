/* <induxsoft-theme v=1.3.0> */
/*!
 * induxsoft.theme.js: tema común de los web components de Induxsoft (EdiTable, InputKey y los que vengan).
 *
 * window.InduxsoftTheme (singleton, sin dependencias). Spec: /home/claude/mapa/induxsoft-theme-spec.md
 * - Registro de temas: themes, theme(nombre), define(nombre, paleta, {base}).
 * - Resolución: resolve(elemento) -> { theme, palette, density, effective, scheme }, desde el ancestro más cercano con
 *   data-et-theme / data-et-palette / data-et-density (cada uno por separado), cruzando shadow DOM y los iframes del
 *   mismo origen; si no hay tema, lo recordado con remember (localStorage 'induxsoft.theme').
 * - Cambio: set(nombre, {on, remember}), setPalette(obj, {on, merge}), setDensity(d, {on}); on = <html> por omisión.
 * - Aviso: subscribe(elemento, callback) / unsubscribe(elemento, callback), un solo MutationObserver y un matchMedia;
 *   evento 'themechange' en document.
 * - 1.1.0: fromColors({bar, barText, bg}, {base}) deriva una paleta (variables --et-* sin el prefijo) de los colores
 *   que el cliente configuró, con contraste AA (4.5:1) en el texto; applyColors(elemento, colores, {base}) la fija
 *   con data-et-palette. data-et-theme="ninguno" corta el tema: ese elemento y lo de arriba no aportan tema, paleta ni
 *   densidad (resolve agrega none: true). Sin llamar a fromColors/applyColors ni usar «ninguno», nada cambia.
 * - 1.2.0: color 'info' en los cuatro temas (avisos informativos; fromColors lo toma de la base y solo le ajusta el
 *   contraste contra el fondo) y letra de Windows 11 ("Segoe UI Variable" con respaldo, 0.875rem) en los cuatro.
 * - 1.3.0: bind(host, {root, name, css}) liga cualquier componente al tema con el mismo mecanismo que InputKey: los
 *   atributos propios theme/palette/density del host ganan a lo heredado; con tema mantiene un <style data-ix-theme>
 *   al principio de root (su shadow, o document.head para los de DOM claro) con las variables --et-t-*, la densidad
 *   (--ix-t-h, --ix-t-pad, --ix-t-row, --ix-t-fs) y lo que devuelva css(V, estado); sin tema no deja nada (el
 *   componente queda byte por byte como antes). V(n, respaldo) = var(--et-n, [var(--et-padre,)] var(--et-t-n, respaldo)).
 *
 * Este archivo se copia tal cual dentro de induxsoft.controls.editable.js e induxsoft.controls.js, entre los
 * marcadores induxsoft-theme (tests/tools/embed-theme.mjs). Se edita solo aquí.
 */
(function ()
{
    'use strict';
    var VERSION = '1.3.0';
    if (typeof window === 'undefined') return;
    var w = window;

    function comparar(a, b)
    {
        var x = String(a || '0').split(/[.-]/), y = String(b || '0').split(/[.-]/);
        for (var i = 0; i < 3; i++)
        {
            var p = parseInt(x[i], 10) || 0, q = parseInt(y[i], 10) || 0;
            if (p !== q) return p < q ? -1 : 1;
        }
        return 0;
    }
    var previo = w.InduxsoftTheme;
    if (previo && typeof previo === 'object' && comparar(previo.version, VERSION) >= 0) return;

    var ATTR = { theme: 'data-et-theme', palette: 'data-et-palette', density: 'data-et-density' };
    var ATTRS = [ATTR.theme, ATTR.palette, ATTR.density];
    var CLAVE = 'induxsoft.theme';

    // ---------------------------------------------------------------- registro de temas
    // Derivadas: si un tema no las da, toman la de su padre (mismo mapa que EditTable F8b).
    var PADRES = {
        'header-border': 'border', 'header-pad-y': 'cell-pad-y', 'footer-bg': 'header-bg', 'footer-fg': 'header-fg',
        'menu-bg': 'bg', 'menu-fg': 'fg', 'menu-border': 'border', 'menu-hover-bg': 'hover-bg',
        'panel-bg': 'header-bg', 'panel-border': 'border', 'chip-bg': 'bg', 'chip-border': 'input-border',
        'card-border': 'border', 'group-bg': 'header-bg', 'group-hover-bg': 'hover-bg',
        'fixed-bg': 'bg', 'fixed-head-bg': 'header-bg', 'fixed-hover-bg': 'hover-bg', 'badge-bg': 'muted-fg',
        'checked-bg': 'sel-bg-soft'
    };
    // Letra de los temas (1.2.0): la de Windows 11 (Segoe UI Variable), con respaldo para otros sistemas.
    var FUENTE_W11 = '"Segoe UI Variable Text", "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
    // Temas predeterminados (los de EditTable F8b, mismos valores; 1.2.0: letra de Windows 11 e 'info'). Claves sin '--et-'; 'color-scheme' no es variable.
    var EXPLICITOS = {
        claro: {
            'color-scheme': 'light',
            font: FUENTE_W11, 'font-size': '0.875rem',
            bg: '#FFFFFF', fg: '#1F2328', 'muted-fg': '#59636E',
            'header-bg': '#F3F5F8', 'header-fg': '#1F2328', 'header-border': '#D0D7DE', 'header-weight': '600',
            border: '#E1E5EA', 'row-alt-bg': '#F8FAFC', 'hover-bg': '#EDF2F8',
            'sel-bg': '#2F66CC', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#DCE7FA',
            'active-cell': '#0B3D91', 'active-bg': '#FFFFFF', 'active-fg': '#1F2328', 'active-border': '#FFFFFF',
            accent: '#2F66CC', 'focus-ring': '#2F66CC',
            'input-bg': '#FFFFFF', 'input-fg': '#1F2328', 'input-border': '#8C959F', 'input-disabled-bg': '#EEF1F4',
            'mark-bg': '#FFF1A8', 'mark-fg': '#1F2328', error: '#C62828', 'error-bg': '#FDECEC', warn: '#8A5A00', ok: '#1A7F37', info: '#0B7285', 'neg-fg': '#C62828',
            'tooltip-bg': '#1F2328', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#6E7781', 'badge-color': '#FFFFFF',
            radius: '4px', 'chip-radius': '12px', 'badge-radius': '999px',
            'cell-pad-x': '6px', 'cell-pad-y': '4px', 'header-pad-x': '8px', 'row-height': '1.6rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.5rem', 'num-font': 'inherit'
        },
        oscuro: {
            'color-scheme': 'dark',
            font: FUENTE_W11, 'font-size': '0.875rem',
            bg: '#15181C', fg: '#E6EDF3', 'muted-fg': '#9DA7B3',
            'header-bg': '#1F242B', 'header-fg': '#E6EDF3', 'header-border': '#3A424C', 'header-weight': '600',
            border: '#2C333B', 'row-alt-bg': '#1A1E23', 'hover-bg': '#242B33',
            'sel-bg': '#2C5AA8', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#1E3352',
            'active-cell': '#8CC2FF', 'active-bg': '#0D1117', 'active-fg': '#E6EDF3', 'active-border': '#0D1117',
            accent: '#6CA8FF', 'focus-ring': '#8CC2FF',
            'input-bg': '#0D1117', 'input-fg': '#E6EDF3', 'input-border': '#5A6572', 'input-disabled-bg': '#1F242B',
            'mark-bg': '#6B5800', 'mark-fg': '#FFF6CC', error: '#FF8A80', 'error-bg': '#3D1F1F', warn: '#E3B341', ok: '#5FD07A', info: '#56C8E0', 'neg-fg': '#FF8A80',
            'tooltip-bg': '#E6EDF3', 'tooltip-fg': '#15181C', 'badge-bg': '#56606C', 'badge-color': '#FFFFFF',
            'select-arrow': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23C9D1D9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e\")",
            radius: '4px', 'chip-radius': '12px', 'badge-radius': '999px',
            'cell-pad-x': '6px', 'cell-pad-y': '4px', 'header-pad-x': '8px', 'row-height': '1.6rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.5rem', 'num-font': 'inherit'
        },
        // Inspirado en la bandeja de agentes de agent.induxsoft.net (ai_broadcast.css).
        jade: {
            'color-scheme': 'light',
            font: FUENTE_W11, 'font-size': '0.875rem',
            bg: '#FFFFFF', fg: '#1A202C', 'muted-fg': '#5A6577',
            'header-bg': '#F4F6F9', 'header-fg': '#4A5568', 'header-border': '#E2E8F0', 'header-weight': '600',
            'header-transform': 'uppercase', 'header-spacing': '.04em', 'header-font-size': '0.72rem',
            border: '#E2E8F0', 'row-alt-bg': '#F8FAFB', 'hover-bg': '#EEF9F2',
            'sel-bg': '#D1FAE5', 'sel-fg': '#064E3B', 'sel-bg-soft': '#E6F7EE',
            'active-cell': '#128C4A', 'active-bg': '#FFFFFF', 'active-fg': '#1A202C', 'active-border': '#FFFFFF',
            accent: '#0F7A41', 'focus-ring': '#128C4A',
            'input-bg': '#FFFFFF', 'input-fg': '#1A202C', 'input-border': '#A0AEC0', 'input-disabled-bg': '#F4F6F9',
            'mark-bg': '#FDE68A', 'mark-fg': '#1A202C', error: '#C53030', 'error-bg': '#FFF5F5', warn: '#B45309', ok: '#0F7A41', info: '#2B6CB0', 'neg-fg': '#C53030',
            'tooltip-bg': '#1A202C', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#667781', 'badge-color': '#FFFFFF',
            radius: '8px', 'chip-radius': '20px', 'badge-radius': '999px',
            'cell-pad-x': '12px', 'cell-pad-y': '7px', 'header-pad-x': '12px', 'header-pad-y': '8px', 'row-height': '2rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.6rem', 'num-font': 'inherit'
        },
        // Estilo «Libro mayor» de V12 (cuenta-maestra-dk2, recursos/libro-mayor.css).
        'libro-mayor': {
            'color-scheme': 'light',
            font: FUENTE_W11, 'font-size': '0.875rem',
            'num-font': '"IBM Plex Mono", ui-monospace, monospace',
            bg: '#FFFFFF', fg: '#1B1F24', 'muted-fg': '#5B6470',
            'header-bg': '#F3F4F6', 'header-fg': '#4E5661', 'header-border': '#D9DDE3', 'header-weight': '600',
            'header-transform': 'uppercase', 'header-spacing': '.04em', 'header-font-size': '0.75rem',
            border: '#E3E6EA', 'row-alt-bg': '#F8F9FA', 'hover-bg': '#EEF1F5',
            'sel-bg': '#1D4F91', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#E4ECF7',
            'active-cell': '#1B1F24', 'active-bg': '#FFFFFF', 'active-fg': '#1B1F24', 'active-border': '#FFFFFF',
            accent: '#1D4F91', 'focus-ring': '#1D4F91',
            'input-bg': '#FFFFFF', 'input-fg': '#1B1F24', 'input-border': '#9AA3AE', 'input-disabled-bg': '#F3F4F6',
            'mark-bg': '#FBEBD0', 'mark-fg': '#4A3200', error: '#A13A14', 'error-bg': '#FBE9E3', warn: '#6E4700', ok: '#1E6B3A', info: '#1F6F80', 'neg-fg': '#A13A14',
            'tooltip-bg': '#1B1F24', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#5B6470', 'badge-color': '#FFFFFF',
            radius: '0', 'chip-radius': '0', 'badge-radius': '0',
            'cell-pad-x': '10px', 'cell-pad-y': '5px', 'header-pad-x': '10px', 'header-pad-y': '6px', 'row-height': '1.8rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.6rem'
        }
    };
    var ALIAS = { light: 'claro', dark: 'oscuro', 'libro mayor': 'libro-mayor', 'libromayor': 'libro-mayor' };
    var DENSIDAD_ALIAS = { 'cómoda': 'comoda', compact: 'compacta', comfortable: 'comoda', compacto: 'compacta', comodo: 'comoda' };
    var RESUELTOS = {};
    var FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    function asignar(d) { for (var i = 1; i < arguments.length; i++) { var o = arguments[i]; if (o) for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) d[k] = o[k]; } return d; }
    function copia(o) { return o ? asignar({}, o) : null; }

    // Completa una paleta: lo explícito, después lo de la base y, para las derivadas, su padre.
    function completar(explicita, base)
    {
        var r = asignar({}, base || {}, explicita);
        for (var n in PADRES)
        {
            var p = PADRES[n];
            if (!(n in explicita) && ((p in explicita) || !(n in r)) && (p in r)) r[n] = r[p];
        }
        return r;
    }
    function normalizar(v)
    {
        var s = String(v == null ? '' : v).trim().toLowerCase();
        if (!s || s === 'none' || s === 'ninguno' || s === 'false') return '';
        return ALIAS[s] || s;
    }
    // «ninguno» explícito (también 'none'): corta el tema, la paleta y la densidad heredados (1.1.0).
    var NINGUNO = 'ninguno';
    function esNinguno(v)
    {
        var s = String(v == null ? '' : v).trim().toLowerCase();
        return s === 'ninguno' || s === 'none';
    }
    function normalizarDensidad(v)
    {
        var s = String(v == null ? '' : v).trim().toLowerCase();
        return DENSIDAD_ALIAS[s] || s;
    }
    // Valida una paleta: objeto o JSON; claves [a-z0-9-] (sin '--et-', se acepta camelCase); valores de texto o
    // número sin ; { } < >. Lo inválido se ignora con console.warn.
    function limpiar(p, donde)
    {
        donde = donde || 'palette';
        if (typeof p === 'string') { try { p = p.trim() ? JSON.parse(p) : {}; } catch (e) { console.warn('InduxsoftTheme: ' + donde + ': JSON inválido; se ignora.'); return {}; } }
        if (!p || typeof p !== 'object' || Array.isArray(p)) { if (p != null) console.warn('InduxsoftTheme: ' + donde + ': se esperaba un objeto; se ignora.'); return {}; }
        var r = {};
        for (var k0 in p)
        {
            if (!Object.prototype.hasOwnProperty.call(p, k0)) continue;
            var v = p[k0];
            var k = String(k0).trim().replace(/^--et-/, '').replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); });
            if (!/^[a-z0-9][a-z0-9-]*$/.test(k) || (typeof v !== 'string' && typeof v !== 'number') || /[;{}<>]/.test(String(v)) || String(v).trim() === '')
            { console.warn('InduxsoftTheme: ' + donde + ': se ignora ' + JSON.stringify(k) + '.'); continue; }
            r[k] = String(v).trim();
        }
        return r;
    }
    // Paleta resuelta (objeto interno, no copia). Si el nombre no está aquí, se busca en la ventana padre.
    function interno(nombre)
    {
        var n = normalizar(nombre);
        if (!n || n === 'auto') return null;
        if (!RESUELTOS[n] && EXPLICITOS[n]) RESUELTOS[n] = completar(EXPLICITOS[n], null);
        if (RESUELTOS[n]) return RESUELTOS[n];
        var pm = moduloPadre();
        if (pm && typeof pm.theme === 'function') { try { return pm.theme(n); } catch (e) { } }
        return null;
    }

    // ---------------------------------------------------------------- resolución
    function ventanaDe(nodo) { try { return (nodo.ownerDocument || nodo).defaultView || null; } catch (e) { return null; } }
    function marco(doc)
    {
        try { var v = doc.defaultView; return v && v.frameElement ? v.frameElement : null; } catch (e) { return null; }
    }
    function moduloPadre()
    {
        try { var f = w.frameElement; if (!f) return null; var pw = f.ownerDocument.defaultView; return pw && pw !== w ? pw.InduxsoftTheme || null : null; } catch (e) { return null; }
    }
    // Siguiente nodo hacia arriba: padre, host del shadow DOM o el <iframe> de la ventana padre (mismo origen).
    function arriba(n)
    {
        if (n.parentNode)
        {
            var p = n.parentNode;
            if (p.nodeType === 11 && p.host) return p.host;      // ShadowRoot
            if (p.nodeType === 9) return marco(p);                // Document: sigue en el <iframe>
            return p;
        }
        if (n.nodeType === 11 && n.host) return n.host;
        if (n.nodeType === 9) return marco(n);
        return null;
    }
    function leerRecordado()
    {
        try
        {
            var s = w.localStorage && w.localStorage.getItem(CLAVE);
            if (!s) return null;
            var o; try { o = JSON.parse(s); } catch (e) { o = { theme: s }; }
            return o && typeof o === 'object' ? o : (typeof o === 'string' ? { theme: o } : null);
        }
        catch (e) { return null; }
    }
    var mql = null, escuchando = false;
    function oscuroDelSistema() { try { return !!(mql && mql.matches); } catch (e) { return false; } }
    // El listener de prefers-color-scheme se pone solo cuando algo usa 'auto' (sin auto, el módulo no deja listeners).
    function escucharEsquema()
    {
        if (escuchando || !mql) return;
        escuchando = true;
        try { if (mql.addEventListener) mql.addEventListener('change', alCambiarEsquema); else if (mql.addListener) mql.addListener(alCambiarEsquema); } catch (e) { }
    }
    var cachePaleta = { txt: null, val: null };
    function paletaDe(txt)
    {
        if (txt == null || String(txt).trim() === '') return null;
        if (cachePaleta.txt === txt) return copia(cachePaleta.val);
        var p = limpiar(txt, ATTR.palette);
        cachePaleta = { txt: txt, val: p };
        return Object.keys(p).length ? copia(p) : null;
    }
    /**
     * resolve(elemento) -> { theme, palette, density, effective, scheme, source }
     * theme: nombre normalizado ('auto' incluido) o ''. palette: objeto limpio o null. density: normalizada o ''.
     * effective: el tema con 'auto' resuelto (claro/oscuro). scheme: 'light' | 'dark' | ''.
     * source: de dónde salió el tema: 'element' | 'frame' | 'storage' | '' (ninguno).
     * none: solo existe (true) si un data-et-theme="ninguno" (o lo recordado) cortó el tema; entonces theme es '' y palette y
     * density solo salen de los elementos que están debajo del corte.
     */
    function resolve(el)
    {
        var enc = { theme: null, palette: null, density: null };
        var fuente = '';
        var d0 = null;
        var corte = false;
        var n = el || (w.document && w.document.documentElement);
        var guard = 0;
        while (n && guard++ < 10000)
        {
            if (n.nodeType === 1 && n.hasAttribute)
            {
                if (enc.theme === null && n.hasAttribute(ATTR.theme))
                {
                    enc.theme = n.getAttribute(ATTR.theme); fuente = (d0 && n.ownerDocument !== d0) ? 'frame' : 'element';
                    // «ninguno»: la paleta y la densidad de este elemento y de los de arriba ya no cuentan.
                    if (esNinguno(enc.theme)) { corte = true; break; }
                }
                if (enc.palette === null && n.hasAttribute(ATTR.palette)) enc.palette = n.getAttribute(ATTR.palette);
                if (enc.density === null && n.hasAttribute(ATTR.density)) enc.density = n.getAttribute(ATTR.density);
                if (!d0) d0 = n.ownerDocument;
                if (enc.theme !== null && enc.palette !== null && enc.density !== null) break;
            }
            n = arriba(n);
        }
        var tema = enc.theme;
        if (tema === null)
        {
            var r = leerRecordado();
            if (r && r.theme) { tema = String(r.theme); fuente = 'storage'; corte = esNinguno(tema); }
        }
        var t = normalizar(tema);
        if (t === 'auto') escucharEsquema();
        var ef = t === 'auto' ? (oscuroDelSistema() ? 'oscuro' : 'claro') : t;
        var pal = interno(ef);
        var res = {
            theme: t,
            palette: paletaDe(enc.palette),
            density: normalizarDensidad(enc.density),
            effective: ef,
            scheme: pal ? (pal['color-scheme'] || '') : '',
            source: t ? fuente : ''
        };
        if (corte) res.none = true;   // solo con «ninguno»: sin él, el resultado es el mismo de 1.0.0
        return res;
    }

    // ---------------------------------------------------------------- aviso de cambios
    var subs = new Map();          // elemento -> Map(callback -> último resultado en JSON)
    var observadas = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
    var OPC = { subtree: true, attributes: true, attributeFilter: ATTRS };
    var obs = null;
    function observar(raiz)
    {
        if (!obs || !raiz) return;
        if (observadas && observadas.has(raiz)) return;
        try { obs.observe(raiz, OPC); if (observadas) observadas.add(raiz); } catch (e) { }
    }
    // Observa cada shadow root entre el elemento y su documento (el observador del documento no los ve).
    function observarCadena(el)
    {
        var n = el, g = 0;
        while (n && g++ < 10000)
        {
            var r = n.getRootNode ? n.getRootNode() : null;
            if (!r || r.nodeType !== 11 || !r.host) break;
            observar(r);
            n = r.host;
        }
    }
    function debajo(el, objetivos)
    {
        var n = el, g = 0;
        while (n && g++ < 10000) { if (objetivos.has(n)) return true; n = arriba(n); }
        return false;
    }
    function avisar(el, mapa, motivo, forzar)
    {
        var res = resolve(el), txt = JSON.stringify(res);
        mapa.forEach(function (ultimo, cb)
        {
            if (!forzar && ultimo === txt) return;
            mapa.set(cb, txt);
            try { cb(res, { reason: motivo, element: el }); } catch (e) { setTimeout(function () { throw e; }); }
        });
    }
    function avisarTodos(motivo, forzar, filtro)
    {
        Array.from(subs.keys()).forEach(function (el)
        {
            var mapa = subs.get(el);
            if (mapa && (!filtro || filtro(el))) avisar(el, mapa, motivo, forzar);
        });
    }
    function disparar(motivo, detalle)
    {
        try { w.document.dispatchEvent(new CustomEvent('themechange', { detail: asignar({ reason: motivo }, detalle || {}) })); } catch (e) { }
    }
    function alMutar(registros)
    {
        var objetivos = new Set();
        registros.forEach(function (r) { if (r.target) objetivos.add(r.target); });
        if (!objetivos.size) return;
        avisarTodos('attribute', false, function (el) { return debajo(el, objetivos); });
        disparar('attribute', { targets: Array.from(objetivos).filter(function (x) { return ventanaDe(x) === w; }) });
    }
    function alCambiarEsquema()
    {
        avisarTodos('scheme', false, null);
        disparar('scheme', { dark: oscuroDelSistema() });
    }
    // iframes del mismo origen: el módulo de la ventana hija se suscribe a su <iframe> en la ventana padre. Si la
    // padre no tiene el módulo, el mismo observador mira el documento de la padre.
    var enPadre = null;
    function engancharPadre()
    {
        if (enPadre) return;
        var f = null; try { f = w.frameElement; } catch (e) { f = null; }
        if (!f) return;
        var pm = moduloPadre();
        var cb = function () { avisarTodos('frame', false, null); disparar('frame', {}); };
        if (pm && typeof pm.subscribe === 'function')
        {
            try { pm.subscribe(f, cb); enPadre = { modulo: pm, frame: f, cb: cb }; } catch (e) { }
        }
        else
        {
            try
            {
                var pd = f.ownerDocument; observar(pd); observarCadena(f);
                enPadre = { frame: f, doc: pd };
            }
            catch (e) { }
        }
        if (enPadre)
        {
            try { w.addEventListener('pagehide', function () { try { if (enPadre && enPadre.modulo) enPadre.modulo.unsubscribe(enPadre.frame, enPadre.cb); } catch (e) { } enPadre = null; }); } catch (e) { }
        }
    }
    function subscribe(el, cb)
    {
        if (!el || typeof cb !== 'function') return function () { };
        var mapa = subs.get(el);
        if (!mapa) { mapa = new Map(); subs.set(el, mapa); }
        mapa.set(cb, JSON.stringify(resolve(el)));
        observarCadena(el);
        engancharPadre();
        return function () { unsubscribe(el, cb); };
    }
    function unsubscribe(el, cb)
    {
        var mapa = subs.get(el);
        if (!mapa) return;
        if (cb) mapa.delete(cb); else mapa.clear();
        if (!mapa.size) subs.delete(el);
    }

    // ---------------------------------------------------------------- cambio
    function destino(o) { return (o && o.on) || (w.document && w.document.documentElement); }
    function recordar(o, nombre)
    {
        if (!o || o.remember === undefined) return;
        try
        {
            if (o.remember && nombre) w.localStorage.setItem(CLAVE, JSON.stringify({ theme: esNinguno(nombre) ? NINGUNO : nombre }));
            else w.localStorage.removeItem(CLAVE);
        }
        catch (e) { }
    }
    /** set(nombre, {on, remember}): pone data-et-theme. null/undefined lo quita; '' corta la herencia. */
    function set(nombre, o)
    {
        var el = destino(o);
        if (!el) return;
        if (nombre == null) el.removeAttribute(ATTR.theme);
        else el.setAttribute(ATTR.theme, String(nombre));
        recordar(o, nombre == null ? '' : (esNinguno(nombre) ? NINGUNO : normalizar(nombre)));
    }
    function get(on) { return resolve(on || (w.document && w.document.documentElement)).theme; }
    /** setPalette(obj, {on, merge}): data-et-palette (JSON). merge combina con la que ya tiene el elemento; null la quita. */
    function setPalette(obj, o)
    {
        var el = destino(o);
        if (!el) return null;
        if (obj == null) { el.removeAttribute(ATTR.palette); return null; }
        var nueva = limpiar(obj, 'setPalette');
        if (o && o.merge) nueva = asignar(paletaDe(el.getAttribute(ATTR.palette)) || {}, nueva);
        el.setAttribute(ATTR.palette, JSON.stringify(nueva));
        return copia(nueva);
    }
    /** setDensity(d, {on}): data-et-density. null lo quita; '' corta la herencia. */
    function setDensity(d, o)
    {
        var el = destino(o);
        if (!el) return;
        if (d == null) el.removeAttribute(ATTR.density);
        else el.setAttribute(ATTR.density, String(d));
    }
    function forget() { try { w.localStorage.removeItem(CLAVE); } catch (e) { } }

    /**
     * define(nombre, paleta, {base}): registra o reemplaza un tema. Lo que falta lo toma de base ('claro' por
     * omisión; null para ninguna). Se avisa a todos los suscriptores. Devuelve la paleta resuelta (copia).
     */
    function define(nombre, paleta, o)
    {
        var n = normalizar(nombre);
        if (!n || n === 'auto' || !/^[a-z0-9][a-z0-9_-]*$/.test(n)) throw new Error('InduxsoftTheme.define: nombre de tema inválido: ' + nombre);
        var l = limpiar(paleta, 'define');
        var b = (o && o.base === null) ? null : interno((o && o.base) || 'claro');
        EXPLICITOS[n] = l;
        RESUELTOS[n] = completar(l, b);
        avisarTodos('define', true, null);
        disparar('define', { theme: n });
        return copia(RESUELTOS[n]);
    }

    // ---------------------------------------------------------------- colores del cliente (1.1.0)
    // Cálculo en JS (sRGB <-> OKLab/OKLCH), para poder garantizar el contraste: color-mix() no lo permite.
    function hex2(n) { var h = Math.round(Math.max(0, Math.min(255, n))).toString(16); return h.length < 2 ? '0' + h : h; }
    function aHex(c) { return ('#' + hex2(c[0]) + hex2(c[1]) + hex2(c[2])).toUpperCase(); }
    var lienzo = null;
    /** Color CSS -> [r, g, b] (0-255) o null. Acepta #rgb, #rrggbb (con o sin #), rgb()/rgba() y, en el navegador, nombres. */
    function leerColor(v)
    {
        if (v == null) return null;
        var s = String(v).trim();
        if (!s) return null;
        var m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
        if (m)
        {
            var h = m[1];
            if (h.length <= 4) h = h.replace(/./g, function (x) { return x + x; });
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        }
        m = /^rgba?\(\s*([\d.]+)%?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/i.exec(s);
        if (m) return [+m[1], +m[2], +m[3]].map(function (x) { return Math.max(0, Math.min(255, x)); });
        if (/^[a-z]+$/i.test(s) && w.document && w.document.createElement)
        {
            try
            {
                if (!lienzo) lienzo = w.document.createElement('canvas').getContext('2d');
                lienzo.fillStyle = '#000001'; lienzo.fillStyle = s;
                if (lienzo.fillStyle !== '#000001') return leerColor(lienzo.fillStyle);
            }
            catch (e) { }
        }
        return null;
    }
    function lin(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function delin(c) { return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055); }
    /** Luminancia relativa (WCAG 2). */
    function luminancia(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
    /** Contraste WCAG entre dos colores (CSS o [r,g,b]); NaN si alguno no se entiende. */
    function contraste(a, b)
    {
        var x = Array.isArray(a) ? a : leerColor(a), y = Array.isArray(b) ? b : leerColor(b);
        if (!x || !y) return NaN;
        var l1 = luminancia(x), l2 = luminancia(y);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    function aOklab(c)
    {
        var r = lin(c[0]), g = lin(c[1]), b = lin(c[2]);
        var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
    }
    // OKLab -> sRGB lineal (sin recortar).
    function deOklabLin(o)
    {
        var l = Math.pow(o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2], 3);
        var m = Math.pow(o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2], 3);
        var s = Math.pow(o[0] - 0.0894841775 * o[1] - 1.2914855480 * o[2], 3);
        return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    }
    function enGama(x) { return x[0] >= -1e-4 && x[0] <= 1.0001 && x[1] >= -1e-4 && x[1] <= 1.0001 && x[2] >= -1e-4 && x[2] <= 1.0001; }
    function aLch(c) { var o = aOklab(c); return [o[0], Math.sqrt(o[1] * o[1] + o[2] * o[2]), Math.atan2(o[2], o[1])]; }
    // OKLCH -> sRGB; fuera de gama baja el croma hasta que quepa (conserva luminosidad y tono).
    function deLch(L, C, H)
    {
        L = Math.max(0, Math.min(1, L));
        var x = deOklabLin([L, C * Math.cos(H), C * Math.sin(H)]);
        if (!enGama(x))
        {
            var lo = 0, hi = C;
            for (var i = 0; i < 24; i++) { var mid = (lo + hi) / 2; if (enGama(deOklabLin([L, mid * Math.cos(H), mid * Math.sin(H)]))) lo = mid; else hi = mid; }
            x = deOklabLin([L, lo * Math.cos(H), lo * Math.sin(H)]);
        }
        return [delin(Math.max(0, Math.min(1, x[0]))), delin(Math.max(0, Math.min(1, x[1]))), delin(Math.max(0, Math.min(1, x[2])))].map(Math.round);
    }
    /** Mezcla en OKLab: p (0-1) de b sobre a. */
    function mezclar(a, b, p)
    {
        var x = aOklab(a), y = aOklab(b);
        var o = [x[0] + (y[0] - x[0]) * p, x[1] + (y[1] - x[1]) * p, x[2] + (y[2] - x[2]) * p];
        var c = Math.sqrt(o[1] * o[1] + o[2] * o[2]);
        return deLch(o[0], c, Math.atan2(o[2], o[1]));
    }
    /** Mueve c en OKLab lo mismo que va de desde a hacia (conserva la relación de un fondo con el fondo base). */
    function desplazar(c, desde, hacia)
    {
        var x = aOklab(c), a = aOklab(desde), b = aOklab(hacia);
        var o = [x[0] + b[0] - a[0], x[1] + b[1] - a[1], x[2] + b[2] - a[2]];
        var ch = Math.sqrt(o[1] * o[1] + o[2] * o[2]);
        return deLch(o[0], ch, Math.atan2(o[2], o[1]));
    }
    /**
     * Ajusta la luminosidad (OKLCH, mismo tono) de fg hasta que contraste al menos min con fondo. Se aleja del fondo:
     * hacia el negro si el fondo contrasta más con el negro, hacia el blanco si no. Siempre se alcanza 4.5:1, porque
     * todo color contrasta al menos 4.58:1 con el blanco o con el negro.
     */
    function asegurar(fg, fondo, min)
    {
        if (contraste(fg, fondo) >= min) return fg;
        var lf = luminancia(fondo), oscurecer = (lf + 0.05) / 0.05 >= 1.05 / (lf + 0.05);
        var lch = aLch(fg), lo, hi, mejor = oscurecer ? [0, 0, 0] : [255, 255, 255];
        // Búsqueda binaria del valor de L más cercano al original que cumple.
        if (oscurecer) { lo = 0; hi = lch[0]; } else { lo = lch[0]; hi = 1; }
        for (var i = 0; i < 30; i++)
        {
            var mid = (lo + hi) / 2, c = deLch(mid, lch[1], lch[2]);
            if (contraste(c, fondo) >= min) { mejor = c; if (oscurecer) lo = mid; else hi = mid; }
            else { if (oscurecer) hi = mid; else lo = mid; }
        }
        // El redondeo a 8 bits puede dejarlo apenas abajo: un paso más hacia el extremo.
        var g = 0;
        while (contraste(mejor, fondo) < min && g++ < 255) mejor = mejor.map(function (x) { return oscurecer ? Math.max(0, x - 1) : Math.min(255, x + 1); });
        return mejor;
    }
    // Pares de texto contra fondo que deben cumplir AA (4.5:1) y de elementos de interfaz (3:1, WCAG 1.4.11).
    var TEXTO_AA = [
        ['fg', 'bg'], ['muted-fg', 'bg'], ['header-fg', 'header-bg'], ['footer-fg', 'footer-bg'], ['sel-fg', 'sel-bg'],
        ['active-fg', 'active-bg'], ['input-fg', 'input-bg'], ['menu-fg', 'menu-bg'], ['mark-fg', 'mark-bg'],
        ['accent', 'bg'], ['error', 'bg'], ['warn', 'bg'], ['ok', 'bg'], ['info', 'bg'], ['neg-fg', 'bg'],
        ['tooltip-fg', 'tooltip-bg'], ['badge-color', 'badge-bg']
    ];
    // Fondos derivados contra un texto ya fijado: si no alcanzan, el fondo se acerca a 'bg' (que ya cumple con ese
    // texto), porque mover el texto rompería su contraste con 'bg'.
    var FONDO_AA = [['fg', 'row-alt-bg'], ['fg', 'hover-bg'], ['fg', 'sel-bg-soft'], ['fg', 'checked-bg'], ['error', 'error-bg']];
    function acercarFondo(texto, fondo, haciaBg, min)
    {
        if (contraste(texto, fondo) >= min) return fondo;
        var lo = 0, hi = 1, mejor = haciaBg;
        for (var i = 0; i < 24; i++) { var mid = (lo + hi) / 2, c = mezclar(fondo, haciaBg, mid); if (contraste(texto, c) >= min) { mejor = c; hi = mid; } else lo = mid; }
        return mejor;
    }
    var INTERFAZ_3 = [['focus-ring', 'bg'], ['active-cell', 'bg'], ['input-border', 'input-bg']];   // si cambiaron
    function esColor(v) { return /^#[0-9a-f]{3,8}$/i.test(String(v || '').trim()); }
    /**
     * fromColors({bar, barText, bg}, {base}) -> paleta (claves de las variables --et-* sin el prefijo, valores #RRGGBB,
     * más 'color-scheme'). Solo colores: tipografía, radios y espaciados quedan los del tema activo.
     * - base: tema del que salen los colores que no se derivan ('libro-mayor' por omisión).
     * - bar (color de la barra, webshell_nav_background_color): acento, selección, foco, celda activa, encabezados,
     *   hover y bordes (tonalidades de la barra mezcladas con el fondo).
     * - barText (webshell_nav_text_color): texto sobre el acento (sel-fg).
     * - bg (webshell_secbg_color): fondo (bg, input-bg, menús) y, si es oscuro, color-scheme 'dark'.
     * Lo que no se da o no se entiende se toma de la base. Todo texto contra su fondo queda en 4.5:1 o más
     * (se ajusta la luminosidad del texto, nunca el fondo ni la barra: los colores del cliente ganan).
     */
    function fromColors(colores, o)
    {
        colores = colores || {};
        var nb = (o && o.base) || 'libro-mayor';
        var base = interno(nb) || interno('libro-mayor');
        var r = {}, k;
        for (k in base) if (esColor(base[k])) r[k] = leerColor(base[k]);
        var bar = leerColor(colores.bar), barText = leerColor(colores.barText), bg = leerColor(colores.bg);
        var bg0 = r.bg, fg0 = r.fg;
        var oscuro = false;
        if (bg)
        {
            oscuro = luminancia(bg) < 0.18;
            var claroBase = luminancia(bg0) >= 0.18;
            // Si el fondo cambia de claro a oscuro (o al revés), los fondos y textos de la base se invierten respecto
            // a su fondo: se recalculan como mezclas del nuevo fondo con el texto.
            var invertir = oscuro === claroBase;
            var fg = invertir ? (oscuro ? [230, 237, 243] : [27, 31, 36]) : fg0;
            ['bg', 'input-bg', 'active-bg', 'menu-bg', 'fixed-bg', 'chip-bg'].forEach(function (x) { if (r[x] && aHex(r[x]) === aHex(bg0)) r[x] = bg; });
            r.bg = bg;
            if (invertir)
            {
                r.fg = r['input-fg'] = r['active-fg'] = r['menu-fg'] = r['mark-fg'] = fg;
                r['header-fg'] = r['footer-fg'] = mezclar(fg, bg, 0.15);
                r['muted-fg'] = mezclar(fg, bg, 0.35);
                r['header-bg'] = r['footer-bg'] = r['panel-bg'] = r['group-bg'] = r['fixed-head-bg'] = mezclar(bg, fg, 0.07);
                r['row-alt-bg'] = mezclar(bg, fg, 0.03);
                r['hover-bg'] = r['menu-hover-bg'] = r['group-hover-bg'] = r['fixed-hover-bg'] = mezclar(bg, fg, 0.09);
                r.border = r['menu-border'] = r['panel-border'] = r['card-border'] = mezclar(bg, fg, 0.14);
                r['header-border'] = mezclar(bg, fg, 0.22);
                r['input-border'] = mezclar(bg, fg, 0.45);
                r['input-disabled-bg'] = mezclar(bg, fg, 0.07);
                r['error-bg'] = mezclar(bg, r.error, 0.15);
                r['mark-bg'] = mezclar(bg, r['mark-bg'], oscuro ? 0.35 : 1);
                r['tooltip-bg'] = fg; r['tooltip-fg'] = bg;
            }
            else
            {
                // Mismo lado (claro con claro): los fondos de la base se acercan al nuevo fondo.
                ['header-bg', 'footer-bg', 'panel-bg', 'group-bg', 'fixed-head-bg', 'row-alt-bg', 'hover-bg', 'menu-hover-bg', 'group-hover-bg', 'fixed-hover-bg', 'input-disabled-bg', 'sel-bg-soft']
                    .forEach(function (x) { if (r[x]) r[x] = desplazar(r[x], bg0, bg); });
            }
        }
        if (bar)
        {
            var f = r.bg, t = r.fg;
            r['sel-bg'] = bar;
            r.accent = bar;
            r['focus-ring'] = bar;
            r['active-cell'] = bar;
            r['sel-bg-soft'] = r['checked-bg'] = mezclar(f, bar, oscuro ? 0.30 : 0.14);
            r['hover-bg'] = r['menu-hover-bg'] = r['group-hover-bg'] = r['fixed-hover-bg'] = mezclar(f, bar, oscuro ? 0.16 : 0.07);
            r['header-bg'] = r['footer-bg'] = r['panel-bg'] = r['group-bg'] = r['fixed-head-bg'] = mezclar(f, bar, oscuro ? 0.12 : 0.06);
            r['row-alt-bg'] = mezclar(f, bar, oscuro ? 0.05 : 0.025);
            r['header-fg'] = r['footer-fg'] = mezclar(t, bar, 0.25);
            r['header-border'] = mezclar(f, bar, oscuro ? 0.35 : 0.24);
            r.border = r['menu-border'] = r['panel-border'] = r['card-border'] = mezclar(f, bar, oscuro ? 0.24 : 0.13);
            r['input-border'] = mezclar(mezclar(f, t, 0.45), bar, 0.25);
            if (!barText) r['sel-fg'] = contraste([255, 255, 255], bar) >= contraste([0, 0, 0], bar) ? [255, 255, 255] : [27, 31, 36];
        }
        if (barText) r['sel-fg'] = barText;
        // Contraste: primero las interfaces (3:1), luego el texto (4.5:1). Solo se mueve el primer color del par, y
        // solo en los pares que cambiaron respecto a la base (sin colores, la paleta es la de la base, tal cual).
        var cambio = function (p) { return aHex(r[p[0]]) !== aHex(leerColor(base[p[0]])) || aHex(r[p[1]]) !== aHex(leerColor(base[p[1]])); };
        INTERFAZ_3.forEach(function (p) { if (r[p[0]] && r[p[1]] && cambio(p)) r[p[0]] = asegurar(r[p[0]], r[p[1]], 3); });
        TEXTO_AA.forEach(function (p) { if (r[p[0]] && r[p[1]] && cambio(p)) r[p[0]] = asegurar(r[p[0]], r[p[1]], 4.5); });
        FONDO_AA.forEach(function (p) { if (r[p[0]] && r[p[1]] && cambio(p)) r[p[1]] = acercarFondo(r[p[0]], r[p[1]], r.bg, 4.5); });
        var out = { 'color-scheme': bg ? (oscuro ? 'dark' : 'light') : (base['color-scheme'] || 'light') };
        for (k in r) out[k] = aHex(r[k]);
        return out;
    }
    /**
     * applyColors(elemento, colores, {base}) -> paleta. Fija fromColors(colores) como data-et-palette del elemento
     * (<html> por omisión), así que la heredan sus descendientes, los shadow DOM y los iframes del mismo origen.
     * base: por omisión, el tema efectivo del elemento (o 'libro-mayor' si no tiene). colores null quita la paleta.
     */
    function applyColors(el, colores, o)
    {
        el = el || (w.document && w.document.documentElement);
        if (!el) return null;
        if (colores == null) { el.removeAttribute(ATTR.palette); return null; }
        var b = o && o.base;
        if (!b) { var res = resolve(el); b = res.effective && interno(res.effective) ? res.effective : 'libro-mayor'; }
        var p = fromColors(colores, { base: b });
        el.setAttribute(ATTR.palette, JSON.stringify(p));
        return copia(p);
    }

    // ---------------------------------------------------------------- utilidades para los componentes
    /** cssVars(paleta, {prefix, important}) -> "--et-t-bg: #FFF; …" (sin color-scheme). */
    function cssVars(p, o)
    {
        if (!p) return '';
        var pre = (o && o.prefix != null) ? o.prefix : '--et-t-', imp = (o && o.important) ? ' !important' : '';
        var out = [];
        for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k) && k !== 'color-scheme') out.push(pre + k + ': ' + p[k] + imp + ';');
        return out.join(' ');
    }
    function fontStack(p) { return (p && p.font) || FONT_STACK; }


    // ---------------------------------------------------------------- 1.3.0: bind (tema para cualquier componente)
    var DENSIDADES = {
        compacta: { h: '28px', pad: '3px 8px', row: '26px', fs: '13px' },
        normal: { h: '34px', pad: '6px 10px', row: '32px', fs: '14px' },
        comoda: { h: '42px', pad: '9px 12px', row: '40px', fs: '15px' }
    };
    var bindSeq = 0;
    /** V(n, respaldo): la variable de tema n con su derivada (PADRES) y el valor del tema (--et-t-n). */
    function cssVar(n, fb)
    {
        var t = 'var(--et-t-' + n + (fb != null ? ', ' + fb : '') + ')';
        var p = PADRES[n];
        return p ? 'var(--et-' + n + ', var(--et-' + p + ', ' + t + '))' : 'var(--et-' + n + ', ' + t + ')';
    }
    /** Estado de tema de un componente: propios (theme, palette, density del host, aunque estén vacíos) o heredados. */
    function estadoDe(host)
    {
        var r = null;
        function her() { if (r === null) { try { r = resolve(host) || {}; } catch (e) { r = {}; } } return r; }
        var theme;
        if (host.hasAttribute('theme')) theme = normalizar(host.getAttribute('theme')) || '';
        else theme = her().none ? '' : (normalizar(her().theme) || '');
        if (theme && theme !== 'auto' && !interno(theme)) theme = '';
        var palette;
        if (host.hasAttribute('palette')) palette = limpiar(host.getAttribute('palette'), (host.localName || 'componente') + ' palette');
        else palette = her().palette;
        if (palette && (typeof palette !== 'object' || !Object.keys(palette).length)) palette = null;
        var density = normalizarDensidad(host.hasAttribute('density') ? host.getAttribute('density') : her().density);
        if (!DENSIDADES[density]) density = '';
        if (theme === 'auto') escucharEsquema();
        var ef = theme === 'auto' ? (oscuroDelSistema() ? 'oscuro' : 'claro') : theme;
        var pal = ef ? interno(ef) : null;
        return { theme: theme, palette: palette || null, density: density, effective: ef || '', scheme: pal ? (pal['color-scheme'] || '') : '' };
    }
    function varsDe(nombre) { var p = interno(nombre); return p ? cssVars(p, { prefix: '--et-t-' }) + (p['color-scheme'] ? ' --ix-t-cs: ' + p['color-scheme'] + ';' : '') : ''; }
    function cssEstado(sel, e)
    {
        var s = '';
        if (e.theme === 'auto') s += sel + ' { ' + varsDe('claro') + ' }\n@media (prefers-color-scheme: dark) { ' + sel + ' { ' + varsDe('oscuro') + ' } }\n';
        else s += sel + ' { ' + varsDe(e.theme) + ' }\n';
        var d = DENSIDADES[e.density || 'normal'];
        s += sel + ' { --ix-t-h: ' + d.h + '; --ix-t-pad: ' + d.pad + '; --ix-t-row: ' + d.row + '; --ix-t-fs: ' + d.fs + '; }\n';
        if (e.palette) { var x = []; for (var k in e.palette) if (Object.prototype.hasOwnProperty.call(e.palette, k)) x.push('--et-' + k + ': ' + e.palette[k] + ' !important;'); s += sel + ' { ' + x.join(' ') + ' }\n'; }
        return s;
    }
    /**
     * bind(host, {root, name, css, onChange}) -> {state(), update(), dispose(), active}
     *  root: ShadowRoot del componente; si se omite o no es shadow, el <style> va a document.head con el selector
     *        name[data-ix-themed="N"] (el componente queda marcado con ese atributo solo mientras tiene tema).
     *  css(V, estado): CSS del componente con tema; estado.sel es el selector del host (':host' o el de DOM claro).
     *  onChange(estado): se llama tras cada cambio (con o sin tema), por si el componente cambia clases o ARIA.
     */
    function bind(host, o)
    {
        o = o || {};
        var root = o.root && o.root.nodeType === 11 ? o.root : null;
        var nombre = o.name || (host.localName || 'componente');
        var id = String(++bindSeq), estilo = null, baja = null, mo = null, vivo = true, ultimo = null;
        var h = { active: false };
        function quitar()
        {
            if (estilo) { try { estilo.remove(); } catch (e) { } estilo = null; }
            if (!root && host.getAttribute('data-ix-themed') === id) host.removeAttribute('data-ix-themed');
        }
        function update()
        {
            if (!vivo) return h;
            var e = estadoDe(host);
            e.sel = root ? ':host' : nombre + '[data-ix-themed="' + id + '"]';
            h.estado = e;
            h.active = !!e.theme;
            if (!e.theme) quitar();
            else
            {
                var css = '/* ' + nombre + ': tema ' + e.theme + ' */\n' + cssEstado(e.sel, e) + (typeof o.css === 'function' ? (o.css(cssVar, e) || '') : '');
                if (!root) host.setAttribute('data-ix-themed', id);
                var destinoEstilo = root || (w.document && w.document.head);
                if (!estilo || !estilo.isConnected)
                {
                    estilo = w.document.createElement('style');
                    estilo.setAttribute('data-ix-theme', nombre);
                    if (destinoEstilo === root) root.insertBefore(estilo, root.firstChild); else if (destinoEstilo) destinoEstilo.appendChild(estilo);
                }
                if (estilo.textContent !== css) estilo.textContent = css;
            }
            var clave = JSON.stringify([e.theme, e.palette, e.density, e.effective]);
            if (typeof o.onChange === 'function' && clave !== ultimo) { try { o.onChange(e); } catch (x) { console.warn('InduxsoftTheme.bind: onChange falló', x); } }
            ultimo = clave;
            return h;
        }
        h.state = function () { return estadoDe(host); };
        h.update = update;
        h.dispose = function ()
        {
            vivo = false;
            if (baja) { try { baja(); } catch (e) { } baja = null; }
            if (mo) { try { mo.disconnect(); } catch (e) { } mo = null; }
            quitar();
        };
        baja = subscribe(host, update);
        if (typeof MutationObserver !== 'undefined') { mo = new MutationObserver(update); mo.observe(host, { attributes: true, attributeFilter: ['theme', 'palette', 'density'] }); }
        update();
        return h;
    }

    var api = {
        version: VERSION,
        attributes: ATTRS.slice(),
        storageKey: CLAVE,
        parents: asignar({}, PADRES),
        get themes()
        {
            var o = {};
            for (var n in EXPLICITOS) o[n] = copia(interno(n));
            return o;
        },
        theme: function (nombre) { return copia(interno(nombre)); },
        has: function (nombre) { return !!interno(nombre); },
        define: define,
        normalize: normalizar,
        normalizeDensity: normalizarDensidad,
        parsePalette: limpiar,
        resolve: resolve,
        get: get,
        set: set,
        setPalette: setPalette,
        setDensity: setDensity,
        forget: forget,
        subscribe: subscribe,
        unsubscribe: unsubscribe,
        cssVars: cssVars,
        cssVar: cssVar,
        bind: bind,
        densities: JSON.parse(JSON.stringify(DENSIDADES)),
        fontStack: fontStack,
        none: NINGUNO,
        isNone: esNinguno,
        fromColors: fromColors,
        applyColors: applyColors,
        contrast: contraste,
        _interno: interno,
        _exportar: function () { return { explicitos: asignar({}, EXPLICITOS), resueltos: asignar({}, RESUELTOS), subs: subs }; },
        _detener: function () { try { if (obs) obs.disconnect(); } catch (e) { } try { if (mql) { if (mql.removeEventListener) mql.removeEventListener('change', alCambiarEsquema); else if (mql.removeListener) mql.removeListener(alCambiarEsquema); } } catch (e) { } }
    };

    // Una versión anterior: se conservan sus temas registrados y sus suscriptores, y se apaga su observador.
    if (previo && typeof previo === 'object')
    {
        try
        {
            var x = previo._exportar ? previo._exportar() : null;
            if (x)
            {
                for (var k in x.explicitos) if (!(k in EXPLICITOS) || (x.resueltos && x.resueltos[k])) { EXPLICITOS[k] = x.explicitos[k]; if (x.resueltos && x.resueltos[k]) RESUELTOS[k] = x.resueltos[k]; }
                if (x.subs) x.subs.forEach(function (mapa, el) { mapa.forEach(function (_, cb) { subscribe(el, cb); }); });
            }
            if (previo._detener) previo._detener();
        }
        catch (e) { }
    }

    try { obs = new MutationObserver(alMutar); observar(w.document); } catch (e) { obs = null; }
    try
    {
        mql = w.matchMedia ? w.matchMedia('(prefers-color-scheme: dark)') : null;
    }
    catch (e) { mql = null; }

    try { Object.defineProperty(w, 'InduxsoftTheme', { value: api, configurable: true, writable: true, enumerable: false }); }
    catch (e) { w.InduxsoftTheme = api; }
})();
/* </induxsoft-theme> */

/**
 * ¿QUÉ ES UN WEB COMPONENT?
 * Es una forma de crear un bloque de código encapsulado y de
 * responsabilidad única que puede reutilizarse en cualquier
 * página.
 */

// IK-7 (2026-11-02): construcción de los componentes del núcleo (EditSelect, InputKey, CheckList, StackEdit, DateRange,
// SafeInput, MediaList, FilterText, FilterDateRange). Mientras la página carga, en DOMContentLoaded como siempre (mismo
// orden); si ya cargó (elemento insertado por JS, o este archivo cargado tarde), en un microtask, para que tome los
// atributos que se pongan en el mismo script después de insertarlo. Se construye una sola vez: reconectar no repite.
// Antes, un componente insertado después de DOMContentLoaded no se construía nunca. Mismo criterio que EdiTable (F1, C9).
function _ixDocumentoCargado()
{
    if (document.readyState === 'complete') return true;
    if (document.readyState === 'loading') return false;
    try { const nav = performance.getEntriesByType('navigation')[0]; if (nav) return nav.domContentLoadedEventStart > 0; } catch (e) { }
    return true;
}
function _ixConstruirAlCargar(el, construir)
{
    if (el._ixConstruido || el._ixEsperando) return;
    el._ixEsperando = true;
    const hacer = () => { el._ixEsperando = false; if (el._ixConstruido) return; el._ixConstruido = true; construir(); };
    if (!_ixDocumentoCargado()) { document.addEventListener('DOMContentLoaded', hacer); return; }
    queueMicrotask(() =>
    {
        if (!el.isConnected) { el._ixEsperando = false; return; }   // se quitó antes: se construye al volver a conectarse
        el.attributes = el.getAttributeNames();   // lo que hace el DOMContentLoaded del constructor
        hacer();
    });
}

// Tema en EditSelect, CheckList, StackEdit y SafeInput (tests/theme/CONTROLES.md, 2026-11-03). Liga el control a
// InduxsoftTheme.bind con su shadow: sin el módulo o sin tema no deja nada (ni <style> ni clases), así que el control
// queda como antes. Las reglas usan ':host' en cadena (más específicas que las de la hoja de hoy) y solo existen con
// tema. css(V, e) es la función del control. Se vuelve a ligar al reconectar y se libera al desconectar.
function _ixVincularTema(el, nombre, css)
{
    const T = (typeof window !== 'undefined') ? window.InduxsoftTheme : null;
    if (!el._ixRaiz || !T || typeof T.bind !== 'function') return null;
    if (el._ixTema) { el._ixTema.update(); return el._ixTema; }
    try { el._ixTema = T.bind(el, { root: el._ixRaiz, name: nombre, css }); }
    catch (e) { console.warn(nombre + ': InduxsoftTheme.bind falló', e); el._ixTema = null; }
    return el._ixTema;
}
function _ixSoltarTema(el) { if (el._ixTema) { try { el._ixTema.dispose(); } catch (e) { } el._ixTema = null; } }
// Medidas de la densidad (las pone bind) y size="sm" (alto 28px, relleno 3px 8px, letra 13px: los de «compacta»).
const _ixT = {
    H: 'var(--ix-h, var(--ix-t-h))', PAD: 'var(--ix-pad, var(--ix-t-pad))', FS: 'var(--ix-fs, var(--ix-t-fs))', ROW: 'var(--ix-row, var(--ix-t-row))',
    sm: ':host([size="sm" i]){ --ix-t-h: 28px; --ix-t-pad: 3px 8px; --ix-t-fs: 13px; --ix-t-row: 26px; }\n',
    anillo: (V) => `0 0 0 3px color-mix(in srgb, ${V('focus-ring', '#2F66CC')} 30%, transparent)`,
    // Flecha de select en currentColor (la de hoy es un SVG con color fijo, invisible en oscuro).
    flecha: (V) => `background-image: linear-gradient(45deg, transparent 50%, ${V('muted-fg', '#59636E')} 50%), linear-gradient(135deg, ${V('muted-fg', '#59636E')} 50%, transparent 50%); background-position: calc(100% - 16px) 50%, calc(100% - 11px) 50%; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;`
};

class EditSelect extends HTMLElement
{
    attributes = null;
    select = null;
    inputh = null;
    manualOption = null;
    manualInput = null;
    onChanging = null;

    // Inicializar el HTMLElement padre
    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    // Devuelve el array de atributos que el navegador observará
    static get observedAttributes()
    {
        return  attributes;
    }

    // Se llama cada vez que se modifica un atributo
    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    // Se llama cuando el componente se agrega al documento
    connectedCallback()
    {
        if (this._ixRaiz) this._ixTemaLigar();   // reconectado: vuelve a tomar el tema
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow = this.attachShadow({ mode: 'closed' });
            const option = this.querySelectorAll('option');
            const contnr = document.createElement('div');
            const defval = this.getAttribute('value');
            this.select = document.createElement('select');
            this.inputh = document.createElement('input');

            this.select.classList.add('induxsoft-form-select');
            contnr.setAttribute('id', 'EditSelect_container');
            this.inputh.setAttribute('type', 'hidden');
            this.inputh.setAttribute('name', (this.getAttribute('name')??''));

            //=============== Manual option

            const textIndicatorManual = (this.getAttribute('manual-text') ?? 'Escribir manualmente...');
            this.manualOption = document.createElement('option');
            this.manualOption.value = -99;
            this.manualOption.textContent = textIndicatorManual;

            //=============== Input manual

            this.manualInput = document.createElement('input');
            this.manualInput.classList.add('induxsoft-form-control');
            this.manualInput.setAttribute('placeholder', textIndicatorManual);

            //=============== Events

            this.select.addEventListener('change', (e) => 
            {
                if (this.select.value === this.manualOption.value)
                {
                    this.setValue((this.select.getAttribute('text-value') ?? ''));
                }
                else
                {
                    this.setValue(e.target.value ?? '');
                }
            });

            this.manualInput.addEventListener('change', () => 
            {
                this.setValue(this.manualInput.value, false);
                this.select.setAttribute('text-value', this.manualInput.value);
            });

            if ((this.getAttribute('edit-options') ?? 'false') == 'true')
            {
                this.select.addEventListener('dblclick', () => 
                {
                    this.manualInput.style.zIndex = 0;
                    this.setValue((this.select.getAttribute('text-value') ?? ''));
                    this.manualInput.value = (this.select.getAttribute('text-value') ?? '');
                    this.manualInput.select();
                    this.manualInput.focus();
                });
            }

            //=============== DOM

            shadow.innerHTML = 
            `
                <style>
                    div{ position: relative !important; }
                    select{ width: 100% !important; padding: 4px 8px !important; }
                    input{ position: absolute !important; z-index: -1; left: 0; top: 0; width:85% !important; height: 60% !important; border: none !important; outline: none !important;}
                    
                    .induxsoft-form-control{border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem !important;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] {background-color: #e9ecef;opacity: 1;
                    }
                    .induxsoft-buttons{display: inline-block;font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-buttons:hover{color: #212529;background-color: #F5F5F5;
                    }
                    .induxsoft-form-select {display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem !important;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                    }
                    
                    ` + (this.getAttribute('control-styles') ?? '') + `
                </style>
            `;

            if (option && option.length >= 1) 
                option.forEach(opt => this.select.appendChild(opt));

            this.select.appendChild(this.manualOption);

            if (defval) 
            {
                this.setValue(defval);
                if (this.select.selectedIndex >= 0)
                    this.select.setAttribute('text-value', this.select.options[this.select.selectedIndex].textContent);
                else{
                    this.select.setAttribute('text-value', defval);
                    this.select.value = this.manualOption.value;
                    this.select.dispatchEvent(new Event('change'));
                }
            }

            if (this.hasAttribute('name'))
                this.select.setAttribute('name', this.getAttribute('name'));

            contnr.appendChild(this.select);
            contnr.appendChild(this.manualInput);
            shadow.appendChild(contnr);
            this.after(this.inputh);
            this._ixRaiz = shadow;
            this._ixTemaLigar();
        });
    }
    disconnectedCallback() { _ixSoltarTema(this); }

    // Tema (CONTROLES.md): el select es el campo; el texto manual se encima dentro de él con los mismos colores.
    _ixTemaLigar() { return _ixVincularTema(this, 'edit-select', (V) => EditSelect._ixCss(V)); }
    static _ixCss(V)
    {
        const { H, PAD, FS } = _ixT, S = ':host #EditSelect_container';
        return _ixT.sm + `
:host{ color-scheme: var(--ix-t-cs, normal); }
${S} select.induxsoft-form-select{ box-sizing: border-box; min-height: ${H}; height: auto; padding: ${PAD} !important; padding-right: 2rem !important; font-family: ${V('font', 'system-ui, sans-serif')}; font-size: ${FS}; line-height: 1.4; color: ${V('input-fg', '#1F2328')}; background-color: ${V('input-bg', '#FFFFFF')}; ${_ixT.flecha(V)} border: 1px solid ${V('input-border', '#8C959F')}; outline: 0; border-radius: ${V('radius', '4px')}; transition: border-color .12s, box-shadow .12s; }
${S} select.induxsoft-form-select:focus{ border-color: ${V('accent', '#2F66CC')}; box-shadow: ${_ixT.anillo(V)}; }
${S} select.induxsoft-form-select:disabled{ background-color: ${V('input-disabled-bg', '#EEF1F4')}; color: ${V('muted-fg', '#59636E')}; }
${S} select.induxsoft-form-select option{ background-color: ${V('menu-bg', '#FFFFFF')}; color: ${V('menu-fg', '#1F2328')}; }
${S} input.induxsoft-form-control{ box-sizing: border-box; top: 1px; left: 1px; width: calc(100% - 2rem - 2px) !important; height: calc(100% - 2px) !important; padding: ${PAD} !important; font-family: ${V('font', 'system-ui, sans-serif')}; font-size: ${FS}; line-height: 1.4; color: ${V('input-fg', '#1F2328')}; background-color: ${V('input-bg', '#FFFFFF')}; border-radius: ${V('radius', '4px')} 0 0 ${V('radius', '4px')}; }
${S} input.induxsoft-form-control::placeholder{ color: ${V('muted-fg', '#59636E')}; opacity: 1; }
${S}:focus-within select.induxsoft-form-select{ border-color: ${V('accent', '#2F66CC')}; box-shadow: ${_ixT.anillo(V)}; }
`;
    }

    setValue(value, allowFocus=true)
    {
        this.setAttribute('value', value);
        this.inputh.value = value;
        this.select.value = value;

        if ((this.select.selectedIndex < 0) || this.select.value === this.manualOption.value)
        {
            this.select.setAttribute('text-value', value);
            this.select.value = this.manualOption.value;
            this.manualInput.style.zIndex = 0;
            this.manualInput.value = (this.select.getAttribute('text-value') ?? '');
            
            if (allowFocus)
            {
                this.manualInput.select();
                this.manualInput.focus();
            }            
        }
        else
        {
            this.manualInput.style.zIndex = -1;
            this.select.setAttribute('text-value', this.select.options[this.select.selectedIndex].textContent); 
        }

        if (this.onChanging)
            this.onChanging();
    }

    getValue()
    {
        return this.getAttribute('value');
    }

    reloadSelect()
    {
        const option = this.querySelectorAll('option');
        const micopy = this.manualOption.cloneNode(true);

        this.select.innerHTML = '';

        if (option && option.length >= 1) 
            option.forEach(opt => this.select.appendChild(opt));

        this.manualOption = micopy;
        this.select.appendChild(this.manualOption);
    }
}

class InputKey extends HTMLElement
{
    attributes = null;
    data = null;
    searchData = null;
    record_selected = {};
    accept_data = null;
    table_tables_container2 = null;
    head_tables_container2 = null;
    body_tables_container2 = null;
    columns = null;
    container2 = null;
    colcaptions = null;
    inputv = null;
    input_search_container = null;
    input_search_container2 = null;
    input_description_container = null;
    accept_footer_container2 = null;
    change_event = null;
    onBeforeSearch = null;
    buttonElements = [];
    #Requesting = false;
    // IK-5 (2026-11-02): cada búsqueda lleva un número; la respuesta que no es de la última se descarta.
    #searchSeq = 0;
    #abort = null;
    // IK-3: texto de la última búsqueda, tal como se escribió (para la coincidencia exacta).
    #lastSearch = '';
    // IK-1: elemento que tenía el foco al abrir la búsqueda; recibe el foco al cerrar sin selección.
    #opener = null;
    #skipBlur = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return this.attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            if (!this.shadow) this.CreateShadow();   // pudo construirse antes (pick(), open() de InputKey 2)
        });
        this._ik2Conectado();   // InputKey 2
    }
    disconnectedCallback()
    {
        this._ik2Desconectado();   // InputKey 2
    }
    shadow=null;
    CreateShadow()
    {
        this.columns = this.getAttribute('columns');
        this.colcaptions = this.getAttribute('colcaptions');

        //=============== 1 SECTION [ MAIN CONTROL ]
        
        if(!this.shadow)this.shadow = this.attachShadow({ mode: 'closed' });

        this.inputv = this.createFullElement('input', {id:'inputv', type:'text', value:`${this.getAttribute('value')??''}`, name:`${this.getAttribute('name')}`, style:'opacity: 0 !important;width: 1px !important; height:1px !important; border:none !important; outline:none !important; box-shadow:none !important; padding:0 !important; margin: 0 !important; pointer-events: none !important; background-color: transparent !important; position:relative !important; display:block !important; top:-15px !important;'});
        const container = this.createFullElement('div', {id:'container'});
        const search_container = this.createFullElement('div', {id:'search_container'});
        this.input_search_container = this.createFullElement('input', {id:'input_search_container', type:'text', class:'form-control induxsoft-form-control'});
        const button_search_container = this.createFullElement('button', {id:'button_search_container', type:'button', class:'induxsoft-buttons', title:'Buscar'});
        const description_container = this.createFullElement('div', {id:'description_container'});
        this.input_description_container = this.createFullElement('input', {id:'input_description_container', type:'text', readonly:'readonly', class:'induxsoft-form-control'});
        const button_add_container = this.createFullElement('button', {id:'button_add_container', type:'button', class:'induxsoft-buttons', title:'Agregar'});
        const button_edit_container = this.createFullElement('button', {id:'button_edit_container', type:'button', class:'induxsoft-buttons', title:'Editar'});
        const button_clear_container = this.createFullElement('button', {id:'button_clear_container', type:'button', class:'induxsoft-buttons', title:'Limpiar'});

        container.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));
        this.inputv.required = ((this.getAttribute('required') ?? 'false') === 'true');
        if (this.getAttribute("hide-searcher") === 'true') {
            this.input_search_container.style.display = 'none';
            container.style.gridTemplateColumns = 'minmax(6%,max-content) auto';
        }

        this.input_search_container.value = (this.getAttribute('search-value') ?? '');
        this.input_description_container.value = (this.getAttribute('text-value') ?? '');
        button_search_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>`;
        button_add_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>`;
        button_edit_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil-fill" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;
        button_clear_container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;

        search_container.appendChild(this.input_search_container);
        search_container.appendChild(button_search_container);
        description_container.appendChild(this.input_description_container);

        // BOTONES ADICIONALES
        if (this.hasAttribute('buttons'))
            this._createOtherButtons();

        this.buttonElements.forEach(btn=>{
            description_container.appendChild(btn);
            this._setOtherButtonsEvents(btn);
        });

        if (this.getAttribute('add-url')) description_container.appendChild(button_add_container);
        if (this.getAttribute('edit-url')) description_container.appendChild(button_edit_container);
        description_container.appendChild(button_clear_container);
        container.appendChild(search_container);
        container.appendChild(description_container);

        //=============== 2 SECTION [ SEARCH AND SELECT ELEMENT ]

        this.container2 = this.createFullElement('div', {id:'container2', class:'hide-element modal-backdrop'});
        const search_container2 = this.createFullElement('div', {id:'search_container2', class:'bg-white modal-container'});
        const header_section_container2 = this.createFullElement('div', {id:'header_section_container2', class:'d-flex modal-section modal-section-header'});
        const search_section_container2 = this.createFullElement('div', {id:'search_section_container2', class:'d-flex p-2 modal-section'});
        const tables_section_container2 = this.createFullElement('div', {id:'tables_section_container2', class:'grow-1 modal-section overflow'});
        const footer_section_container2 = this.createFullElement('div', {class:'bg-light-gray d-flex gap-1 justify-content-end p-2 modal-section'});

        // header section
        const title_header_container2 = this.createFullElement('p', {id:'title_container2', class:'text-secondary grow-1'});
        const close_header_container2 = this.createFullElement('button', {id:'close_header_container2', class:"border-0 induxsoft-buttons p-2 d-flex align-items-center justify-content-center hover-red"});
        title_header_container2.textContent = (this.getAttribute('box-title-text') ?? this._ik2T('title'));
        close_header_container2.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#333" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
        header_section_container2.appendChild(title_header_container2);
        header_section_container2.appendChild(close_header_container2);

        // search section
        const button_search_container2 = this.createFullElement('button', {type:'button',class:'p-2 induxsoft-buttons'});
        this.input_search_container2 = this.createFullElement('input', {type:'text', class:'grow-1 induxsoft-form-control'});
        button_search_container2.textContent = this._ik2T('search');
        this.input_search_container2.setAttribute('placeholder', (this.getAttribute('box-placeholder-text') ?? this._ik2T('searchPlaceholder')));
        search_section_container2.appendChild(this.input_search_container2);
        search_section_container2.appendChild(button_search_container2);

        // tables section
        this.table_tables_container2 = this.createFullElement('table', {id:'table_tables_container2'});
        this.head_tables_container2 = this.createFullElement('thead', {id:'head_tables_container2', class:'bg-light-gray'});
        this.body_tables_container2 = this.createFullElement('tbody', {id:'body_tables_container2'});

        this.table_tables_container2.appendChild(this.head_tables_container2);
        this.table_tables_container2.appendChild(this.body_tables_container2);
        tables_section_container2.appendChild(this.table_tables_container2);

        // footer section
        this.accept_footer_container2 = this.createFullElement('button', {type:'button',class:'induxsoft-buttons'});
        const close2_footer_container2 = this.createFullElement('button', {id:'close2_container2', type:'button', class:'induxsoft-buttons'});
        this.accept_footer_container2.textContent = this._ik2T('accept');
        close2_footer_container2.textContent = this._ik2T('cancel');
        footer_section_container2.appendChild(this.accept_footer_container2);
        footer_section_container2.appendChild(close2_footer_container2);

        search_container2.appendChild(header_section_container2);
        search_container2.appendChild(search_section_container2);
        search_container2.appendChild(tables_section_container2);
        search_container2.appendChild(footer_section_container2);
        this.container2.appendChild(search_container2);

        //=============== 3 SECTION [ ADD ELEMENT ]

        const container3 = this.createFullElement('div', {id:'container3', class:'hide-element modal-backdrop'});
        const add_container3 = this.createFullElement('div', {id:'add_container3', class:'bg-white modal-container'});
        const header_section_container3 = this.createFullElement('div', {id:'header_section_container3', class:'d-flex modal-section modal-section-header'});
        const iframe_section_container3 = this.createFullElement('div', {id:'iframe_section_container3', class:'grow-1 modal-section'});

        // header section
        const title_header_container3 = this.createFullElement('p', {id:'title_container2', class:'text-secondary grow-1'});
        const close_header_container3 = this.createFullElement('button', {id:'close_header_container2', class:"border-0 p-1 hover-red"});
        title_header_container3.textContent = (this.getAttribute('box-title-text') ?? this._ik2T('addTitle'));
        close_header_container3.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#333" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
        header_section_container3.appendChild(title_header_container3);
        header_section_container3.appendChild(close_header_container3);

        add_container3.appendChild(header_section_container3);
        add_container3.appendChild(iframe_section_container3);
        container3.appendChild(add_container3);

        //=============== 4 SECTION [ EDIT ELEMENT ]

        const container4 = this.createFullElement('div', {id:'container4', class:'hide-element modal-backdrop'});
        const edit_container4 = this.createFullElement('div', {id:'edit_container4', class:'bg-white modal-container'});
        const header_section_container4 = this.createFullElement('div', {id:'header_section_container4', class:'d-flex modal-section modal-section-header'});
        const iframe_section_container4 = this.createFullElement('div', {id:'iframe_section_container4', class:'grow-1 modal-section'});

        // header section
        const title_header_container4 = this.createFullElement('p', {id:'title_container4', class:'text-secondary grow-1'});
        const close_header_container4 = this.createFullElement('button', {id:'close_header_container4', class:"border-0 p-1 hover-red"});
        title_header_container4.textContent = (this.getAttribute('box-title-text') ?? this._ik2T('editTitle'));
        close_header_container4.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#333" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
        header_section_container4.appendChild(title_header_container4);
        header_section_container4.appendChild(close_header_container4);

        edit_container4.appendChild(header_section_container4);
        edit_container4.appendChild(iframe_section_container4);
        container4.appendChild(edit_container4);

        //=============== EVENTS

        button_search_container.addEventListener('click', () => {
            this._search(false);
        });
        this.input_description_container.addEventListener('dblclick', () => {
            button_search_container.click();
        })
        // IK-2 (2026-11-02): la X, «Cancelar» y Esc cierran igual: sin selección y sin change_event.
        // Antes «Cancelar» llamaba a setValue(this.accept_data) y volvía a disparar change_event con el último registro.
        close_header_container2.addEventListener('click', () => {
            this._ikCancel();
        });
        close2_footer_container2.addEventListener('click', () => {
            this._ikCancel();
        });
        this.accept_footer_container2.addEventListener('click', () => {
            if (!this.record_selected || Object.entries(this.record_selected).length <= 0)
            {
                this._ik2Avisar(this._ik2T('mustSelect'), 'ventana');   // con tema: en línea; sin tema: alert
                return;
            }
            const o2 = this.#opener;   // InputKey 2: con tema, el foco vuelve al que abrió
            this.#opener = null;
            this.setValue(this.record_selected);
            this._ik2Elegido(this.accept_data);   // InputKey 2: Selected y pick()
            this._ik2Ocultar();                   // antes: this.container2.classList.add('hide-element')
            InputKey._ikSyncListeners();   // IK-1
            this._ik2DevolverFoco(o2);
        });
        this.input_search_container.addEventListener('click', () => {
            this.input_search_container.select();
            this.input_search_container.focus();
        });
        this.input_search_container.addEventListener('blur', (e) => {
            // IK-2: primer blur después de cerrar sin selección, sin haber cambiado el texto: no busca ni limpia.
            const skip = this.#skipBlur; this.#skipBlur = null;
            if (skip !== null && skip === this.input_search_container.value) return;
            if (this.container2.classList.contains('hide-element'))
            {
                if (!this.input_search_container.value.trim())
                {
                    this.clear();
                }
                else if (!this.accept_data || Object.keys(this.accept_data).length < 1)
                {
                    this._search();
                }
                else if (this.accept_data && (this.accept_data[(this.getAttribute('data-search') ?? '').toLowerCase()]) != this.input_search_container.value.toLowerCase())
                {
                    this.setValue(this.accept_data);
                }
            }
        });
        this.input_search_container.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && this.input_search_container.value == "")
                this.clear();
            else if (e.key === 'Enter')
                this._search();
            else if (e.key === 'Escape')
                this.input_search_container.blur();
        });
        button_search_container2.addEventListener('click', () => {
            this.searchButton(this.container2);
        });
        this.input_search_container2.addEventListener('keyup', (e) => {
            if (this._ik2Lista) return;   // InputKey 2: con tema el buscador de la ventana usa keydown
            if (e.key === 'Enter')
                this.searchButton(this.container2);
        });

        // IK-1: Esc lo atiende InputKey._ikOnWindowKey (keydown en captura de window, que lo consume). Esto queda por si
        // el keyup llegara de todos modos.
        search_container2.addEventListener('keyup', (e) => {
            if (e.key === 'Escape' && !this.container2.classList.contains('hide-element'))
                this._ikCancel();
        });
        button_add_container.addEventListener('click', (e) => {
            e.stopPropagation();
            let url = this.prepareUrl((this.getAttribute('add-url')??''));
            const iframe_container3 = this.createFullElement('iframe', {width:'100%', height:'100%', title:'Add element', src:url});
            iframe_section_container3.innerHTML = '';
            iframe_section_container3.appendChild(iframe_container3);
            this._ik2Cargando(iframe_section_container3, iframe_container3);   // InputKey 2 (A8)
            container3.classList.remove('hide-element');
        });
        close_header_container3.addEventListener('click', () => {
            container3.classList.add('hide-element');
        });
        button_edit_container.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.getAttribute('value'))
            {
                this._ik2Avisar(this._ik2T('mustSelectEdit'), 'campo');
                return;
            }
            let url = this.prepareUrl((this.getAttribute('edit-url')??''));
            const iframe_container4 = this.createFullElement('iframe', {width:'100%', height:'100%', title:'Edit element', src:url});
            iframe_section_container4.innerHTML = '';
            iframe_section_container4.appendChild(iframe_container4);
            this._ik2Cargando(iframe_section_container4, iframe_container4);   // InputKey 2 (A8)
            container4.classList.remove('hide-element');
        });
        button_clear_container.addEventListener('click', () => {
            this.clear();
            this.input_search_container.focus();
        });
        close_header_container4.addEventListener('click', () => {
            container4.classList.add('hide-element');
        });

        const MO = new MutationObserver(()=>{
            container.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));
            this.inputv.required = ((this.getAttribute('required') ?? 'false') === 'true');
            
            let hide_searcher = (this.getAttribute("hide-searcher") === 'true');
            this.input_search_container.style.display = (hide_searcher) ? 'none' : '';
            container.style.gridTemplateColumns = (hide_searcher) ? 'minmax(6%,max-content) auto' : '40% 60%';
        });

        MO.observe(this, {
            attributes: true,
            attributeFilter: ['disabled','required','hide-searcher']
        });
        
        //=============== STYLES

        this.shadow.innerHTML = `
            <style>
                /* ========== General */
                *{ box-sizing: border-box; margin: 0; padding: 0; }
                .hide-element{ display: none !important; }
                .text-secondary{ color: #888; }
                .text-white{color: #FFF;}
                .bg-white{ background-color: #FFF;}.bg-red{ background-color: #F00; }.bg-light-gray{ background-color: #F5F5F5; }.bg-gray{background-color:#C0C0C0;}
                .d-flex{ display:flex; align-items:center;}
                .gap-1{gap:4px;}.gap-2{gap:8px;}
                .grow-1{ flex-grow: 1; }
                .border-0{ border:none; outline:none; }.border-1{border:1px solid #EEE;}
                .p-1{ padding: 2px; }.p-2{ padding: 4px; }.p-3{ padding: 8px; }.p-4{ padding: 16px; }.p-5{ padding: 32px; }
                .ps-1{ padding-left: 2px; }.ps-2{ padding-left: 4px; }.ps-3{ padding-left: 8px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                .pe-1{ padding-right: 2px; }.pe-2{ padding-right: 4px; }.pe-3{ padding-right: 8px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                .justify-content-start{ justify-content: start; }.justify-content-center{ justify-content: center; }.justify-content-end{ justify-content: end; }
                .hover-red:hover{ background-color:#F00; }.hover-gray:hover{ background-color:#DDD !important; }
                .fw-500{font-weight: 500;}
                .btn-sm{display: flex; align-items:center; justify-content: center; padding: 0 5px; border: none; outline:1px solid #888;}
                .modal-backdrop{ width: 100vw; height: 100vh; position: fixed; top:0; left:0; padding:0; margin: 0; display:flex; align-items:center; justify-content:center; z-index: 1000; }
                .modal-container{ width: 40rem; height: 30rem; border:1px solid #ededed; box-shadow: 1px 3px 6px 0 #DDD; display:flex;flex-direction: column; }
                .modal-section{ border-bottom:1px solid #DDD; }
                .modal-section-header{ padding: 6px 10px; }
                .overflow{ overflow:auto; }
                .disable-element{ pointer-events: none !important; opacity: .5 !important; }

                /* ========== 1 Section */
                #container{ display: grid; grid-template-columns: 40% 60%; }
                #search_container, #description_container{ display: flex; padding:0 4px;}
                #input_search_container, #input_description_container{ padding: 4px 8px; width: 100%; }

                /* ========== 2 Section */
                #table_tables_container2{width:100%;border-spacing: 0;}
                th,td{ border: 1px solid #DDD; }
                th{text-align:start;}
                #body_tables_container2{text-wrap: nowrap;}
                .row_table{cursor: default;}
                .row_table:hover{background-color:#F5F5F5;color:#000;}
                .row_selected{background-color:#3D75DD !important;color:#FFF !important;}

                @media screen and (max-width:600px) {
                    #search_container2{width: 100%;}
                }

                .induxsoft-form-control{border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem !important;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] {background-color: #e9ecef;opacity: 1;
                }
                .induxsoft-buttons{font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .induxsoft-buttons:hover{color: #212529;background-color: #F5F5F5;
                }
                .induxsoft-form-select {display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem !important;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                }

                ` + (this.getAttribute('control-styles') ?? '') + `
                
            </style>
        `;

        InputKey._ikInstances.add(this);   // IK-1
        this.shadow.appendChild(container);
        this.shadow.appendChild(this.container2);
        this.shadow.appendChild(container3);
        this.shadow.appendChild(container4);
        
        if (this._parseBool((this.getAttribute('hidden-input')??''), true)) this.after(this.inputv);
        this._ik2Botones = { searchBtn: button_search_container, addBtn: button_add_container, editBtn: button_edit_container, clearBtn: button_clear_container, x3: close_header_container3, title3: title_header_container3 };
        this._ik2Iniciar();   // InputKey 2: tema, panel anclado, headless (sin atributos nuevos no hace nada)

        if (this.hasAttribute('data-value'))
        {
            try{
                var data_value=JSON.parse(this.getAttribute('data-value')??'{}');
                if(data_value)
                {
                    let initvalue = this.setObjectMinus(data_value);
                    this.setValue(initvalue);
                }
                
            }catch{
                this._ik2Avisar('El valor del atributo "data-value" tiene un formato JSON inválido', 'campo');
            }
        }
    }
    /**
     * @param {string} tagName Nombre de etiqueta.
     * @param {object} attributes Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}
     * @returns Retorna un **nuevo elemento HTML**
     */
    createFullElement(tagName="div", attributes={}, innerHTML="")
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        if (innerHTML) elem.innerHTML = innerHTML;
        return elem;
    }
    /**
     * Pinta la información en la tabla de búsqueda.
     * @returns retorna el elemento ***tbody*** de la tabla
     */
    printTableData()
    {
        if (this._ik2Lista) return this._ik2PintarLista();   // InputKey 2 (A6): ventana con tema
        const cj = this._ik2Columnas();                       // InputKey 2 (B8): columns en JSON
        if (cj) return this._ik2PintarLegado(cj);
        this.body_tables_container2.innerHTML = ``;
        this.head_tables_container2.innerHTML = ``;

        if (!this.data || this.data.length <= 0)
        { 
            this.body_tables_container2.innerHTML = `<p class="p-3 text-secondary">${(this.getAttribute('box-nodata-text')??'Sin registros')}</p>`; 
            return;
        }

        const titles = (this.colcaptions ? this.colcaptions.split(',') : Object.keys(this.data[0]));
        const fields = (this.columns ? this.columns.split(',') : Object.keys(this.data[0]));

        while (fields.length > titles.length && fields.length <= Object.keys(this.data[0]).length)
            titles[titles.length] = fields[titles.length];

        while (titles.length > fields.length && titles.length <= Object.keys(this.data[0]).length)
            fields[fields.length] = Object.keys(this.data[0])[fields.length];
            
        const tr_tables_container2 = this.createFullElement('tr', {id:'tr_tables_container2'});
        
        titles.forEach(title => 
        {
            const t = this.createFullElement('th',{class:'fw-500 border-1 p-2 ps-3 pe-3'});
            t.textContent = title.trim();
            tr_tables_container2.appendChild(t);
        });
        
        this.head_tables_container2.appendChild(tr_tables_container2);

        this.data.forEach((dt, i) => 
        {
            const row_tables_conatiner2 = this.createFullElement('tr',{class:'row_table', value:`${dt[(this.getAttribute('data-key')??'').toLowerCase()]}`, tabindex:`0`});
            row_tables_conatiner2.addEventListener('click', (e) => 
            {
                e.stopPropagation();
                this.findValue(e.target.parentNode.getAttribute('value'));
                e.target.parentNode.parentNode.childNodes.forEach(child => child.classList.remove('row_selected'));
                e.target.parentNode.classList.add('row_selected');
            });
            row_tables_conatiner2.addEventListener('dblclick', () => {
                this.accept_footer_container2.click();
            });
            row_tables_conatiner2.addEventListener('keyup', (e) => 
            {
                switch(e.key)
                {
                    case "ArrowRight":
                    case "ArrowDown":
                        if(e.target.nextElementSibling)e.target.nextElementSibling.focus();
                        else if(this.body_tables_container2.firstChild) this.body_tables_container2.firstChild.focus();
                        break;
                    case "ArrowLeft":
                    case "ArrowUp":
                        if(e.target.previousElementSibling)e.target.previousElementSibling.focus();
                        else if(this.body_tables_container2.lastChild) this.body_tables_container2.lastChild.focus();
                        break;
                    case "Enter":
                        this.accept_footer_container2.click();
                        break;
                }
            });
            row_tables_conatiner2.addEventListener('focus', (e) => 
            {
                e.stopPropagation();
                this.findValue(e.target.getAttribute('value'));
                e.target.parentNode.childNodes.forEach(child => child.classList.remove('row_selected'));
                e.target.classList.add('row_selected');
            });
            fields.forEach(field => 
            {
                const cell = this.createFullElement('td',{class:'border-1 p-1 ps-2 pe-2'});
                cell.textContent = dt[field.trim()];
                row_tables_conatiner2.appendChild(cell);
            });
            this.body_tables_container2.appendChild(row_tables_conatiner2);
        });

        return this.body_tables_container2;
    }
    /**
     * Establece el objeto de datos a partir de un identificador con el cual se realizará la búsqueda de similitudes.
     * @param {string} id Cadena con el valor a buscar.
     * @returns retorna un objeto **promise** al que se le puede adjuntar un *callback* de retorno.
     */
    setDataSource(id="",search="")
    {
        this.data = null;
        // IK-5 (2026-11-02): una búsqueda nueva cancela la anterior (AbortController) y la respuesta que no es de la
        // última búsqueda se descarta (su promesa no se resuelve). Antes, con #Requesting activo, se ignoraba la NUEVA.
        const seq = ++this.#searchSeq;
        if (this.#abort) { try { this.#abort.abort(); } catch {} this.#abort = null; }
        this.#Requesting = false;
        let url = this.getAttribute('data-source');
        // InputKey 2 (B2): BeforeSearch puede cambiar el texto o cancelar la búsqueda (la promesa no se resuelve).
        const bs = this._ik2AntesDeBuscar((search ?? '').toString());
        if (bs === null) return new Promise(() => {});
        search = bs;
        this._ik2Error = null;
        this.#lastSearch = (search ?? '').toString();   // IK-3
        // IK-4: se conserva el envío en minúsculas (compatibilidad). InputKey 2 (B16): search-case="keep" lo manda tal cual.
        if (!this._ik2Conservar()) search=search.toLowerCase();
        return new Promise(resolve => {
            if (url && search.trim() != "")
            {
                // IK-4: el texto va codificado (antes iba crudo y '&', '#', '+' o '%' armaban mal la URL).
                let surl = url.replace('@search', () => encodeURIComponent(search));
                if (this.onBeforeSearch) {
                    surl = this.onBeforeSearch(surl);
                }

                const ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
                this.#abort = ctrl;
                this.#Requesting = true;
                const vigente = () => (seq === this.#searchSeq);
                // InputKey 2 (B15): tiempo máximo (request-timeout; con tema, 30 s por omisión; sin tema, solo si se pide).
                const tmax = ctrl ? this._ik2Timeout() : 0;
                let vencida = false;
                const reloj = tmax > 0 ? setTimeout(() => { vencida = true; try { ctrl.abort(); } catch { } }, tmax) : null;
                this._ik2Buscando(true);
                this.request(surl, (dataSuccess) => {
                    if (!vigente()) return;   // IK-5: respuesta vieja
                    if (reloj) clearTimeout(reloj);
                    this.#abort = null;
                    this._ik2Buscando(false);
                    this.data = this.setObjectListMinus(dataSuccess);
                    this.findValue(id);
                    this._ik2Disparar('SearchCompleted', { text: this.#lastSearch, count: (this.data ?? []).length });
                    resolve();
                    this.#Requesting = false;
                }, (dataFail) => {
                    if (!vigente()) return;   // IK-5: también la cancelada por AbortController
                    if (reloj) clearTimeout(reloj);
                    this.#abort = null;
                    this._ik2Buscando(false);
                    const msg = vencida ? this._ik2T('timeout') : dataFail;
                    this._ik2Disparar('SearchError', { text: this.#lastSearch, error: msg, timeout: vencida });
                    if (this._ik2Lista || this._ik2PopupTema()) { this._ik2Error = { text: this.#lastSearch, message: String(msg ?? '') }; resolve(); }
                    else
                    {
                        resolve();
                        alert(this._ik2T('serviceError') + "\n\n" + msg);
                    }
                    this.#Requesting = false;
                }, ctrl ? ctrl.signal : undefined);
            }
            else if(this.hasAttribute('data-source-array') && this.getAttribute('data-source-array').trim() != '')
            {
                try{ this.data = this.setObjectListMinus(JSON.parse(this.getAttribute('data-source-array'))); }
                catch{
                    const m = 'El valor del atributo "data-source-array" tiene un formato JSON inválido';
                    if (this._ik2PopupTema()) { this._ik2Error = { text: this.#lastSearch, message: m }; console.warn('InputKey: ' + m); }
                    else alert(m);
                }
                // IK-6 (2026-11-02): la llave del registro aceptado antes (key-value) solo filtra si no hay texto o si el
                // texto ES esa llave (carga por valor). Antes filtraba siempre: tras elegir un registro, cualquier búsqueda
                // nueva (searchText("%") del menú de acciones de V12, o un texto distinto) devolvía solo ese registro.
                if (id && this.data && (!search || search.toLowerCase() === id.toLowerCase())){
                    this.data = this.data.filter(data => (data[(this.getAttribute('data-key')??'').toLowerCase()] === id.toLowerCase()));
                }
                else if (search && this.data){
                    const cs = this._ik2Conservar();   // InputKey 2 (B16)
                    this.data = this.data.filter(data => (cs ? String(data[(this.getAttribute('data-search')??'').toLowerCase()] ?? '').includes(search) : data[(this.getAttribute('data-search')??'').toLowerCase()].includes(search.toLowerCase())) || search=='%');
                }
                this.findValue(id);
                this._ik2Disparar('SearchCompleted', { text: this.#lastSearch, count: (this.data ?? []).length });
                resolve();
            }
            else
            {
                resolve();
            }
        });
    }
    /**
     * Convierte los campos de los objetos de la lista a minúsculas.
     * @param {Array} list 
     * @returns Retorna una copia de la lista de objetos con campos convertidos a minúsculas
     */
    setObjectListMinus(list)
    {
        if (!list) return [];

        let newList = [];
        list.forEach(obj => {
            newList.push(this.setObjectMinus(obj));
        });
        return newList;
    }
    /**
     * Convierte los campos del objeto a minúsculas.
     * @param {Object} obj 
     * @returns Retorna una copia del objeto con campos convertidos a minúsculas
     */
    setObjectMinus(obj)
    {
        let newObj = {};
        Object.keys(obj).forEach(key => {
            newObj[key.toLowerCase()] = obj[key];
        });
        return newObj;
    }
    /**
     * @param {string} id Cadena con el valor a buscar.
     * @returns Retorna un **elemento** dentro del objeto de datos que coincida con el valor especificado establecido en la propiedad searchData y el identificador proporcionado.
     */
    findValue(id)
    {
        if (this.data && this.data.length > 0) {
            this.record_selected = this.data.find(d => (d[(this.getAttribute('data-key')??'').toString().toLowerCase()]??'').toString().toLowerCase() == id.toLowerCase());
            // console.log("key")
        }
        if (Object.keys(this.record_selected??{}).length == 0) {
            this.record_selected = (this.data ?? []).find(d => (d[(this.getAttribute('data-search')??'').toString().toLowerCase()]??'').toString().toLowerCase() == id.toLowerCase());
            // console.log("search")
        }
        // console.log(this.record_selected)

        return this.record_selected;
    }
    /**
     * @returns Retorna el **objeto** seleccionado en la tabla de datos.
     */
    getValue()
    {
        return this.accept_data;
    }
    /**
     * Establece el valor del control.
     * @param {object} value Objeto a establecer
     */
    setValue(value={})
    {
        this.accept_data = value;
        this._ikPaintValue();

        if (this.change_event)
            this.change_event(value);
    }
    /**
     * Muestra this.accept_data en los controles sin disparar change_event (IK-2: lo usa también el cierre sin selección).
     */
    _ikPaintValue()
    {
        if(!this.accept_data || Object.entries(this.accept_data).length <= 0)
        {
            this.input_search_container.value = '';
            this.input_description_container.value = '';
            this.setAttribute('value', '');
            this.inputv.setAttribute('value', '');
        }
        else
        {
            this.accept_data = this.setObjectMinus(this.accept_data);
            this.input_search_container.value = (this.accept_data[(this.getAttribute('data-search')??'').toLowerCase()]??'');
            this.input_search_container.setAttribute("key-value",(this.accept_data[(this.getAttribute('data-key')??'').toLowerCase()]??''));
            this.input_description_container.value = (this.accept_data[(this.getAttribute('data-text')??'').toLowerCase()]??'');
            this.setAttribute('value', this.accept_data[(this.getAttribute('data-key')??'').toLowerCase()]??'');
            this.inputv.setAttribute('value', this.accept_data[(this.getAttribute('data-key')??'').toLowerCase()]??'');
        }
        this._ik2AlPintarValor();   // InputKey 2: estado vacío / con valor, validez y ancho del código
    }
    /**
     * Limpia la información del objeto seleccionado y los controles del componente.
     */
    clear()
    {
        this.accept_data = null;
        this.record_selected = null;
        this.setValue(null);
    }
    /**
     * Abre la tabla de busqueda
     * @param {HTMLElement} this.container2 Referencia del contenedor principal de la tabla de búsqueda
     * @param {Boolean} autoselect Define la selección automática de un elemento al lanzarse la búsqueda y encontrarse una sola coincidencia.
     */
    search(container2, autoselect=false)
    {
        // IK-3 (2026-11-02): selección automática = autoselect pedido + atributo autoselect distinto de "false" + UN solo
        // resultado + el texto buscado es IGUAL (sin distinguir mayúsculas ni espacios en los extremos) a uno de los
        // campos de _ikAutoselectFields(). Antes se comparaba contra la llave del registro aceptado la vez anterior
        // (key-value): un código nuevo abría la lista y una coincidencia parcial del mismo registro entraba sola.
        const unico = (this.data && this.data.length == 1) ? this.data[0] : null;
        // InputKey 2 (B13): autoselect="exact" también elige entre varios resultados si UNO solo es exacto.
        const asel = this._ik2ModoAutoselect();
        let elegido = (autoselect && asel && unico && this._ikExactMatch(unico, this.#lastSearch)) ? unico : null;
        if (!elegido && autoselect && asel === 'exact' && this.data && this.data.length > 1)
        {
            const ex = this.data.filter(r => this._ikExactMatch(r, this.#lastSearch));
            if (ex.length === 1) elegido = ex[0];
        }
        if (elegido)
        {
            this.record_selected = elegido;
            this.#opener = null;
            this.setValue(this.record_selected);
            this._ik2Elegido(this.accept_data);   // InputKey 2
        }
        else if (this._ik2EstrictoSinResultados(autoselect))
        {
            // InputKey 2 (B10): strict con tema y sin resultados: no abre la ventana vacía; el campo queda inválido.
            this.#opener = null;
        }
        else
        {
            // IK-1: si lo que tenía el foco al pedir la búsqueda ya no existe (p. ej. el editor de la celda, que EdiTable
            // quita al confirmar), se toma lo que tiene el foco ahora, justo antes de abrir la ventana.
            if (this.container2.classList.contains('hide-element') && (!this.#opener || !this.#opener.isConnected))
                this.#opener = InputKey._ikDeepActive();
            this._ik2PrepararVentana(this.#opener);   // InputKey 2: tema de la ventana (A2) y modo (A5)
            this.printTableData();
            this._ik2Mostrar();                       // antes: this.container2.classList.remove('hide-element')
            InputKey._ikSyncListeners();   // IK-1
            if(!this.data || this.data.length <= 0)
            {
                this.input_search_container2.select();
                this.input_search_container2.focus();
            }
            else
            {
                this.body_tables_container2.childNodes[0].focus();
            }
        }
    }
    /**
     * Lanza la búsqueda de un elemento.
     * @param {HTMLElement} this.container2 Referencia del contenedor principal de la tabla de búsqueda.
     */
    searchButton(container2)
    {
        if (this.input_search_container2.value.trim() == ""){
            this._ik2Avisar(this._ik2T('mustType'), 'ventana');
            this.input_search_container2.focus();
            return;
        }

        let kv = this.input_search_container2.getAttribute("key-value") || "";
        let sv = this.input_search_container2.value || "";
        this.setDataSource(kv,sv).then(()=>{
            this.search(container2, false);
        });
    }
    /**
     * Sincroniza el valor del campo de búsqueda del primer control del componente con el campo de búsqueda de la tabla de datos.
     */
    setDataInputSearch2()
    {
        this.input_search_container2.value = this.input_search_container.value;
        this.input_search_container2.setAttribute("key-value",this.input_search_container.getAttribute("key-value")||"");
        this.input_search_container2.select();
        this.input_search_container2.focus();
    }
    /**
     * Sobrescribe el escuchador de eventos del componente con el definido por el usuario.
     * @param {string} ename Nombre del evento.
     * @param {object} func Función a disparar con el evento.
     */
    addEventListener(ename, func)
    {
        switch(ename)
        {
            case 'change':
                this.change_event = func;
                break;
            // InputKey 2 (B2): eventos nuevos, como casos explícitos. Cualquier otro nombre se sigue descartando.
            case 'Selected':
            case 'Canceled':
            case 'BeforeSearch':
            case 'SearchCompleted':
            case 'SearchError':
            case 'Opened':
            case 'Closed':
                this._ik2Oyentes(ename).add(func);
                break;
        }
    }
    /** InputKey 2: quita un oyente de los eventos nuevos. Para los demás nombres hace lo de siempre (el nativo). */
    removeEventListener(ename, func, opts)
    {
        if (InputKey._ik2Eventos.includes(ename)) { this._ik2Oyentes(ename).delete(func); return; }
        super.removeEventListener(ename, func, opts);
    }
    /**
     * Procesa la URL proporcionada para remplazar las claves que contenga con los valores del control.
     * @param {string} url URL a procesar.
     * @returns Retorna la nueva URL
     */
    prepareUrl(url)
    {
        return url.replace('@search',this.input_search_container.value)
            .replace('@key',this.getAttribute('value')??'')
            .replace('@text', this.input_description_container.value);
    }
    request(url, success, fail, signal)
    {
        const opts = {
            method: 'GET',
            mode: 'cors',
            headers:{
                'Access-Control-Allow-Origin':'*'
            }
        };
        if (signal) opts.signal = signal;   // IK-5
        fetch(url, opts).then(response =>
        {
            if (response.ok)
            {
                response.json().then(json => 
                {
                    success(json);
                }).catch(error => fail(error.message??error));
            }
            else{
                response.json().then(json => 
                    {
                        fail(json.message ??json);
                    }).catch(error=>
                    {
                        fail(error.message??error)
                    });
                // fail("El servicio respondió con un estado unválido");
            }
        })
        .catch(error => 
        {
            fail(error.message);
        })
    }
    _search(autoselect=true)
    {
        let kv = this.input_search_container.getAttribute("key-value") || "";
        let sv = this.input_search_container.value || "";
        this._ikRememberOpener();   // IK-1

        if (autoselect)
        {
            this.setDataSource(kv,sv).then(()=>{
                this.input_search_container2.value = this.input_search_container.value;
                this.input_search_container2.setAttribute("key-value",this.input_search_container.getAttribute("key-value")||"");
                this.search(this.container2, true);
            });
        }
        else
        {
            this.setDataSource(kv,sv).then(()=>{
                this.setDataInputSearch2();
                this.search(this.container2, false);
            });
        }
    }
    searchText(text,autoselect=true)
    {
        this.input_search_container.value = text;
        this._search(autoselect);
    }
    // ===== Correcciones IK-1 a IK-3 (2026-11-02)
    /**
     * IK-3: campos que se comparan con el texto buscado para la selección automática (llaves en minúsculas).
     * Atributo autoselect-fields="campo1,campo2": lista explícita. Sin él: data-key, data-search y los campos del
     * registro con nombre de código de barras (codbar*, cod_bar*, codigo_barras*, barcode*, ean*, upc*, gtin*).
     */
    _ikAutoselectFields(rec)
    {
        const attr = this.getAttribute('autoselect-fields');
        if (attr !== null && attr.trim() !== '')
            return attr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        const f = [(this.getAttribute('data-key') ?? ''), (this.getAttribute('data-search') ?? '')].map(s => s.toLowerCase()).filter(Boolean);
        Object.keys(rec ?? {}).forEach(k => { if (/^(codbar|cod_bar|codigo_?barras|barcode|ean|upc|gtin)/i.test(k) && !f.includes(k)) f.push(k); });
        return f;
    }
    /** IK-3: true si el texto es igual (sin mayúsculas ni espacios en los extremos) a uno de los campos del registro. */
    _ikExactMatch(rec, text)
    {
        const t = (text ?? '').toString().trim().toLowerCase();
        if (!rec || t === '') return false;
        return this._ikAutoselectFields(rec).some(k => {
            const v = rec[k];
            return v !== undefined && v !== null && v.toString().trim().toLowerCase() === t;
        });
    }
    /** IK-1: recuerda qué tenía el foco al abrir la búsqueda (solo si la ventana está cerrada). */
    _ikRememberOpener()
    {
        if (!this.container2 || !this.container2.classList.contains('hide-element')) return;
        this.#opener = InputKey._ikDeepActive();
        this._ik2Celda = this._ik2CeldaDe(this.#opener) ?? InputKey._ik2CeldaReciente();   // InputKey 2 (A5): celda que abrió la búsqueda
    }
    /** IK-1 e IK-2: cierra la ventana sin selección (Esc, «Cancelar» o la X): no dispara change_event. */
    _ikCancel()
    {
        const texto2 = this.input_search_container2 ? this.input_search_container2.value : '';
        if (this.IsOpen) this._ik2Disparar('Canceled', { text: texto2 });   // InputKey 2 (B2): antes de Closed, como Selected
        this._ik2Ocultar();   // antes: this.container2.classList.add('hide-element')
        InputKey._ikSyncListeners();
        // Los controles vuelven a mostrar el registro aceptado, sin evento. Sin registro aceptado solo se borra el texto
        // buscado (los atributos value quedan como estaban).
        if (this.accept_data && Object.keys(this.accept_data).length > 0) this._ikPaintValue();
        else { this.input_search_container.value = ''; this.input_description_container.value = ''; }
        const o = this.#opener;
        this.#opener = null;
        // Si el foco vuelve al buscador propio, el siguiente blur sin teclear nada no debe buscar ni limpiar (eso
        // dispararía change_event). Se guarda el texto: si el usuario lo cambia, el blur funciona como siempre.
        this.#skipBlur = (o === this.input_search_container) ? this.input_search_container.value : null;
        if (o && o.isConnected && typeof o.focus === 'function')
        {
            try { o.focus({ preventScroll: true }); } catch { }
        }
        this._ik2Resolver(null);   // InputKey 2: pick() → null
    }
    /** Elemento con el foco, entrando a los shadow (abiertos, el de EdiTable por _shadow y el de InputKey por shadow). */
    static _ikDeepActive()
    {
        let a = document.activeElement;
        for (let i = 0; a && i < 10; i++)
        {
            const r = a.shadowRoot || a._shadow || ((a instanceof InputKey) ? a.shadow : null);
            if (!r || !r.activeElement) break;
            a = r.activeElement;
        }
        return (a && a !== document.body && a !== document.documentElement) ? a : null;
    }
    static _ikInstances = new Set();
    static _ikEscPending = false;
    static _ikListening = false;
    /**
     * IK-1: los listeners de Esc (captura de window, que corre antes que cualquier listener de document) solo están
     * puestos mientras hay una ventana de búsqueda abierta o falta el keyup del Esc que la cerró.
     */
    static _ikSyncListeners()
    {
        let abierta = false;
        InputKey._ikInstances.forEach(x => { if (x.isConnected && x.container2 && !x.container2.classList.contains('hide-element')) abierta = true; });
        const quiero = abierta || InputKey._ikEscPending;
        if (quiero === InputKey._ikListening) return;
        InputKey._ikListening = quiero;
        const f = quiero ? 'addEventListener' : 'removeEventListener';
        window[f]('keydown', InputKey._ikOnWindowKey, true);
        window[f]('keyup', InputKey._ikOnWindowKey, true);
    }
    /**
     * IK-1: con la ventana de búsqueda abierta, Esc la cierra y se CONSUME (preventDefault + stopImmediatePropagation en
     * la captura de window, la primera fase), así que ningún listener del documento recibe ese keydown ni su keyup.
     */
    static _ikOnWindowKey(e)
    {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        if (e.type === 'keyup')
        {
            if (InputKey._ikEscPending)
            {
                InputKey._ikEscPending = false;
                e.preventDefault();
                e.stopImmediatePropagation();
                InputKey._ikSyncListeners();
            }
            return;
        }
        if (e.repeat && InputKey._ikEscPending)
        {
            // Esc sostenido después de cerrar: la repetición tampoco llega al documento.
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        let ik = null;
        InputKey._ikInstances.forEach(x => {
            if (!x.isConnected) { InputKey._ikInstances.delete(x); return; }
            if (x.container2 && !x.container2.classList.contains('hide-element')) ik = x;
        });
        if (!ik) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        InputKey._ikEscPending = true;
        ik._ikCancel();
    }
    // ===== fin IK-1 a IK-3
    _parseBool=(value, _default = false)=>
    {
        if (value) return (value.toString().toLowerCase() === 'true');
        return _default;
    }
    _createOtherButtons()
    {
        this.buttonElements = [];
        if (this.getAttribute('buttons') != '')
        {
            let buttonList = [];
            try { buttonList = JSON.parse(this.getAttribute('buttons')); }
            catch{ alert('El valor del atributo "buttons" tiene un formato JSON inválido'); }

            buttonList.forEach((obj,i) => {
                const btn = {
                    type:'button', 
                    class:'induxsoft-buttons',
                    id: (obj.id ?? 'btn_ik_'+i)
                }
                this.buttonElements.push(this.createFullElement('button', btn, (obj.content??'')));
            });
        }
    }
    _setOtherButtonsEvents(button)
    {
        const externalBtn = this.createFullElement('button', { type:'button', style:"display:none !important;", id:button.id });
        this.after(externalBtn);
        button.onclick = e => externalBtn.click();
    }
    // =====================================================================================================
    // ===== InputKey 2 (2026-11-02). Todo se activa con atributos nuevos; sin ellos, el control es el de hoy.
    //  - Apariencia (A1-A4, A6, A8-A11): solo con tema, del atributo `theme` o heredado por `data-et-theme`
    //    mediante el módulo común window.InduxsoftTheme; la ventana también toma el tema de la EdiTable que la abre (A2).
    //  - Funcional: headless, open/close/pick/load (B1), eventos (B2), popup="modal|anchored|auto" (A5), teclado con
    //    keydown (B7, con tema), columns en JSON (B8), strict y validez (B10), request-timeout y «Reintentar» (B15),
    //    search-case (B16), autoselect="exact" (B13).
    //  - Pendiente (no implementado): live-search, page-size, cache-seconds, recent-items, DataSource como función,
    //    alta y edición que devuelven el registro, multi-select, columna lookup de EdiTable (B3-B6, B9, B11-B14).
    // =====================================================================================================
    static version = '2.0.0-alpha.1';
    static features = ['theme', 'palette', 'density', 'popup', 'headless', 'pick', 'events', 'columns-json', 'strict', 'request-timeout', 'search-case', 'autoselect-exact', 'key-chars'];
    static _ik2Eventos = ['Selected', 'Canceled', 'BeforeSearch', 'SearchCompleted', 'SearchError', 'Opened', 'Closed'];
    static _ik2Atributos = ['theme', 'palette', 'density', 'popup', 'headless', 'key-min-chars', 'key-max-chars', 'texts', 'strict', 'disabled', 'required', 'size', 'control-styles'];

    /** A11: textos de la interfaz. Se pueden traducir aquí (global) o por control con el atributo texts (JSON). */
    static texts = {
        title: 'Seleccione un Registro', search: 'Buscar', searchPlaceholder: 'Buscar...', noData: 'Sin registros',
        accept: 'Aceptar', cancel: 'Cancelar', add: 'Agregar', edit: 'Editar', clear: 'Limpiar', close: 'Cerrar',
        addTitle: 'Agregar registro', editTitle: 'Editar registro',
        mustSelect: 'Debe seleccionar un registro para continuar', mustSelectEdit: 'Debe seleccionar un registro para continuar.',
        mustType: 'Debe especificar el texto a buscar para continuar', serviceError: 'Ocurrió un error al invocar el servicio.',
        keyPlaceholder: 'Código', keyLabel: 'Código', descLabel: 'Descripción', noValue: 'Sin seleccionar',
        results: '{n} resultados', oneResult: '1 resultado', noMatches: 'Sin coincidencias para «{text}»', typeToSearch: 'Escribe para buscar',
        create: 'Crear «{text}»', retry: 'Reintentar', timeout: 'La búsqueda tardó demasiado y se canceló.',
        notFound: 'No existe un registro con «{text}».', required: 'Este campo es obligatorio.', loading: 'Cargando…', searching: 'Buscando…',
        listLabel: 'Resultados de la búsqueda'
    };

    // A9: densidad (alto del campo, relleno, alto de fila de la lista, tamaño de letra).
    static _ik2Densidades = {
        compacta: { h: '28px', pad: '3px 8px', row: '26px', fs: '13px' },
        normal: { h: '34px', pad: '6px 10px', row: '32px', fs: '14px' },
        comoda: { h: '42px', pad: '9px 12px', row: '40px', fs: '15px' }
    };
    static _ik2Iconos = {
        buscar: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.74 10.33a6 6 0 1 0-1.41 1.41l3.85 3.85a1 1 0 0 0 1.41-1.41l-3.85-3.85ZM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"/></svg>',
        vacio: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.74 10.33a6 6 0 1 0-1.41 1.41l3.85 3.85a1 1 0 0 0 1.41-1.41l-3.85-3.85ZM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0Z"/></svg>',
        aviso: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8.98 1.56a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>'
    };

    // ---- Estado de InputKey 2 (prefijo _ik2: no choca con nada de hoy)
    _ik2Ini = false;          // _ik2Iniciar ya corrió
    _ik2Campo = false;        // el campo (#container) lleva la apariencia nueva
    _ik2Lista = false;        // la ventana (#container2) lleva la apariencia nueva (incluye A2)
    _ik2Ev = null;            // oyentes de los eventos nuevos
    _ik2Pick = null;          // resolver de pick() pendiente
    _ik2Ancla = null;         // anchor pedido en open()/pick()
    _ik2Celda = null;         // td que abrió la búsqueda (EdiTable)
    _ik2TablaOrigen = null;   // edit-table que abrió la búsqueda (A2)
    _ik2Modo = 'modal';       // modo de la ventana abierta: modal, anchored, sheet
    _ik2Error = null;         // {text, message} del último error (B15, con tema)
    _ik2Estilo = null;        // <style data-ik="2">
    _ik2Mo = null;            // MutationObserver de los atributos nuevos
    _ik2Sub = null;           // callback registrado en InduxsoftTheme.subscribe
    _ik2TemaProp = undefined; // Theme por propiedad (gana al atributo)
    _ik2PaletaProp = undefined;
    _ik2DensProp = undefined;
    _ik2Activa = -1;          // fila activa de la lista con tema
    _ik2Reubicar = null;      // listener de scroll/resize con el panel anclado
    _ik2Icono = null;         // innerHTML original del botón «…»
    _ik2Invalido = '';        // mensaje de validez propio (strict, required)

    // ---- Textos (A11)
    _ik2T(k)
    {
        if (this._ik2TextosCache === undefined)
        {
            this._ik2TextosCache = null;
            const t = this.getAttribute('texts');
            if (t) { try { const o = JSON.parse(t); if (o && typeof o === 'object') this._ik2TextosCache = o; } catch { console.warn('InputKey: el atributo texts no es un JSON válido; se ignora.'); } }
        }
        const v = (this._ik2TextosCache && this._ik2TextosCache[k] != null) ? this._ik2TextosCache[k] : InputKey.texts[k];
        return v == null ? '' : String(v);
    }
    get Texts() { return Object.assign({}, InputKey.texts, this._ik2TextosCache ?? {}); }
    set Texts(v) { if (v == null) this.removeAttribute('texts'); else this.setAttribute('texts', typeof v === 'string' ? v : JSON.stringify(v)); }

    // ---- Propiedades (Pascal, como EdiTable)
    get Theme() { return this._ik2TemaPropio() || (this._ik2Estado().theme ?? ''); }
    set Theme(v) { this._ik2TemaProp = (v === undefined ? undefined : v == null ? '' : String(v)); this._ik2Aplicar(); }
    get Palette() { const p = this._ik2PaletaPropia(); return p ? { ...p } : null; }
    set Palette(v) { this._ik2PaletaProp = (v === undefined ? undefined : v == null ? null : InputKey._ik2LimpiarPaleta(v, 'Palette')); this._ik2Aplicar(); }
    SetPalette(obj, opciones = {})
    {
        const nueva = (obj == null ? null : InputKey._ik2LimpiarPaleta(obj, 'SetPalette'));
        this._ik2PaletaProp = (opciones?.merge && nueva) ? { ...(this._ik2PaletaPropia() ?? {}), ...nueva } : nueva;
        this._ik2Aplicar();
        return this.Palette;
    }
    get Density() { return this._ik2Estado().density || 'normal'; }
    set Density(v) { this._ik2DensProp = (v === undefined ? undefined : String(v ?? '')); this._ik2Aplicar(); }
    get Popup() { const v = (this.getAttribute('popup') ?? '').trim().toLowerCase(); return (v === 'anchored' || v === 'auto') ? v : 'modal'; }
    set Popup(v) { if (v == null || v === '') this.removeAttribute('popup'); else this.setAttribute('popup', String(v)); }
    get Headless() { return this._ik2Bool(this.getAttribute('headless')); }
    set Headless(v) { if (v == null) this.removeAttribute('headless'); else this.setAttribute('headless', String(!!v && String(v) !== 'false')); }
    get KeyMinChars() { return this._ik2Num('key-min-chars', 15, 1); }
    set KeyMinChars(v) { if (v == null) this.removeAttribute('key-min-chars'); else this.setAttribute('key-min-chars', String(v)); }
    get KeyMaxChars() { return Math.max(this.KeyMinChars, this._ik2Num('key-max-chars', 32, 1)); }
    set KeyMaxChars(v) { if (v == null) this.removeAttribute('key-max-chars'); else this.setAttribute('key-max-chars', String(v)); }
    get Strict() { return this._ik2Bool(this.getAttribute('strict')); }
    set Strict(v) { if (v == null) this.removeAttribute('strict'); else this.setAttribute('strict', String(!!v && String(v) !== 'false')); }
    get TabAccepts() { return this._ik2Bool(this.getAttribute('tab-accepts')); }
    set TabAccepts(v) { if (v == null) this.removeAttribute('tab-accepts'); else this.setAttribute('tab-accepts', String(!!v && String(v) !== 'false')); }
    get Autoselect() { const m = this._ik2ModoAutoselect(); return m === 'exact' ? 'exact' : !!m; }
    set Autoselect(v) { if (v == null) this.removeAttribute('autoselect'); else this.setAttribute('autoselect', String(v)); }
    get AutoselectFields() { return (this.getAttribute('autoselect-fields') ?? '').split(',').map(s => s.trim()).filter(Boolean); }
    set AutoselectFields(v) { if (v == null) this.removeAttribute('autoselect-fields'); else this.setAttribute('autoselect-fields', Array.isArray(v) ? v.join(',') : String(v)); }
    get RequestTimeout() { return this._ik2Timeout(); }
    set RequestTimeout(v) { if (v == null) this.removeAttribute('request-timeout'); else this.setAttribute('request-timeout', String(v)); }
    get SearchCase() { return this._ik2Conservar() ? 'keep' : 'lower'; }
    set SearchCase(v) { if (v == null) this.removeAttribute('search-case'); else this.setAttribute('search-case', String(v)); }
    /** true si la ventana o el panel de resultados está abierto. */
    get IsOpen() { return !!(this.container2 && !this.container2.classList.contains('hide-element')); }

    _ik2Bool(v) { const s = String(v ?? '').trim().toLowerCase(); return s !== '' && s !== 'false' && s !== '0' && s !== 'no'; }
    _ik2Num(attr, def, min) { const n = parseInt(this.getAttribute(attr) ?? '', 10); return Number.isFinite(n) && n >= min ? n : def; }
    _ik2Conservar() { return (this.getAttribute('search-case') ?? '').trim().toLowerCase() === 'keep'; }
    /** IK-3 y B13: false (nunca), true (un solo resultado exacto, como hoy) o 'exact' (también entre varios). */
    _ik2ModoAutoselect()
    {
        const v = this.getAttribute('autoselect');
        if (v != null && v.toString().trim().toLowerCase() === 'exact') return 'exact';
        return this._parseBool(v, true);
    }
    /** B15: ms de request-timeout; con tema 30000 por omisión; sin tema y sin atributo, 0 (sin límite, como hoy). */
    _ik2Timeout()
    {
        const a = this.getAttribute('request-timeout');
        if (a != null && a.trim() !== '') { const n = Number(a); return Number.isFinite(n) && n > 0 ? n : 0; }
        return (this._ik2Campo || this._ik2Lista || this._ik2PopupTema()) ? 30000 : 0;
    }

    // ---- Tema: resolución (A1, A2). Precedencia: respaldo < tema (propio, o heredado por el módulo, o de la tabla
    // que abre la ventana) < variables --et-* externas < palette.
    static _ik2Modulo() { const m = (typeof window !== 'undefined') ? window.InduxsoftTheme : null; return (m && typeof m.resolve === 'function') ? m : null; }
    /** Nombre normalizado con el módulo común (alias light/dark…; none/ninguno/false = sin tema). */
    static _ik2Nombre(v)
    {
        const m = InputKey._ik2Modulo();
        if (m && typeof m.normalize === 'function') return m.normalize(v) || '';
        const s = String(v ?? '').trim().toLowerCase();
        return (!s || s === 'none' || s === 'ninguno' || s === 'false') ? '' : s;
    }
    /** Paleta resuelta de un tema registrado en el módulo común (InduxsoftTheme.theme), o null. */
    static _ik2Paleta(nombre)
    {
        const n = InputKey._ik2Nombre(nombre), m = InputKey._ik2Modulo();
        if (!n || n === 'auto' || !m || typeof m.theme !== 'function') return null;
        try { return m.theme(n); } catch { return null; }
    }
    static _ik2LimpiarPaleta(p, donde)
    {
        const m = InputKey._ik2Modulo();
        if (m && typeof m.parsePalette === 'function') { try { return m.parsePalette(p, 'InputKey ' + donde) ?? {}; } catch { return {}; } }
        return {};
    }
    /** El componente declara theme (atributo o propiedad), aunque sea vacío: entonces gana al heredado. */
    _ik2TemaDeclarado() { return this._ik2TemaProp !== undefined || this.hasAttribute('theme'); }
    _ik2TemaPropio()
    {
        const v = this._ik2TemaProp !== undefined ? this._ik2TemaProp : this.getAttribute('theme');
        const n = InputKey._ik2Nombre(v);
        if (n && n !== 'auto' && !InputKey._ik2Paleta(n)) { if (this._ik2Avisado !== n) { this._ik2Avisado = n; console.warn('InputKey: tema desconocido: ' + n); } return ''; }
        return n;
    }
    _ik2PaletaPropia()
    {
        if (this._ik2PaletaProp !== undefined) return this._ik2PaletaProp && Object.keys(this._ik2PaletaProp).length ? this._ik2PaletaProp : null;
        const a = this.getAttribute('palette');
        if (a == null) return null;
        const p = InputKey._ik2LimpiarPaleta(a, 'palette');
        return Object.keys(p).length ? p : null;
    }
    static _ik2Densidad(v)
    {
        const m = InputKey._ik2Modulo();
        const d = (m && typeof m.normalizeDensity === 'function') ? m.normalizeDensity(v) : String(v ?? '').trim().toLowerCase();
        return InputKey._ik2Densidades[d] ? d : '';
    }
    /**
     * Tema del campo (spec del módulo §4 y §8): cada atributo propio (theme, palette, density), aunque sea vacío, gana
     * a su equivalente heredado por data-et-* (InduxsoftTheme.resolve). {theme, palette, density, origen}
     */
    _ik2Estado()
    {
        const m = InputKey._ik2Modulo();
        let r = null;
        const hace = () => { if (r === null) { r = {}; if (m) { try { r = m.resolve(this) || {}; } catch (e) { console.warn('InputKey: InduxsoftTheme.resolve falló', e); } } } return r; };
        let theme, origen;
        if (this._ik2TemaDeclarado()) { theme = this._ik2TemaPropio(); origen = theme ? 'propio' : ''; }
        else
        {
            const n = InputKey._ik2Nombre(hace().theme);
            theme = (n === 'auto' || InputKey._ik2Paleta(n)) ? n : '';
            origen = theme ? (hace().source || 'pagina') : '';
        }
        let palette;
        if (this._ik2PaletaProp !== undefined || this.hasAttribute('palette')) palette = this._ik2PaletaPropia();
        else { const p = hace().palette; palette = (p && typeof p === 'object' && Object.keys(p).length) ? p : null; }
        let density;
        if (this._ik2DensProp !== undefined || this.hasAttribute('density')) density = InputKey._ik2Densidad(this._ik2DensProp !== undefined ? this._ik2DensProp : this.getAttribute('density'));
        else density = InputKey._ik2Densidad(hace().density);
        return { theme, palette, density, origen };
    }
    /** Edit-table que contiene al elemento (cruzando shadows), o null. */
    static _ik2TablaDe(el)
    {
        for (let n = el, i = 0; n && i < 40; i++)
        {
            if (n.nodeType === 1 && n.localName === 'edit-table') return n;
            n = n.parentNode || (n.nodeType === 11 ? n.host : null);
        }
        return null;
    }
    /** A2: tema de la ventana. Si el InputKey no tiene tema (propio ni heredado), toma el de la tabla que lo abrió. */
    _ik2ResolverPopup(opener)
    {
        const e = this._ik2Estado();
        if (e.theme) return e;
        const t = InputKey._ik2TablaDe(opener ?? null);
        if (!t) return e;
        let th = ''; try { th = InputKey._ik2Nombre(t.Theme); } catch { }
        if (!th || (th !== 'auto' && !InputKey._ik2Paleta(th))) return e;
        let pal = e.palette, den = e.density;
        try { if (!pal && t.Palette) pal = InputKey._ik2LimpiarPaleta(t.Palette, 'EditTable.Palette'); } catch { }
        try { if (!den && t.Density && t.Density !== 'normal') den = InputKey._ik2Densidad(t.Density); } catch { }
        return { theme: th, palette: pal, density: den, origen: 'tabla', tabla: t };
    }
    _ik2PopupTema() { return !!this._ik2ResolverPopup(this.#opener).theme; }

    // ---- Ciclo de vida
    _ik2Conectado()
    {
        // IK-7 (2026-11-02): la construcción tardía ya es general (_ixConstruirAlCargar en connectedCallback); antes solo
        // se construía tarde con theme, popup o headless. Aquí queda lo de reconectar uno ya construido.
        if (this.shadow) { this._ik2Suscribir(); this._ik2Aplicar(); }
    }
    _ik2Desconectado()
    {
        if (typeof this._ik2Sub === 'function') { try { this._ik2Sub(); } catch { } }   // subscribe devuelve la baja
        this._ik2Sub = null;
        this._ik2QuitarReubicar();
    }
    _ik2Suscribir()
    {
        const m = InputKey._ik2Modulo();
        if (!m || this._ik2Sub || typeof m.subscribe !== 'function') return;
        try { const baja = m.subscribe(this, () => this._ik2Aplicar()); this._ik2Sub = typeof baja === 'function' ? baja : null; } catch (e) { this._ik2Sub = null; }
    }
    /** Construye el control si aún no existe (open, pick y load lo usan). */
    _ik2Asegurar() { if (!this.shadow || !this.container2) this.CreateShadow(); }
    _ik2Iniciar()
    {
        this._ik2Ini = true;
        this._ik2Icono = null;
        this._ik2Estilo = null;
        this._ik2TextosCache = undefined;
        const s = this.shadow;
        this._ik2El = {
            container: s.getElementById('container'), desc: s.getElementById('input_description_container'),
            panel: s.getElementById('search_container2'), header2: s.getElementById('header_section_container2'),
            close2: s.getElementById('close_header_container2'), searchSec: s.getElementById('search_section_container2'),
            tablesSec: s.getElementById('tables_section_container2'), cancel2: s.getElementById('close2_container2'),
            c3: s.getElementById('container3'), c4: s.getElementById('container4'),
            title4: s.getElementById('title_container4'), x4: s.getElementById('close_header_container4'),
            ...this._ik2Botones
        };
        this._ik2El.footer = this._ik2El.panel ? this._ik2El.panel.lastElementChild : null;
        this._ik2El.search2Btn = this._ik2El.searchSec ? this._ik2El.searchSec.querySelector('button') : null;
        this._ik2Oidos = {};
        if (!this._ik2Mo)
        {
            this._ik2Mo = new MutationObserver((ms) => {
                if (ms.some(m => m.attributeName === 'texts')) this._ik2TextosCache = undefined;
                this._ik2Aplicar();
            });
            this._ik2Mo.observe(this, { attributes: true, attributeFilter: InputKey._ik2Atributos });
        }
        this._ik2Suscribir();
        this._ik2Aplicar();
    }

    // ---- Aplicar tema y modo (en caliente: clases, atributos ARIA y el <style data-ik="2">; no redibuja datos).
    _ik2Aplicar()
    {
        if (!this._ik2Ini || !this.shadow) return;
        const e = this._ik2Estado();
        const campo = !!e.theme;
        // Con la ventana abierta se conserva su tema (puede venir de la tabla, A2); cerrada sigue al del campo.
        const pe = this._ik2PopEstado ?? e;   // _ik2PopEstado existe de _ik2PrepararVentana a _ik2Ocultar
        const lista = !!pe.theme;
        this._ik2Campo = campo;
        this._ik2Lista = lista;
        this._ik2Escuchar(campo, lista, this.Popup !== 'modal');
        this._ik2PintarCampo(campo);
        for (const el of [this.container2, this._ik2El.c3, this._ik2El.c4]) if (el) el.classList.toggle('ik2', lista);
        if (this._ik2El.title3) this._ik2El.title3.textContent = lista ? this._ik2T('addTitle') : (this.getAttribute('box-title-text') ?? this._ik2T('addTitle'));
        if (this._ik2El.title4) this._ik2El.title4.textContent = lista ? this._ik2T('editTitle') : (this.getAttribute('box-title-text') ?? this._ik2T('editTitle'));
        this._ik2PintarVentanaFija(lista);
        const css = this._ik2Css(campo ? e : null, lista ? pe : null);
        if (!css) { if (this._ik2Estilo) { this._ik2Estilo.remove(); this._ik2Estilo = null; } }
        else
        {
            if (!this._ik2Estilo || !this._ik2Estilo.isConnected)
            {
                this._ik2Estilo = document.createElement('style');
                this._ik2Estilo.setAttribute('data-ik', '2');
                this.shadow.prepend(this._ik2Estilo);   // antes de la hoja de hoy: control-styles le gana en empates
            }
            if (this._ik2Estilo.textContent !== css) this._ik2Estilo.textContent = css;
        }
        this._ik2AlPintarValor();
        if (campo) { this._ik2AnchoVisto = 0; this._ik2Angosto(); }
    }
    _ik2PopEstadoActual() { return this._ik2PopEstado ?? this._ik2Estado(); }
    /** Listeners de InputKey 2: se ponen solo cuando hacen falta (sin atributos nuevos no se agrega ninguno). */
    _ik2Escuchar(campo, lista, popup)
    {
        const o = this._ik2Oidos;
        if (campo && !o.campo)
        {
            o.campo = true;
            // Pantallas angostas: si no caben el código mínimo, ~12 caracteres de descripción y los botones, la
            // descripción baja a un segundo renglón (los botones se quedan junto al código).
            if (typeof ResizeObserver === 'function') new ResizeObserver(() => this._ik2Angosto()).observe(this._ik2El.container);
            this.input_search_container.addEventListener('keydown', (e) => this._ik2TeclaCampo(e));   // B7
            this.input_search_container.addEventListener('input', () => this._ik2AlTeclearCampo());
        }
        if (lista && !o.lista) { o.lista = true; this.input_search_container2.addEventListener('keydown', (e) => this._ik2TeclaBuscador(e)); }
        if (popup && !o.popup)
        {
            o.popup = true;
            InputKey._ik2VigilarCeldas();
            // Panel anclado u hoja: clic fuera del panel (sobre el fondo) cierra sin selección.
            this.container2.addEventListener('mousedown', (e) => { if (e.target === this.container2 && this._ik2Modo !== 'modal' && this.IsOpen) { e.preventDefault(); this._ikCancel(); } });
        }
    }

    /** Campo con tema (A3, A4, A10) o como hoy. */
    _ik2PintarCampo(on)
    {
        const E = this._ik2El, c = E.container;
        if (!c) return;
        c.classList.toggle('ik2', on);
        const i = this.input_search_container, d = this.input_description_container;
        if (on)
        {
            if (this._ik2Icono === null) this._ik2Icono = E.searchBtn.innerHTML;
            E.searchBtn.innerHTML = InputKey._ik2Iconos.buscar;
            i.setAttribute('role', 'combobox'); i.setAttribute('aria-autocomplete', 'list'); i.setAttribute('aria-haspopup', 'grid');
            i.setAttribute('aria-controls', 'table_tables_container2'); i.setAttribute('aria-expanded', String(this.IsOpen));
            i.setAttribute('aria-label', this._ik2T('keyLabel')); i.setAttribute('placeholder', this._ik2T('keyPlaceholder')); i.setAttribute('autocomplete', 'off');
            d.setAttribute('aria-label', this._ik2T('descLabel')); d.setAttribute('placeholder', this._ik2T('noValue')); d.tabIndex = -1;
            E.searchBtn.setAttribute('aria-label', this._ik2T('search')); E.clearBtn.setAttribute('aria-label', this._ik2T('clear'));
            E.addBtn.setAttribute('aria-label', this._ik2T('add')); E.editBtn.setAttribute('aria-label', this._ik2T('edit'));
            if (!this.hasAttribute('aria-describedby')) i.setAttribute('aria-describedby', 'ik2_msg');
        }
        else if (this._ik2Icono !== null)
        {
            E.searchBtn.innerHTML = this._ik2Icono; this._ik2Icono = null;
            ['role', 'aria-autocomplete', 'aria-haspopup', 'aria-controls', 'aria-expanded', 'aria-label', 'placeholder', 'autocomplete', 'aria-describedby'].forEach(a => i.removeAttribute(a));
            ['aria-label', 'placeholder', 'tabindex'].forEach(a => d.removeAttribute(a));
            [E.searchBtn, E.clearBtn, E.addBtn, E.editBtn].forEach(b => b.removeAttribute('aria-label'));
            c.classList.remove('ik2-vacio', 'ik2-invalido', 'ik2-requerido', 'ik2-buscando');
            const m = this.shadow.getElementById('ik2_msg'); if (m) m.remove();
        }
    }
    /** Partes fijas de la ventana con tema: contador (aria-live) y línea de estado del pie. Sin tema no existen. */
    _ik2PintarVentanaFija(on)
    {
        const E = this._ik2El, s = this.shadow;
        let cuenta = s.getElementById('ik2_cuenta'), estado = s.getElementById('ik2_estado');
        if (on)
        {
            if (!cuenta && E.searchSec) { cuenta = this.createFullElement('span', { id: 'ik2_cuenta', 'aria-live': 'polite' }); E.searchSec.appendChild(cuenta); }
            if (!estado && E.footer) { estado = this.createFullElement('span', { id: 'ik2_estado', role: 'status', 'aria-live': 'polite' }); E.footer.prepend(estado); }
            this.table_tables_container2.setAttribute('role', 'grid');
            this.table_tables_container2.setAttribute('aria-label', this._ik2T('listLabel'));
            this.input_search_container2.setAttribute('aria-controls', 'table_tables_container2');
            if (E.close2) E.close2.setAttribute('aria-label', this._ik2T('close'));
            if (E.x3) E.x3.setAttribute('aria-label', this._ik2T('close'));
            if (E.x4) E.x4.setAttribute('aria-label', this._ik2T('close'));
            this.container2.setAttribute('role', 'dialog');
            if (E.panel) E.panel.setAttribute('aria-labelledby', 'title_container2');
        }
        else
        {
            if (cuenta) cuenta.remove();
            if (estado) estado.remove();
            if (this.table_tables_container2.hasAttribute('role'))
            {
                ['role', 'aria-label'].forEach(a => this.table_tables_container2.removeAttribute(a));
                ['aria-controls', 'aria-activedescendant'].forEach(a => this.input_search_container2.removeAttribute(a));
                [E.close2, E.x3, E.x4].forEach(b => b && b.removeAttribute('aria-label'));
                this.container2.removeAttribute('role');
                if (E.panel) E.panel.removeAttribute('aria-labelledby');
            }
        }
    }

    // ---- CSS (A1-A11). Variables: var(--et-x, var(--et-t-x, respaldo)), como EdiTable F8b. Solo existe con algo activo.
    static _ik2V(n, fb)
    {
        const t = `var(--et-t-${n}${fb != null ? ', ' + fb : ''})`;
        const m = InputKey._ik2Modulo();
        const p = m && m.parents ? (InputKey._ik2Padres ??= m.parents)[n] : null;
        return p ? `var(--et-${n}, var(--et-${p}, ${t}))` : `var(--et-${n}, ${t})`;
    }
    static _ik2VarsDe(pal)
    {
        if (!pal) return '';
        const m = InputKey._ik2Modulo();
        let s = (m && typeof m.cssVars === 'function') ? m.cssVars(pal, { prefix: '--et-t-' }) : '';
        // 'mono' es propia de InputKey (código del campo): libro-mayor la toma de su num-font monoespaciada.
        if (!pal.mono && /mono/i.test(pal['num-font'] ?? '')) s += ` --et-t-mono: ${pal['num-font']};`;
        if (pal['color-scheme']) s += ` --ik2-cs: ${pal['color-scheme']};`;
        return s;
    }
    _ik2Vars(e)
    {
        let s = '';
        if (e.theme === 'auto') s += `:host { ${InputKey._ik2VarsDe(InputKey._ik2Paleta('claro'))} }\n@media (prefers-color-scheme: dark) { :host { ${InputKey._ik2VarsDe(InputKey._ik2Paleta('oscuro'))} } }\n`;
        else if (e.theme) s += `:host { ${InputKey._ik2VarsDe(InputKey._ik2Paleta(e.theme))} }\n`;
        const d = InputKey._ik2Densidades[e.density || 'normal'];
        s += `:host { --ik-t-h: ${d.h}; --ik-t-pad: ${d.pad}; --ik-t-px: ${d.pad.split(' ')[1] ?? d.pad}; --ik-t-row: ${d.row}; --ik-t-fs: ${d.fs}; }\n`;
        if (e.palette) s += `:host { ${Object.entries(e.palette).map(([k, v]) => `--et-${k}: ${v} !important;`).join(' ')} }\n`;
        return s;
    }
    _ik2Css(campo, lista)
    {
        const headless = this.Headless, popup = this.Popup !== 'modal';
        if (!campo && !lista && !headless && !popup) return '';
        let s = '/* InputKey 2 */\n';
        if (campo || lista) s += this._ik2Vars(campo ?? lista);
        if (lista && campo && (lista.theme !== campo.theme || lista.density !== campo.density || lista.palette !== campo.palette))
            s += this._ik2Vars(lista).replace(/:host \{/g, '#container2, #container3, #container4 {');
        if (campo) s += InputKey._ik2CssCampo(this.KeyMinChars, this.KeyMaxChars) + (this._ik2Chico() ? InputKey._ik2CssChico() : '');
        if (lista) s += InputKey._ik2CssLista();
        if (popup) s += InputKey._ik2CssAnclado();
        if (headless) s += '#container{ display: none !important; }\n';
        return s;
    }
    static _ik2CssCampo(kmin, kmax)
    {
        const V = InputKey._ik2V;
        const mono = `var(--et-mono, var(--et-t-mono, ui-monospace, "Cascadia Mono", Consolas, monospace))`;
        const H = 'var(--ik-h, var(--ik-t-h))', PAD = 'var(--ik-pad, var(--ik-t-pad))', FS = 'var(--ik-fs, var(--ik-t-fs))';
        return `
#container.ik2{ display:flex; flex-wrap:wrap; align-items:stretch; min-height:${H}; background:${V('input-bg', '#fff')}; color:${V('input-fg', '#1F2328')}; border:1px solid ${V('input-border', '#8C959F')}; border-radius:${V('radius', '4px')}; overflow:hidden; font-family:${V('font', 'system-ui, sans-serif')}; font-size:${FS}; color-scheme:var(--ik2-cs, normal); transition:border-color .12s, box-shadow .12s; }
#container.ik2:focus-within{ border-color:${V('accent', '#2F66CC')}; box-shadow:0 0 0 3px color-mix(in srgb, ${V('focus-ring', '#2F66CC')} 30%, transparent); }
#container.ik2 #search_container, #container.ik2 #description_container{ display:contents; }
#container.ik2 #input_search_container{ --ik2-kmin: var(--ik-key-min, ${kmin}); --ik2-kmax: var(--ik-key-max, ${kmax}); --ik2-px: calc(2 * var(--ik-px, var(--ik-t-px, 10px))); order:1; field-sizing:content; box-sizing:border-box; min-width:calc(var(--ik2-kmin) * 1ch + var(--ik2-px)); max-width:calc(var(--ik2-kmax) * 1ch + var(--ik2-px)); width:calc(var(--ik2-kmin) * 1ch + var(--ik2-px)); flex:0 1 auto; border:0; outline:0; padding:${PAD} !important; background:transparent; color:inherit; font-family:${mono}; font-size:inherit; line-height:1.4; }
@supports (field-sizing: content){ #container.ik2 #input_search_container{ width:auto; } }
#container.ik2 #input_search_container::placeholder, #container.ik2 #input_description_container::placeholder{ color:${V('muted-fg', '#59636E')}; font-style:italic; opacity:1; }
#container.ik2 #input_description_container{ order:2; flex:1 1 0; min-width:0; box-sizing:border-box; border:0; outline:0; border-left:1px solid ${V('border', '#E1E5EA')}; background:transparent !important; padding:${PAD} !important; color:inherit; font-family:inherit; font-size:inherit; line-height:1.4; text-overflow:ellipsis; white-space:nowrap; cursor:default; }
#container.ik2 .induxsoft-buttons{ order:3; flex:0 0 auto; min-width:calc(${H} - 2px); border:0; outline:0; background:transparent; color:${V('muted-fg', '#59636E')}; display:grid; place-items:center; padding:0 6px; cursor:pointer; font-size:inherit; }
#container.ik2 .induxsoft-buttons:hover{ background:${V('hover-bg', '#EDF2F8')}; color:${V('fg', '#1F2328')}; }
#container.ik2 .induxsoft-buttons:focus-visible{ outline:2px solid ${V('accent', '#2F66CC')}; outline-offset:-2px; }
#container.ik2 .induxsoft-buttons svg{ width:14px; height:14px; }
#container.ik2 #input_search_container, #container.ik2 #input_description_container, #container.ik2 .induxsoft-buttons{ height:auto !important; font-size:inherit !important; }
#container.ik2 .induxsoft-buttons{ box-sizing:border-box; padding:0 6px !important; }
#container.ik2 #button_search_container{ order:9; color:${V('accent', '#2F66CC')}; border-left:1px solid ${V('border', '#E1E5EA')}; }
#container.ik2.ik2-vacio #button_clear_container{ display:none; }
#container.ik2.ik2-angosto #input_search_container{ flex:1 1 0; min-width:0; width:auto; }
#container.ik2.ik2-angosto #input_description_container{ order:20; flex:1 1 100%; border-left:0; border-top:1px solid ${V('border', '#E1E5EA')}; }
#container.ik2.disable-element{ background:${V('input-disabled-bg', '#EEF1F4')}; opacity:.6 !important; }
#container.ik2.ik2-requerido.ik2-vacio{ box-shadow:inset 3px 0 0 ${V('warn', '#8A5A00')}; }
#container.ik2.ik2-invalido{ border-color:${V('error', '#C62828')}; box-shadow:0 0 0 3px color-mix(in srgb, ${V('error', '#C62828')} 18%, transparent); }
#container.ik2.ik2-buscando #button_search_container svg{ display:none; }
#container.ik2.ik2-buscando #button_search_container::after, #container2.ik2.ik2-buscando #ik2_cuenta::before{ content:""; width:14px; height:14px; border:2px solid ${V('border', '#E1E5EA')}; border-top-color:${V('accent', '#2F66CC')}; border-radius:50%; animation:ik2-giro .7s linear infinite; display:inline-block; vertical-align:middle; }
@keyframes ik2-giro{ to{ transform:rotate(360deg); } }
#ik2_msg{ display:flex; gap:6px; align-items:center; margin-top:4px; font-size:12px; color:${V('error', '#C62828')}; font-family:${V('font', 'system-ui, sans-serif')}; }
#ik2_msg:empty{ display:none; }
`;
    }
    static _ik2CssLista()
    {
        const V = InputKey._ik2V;
        const ROW = 'var(--ik-row, var(--ik-t-row))', FS = 'var(--ik-fs, var(--ik-t-fs))';
        const mono = `var(--et-mono, var(--et-t-mono, ui-monospace, "Cascadia Mono", Consolas, monospace))`;
        const btn = `border:1px solid ${V('input-border', '#8C959F')}; outline:0; background:${V('bg', '#fff')}; color:${V('fg', '#1F2328')}; border-radius:${V('radius', '4px')}; padding:5px 12px; font-size:inherit; line-height:1.3; cursor:pointer;`;
        return `
.ik2{ color-scheme:var(--ik2-cs, normal); }
#container2.ik2, #container3.ik2, #container4.ik2{ background:rgba(15,20,25,.45); font-family:${V('font', 'system-ui, sans-serif')}; font-size:${FS}; color:${V('fg', '#1F2328')}; padding:16px; }
#container2.ik2 #search_container2, #container3.ik2 .modal-container, #container4.ik2 .modal-container{ width:min(46rem, 100%); height:min(32rem, 92vh); background:${V('bg', '#fff')} !important; color:${V('fg', '#1F2328')}; border:1px solid ${V('border', '#E1E5EA')}; border-radius:calc(${V('radius', '4px')} + 4px); box-shadow:0 24px 60px rgba(0,0,0,.3), 0 2px 6px rgba(0,0,0,.08); overflow:hidden; }
#container3.ik2 .modal-container, #container4.ik2 .modal-container{ width:min(60rem, 100%); height:min(40rem, 92vh); }
.ik2 .modal-section{ border-bottom:1px solid ${V('border', '#E1E5EA')}; }
.ik2 .modal-section-header{ padding:10px 14px; gap:10px; }
.ik2 .modal-section-header p{ color:${V('fg', '#1F2328')}; font-weight:600; font-size:15px; }
.ik2 .modal-section-header button{ width:30px; height:30px; display:grid; place-items:center; border:0; outline:0; padding:0; background:transparent; color:${V('fg', '#1F2328')}; border-radius:${V('radius', '4px')}; cursor:pointer; }
.ik2 .modal-section-header button svg{ fill:currentColor; }
.ik2 .modal-section-header button:hover{ background:${V('error-bg', '#FDECEC')}; color:${V('error', '#C62828')}; }
.ik2 .modal-section-header button:focus-visible{ outline:2px solid ${V('focus-ring', '#2F66CC')}; outline-offset:-2px; }
#container2.ik2 #search_section_container2{ padding:8px 10px; gap:8px; }
#container2.ik2 #search_section_container2 input{ ${btn} cursor:text; background:${V('input-bg', '#fff')}; color:${V('input-fg', '#1F2328')}; padding:6px 10px !important; }
#container2.ik2 #search_section_container2 input:focus{ border-color:${V('accent', '#2F66CC')}; box-shadow:0 0 0 3px color-mix(in srgb, ${V('focus-ring', '#2F66CC')} 30%, transparent); }
#container2.ik2 #search_section_container2 button{ ${btn} }
#ik2_cuenta{ font-size:12px; color:${V('muted-fg', '#59636E')}; white-space:nowrap; display:flex; gap:6px; align-items:center; }
#container2.ik2 #tables_section_container2{ border-bottom:0; min-height:0; }
#container2.ik2 #table_tables_container2{ border-collapse:separate; border-spacing:0; }
#container2.ik2 th, #container2.ik2 td{ border:0; outline:0; }
#container2.ik2 th{ position:sticky; top:0; z-index:1; background:${V('header-bg', '#F3F5F8')}; color:${V('header-fg', '#1F2328')}; font-weight:${V('header-weight', '600')}; font-size:12px; text-transform:${V('header-transform', 'none')}; letter-spacing:${V('header-spacing', 'normal')}; padding:6px 10px !important; border-bottom:1px solid ${V('header-border', '#D0D7DE')}; white-space:nowrap; }
#container2.ik2 td{ padding:0 10px !important; height:${ROW}; border-bottom:1px solid color-mix(in srgb, ${V('border', '#E1E5EA')} 60%, transparent); white-space:nowrap; }
#container2.ik2 tbody tr{ cursor:pointer; background:transparent; color:inherit; }
#container2.ik2 tbody tr:focus{ outline:none; }
#container2.ik2 tbody tr:nth-child(even) > td{ background:${V('row-alt-bg', '#F8FAFC')}; }
#container2.ik2 tbody tr.row_table:hover > td{ background:${V('hover-bg', '#EDF2F8')}; color:${V('fg', '#1F2328')}; }
#container2.ik2 tbody tr.row_selected, #container2.ik2 tbody tr.row_selected:hover{ background:transparent !important; }
#container2.ik2 tbody tr.row_selected > td{ background:${V('sel-bg', '#2F66CC')} !important; color:${V('sel-fg', '#fff')} !important; }
#container2.ik2 tbody tr.row_selected:focus-visible > td:first-child{ box-shadow:inset 3px 0 0 ${V('focus-ring', '#2F66CC')}; }
#container2.ik2 mark{ background:${V('mark-bg', '#FFF1A8')}; color:${V('mark-fg', '#1F2328')}; border-radius:2px; padding:0 1px; }
#container2.ik2 tr.row_selected mark{ background:transparent; color:inherit; text-decoration:underline; text-underline-offset:2px; }
#container2.ik2 .ik2-num{ text-align:end; font-variant-numeric:tabular-nums; font-family:${V('num-font', 'inherit')}; }
#container2.ik2 .ik2-cod{ font-family:${mono}; }
#container2.ik2 td.ik2-aviso{ height:auto; padding:22px 16px !important; text-align:center; color:${V('muted-fg', '#59636E')}; white-space:normal; cursor:default; background:transparent !important; }
#container2.ik2 td.ik2-aviso .ik2-aviso-in{ display:grid; gap:10px; justify-items:center; }
#container2.ik2 td.ik2-aviso svg{ opacity:.6; }
#container2.ik2 td.ik2-aviso.ik2-error{ color:${V('error', '#C62828')}; }
#container2.ik2 td.ik2-aviso button{ ${btn} }
#container2.ik2 #search_container2 > .modal-section:last-child{ background:${V('header-bg', '#F3F5F8')} !important; border-top:1px solid ${V('border', '#E1E5EA')}; border-bottom:0; padding:7px 10px; gap:8px; }
#container2.ik2 #search_container2 > .modal-section:last-child button{ ${btn} }
#container2.ik2 #search_container2 > .modal-section:last-child button:first-of-type{ background:${V('accent', '#2F66CC')}; border-color:${V('accent', '#2F66CC')}; color:${V('sel-fg', '#fff')}; }
.ik2 button:focus-visible{ outline:2px solid ${V('focus-ring', '#2F66CC')}; outline-offset:1px; }
#ik2_estado{ margin-right:auto; font-size:12px; color:${V('muted-fg', '#59636E')}; display:flex; gap:6px; align-items:center; }
#ik2_estado.ik2-error{ color:${V('error', '#C62828')}; }
.ik2 .modal-section.ik2-cargando{ position:relative; }
.ik2 .modal-section.ik2-cargando::after{ content:attr(data-ik2-cargando); position:absolute; inset:0; display:grid; place-items:center; background:${V('bg', '#fff')}; color:${V('muted-fg', '#59636E')}; font-size:13px; }
.ik2 iframe{ border:0; display:block; }
`;
    }
    /**
     * Tamaño chico del campo (alto 28px, relleno 3px 8px, letra 13px): size="sm", o la hoja de V12 que fija el alto de
     * los ids internos por control-styles (ik_sm_style y equivalentes). Solo con tema; sin tema el campo queda como hoy.
     */
    _ik2Chico()
    {
        if (String(this.getAttribute('size') ?? '').trim().toLowerCase() === 'sm') return true;
        const cs = this.getAttribute('control-styles') ?? '';
        return /#input_search_container[^{}]*\{[^}]*\bheight\s*:/i.test(cs);
    }
    static _ik2CssChico() { return '#container.ik2{ --ik-t-h: 28px; --ik-t-pad: 3px 8px; --ik-t-px: 8px; --ik-t-fs: 13px; }\n'; }
    static _ik2CssAnclado()
    {
        return `
#container2.ik2-anclado, #container2.ik2-hoja{ background:transparent; padding:0; }
#container2.ik2-anclado{ display:block; }
#container2.ik2-anclado #search_container2{ position:fixed; width:max-content; min-width:var(--ik2-ancho, 20rem); max-width:min(720px, calc(100vw - 16px)); height:auto; max-height:var(--ik2-alto, 420px); }
#container2.ik2-anclado #header_section_container2{ display:none; }
#container2.ik2-anclado #tables_section_container2{ flex:1 1 auto; min-height:0; }
#container2.ik2-hoja{ align-items:flex-end; background:rgba(15,20,25,.45); }
#container2.ik2-hoja #search_container2{ width:100%; height:auto; max-height:88vh; border-radius:14px 14px 0 0; }
`;
    }

    // ---- Eventos (B2). Se llama a los oyentes registrados con addEventListener y además se despacha un CustomEvent
    // (bubbles, composed) para quien escuche en un ancestro.
    _ik2Oyentes(n) { if (!this._ik2Ev) this._ik2Ev = {}; return (this._ik2Ev[n] ??= new Set()); }
    _ik2Disparar(nombre, detalle, cancelable = false)
    {
        const lst = this._ik2Ev?.[nombre];
        const ev = new CustomEvent(nombre, { detail: detalle, bubbles: true, composed: true, cancelable });
        if (lst) for (const f of Array.from(lst)) { try { f.call(this, ev); } catch (e) { console.error(e); } }
        try { this.dispatchEvent(ev); } catch { }
        return ev;
    }
    /** B2: BeforeSearch. Devuelve el texto (quizá cambiado) o null si se canceló. */
    _ik2AntesDeBuscar(texto)
    {
        const ev = this._ik2Disparar('BeforeSearch', { text: texto, cancel: false }, true);
        if (!ev) return texto;
        if (ev.defaultPrevented || ev.detail.cancel) { this._ik2Resolver(null); return null; }
        return (ev.detail.text ?? '').toString();
    }
    _ik2Resolver(r) { const f = this._ik2Pick; this._ik2Pick = null; if (f) f(r); }
    _ik2Elegido(rec)
    {
        const r = rec ? { ...rec } : null;
        this._ik2Invalido = '';
        this._ik2Disparar('Selected', { record: r });
        this._ik2Resolver(r);
    }

    // ---- Ventana: preparar, mostrar, ocultar, anclar (A2, A5)
    _ik2PrepararVentana(opener)
    {
        if (!this._ik2Ini || this.IsOpen) return;
        const pe = this._ik2ResolverPopup(opener);
        this._ik2PopEstado = pe;
        this._ik2Abridor = (opener && opener.getRootNode && opener.getRootNode() !== this.shadow) ? opener : null;
        this._ik2TablaOrigen = pe.tabla ?? InputKey._ik2TablaDe(opener ?? null);
        // Modo: modal (hoy), anchored o auto (anclado en pantalla ancha; hoja inferior en pantallas angostas).
        const p = this.Popup;
        let modo = 'modal';
        if (p === 'anchored') modo = 'anchored';
        else if (p === 'auto') modo = (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) ? 'sheet' : 'anchored';
        if (modo === 'anchored' && !this._ik2RectAncla()) modo = (p === 'auto') ? 'modal' : 'modal';
        this._ik2Modo = modo;
        this._ik2Aplicar();
    }
    _ik2Mostrar()
    {
        const abria = this.container2.classList.contains('hide-element');
        this.container2.classList.toggle('ik2-anclado', this._ik2Modo === 'anchored');
        this.container2.classList.toggle('ik2-hoja', this._ik2Modo === 'sheet');
        this.container2.classList.remove('hide-element');
        if (this._ik2Campo) this.input_search_container.setAttribute('aria-expanded', 'true');
        if (this._ik2Modo === 'anchored') { this._ik2Posicionar(); this._ik2PonerReubicar(); }
        if (abria) this._ik2Disparar('Opened', { popup: this._ik2Modo });
    }
    _ik2Ocultar()
    {
        const abierta = !this.container2.classList.contains('hide-element');
        this.container2.classList.add('hide-element');
        if (!this._ik2Ini) return;
        this._ik2QuitarReubicar();
        this.container2.classList.remove('ik2-anclado', 'ik2-hoja');
        if (this._ik2El.panel) ['left', 'top', 'max-height', '--ik2-ancho', '--ik2-alto'].forEach(p => this._ik2El.panel.style.removeProperty(p));
        const modo = this._ik2Modo;
        this._ik2Modo = 'modal';
        this._ik2Ancla = null;
        this._ik2Abridor = null;
        this._ik2PopEstado = null;
        this._ik2Activa = -1;
        const est = this.shadow.getElementById('ik2_estado'); if (est) { est.textContent = ''; est.classList.remove('ik2-error'); }
        if (this._ik2Campo) this.input_search_container.setAttribute('aria-expanded', 'false');
        this._ik2Aplicar();   // la ventana vuelve al tema del campo (A2 era solo mientras estaba abierta)
        if (abierta) this._ik2Disparar('Closed', { popup: modo });
    }
    /** Con tema, al aceptar: si el foco se perdió (quedó en body o dentro de la ventana), vuelve al que abrió. */
    _ik2DevolverFoco(o)
    {
        if (!this._ik2Lista && !this._ik2Campo) return;
        if (this._ik2EnterAceptado) { this._ik2EnterAceptado = false; InputKey._ik2TragarKeyup(this._ik2TeclaAceptar || 'Enter'); }
        queueMicrotask(() => {
            const a = InputKey._ikDeepActive();
            const perdido = !a || (a.getRootNode && a.getRootNode() === this.shadow && this.container2.contains(a));
            if (perdido && o && o.isConnected && typeof o.focus === 'function') { try { o.focus({ preventScroll: true }); } catch { } }
        });
    }
    /**
     * A5: EdiTable confirma la celda con Enter DESPUÉS de mover el foco a la celda siguiente y quitar el editor, así
     * que al llegar searchText ya no se sabe qué celda abrió la búsqueda. Con algún InputKey con popup anclado, un
     * listener en la captura de window (corre antes que EdiTable) recuerda la celda que tenía el foco en cada keydown
     * o pointerdown. Sin popup="anchored|auto" en la página no se pone.
     */
    static _ik2VigilarCeldas()
    {
        if (InputKey._ik2Vigila) return;
        InputKey._ik2Vigila = true;
        const rec = (e) => {
            const a = e.type === 'pointerdown' ? (e.composedPath ? e.composedPath()[0] : e.target) : InputKey._ikDeepActive();
            const td = a && a.closest ? a.closest('td') : null;
            if (td && InputKey._ik2TablaDe(td)) InputKey._ik2UltimaCelda = { td, tabla: td.closest('table'), fila: td.parentElement ? td.parentElement.sectionRowIndex : -1, col: td.cellIndex, t: Date.now() };
        };
        window.addEventListener('keydown', rec, true);
        window.addEventListener('pointerdown', rec, true);
    }
    static _ik2CeldaReciente()
    {
        const c = InputKey._ik2UltimaCelda;
        return (c && Date.now() - c.t < 2000) ? c : null;
    }
    /** td de EdiTable (u otra tabla) que contiene al elemento; se recuerda tabla, fila y columna por si se redibuja. */
    _ik2CeldaDe(el)
    {
        const td = el && el.closest ? el.closest('td') : null;
        if (!td) return null;
        const tr = td.parentElement, tabla = td.closest('table');
        return { td, tabla, fila: tr ? tr.sectionRowIndex : -1, col: td.cellIndex };
    }
    _ik2ElementoAncla()
    {
        const a = this._ik2Ancla;
        if (a && a.isConnected) return a;
        const c = this._ik2Celda;
        if (c)
        {
            if (c.td.isConnected) return c.td;
            if (c.tabla && c.tabla.isConnected && c.fila >= 0) { const td = c.tabla.tBodies[0]?.rows[c.fila]?.cells[c.col]; if (td) return td; }
        }
        const cont = this._ik2El.container;
        if (cont && cont.getClientRects().length) return cont;
        // Campo oculto y fuera de una tabla (p. ej. el menú de acciones de la barra de V12): el elemento que abrió.
        const ab = this._ik2Abridor;
        if (ab && ab.isConnected && ab.getClientRects().length) return ab;
        return null;
    }
    _ik2RectAncla()
    {
        const el = this._ik2ElementoAncla();
        if (el) { const r = el.getBoundingClientRect(); if (r.width > 0 || r.height > 0) { this._ik2UltimoRect = r; return r; } }
        return (this._ik2Ancla || this._ik2Celda) ? (this._ik2UltimoRect ?? null) : null;
    }
    _ik2Posicionar()
    {
        const p = this._ik2El.panel;
        const a = this._ik2RectAncla();
        if (!p || !a) return;
        const vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight;
        p.style.setProperty('--ik2-ancho', Math.max(Math.round(a.width), 240) + 'px');
        const abajo = vh - a.bottom - 8, arriba = a.top - 8;
        p.style.setProperty('--ik2-alto', '420px');
        let r = p.getBoundingClientRect();
        const h = Math.min(r.height, 420);
        let top;
        if (h <= abajo || abajo >= arriba) { const m = Math.max(140, Math.min(420, abajo - 4)); p.style.setProperty('--ik2-alto', m + 'px'); top = a.bottom + 4; }
        else { const m = Math.max(140, Math.min(420, arriba - 4)); p.style.setProperty('--ik2-alto', m + 'px'); r = p.getBoundingClientRect(); top = a.top - 4 - Math.min(r.height, m); }
        r = p.getBoundingClientRect();
        const left = Math.max(8, Math.min(a.left, vw - r.width - 8));
        p.style.left = Math.round(left) + 'px';
        p.style.top = Math.round(Math.max(4, top)) + 'px';
    }
    _ik2PonerReubicar()
    {
        if (this._ik2Reubicar) return;
        let pend = false;
        this._ik2Reubicar = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; if (this.IsOpen && this._ik2Modo === 'anchored') this._ik2Posicionar(); }); };
        window.addEventListener('scroll', this._ik2Reubicar, true);
        window.addEventListener('resize', this._ik2Reubicar);
    }
    _ik2QuitarReubicar()
    {
        if (!this._ik2Reubicar) return;
        window.removeEventListener('scroll', this._ik2Reubicar, true);
        window.removeEventListener('resize', this._ik2Reubicar);
        this._ik2Reubicar = null;
    }
    /** Traga el keyup de la tecla que aceptó con keydown, para que no llegue al elemento que recibe el foco. */
    static _ik2TragarKeyup(tecla)
    {
        const f = (e) => { if (e.key !== tecla) return; e.preventDefault(); e.stopImmediatePropagation(); quitar(); };
        const quitar = () => { window.removeEventListener('keyup', f, true); clearTimeout(t); };
        const t = setTimeout(quitar, 1500);
        window.addEventListener('keyup', f, true);
    }

    // ---- Mensajes en línea (A4, B15). Sin tema se conservan los alert de hoy.
    _ik2Avisar(msg, donde)
    {
        if (donde === 'ventana' && this._ik2Lista)
        {
            const e = this.shadow.getElementById('ik2_estado');
            if (e) { e.classList.add('ik2-error'); e.innerHTML = InputKey._ik2Iconos.aviso; e.append(document.createTextNode(msg)); return; }
        }
        if (donde === 'campo' && this._ik2Campo) { this._ik2MensajeCampo(msg); console.warn('InputKey: ' + msg); return; }
        alert(msg);
    }
    _ik2MensajeCampo(msg)
    {
        let m = this.shadow.getElementById('ik2_msg');
        if (!msg) { if (m) m.textContent = ''; return; }
        if (!m) { m = this.createFullElement('div', { id: 'ik2_msg', role: 'alert' }); this._ik2El.container.after(m); }
        m.innerHTML = InputKey._ik2Iconos.aviso;
        m.append(document.createTextNode(msg));
    }
    _ik2Buscando(b)
    {
        if (!this._ik2Ini) return;
        if (this._ik2Campo) this._ik2El.container.classList.toggle('ik2-buscando', b);
        if (this._ik2Lista) { this.container2.classList.toggle('ik2-buscando', b); this.table_tables_container2.setAttribute('aria-busy', String(b)); }
    }
    _ik2Cargando(seccion, iframe)
    {
        if (!this._ik2Lista) return;
        seccion.classList.add('ik2-cargando');
        seccion.setAttribute('data-ik2-cargando', this._ik2T('loading'));
        iframe.addEventListener('load', () => seccion.classList.remove('ik2-cargando'), { once: true });
    }

    // ---- Estado del campo después de pintar el valor (A4, B10) y ancho del código (respaldo sin field-sizing)
    _ik2AlPintarValor()
    {
        if (!this._ik2Ini || !this._ik2Campo) { this._ik2Validez(); return; }
        const c = this._ik2El.container;
        const vacio = !this.accept_data || Object.keys(this.accept_data).length === 0;
        c.classList.toggle('ik2-vacio', vacio && !this.input_search_container.value);
        c.classList.toggle('ik2-requerido', (this.getAttribute('required') ?? 'false') === 'true');
        this._ik2Validez();
        this._ik2AjustarAncho();
    }
    _ik2Angosto()
    {
        const c = this._ik2El.container;
        if (!this._ik2Campo || !c.isConnected) return;
        const w = c.clientWidth;
        if (!w || w === this._ik2AnchoVisto) return;   // solo cambios de ancho (el alto cambia al bajar la descripción)
        this._ik2AnchoVisto = w;
        const i = this.input_search_container, cs = getComputedStyle(i);
        const cv = InputKey._ik2Canvas ??= document.createElement('canvas').getContext('2d');
        cv.font = cs.fontSize + ' ' + cs.fontFamily;
        const ch = cv.measureText('0').width || 8;
        const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        const botones = Array.from(c.querySelectorAll('.induxsoft-buttons')).reduce((t, b) => t + (b.offsetWidth || 0), 0);
        const necesita = this.KeyMinChars * ch + pad + 12 * ch + pad + botones;
        c.classList.toggle('ik2-angosto', w < necesita);
    }
    _ik2AlTeclearCampo()
    {
        if (!this._ik2Campo) return;
        if (this._ik2Invalido) { this._ik2Invalido = ''; this._ik2Validez(); }
        this._ik2AjustarAncho();
    }
    static _ik2FieldSizing = (typeof CSS !== 'undefined' && CSS.supports) ? CSS.supports('field-sizing', 'content') : false;
    _ik2AjustarAncho()
    {
        if (InputKey._ik2FieldSizing || !this._ik2Campo) return;
        const i = this.input_search_container, cs = getComputedStyle(this);
        const min = Number(cs.getPropertyValue('--ik-key-min')) || this.KeyMinChars, max = Number(cs.getPropertyValue('--ik-key-max')) || this.KeyMaxChars;
        i.style.width = Math.max(min, Math.min(max, i.value.length + 1)) + 'ch';
    }

    // ---- Validez (B10). ElementInternals no es viable: con formAssociated, el input-key con name entra a
    // form.elements junto con su inputv (mismo name) y form.elements[name] pasa a ser un RadioNodeList cuyo .value es
    // '' (verificado en Chrome 153). Se delega en inputv, que es el control que ya participa en el formulario.
    _ik2Validez()
    {
        if (!this.inputv) return '';
        let msg = this._ik2Invalido || '';
        if (!msg && this.Strict)
        {
            const t = (this.input_search_container?.value ?? '').trim();
            const ds = (this.getAttribute('data-search') ?? '').toLowerCase();
            const ok = this.accept_data && Object.keys(this.accept_data).length > 0 && String(this.accept_data[ds] ?? '').trim().toLowerCase() === t.toLowerCase();
            if (t && !ok) msg = this._ik2T('notFound').replace('{text}', t);
        }
        if (this.Strict || this._ik2Validado || msg) { this.inputv.setCustomValidity(msg); this._ik2Validado = true; }
        if (this._ik2Campo)
        {
            this._ik2El.container.classList.toggle('ik2-invalido', !!msg);
            this._ik2MensajeCampo(msg);
            this.input_search_container.setAttribute('aria-invalid', String(!!msg));
        }
        return msg;
    }
    _ik2EstrictoSinResultados(autoselect)
    {
        if (!autoselect || !this.Strict || !this._ik2Campo || (this.data && this.data.length > 0)) return false;
        const t = (this.input_search_container.value ?? '').trim();
        if (!t) return false;
        this._ik2Invalido = this._ik2T('notFound').replace('{text}', t);
        this.accept_data = null;
        this.input_description_container.value = '';
        this._ik2Validez();
        this._ik2Resolver(null);
        return true;
    }
    get validity() { this._ik2Validez(); return this.inputv ? this.inputv.validity : undefined; }
    get validationMessage() { this._ik2Validez(); return this.inputv ? this.inputv.validationMessage : ''; }
    get willValidate() { return this.inputv ? this.inputv.willValidate : false; }
    setCustomValidity(msg) { this._ik2Invalido = String(msg ?? ''); this._ik2Validez(); }
    checkValidity() { this._ik2Validez(); return this.inputv ? this.inputv.checkValidity() : true; }
    reportValidity()
    {
        this._ik2Validez();
        if (!this.inputv) return true;
        const ok = this.inputv.checkValidity();
        if (ok) return true;
        if (this._ik2Campo)
        {
            const m = this.inputv.validity.valueMissing && !this.inputv.validationMessage ? this._ik2T('required') : (this.inputv.validity.valueMissing ? this._ik2T('required') : this.inputv.validationMessage);
            this._ik2El.container.classList.add('ik2-invalido');
            this._ik2MensajeCampo(m);
            try { this.input_search_container.focus(); } catch { }
            return false;
        }
        if (this.inputv.isConnected) return this.inputv.reportValidity();
        return false;
    }

    // ---- API (B1)
    /** Abre la ventana o el panel con ese texto. opciones: {anchor, autoselect=false}. */
    open(texto = '', opciones = {})
    {
        this._ik2Asegurar();
        if (opciones && opciones.anchor) { this._ik2Ancla = opciones.anchor; this._ik2Celda = null; }
        this.searchText(texto == null ? '' : String(texto), !!(opciones && opciones.autoselect));
    }
    /** Cierra sin seleccionar (como Esc o Cancelar). */
    close() { if (this.IsOpen) this._ikCancel(); }
    /**
     * Abre, espera y resuelve con el registro elegido, o null si se cancela. Con texto, una coincidencia exacta única
     * entra sin abrir la lista (IK-3), salvo {autoselect:false}. Se siguen disparando change_event y Selected.
     */
    pick(texto = '', opciones = {})
    {
        this._ik2Asegurar();
        this._ik2Resolver(null);
        return new Promise(res => {
            this._ik2Pick = res;
            const auto = (opciones && 'autoselect' in opciones) ? !!opciones.autoselect : String(texto ?? '').trim() !== '';
            this.open(texto, { anchor: opciones?.anchor, autoselect: auto });
        });
    }
    /**
     * Busca el registro por data-key y lo muestra (sin change_event, salvo {notify:true}). Resuelve con el registro o
     * null. Con data-source, la URL recibe la llave en @search: el servicio debe aceptar la búsqueda por llave.
     */
    async load(llave, opciones = {})
    {
        this._ik2Asegurar();
        const k = String(llave ?? '').trim();
        const dk = (this.getAttribute('data-key') ?? '').toLowerCase();
        if (!k) return null;
        let lista = null;
        const arr = this.getAttribute('data-source-array');
        if (!this.getAttribute('data-source') && arr && arr.trim() !== '')
        {
            try { lista = this.setObjectListMinus(JSON.parse(arr)); } catch { lista = []; }
        }
        else { await this.setDataSource(k, k); lista = this.data ?? []; }
        const rec = (lista ?? []).find(r => String(r[dk] ?? '').toLowerCase() === k.toLowerCase()) ?? null;
        if (!rec) return null;
        if (opciones && opciones.notify) this.setValue(rec);
        else { this.accept_data = rec; this.record_selected = rec; this._ikPaintValue(); }
        return { ...this.accept_data };
    }

    // ---- Columnas en JSON (B8): [{"field","title","type":"text|code|number|money|date","align","width","hidden","decimals","currency"}]
    _ik2Columnas()
    {
        const c = (this.columns ?? '').trim();
        if (!c.startsWith('[')) return null;
        if (this._ik2ColsTxt === c) return this._ik2Cols;
        let a = null;
        try { a = JSON.parse(c); } catch { console.warn('InputKey: columns no es un JSON válido; se usan todos los campos.'); }
        const cols = Array.isArray(a) ? a.filter(x => x && (typeof x === 'string' || x.field)).map(x => typeof x === 'string' ? { field: x } : x)
            .map(x => ({ field: String(x.field).trim().toLowerCase(), title: x.title ?? String(x.field), type: String(x.type ?? 'text').toLowerCase(), align: x.align, width: x.width, hidden: !!x.hidden, decimals: x.decimals, currency: x.currency })) : [];
        this._ik2ColsTxt = c;
        this._ik2Cols = cols;
        return cols;
    }
    /** Columnas efectivas: JSON, o la lista de hoy (columns + colcaptions), o todas las del primer registro. */
    _ik2ColumnasEfectivas()
    {
        const cj = this._ik2Columnas();
        if (cj) return cj.filter(c => !c.hidden);
        const r0 = (this.data && this.data[0]) ? this.data[0] : {};
        const titles = (this.colcaptions ? this.colcaptions.split(',') : Object.keys(r0));
        const fields = (this.columns ? this.columns.split(',') : Object.keys(r0));
        while (fields.length > titles.length && fields.length <= Object.keys(r0).length) titles[titles.length] = fields[titles.length];
        while (titles.length > fields.length && titles.length <= Object.keys(r0).length) fields[fields.length] = Object.keys(r0)[fields.length];
        const ds = (this.getAttribute('data-search') ?? '').toLowerCase();
        return fields.map((f, i) => {
            const field = f.trim();
            const v = r0[field];
            const num = typeof v === 'number';
            return { field, title: (titles[i] ?? field).trim(), type: field.toLowerCase() === ds ? 'code' : (num ? 'number-auto' : 'text') };
        });
    }
    _ik2Formato(v, col)
    {
        if (v === undefined || v === null) return '';
        const loc = this.getAttribute('locale') || 'es-MX';
        const n = Number(v);
        try
        {
            if (col.type === 'money' && v !== '' && Number.isFinite(n)) return new Intl.NumberFormat(loc, { style: 'currency', currency: col.currency || 'MXN', minimumFractionDigits: col.decimals ?? 2, maximumFractionDigits: col.decimals ?? 2 }).format(n);
            if (col.type === 'number' && v !== '' && Number.isFinite(n)) return new Intl.NumberFormat(loc, col.decimals != null ? { minimumFractionDigits: col.decimals, maximumFractionDigits: col.decimals } : {}).format(n);
            if (col.type === 'date' && v !== '') { const d = new Date(v); if (!isNaN(d)) return d.toLocaleDateString(loc); }
        }
        catch { }
        return String(v);
    }
    _ik2Alinear(col) { return col.align ?? ((col.type === 'money' || col.type === 'number' || col.type === 'number-auto') ? 'end' : null); }
    /** B8 sin tema: la tabla de hoy (mismas clases y eventos) con las columnas, el formato, la alineación y el ancho del JSON. */
    _ik2PintarLegado(cols)
    {
        this.body_tables_container2.innerHTML = ``;
        this.head_tables_container2.innerHTML = ``;
        if (!this.data || this.data.length <= 0)
        {
            this.body_tables_container2.innerHTML = `<p class="p-3 text-secondary">${(this.getAttribute('box-nodata-text') ?? this._ik2T('noData'))}</p>`;
            return;
        }
        const vis = cols.filter(c => !c.hidden);
        const tr = this.createFullElement('tr', { id: 'tr_tables_container2' });
        vis.forEach(c => { const t = this.createFullElement('th', { class: 'fw-500 border-1 p-2 ps-3 pe-3' }); t.textContent = c.title; if (c.width) t.style.width = c.width; const al = this._ik2Alinear(c); if (al) t.style.textAlign = al; tr.appendChild(t); });
        this.head_tables_container2.appendChild(tr);
        const dk = (this.getAttribute('data-key') ?? '').toLowerCase();
        this.data.forEach(dt => {
            const row = this.createFullElement('tr', { class: 'row_table', value: `${dt[dk]}`, tabindex: `0` });
            this._ik2EventosFilaLegado(row);
            vis.forEach(c => { const cell = this.createFullElement('td', { class: 'border-1 p-1 ps-2 pe-2' }); cell.textContent = this._ik2Formato(dt[c.field], c); const al = this._ik2Alinear(c); if (al) cell.style.textAlign = al; row.appendChild(cell); });
            this.body_tables_container2.appendChild(row);
        });
        return this.body_tables_container2;
    }
    /** Los mismos listeners que pone printTableData a cada fila (clic, doble clic, keyup y focus). */
    _ik2EventosFilaLegado(row)
    {
        row.addEventListener('click', (e) => { e.stopPropagation(); const tr = e.target.closest('tr'); this.findValue(tr.getAttribute('value')); tr.parentNode.childNodes.forEach(ch => ch.classList.remove('row_selected')); tr.classList.add('row_selected'); });
        row.addEventListener('dblclick', () => { this.accept_footer_container2.click(); });
        row.addEventListener('keyup', (e) => {
            switch (e.key)
            {
                case 'ArrowRight': case 'ArrowDown': if (e.target.nextElementSibling) e.target.nextElementSibling.focus(); else if (this.body_tables_container2.firstChild) this.body_tables_container2.firstChild.focus(); break;
                case 'ArrowLeft': case 'ArrowUp': if (e.target.previousElementSibling) e.target.previousElementSibling.focus(); else if (this.body_tables_container2.lastChild) this.body_tables_container2.lastChild.focus(); break;
                case 'Enter': this.accept_footer_container2.click(); break;
            }
        });
        row.addEventListener('focus', (e) => { e.stopPropagation(); this.findValue(e.target.getAttribute('value')); e.target.parentNode.childNodes.forEach(ch => ch.classList.remove('row_selected')); e.target.classList.add('row_selected'); });
    }
    static _ik2Plegar(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
    /** A6: resalta (mark) las apariciones del texto buscado, sin distinguir mayúsculas ni acentos. */
    static _ik2Resaltar(celda, texto, q)
    {
        const t = String(texto ?? '');
        const terms = q ? InputKey._ik2Plegar(q).split(/\s+/).filter(x => x && x !== '%') : [];
        if (!terms.length) { celda.textContent = t; return; }
        const p = InputKey._ik2Plegar(t);
        if (p.length !== t.length) { celda.textContent = t; return; }
        const marca = new Array(t.length).fill(false);
        terms.forEach(term => { let i = p.indexOf(term); while (i >= 0) { for (let k = i; k < i + term.length; k++) marca[k] = true; i = p.indexOf(term, i + 1); } });
        let i = 0;
        while (i < t.length)
        {
            let j = i; while (j < t.length && marca[j] === marca[i]) j++;
            const s = t.slice(i, j);
            if (marca[i]) { const m = document.createElement('mark'); m.textContent = s; celda.appendChild(m); } else celda.appendChild(document.createTextNode(s));
            i = j;
        }
    }
    /** A6: lista con tema. Mismas filas (tr.row_table con value y tabindex) que hoy; teclado con keydown (B7). */
    _ik2PintarLista()
    {
        const tb = this.body_tables_container2, th = this.head_tables_container2;
        tb.innerHTML = ''; th.innerHTML = '';
        this._ik2Activa = -1;
        const cuenta = this.shadow.getElementById('ik2_cuenta');
        const q = (this.input_search_container2.value || this.#lastSearch || '').trim();
        const err = this._ik2Error;
        const fila = (html, cls) => {
            const tr = this.createFullElement('tr', { class: 'ik2-aviso-fila' });
            const td = this.createFullElement('td', { class: 'ik2-aviso' + (cls ? ' ' + cls : ''), colspan: '99' });
            const div = this.createFullElement('div', { class: 'ik2-aviso-in' }, html);
            td.appendChild(div); tr.appendChild(td); tb.appendChild(tr);
            return div;
        };
        if (err)
        {
            if (cuenta) cuenta.textContent = '';
            const d = fila(InputKey._ik2Iconos.aviso, 'ik2-error');
            const p = document.createElement('div'); p.textContent = this._ik2T('serviceError') + (err.message ? ' ' + err.message : ''); d.appendChild(p);
            const b = this.createFullElement('button', { type: 'button', id: 'ik2_reintentar' }); b.textContent = this._ik2T('retry');
            b.addEventListener('click', () => this._ik2Reintentar());
            d.appendChild(b);
            return tb;
        }
        if (!this.data || this.data.length <= 0)
        {
            if (cuenta) cuenta.textContent = q ? this._ik2T('results').replace('{n}', '0') : '';
            const d = fila(InputKey._ik2Iconos.vacio);
            const p = document.createElement('div');
            p.textContent = q ? (this.getAttribute('box-nodata-text') ?? this._ik2T('noMatches').replace('{text}', q)) : this._ik2T('typeToSearch');
            d.appendChild(p);
            if (q && this.getAttribute('add-url'))
            {
                const b = this.createFullElement('button', { type: 'button', id: 'ik2_crear' }); b.textContent = '+ ' + this._ik2T('create').replace('{text}', q);
                b.addEventListener('click', () => { this.input_search_container.value = q; const ab = this._ik2El.addBtn; this._ikCancel(); ab.click(); });
                d.appendChild(b);
            }
            return tb;
        }
        const cols = this._ik2ColumnasEfectivas();
        const trh = this.createFullElement('tr', { id: 'tr_tables_container2', role: 'row' });
        cols.forEach(c => { const t = this.createFullElement('th', { role: 'columnheader', scope: 'col' }); t.textContent = c.title; if (c.width) t.style.width = c.width; const al = this._ik2Alinear(c); if (al) t.style.textAlign = al; if (c.type === 'money' || c.type === 'number' || c.type === 'number-auto') t.classList.add('ik2-num'); trh.appendChild(t); });
        th.appendChild(trh);
        const dk = (this.getAttribute('data-key') ?? '').toLowerCase();
        this.data.forEach((dt, i) => {
            const tr = this.createFullElement('tr', { class: 'row_table', value: `${dt[dk]}`, tabindex: '-1', role: 'row', id: 'ik2_r' + i, 'aria-selected': 'false', 'data-i': String(i) });
            cols.forEach(c => {
                const td = this.createFullElement('td', { role: 'gridcell' });
                const num = c.type === 'money' || c.type === 'number' || (c.type === 'number-auto' && typeof dt[c.field] === 'number');
                if (num) td.classList.add('ik2-num');
                if (c.type === 'code') td.classList.add('ik2-cod');
                const al = this._ik2Alinear(c); if (al && c.align) td.style.textAlign = al;
                const txt = this._ik2Formato(dt[c.field], c);
                if (num) td.textContent = txt; else InputKey._ik2Resaltar(td, txt, q);
                tr.appendChild(td);
            });
            tr.addEventListener('mousedown', (e) => { if (e.button === 0) e.preventDefault(); });
            tr.addEventListener('click', (e) => { e.stopPropagation(); this._ik2Activar(i, true); });
            tr.addEventListener('dblclick', () => { this._ik2Activar(i, true); this.accept_footer_container2.click(); });
            tr.addEventListener('focus', () => this._ik2Activar(i, false));
            tr.addEventListener('keydown', (e) => this._ik2TeclaFila(e, i));
            tb.appendChild(tr);
        });
        if (cuenta) cuenta.textContent = this.data.length === 1 ? this._ik2T('oneResult') : this._ik2T('results').replace('{n}', String(this.data.length));
        return tb;
    }
    _ik2Filas() { return Array.from(this.body_tables_container2.querySelectorAll('tr.row_table')); }
    /** Marca la fila activa (row_selected, aria-selected, aria-activedescendant) y la vuelve el registro elegido. */
    _ik2Activar(i, enfocar)
    {
        const filas = this._ik2Filas();
        if (!filas.length) return;
        i = Math.max(0, Math.min(filas.length - 1, i));
        const tr = filas[i];
        if (this._ik2Activa !== i || !tr.classList.contains('row_selected'))
        {
            filas.forEach(f => { f.classList.remove('row_selected'); f.setAttribute('aria-selected', 'false'); f.tabIndex = -1; });
            tr.classList.add('row_selected'); tr.setAttribute('aria-selected', 'true'); tr.tabIndex = 0;
            this.findValue(tr.getAttribute('value'));
            this._ik2Activa = i;
            this.input_search_container2.setAttribute('aria-activedescendant', tr.id);
        }
        if (enfocar && this.shadow.activeElement !== tr) tr.focus({ preventScroll: true });
        tr.scrollIntoView({ block: 'nearest' });
    }
    _ik2FilasPorPagina()
    {
        const sec = this._ik2El.tablesSec, f = this._ik2Filas()[0];
        if (!sec || !f) return 8;
        const h = f.getBoundingClientRect().height || 30;
        return Math.max(1, Math.floor((sec.clientHeight - 30) / h) - 1);
    }
    /** B7: teclado de la lista con tema (keydown: la tecla sostenida repite). */
    _ik2TeclaFila(e, i)
    {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        const n = this._ik2Filas().length;
        const ir = (k) => { e.preventDefault(); this._ik2Activar(k, true); };
        switch (e.key)
        {
            case 'ArrowDown': return ir(Math.min(n - 1, i + 1));
            case 'ArrowUp': if (i === 0) { e.preventDefault(); this._ik2AlBuscador(); return; } return ir(i - 1);
            case 'PageDown': return ir(Math.min(n - 1, i + this._ik2FilasPorPagina()));
            case 'PageUp': return ir(Math.max(0, i - this._ik2FilasPorPagina()));
            case 'Home': return ir(0);
            case 'End': return ir(n - 1);
            case 'Enter':
                e.preventDefault(); this._ik2Activar(i, false);
                this._ik2EnterAceptado = true; this._ik2TeclaAceptar = 'Enter';
                this.accept_footer_container2.click();
                this._ik2EnterAceptado = false;
                return;
            case 'Tab':
                if (this.TabAccepts && !e.shiftKey) { e.preventDefault(); this._ik2Activar(i, false); this._ik2EnterAceptado = true; this._ik2TeclaAceptar = 'Tab'; this.accept_footer_container2.click(); this._ik2EnterAceptado = false; }
                return;
            case 'Backspace':
                this._ik2AlBuscador(); return;   // borra en el buscador (la acción por omisión ocurre ya en él)
        }
        // Un carácter imprimible vuelve al buscador de la ventana conservando lo escrito.
        if (e.key && e.key.length === 1) this._ik2AlBuscador();
    }
    _ik2AlBuscador()
    {
        const b = this.input_search_container2;
        // IK-8 (2026-11-02): el comodín «%» con que se abre la lista completa (V12: searchText("%") del menú de acciones)
        // no se conserva al escribir: antes se buscaba «%texto» y no había resultados.
        if (b.value === '%') b.value = '';
        b.focus();
        const n = b.value.length; try { b.setSelectionRange(n, n); } catch { }
    }
    /** B7: buscador de la ventana con tema. Enter busca; ↓ baja a la lista. */
    _ik2TeclaBuscador(e)
    {
        if (!this._ik2Lista) return;
        if (e.key === 'Enter') { e.preventDefault(); this.searchButton(this.container2); return; }
        if ((e.key === 'ArrowDown' || e.key === 'PageDown') && this._ik2Filas().length) { e.preventDefault(); this._ik2Activar(this._ik2Activa >= 0 ? this._ik2Activa : 0, true); }
    }
    /** B7: en el campo con tema, F4 o Alt+↓ abre la lista. (Enter sigue en keyup, como hoy.) */
    _ik2TeclaCampo(e)
    {
        if (!this._ik2Campo) return;
        if (e.key === 'F4' || (e.altKey && e.key === 'ArrowDown')) { e.preventDefault(); this._search(false); }
    }
    _ik2Reintentar()
    {
        const t = this.input_search_container2.value || this.#lastSearch || '';
        this._ik2Error = null;
        this.setDataSource(this.input_search_container2.getAttribute('key-value') || '', t).then(() => this.search(this.container2, false));
    }
}

class CheckList extends HTMLElement
{
    attributes = null;
    data = {};
    key = "id";
    parentKey = "parent";
    childs = "items";
    treeOptions = {}
    locked = null;
    doneStyle = null;
    canRemove = null;
    canEdit = null;
    canMove = null;
    canCheck = null;
    canAdd = null;
    showPercents = null;
    hideHeader = false;
    radioStyle = false;

    onItemChanged = null;
    onItemChecked = null;
    onItemMoved = null;

    _containerwc = null;
    _headSection = null;
    _titleHeader = null;
    _bodySection = null;
    _footSection = null;
    _btnDropDown = null;
    _footHeader = null;
    _textDropDown = null;
    _topPositionDragEvent = true;
    _isChildItemDragEvent = true;
    _draggingItem = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return this.attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        if (this._ixRaiz) this._ixTemaLigar();   // reconectado: vuelve a tomar el tema
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow =      this.attachShadow({ mode: 'closed' });
            this.locked =       this._parseBool(this.getAttribute('data-locked'));
            this.doneStyle =    this._parseInt(this.getAttribute('data-done-style'));
            this.canRemove =    this._parseBool(this.getAttribute('can-remove'));
            this.canEdit =      this._parseBool(this.getAttribute('can-edit'));
            this.canMove =      this._parseBool(this.getAttribute('can-move'));
            this.canCheck =     this._parseBool(this.getAttribute('can-check'), true);
            this.canAdd =       this._parseBool(this.getAttribute('can-add'), true);
            this.showPercents = this._parseBool(this.getAttribute('show-percents'));
            this.hideHeader =   this._parseBool(this.getAttribute('hide-header'));
            this.radioStyle =   this._parseBool(this.getAttribute('radio-style'));

            this._containerwc = this._createFullElement('div', { id:'CL_container', class:'bordered d-flex flex-column' });
            this._headSection = this._createFullElement('div', { id:'CL_headerSection', class:'p-3 d-flex',tabindex:"0" });
            this._bodySection = this._createFullElement('div', { id:'CL_bodySection', class:'grow-1' });
            this._footSection = this._createFullElement('div', { id:'CL_footSection'});

            // head section
            this._titleHeader = this._createFullElement('input', { id:'CL_title_headSection', type: 'text', class:'w-100 fz-big2 p-2 noborder', placeholder:'Título'});
            this._headSection.appendChild(this._titleHeader);
            this._containerwc.appendChild(this._headSection);

            // body section
            this._containerwc.appendChild(this._bodySection);

            // foot section
            this._containerwc.appendChild(this._footSection);
            this._footHeader = this._createFullElement('div', { id:'CL_footHeader', class:'ps-2 pe-2 hide-element' });
            this._btnDropDown = this._createFullElement('button', { id:'CL_btnDropDown', class:'d-flex align-items-center gap-2 noborder bg-transparent p-3' });
            const _svgDropDown = this._createFullElement('div', { class:'d-flex align-items-center justify-content-center' });
            this._textDropDown = this._createFullElement('span');

            _svgDropDown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`;

            this._btnDropDown.appendChild(_svgDropDown);
            this._btnDropDown.appendChild(this._textDropDown);
            this._footHeader.appendChild(this._btnDropDown);
            this._footSection.before(this._footHeader);

            // events
            this._titleHeader.addEventListener('keyup', () => {
                this.data['text'] = this._titleHeader.value;
            });
            this._btnDropDown.addEventListener('click', () => {
                if (this._footSection.classList.contains('hide-element'))
                {
                    this._footSection.classList.remove('hide-element');
                    _svgDropDown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-down" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>`;
                }
                else
                {
                    this._footSection.classList.add('hide-element');
                    _svgDropDown.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>`;
                }
            });
            this._footSection.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return;
            });

            shadow.innerHTML = `
                <style>
                    /* ========== General */
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; }
                    .flex-column{ flex-direction: column; }
                    .gap-1{gap:4px;} .gap-2{gap:8px;}
                    .justify-content-start{ justify-content: start; } .justify-content-center{ justify-content: center; } .justify-content-end{ justify-content: end; }
                    .align-items-start{ align-items: start; } .align-items-center{ align-items: center; } .align-items-end{ align-items: end; }
                    .fz-sm{ font-size: .8rem; } .fz-normal{ font-size: 1rem; } .fz-big1{ font-size: 1.2rem; } .fz-big2{ font-size: 1.4rem; }
                    .grow-1{ flex-grow: 1; }
                    .w-100{ width: 100%; }
                    .bordered{ border: 1px solid #DDD; }
                    .noborder{ border: none !important; outline: none !important; }
                    .rounded{ border-radius: 6px; }
                    .rounded-50{ border-radius: 50%; }
                    .p-1{ padding: 4px; } .p-2{ padding: 8px; } .p-3{ padding: 12px; } .p-4{ padding: 16px; } .p-5{ padding: 32px; }
                    .ps-1{ padding-left: 4px; }.ps-2{ padding-left: 8px; }.ps-3{ padding-left: 12px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                    .pe-1{ padding-right: 4px; }.pe-2{ padding-right: 8px; }.pe-3{ padding-right: 12px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                    .bg-white{ background-color: #FFF;} .bg-light-gray{ background-color: #F5F5F5; } .bg-transparent{background-color:transparent;}
                    .hide-element{ display: none !important; }
                    .disable-element{ pointer-events: none !important; opacity: .5 !important; }
                    .disable-element-op0{ pointer-events: none !important; opacity: 0 !important; }
                    .disable-element-transparent{ pointer-events: none !important; }
                    .borderxy4{ border-top: 6px solid transparent; border-bottom: 6px solid transparent; }
                    .border-t{ border-top-color: #005CC8; }
                    .border-b{ border-bottom-color: #005CC8; }
                    .dragging{ background-color: #F0F8FF; }
                    .d-none{ display: none !important; }

                    /* ========== List */
                    .list-item-new{ display: grid; grid-template-columns: 1rem 1rem 1fr; gap:4px;}
                    .list-item{ display: grid; grid-template-columns: 1rem auto 1fr 2rem; gap:4px;}
                    .sub-item{ padding-left: 1.6rem; }
                    .hover-item:focus-within{ outline: 1px solid #DDD !important; }
                    .movItem, .delItem{ position: relative; left: -1000rem; }
                    .hover-item:hover > div > button{ left: 0; }
                    .delItem:hover{ background-color: #F5F5F5; fill: #000 !important; color: #000 !important; cursor: pointer; }
                    .movItem:hover{ cursor: move ; }
                    #CL_btnDropDown:hover{ !important; cursor: pointer !important; }
                    #CL_footHeader{ border-top: 1px solid #DDD !important; transition: .3s; }
                    #CL_footHeader:hover{ background-color: #f5f5f5; }
                    .in-done-list .list-item .movItem{ pointer-events: none !important; opacity: 0 !important; }
                    .container-checks{ display: flex; justify-content: center; align-items: center; gap: 10px; }
                    .rd-item-yes, rd-item-no{ width: 1rem; height: 1rem; }
                    .rd-item-yes::before{ content:'Si'; position:relative;top:-16px;left:2px;font-size:.7rem; color:#CCC;width: 100% !important;display: flex; }
                    .rd-item-no::before{ content:'No'; position:relative;top:-16px;font-size:.7rem; color:#CCC;width: 100% !important;display: flex; }
                    .rd-item-yes:hover::before{ color:#000; }
                    .rd-item-no:hover::before{ color:#000; }
                    `+ (this.getAttribute("control-styles") ?? '') +`
                </style>
            `;

            shadow.appendChild(this._containerwc);
            this._refreshView();

            if (this.hasAttribute('data') && this.getAttribute('data').trim())
            {
                try
                {
                    this.setData(JSON.parse(this.getAttribute('data')));
                }
                catch(error)
                {
                    alert('El valor del atributo "data" no contiene un formato JSON válido');
                    console.error(error);
                    this.data = {};
                }
            }

            this._initTreeValues();
            this._ixRaiz = shadow;
            this._ixTemaLigar();
        });
    }
    disconnectedCallback() { _ixSoltarTema(this); }

    // Tema (CONTROLES.md): marco como panel, título como encabezado, renglones como opciones de lista.
    _ixTemaLigar() { return _ixVincularTema(this, 'check-list', (V) => CheckList._ixCss(V)); }
    static _ixCss(V)
    {
        const { PAD, FS, ROW } = _ixT, S = ':host #CL_container';
        return _ixT.sm + `
:host{ color-scheme: var(--ix-t-cs, normal); }
${S}.bordered{ border: 1px solid ${V('card-border', '#E1E5EA')}; border-radius: ${V('radius', '4px')}; background-color: ${V('bg', '#FFFFFF')}; color: ${V('fg', '#1F2328')}; font-family: ${V('font', 'system-ui, sans-serif')}; font-size: ${FS}; overflow: hidden; }
${S} #CL_headerSection{ background-color: ${V('header-bg', '#F3F5F8')}; color: ${V('header-fg', '#1F2328')}; border-bottom: 1px solid ${V('header-border', '#D0D7DE')}; }
${S} #CL_headerSection:focus-visible{ outline: 2px solid ${V('focus-ring', '#2F66CC')}; outline-offset: -2px; }
${S} #CL_title_headSection{ background-color: transparent; color: inherit; font-family: inherit; font-size: calc(${FS} * 1.3); font-weight: ${V('header-weight', '600')}; }
${S} input::placeholder{ color: ${V('muted-fg', '#59636E')}; opacity: 1; }
${S} .bg-white{ background-color: ${V('bg', '#FFFFFF')}; }
${S} .hover-item{ min-height: ${ROW}; color: ${V('fg', '#1F2328')}; box-shadow: 0 1px 0 ${V('border', '#E1E5EA')}; }
${S} .hover-item:hover{ background-color: ${V('hover-bg', '#EDF2F8')}; }
${S} .hover-item:focus-within{ outline: 2px solid ${V('focus-ring', '#2F66CC')} !important; outline-offset: -2px; }
${S} .hover-item[item-done="true"]{ background-color: ${V('checked-bg', '#DCE7FA')}; }
${S} .list-item input[type="text"], ${S} .list-item-new input[type="text"]{ color: inherit; font-family: inherit; font-size: ${FS}; padding: ${PAD}; }
${S} input[type="checkbox"], ${S} input[type="radio"]{ accent-color: ${V('accent', '#2F66CC')}; width: 15px; height: 15px; }
${S} svg{ fill: currentColor; }
${S} .movItem, ${S} .list-item-new > div{ color: ${V('muted-fg', '#59636E')}; }
${S} .delItem{ color: ${V('muted-fg', '#59636E')}; border-radius: ${V('radius', '4px')}; }
${S} .delItem:hover{ background-color: ${V('error-bg', '#FDECEC')} !important; color: ${V('error', '#C62828')} !important; fill: currentColor !important; }
${S} .hover-item > div:not(.list-item):not(.list-item-new){ color: ${V('accent', '#2F66CC')}; }
${S} .rd-item-yes::before, ${S} .rd-item-no::before{ color: ${V('muted-fg', '#59636E')}; }
${S} .rd-item-yes:hover::before, ${S} .rd-item-no:hover::before{ color: ${V('fg', '#1F2328')}; }
${S} .dragging{ background-color: ${V('sel-bg-soft', '#DCE7FA')}; }
${S} .bg-light-gray{ background-color: ${V('hover-bg', '#EDF2F8')}; }
${S} .border-t{ border-top-color: ${V('accent', '#2F66CC')}; }
${S} .border-b{ border-bottom-color: ${V('accent', '#2F66CC')}; }
${S} #CL_footHeader{ border-top: 1px solid ${V('border', '#E1E5EA')} !important; background-color: ${V('header-bg', '#F3F5F8')}; }
${S} #CL_footHeader:hover{ background-color: ${V('hover-bg', '#EDF2F8')}; }
${S} #CL_btnDropDown{ color: ${V('header-fg', '#1F2328')}; font-family: inherit; font-size: ${FS}; font-weight: ${V('header-weight', '600')}; }
${S} #CL_btnDropDown:focus-visible{ outline: 2px solid ${V('focus-ring', '#2F66CC')}; outline-offset: -2px; }
`;
    }

    _parseBool(value, _default = false)
    {
        if (value) return (value.toLowerCase() === 'true');
        return _default;
    }
    _parseInt(value, _default = 0)
    {
        if (value != null && isFinite(value.trim()) && !isNaN(value.trim())) { return parseInt(value.trim()); }
        return _default;
    }
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _refreshView()
    {
        this._valideCheckedItems();

        // title
        this._titleHeader.value = (this.data?.text ?? '');
        this._bodySection.innerHTML = ``;
        this._footSection.innerHTML = ``;
        this._footHeader.classList.add('hide-element');
        
        this._headSection.setAttribute("title",(this.data?.text ?? ''));
        this._titleHeader.classList.toggle('disable-element', !this.canEdit);
        if (this.hideHeader) this._headSection.style.display = "none";

        // New item
        let id = this._generateUUID()
        const newItem = this._createRowItem(null, { isNew: true, id: id});

        // Items List
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => 
            {
                let id = (item.id ?? this._generateUUID());
                this._bodySection.appendChild(this._createRowItem(item, { id: id }));

                if (item.items && item.items.length > 0)
                    item.items.forEach(subItem => { 
                        this._bodySection.appendChild(this._createRowItem(subItem, { isNew: false, isSubItem: true, id: (subItem.id ?? this._generateUUID()), parentId: id }))
                    });
            });
        }

        this._bodySection.appendChild(newItem);
        this._reprintElementChecked();
    }
    _generateUUID()
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    _createRowItem(item, params = { isNew: false, isSubItem: false, id: '', parentId:''})
    {
        let containerItem = null;
        if (params.isNew)
        {
            containerItem = this._createFullElement('div', { id:'CL_newCont', class:'hover-item p-2 pe-3 bg-white', style:'margin-top: 1px;',tabindex:"0" });
            const newItem = this._createFullElement('div', { id:'CL_newItem', class:'list-item-new', 'item-id': params.id });
            const newEmpt = this._createFullElement('div');
            const newIcon = this._createFullElement('div', { class:'d-flex align-items-center justify-content-center' });
            const newText = this._createFullElement('input', { type:'text', class:'p-2 noborder w-100 bg-transparent', placeholder:'Elemento de lista'});

            newIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#888" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/></svg>`;

            newItem.appendChild(newEmpt);
            newItem.appendChild(newIcon);
            newItem.appendChild(newText);
            containerItem.appendChild(newItem);

            if (!this.canAdd) containerItem.classList.add('hide-element');

            newText.addEventListener('blur', () => {
                if (newText.value.trim() != ""){
                    const newItemElement = this._createRowItem({ text: newText.value.trim() }, { id: this._generateUUID() });
                    newText.value = "";
                    this._addOrUpdateItem(newItemElement);
                }
            });
            newText.addEventListener('keyup', (e) => {
                if (newText.value.trim() != "" && e.key === 'Enter'){
                    const newItemElement = this._createRowItem({ text: newText.value.trim() }, { id: this._generateUUID() });
                    newText.value = "";
                    this._addOrUpdateItem(newItemElement);
                }
            });
        }
        else
        {
            containerItem = this._createFullElement('div', { class:'hover-item bg-white ps-1 pe-3 borderxy4', 'item-id':`${params.id}`, style:'position: relative; margin-top: 1px;',tabindex:"0" });
            const rowItem = this._createFullElement('div', { class:'list-item' });
            const movItem = this._createFullElement('button', { class: 'movItem noborder', style: 'background: transparent;', draggable: 'true' });
            const chkItem = this._createFullElement('input', { type:'checkbox' });
            const rdItemY = this._createFullElement('input', { type:'radio', name:`radio_${params.id}`, title:'Si', class:'rd-item-yes' });
            const rdItemN = this._createFullElement('input', { type:'radio', name:`radio_${params.id}`, title:'No', class:'rd-item-no' });
            const txtItem = this._createFullElement('input', { type:'text', class:'p-2 noborder w-100 bg-transparent'});
            const delItem = this._createFullElement('button', { class:'delItem noborder bg-transparent d-flex align-items-center justify-content-center' });
            const childIcon = this._createFullElement('div', { style:'position:absolute; top: 5px; left: 2px;', class:'hide-element'});
            const cntnrChks = this._createFullElement('div', { class:'container-checks' });

            childIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#005CC8" class="bi bi-arrow-right-short" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z"/></svg>`;
            movItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#888" class="bi bi-three-dots-vertical" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>`;
            delItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            txtItem.value = item.text;
            chkItem.checked = (item.done ?? false);
            rdItemY.checked = (item.done ?? false);
            rdItemN.checked = (!item.done ?? true);
            containerItem.setAttribute('item-text', item.text);
            containerItem.setAttribute('title', item.text);
            containerItem.setAttribute('item-done', chkItem.checked);

            if (params.isSubItem)
            {
                containerItem.classList.add('sub-item');
                containerItem.setAttribute('parent-id', params.parentId);
            }

            if (chkItem.checked && this.locked) cntnrChks.classList.add('disable-element');
            if (!this.canRemove) delItem.classList.add('hide-element');
            if (!this.canEdit) txtItem.classList.add('disable-element-transparent');
            if (!this.canMove) movItem.classList.add('disable-element-op0');
            if (!this.canCheck) cntnrChks.classList.add('disable-element');

            chkItem.classList.toggle('d-none', this.radioStyle);
            rdItemY.classList.toggle('d-none', !this.radioStyle);
            rdItemN.classList.toggle('d-none', !this.radioStyle);

            cntnrChks.append(chkItem);
            cntnrChks.append(rdItemY);
            cntnrChks.append(rdItemN);

            rowItem.appendChild(movItem);
            rowItem.appendChild(cntnrChks);
            rowItem.appendChild(txtItem);
            rowItem.appendChild(delItem);
            containerItem.appendChild(rowItem);
            containerItem.appendChild(childIcon);

            const verifyCheckItem = () => 
            {
                containerItem.setAttribute('item-done', chkItem.checked);
                this._addOrUpdateItem(containerItem);
                this._refreshView();
                
                if (chkItem.checked && this.onItemChecked)
                {
                    let item = this.getItem((containerItem.getAttribute('item-id')??''))
                    this.onItemChecked(item);
                }

                if (chkItem.checked && this.locked)
                    cntnrChks.classList.add('disable-element');
            }

            delItem.addEventListener('click', () => {
                this._addOrUpdateItem(containerItem, true);
            });
            txtItem.addEventListener('change', (e) => {
                containerItem.setAttribute('item-text', txtItem.value);
                this._addOrUpdateItem(containerItem);
                if (e.key === 'Enter' && containerItem.nextElementSibling && containerItem.nextElementSibling.childNodes[0] && containerItem.nextElementSibling.childNodes[0].childNodes[2]){
                    containerItem.nextElementSibling.childNodes[0].childNodes[2].focus();
                }
            });
            chkItem.addEventListener('click', () => {
                verifyCheckItem();
            });
            rdItemY.addEventListener('change', () => {
                chkItem.checked = rdItemY.checked;
                verifyCheckItem();
            });
            rdItemN.addEventListener('change', () => {
                chkItem.checked = (!rdItemN.checked);
                verifyCheckItem();
            });

            if (this.canMove)
            {
                containerItem.addEventListener('dragstart', (e) => {
                    this._draggingItem = containerItem;
                    e.dataTransfer.setData('text/plain', containerItem.getAttribute('item-id'));
                    containerItem.classList.add('dragging');
                    let item = this.getItem(containerItem.getAttribute('item-id'));
                    if (item && item.items && item.items.length > 0)
                    {
                        this._bodySection.childNodes.forEach(itemList => {
                            item.items.forEach(item => {
                                if (item.id == itemList.getAttribute('item-id'))
                                    itemList.classList.add('disable-element');
                            });
                        });
                    }
                });
                containerItem.addEventListener('dragend', () => {
                    containerItem.classList.remove('dragging');
                    this._draggingItem = null;
                    let item = this.getItem(containerItem.getAttribute('item-id'));
                    if (item && item.items && item.items.length > 0)
                    {
                        this._bodySection.childNodes.forEach(itemList => {
                            item.items.forEach(item => {
                                if (item.id == itemList.getAttribute('item-id'))
                                    itemList.classList.remove('disable-element');
                            });
                        });
                    }
                })
                containerItem.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (containerItem.classList.contains('in-done-list')) return;
                    if (this._draggingItem && containerItem.getAttribute('item-id') == this._draggingItem.getAttribute('item-id')) return;
                    const rect = containerItem.getBoundingClientRect();
                    const limity = (rect.y + (rect.height / 2));
                    const limitx = (rect.x + (rect.width / 5))
    
                    let y = (e.clientY < limity);
                    let x = (!y && e.clientX > limitx);
    
                    containerItem.classList.toggle('border-b', !y);
                    containerItem.classList.toggle('border-t', y);
                    if ((containerItem.getAttribute('parent-id')??'') == '')
                    {
                        containerItem.classList.toggle('bg-light-gray', x);
                        childIcon.classList.toggle('hide-element', !x);
                    }
    
                    this._topPositionDragEvent = y;
                    this._isChildItemDragEvent = x;
                });
                containerItem.addEventListener('dragleave', (e) => {
                    containerItem.classList.remove('border-b');
                    containerItem.classList.remove('border-t');
                    containerItem.classList.remove('bg-light-gray');
                    childIcon.classList.add('hide-element');
                });
                containerItem.addEventListener('drop', (e) => {
                    e.preventDefault();
                    if (containerItem.classList.contains('in-done-list')) return;
                    containerItem.classList.remove('border-b');
                    containerItem.classList.remove('border-t');
                    containerItem.classList.remove('bg-light-gray');
                    childIcon.classList.add('hide-element');
    
                    let itemId = e.dataTransfer.getData("text");
                    let itemDrop = null;
                    this._bodySection.childNodes.forEach(item => {
                        if (item.getAttribute('item-id') == itemId)
                            itemDrop = item;
                    });
    
                    if (itemDrop && containerItem.getAttribute('item-id') == itemDrop.getAttribute('item-id')) return;
    
                    if (itemDrop)
                    {
                        itemDrop.classList.remove('dragging');
    
                        let index = 0;
                        let sourceItem = this.getItem(itemDrop.getAttribute('item-id'), false);
                        
                        if (sourceItem)
                        {
                            if (sourceItem.subindex != undefined) 
                                this.data.items[sourceItem.subindex].items.splice(sourceItem.index, 1);
                            else
                                this.data.items.splice(sourceItem.index, 1);
                        }
    
                        let targetItem = this.getItem(containerItem.getAttribute('item-id'), false);
                        
                        if (!this._topPositionDragEvent)
                            index = 1;
                        
                        if (targetItem)
                        {
                            index += targetItem.index;
                            delete sourceItem.index;
                            delete sourceItem.subindex;
    
                            if (targetItem.subindex != undefined)
                            {
                                let subitemsSource = JSON.parse(JSON.stringify(sourceItem.items ?? []));
                                if (subitemsSource && subitemsSource.length > 0)
                                    delete sourceItem.items;
                                this.data.items[targetItem.subindex].items.splice(index, 0, sourceItem);
                                subitemsSource.forEach(subitem => {
                                    index ++;
                                    this.data.items[targetItem.subindex].items.splice(index, 0, subitem);
                                });
                            }
                            else if (this._isChildItemDragEvent)
                            {
                                let subitems = (this.data.items[targetItem.index].items??[]);
                                let subitemsSource = JSON.parse(JSON.stringify(sourceItem.items ?? []));
                                if (subitemsSource && subitemsSource.length > 0)
                                    delete sourceItem.items;
                                subitems.unshift(sourceItem);
                                let _index = 0;
                                subitemsSource.forEach(subitem => {
                                    _index ++;
                                    subitems.splice(_index, 0, subitem);
                                });
                                this.data.items[targetItem.index].items = subitems;
                            }
                            else
                            {
                                this.data.items.splice(index, 0, sourceItem);
                            }
                            if (this.onItemMoved) this.onItemMoved(sourceItem);
                        }
                    }
                    this._refreshView();
                });
            }
        }

        return containerItem;
    }
    _reprintElementChecked()
    {
        this._footSection.innerHTML = '';

        switch(this.doneStyle)
        {
            case 0:
            {
                this._footHeader.classList.add('hide-element');
                break;
            }
            case 1:
            {
                let checkedItems = this._getCheckedItems();
                let lastParendtId = '🧔';

                checkedItems.forEach(itemChecked => 
                {
                    this._bodySection.childNodes.forEach(itemList => 
                    {
                        if (itemChecked.id == itemList.getAttribute('item-id'))
                        {
                            let parentId = (itemList.getAttribute('parent-id') ?? '');
                            if (parentId && parentId != lastParendtId)
                            {
                                lastParendtId = parentId;
                                let parentItemList = null; 
                                this._bodySection.childNodes.forEach(item => { 
                                    if(item.getAttribute('item-id') == parentId)  
                                        parentItemList = item;
                                });
                                if (parentItemList)
                                {
                                    const parentClone = parentItemList.cloneNode(true);
                                    parentClone.classList.add('disable-element');
                                    this._footSection.appendChild(parentClone);
                                }
                            }
                            itemList.classList.add('in-done-list');
                            this._footSection.appendChild(itemList);
                        }
                    });
                });
                
                if (checkedItems.length > 0)
                {
                    this._footHeader.classList.remove('hide-element');
                    let text = (checkedItems.length == 1 ? ' Elemento completado' : ' Elementos completados');
                    this._textDropDown.textContent = checkedItems.length + text;
                }
                break;
            }
            case 2:
            {
                this._footHeader.classList.add('hide-element');
                let checkedItems = this._getCheckedItems();
                checkedItems.forEach(item => this._bodySection.childNodes.forEach(itemList => { if (item.id == itemList.getAttribute('item-id')) itemList.remove(); }));
                break;
            }
        }
    }
    __addOrUpdateItem(element, del=false, data=null)
    {
        if (data == null) data = this.data;
        
        let updated = false;
        let items = (data?.items??[]);
        let itemId = (element.getAttribute('item-id') ?? '_');
        let parentId = (element.getAttribute('parent-id')??'_');

        if (items && items.length > 0)
        {
            items.forEach((item, i) => 
            {
                if (!updated && itemId == item.id)
                {
                    if (del)
                    {
                        let delSubItems = [];

                        if (items[i].items && items[i].items.length > 0)
                        {
                            this._bodySection.childNodes.forEach((itm) => {
                                if ((itm.getAttribute('parent-id')??'') == itemId) delSubItems.push(itm);
                            });
                        }
                        items.splice(i, 1);
                        delSubItems.forEach(subItem => subItem.remove());
                        element.remove();
                    }
                    else
                    {
                        items[i].text = element.getAttribute('item-text');
                        items[i].done = ((element.getAttribute('item-done') ?? '') === 'true');
                        if (items[i].items && items[i].items.length > 0)
                            items[i].items.forEach(subitem => subitem.done = items[i].done);
                        if (this.onItemChanged)
                            this.onItemChanged(item);
                    }
                    updated = true;
                }
                else if (item.items && item.items.length > 0 && parentId == item.id)
                {
                    items[i].items = this.__addOrUpdateItem(element, del, item);
                    updated = true;
                }
            });
        }

        if (!updated)
        {
            items.push({
                id: element.getAttribute('item-id'), 
                text: element.getAttribute('item-text'),
                done: ((element.getAttribute('item-done') ?? '') === 'true'),
                _meta: {
                    percent: -1, 
                    progress: '100'
                }
            });
            this._bodySection.lastChild.before(element);
        }

        return items;
    }
    _addOrUpdateItem(element, del=false)
    {
        this.data['items'] = this.__addOrUpdateItem(element, del);
        this._valideCheckedItems();
    }
    _valideCheckedItems()
    {
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => 
            {
                if (item.items && item.items.length > 0)
                {
                    let allSubItemsChecked = true;
                    item.items.forEach(subItem => {
                        if(!subItem.done) allSubItemsChecked = false;
                    });
                    item.done = allSubItemsChecked;
                }
            });
        }
    }
    _getCheckedItems()
    {
        let itemsCompleted = [];
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => {
                if (item.done == true) itemsCompleted.push(item);
                if (item.items && item.items.length > 0){
                    item.items.forEach(subitem => {
                        if (subitem.done == true) itemsCompleted.push(subitem);
                    });
                }
            });
        }
        return itemsCompleted;
    }
    _getUncheckedItems()
    {
        let incompleteItems = [];
        if (this.data && this.data.items && this.data.items.length > 0)
        {
            this.data.items.forEach(item => {
                if (item.done == false) incompleteItems.push(item);
                if (item.items && item.items.length > 0){
                    item.items.forEach(subitem => {
                        if (subitem.done == false) incompleteItems.push(subitem);
                    });
                }
            });
        }
        return incompleteItems;
    }
    _initTreeValues()
    {
        let v = (this.getAttribute("key") ?? "").trim();
        this.key = (v || this.key);
        v = (this.getAttribute("parentkey") ?? "").trim();
        this.parentKey = (v || this.parentKey);
        v = (this.getAttribute("childs-field") ?? "").trim();
        this.childs = (v || this.childs);
    }
    _getTreeOptions()
    {
        if (!this.treeOptions || Object.keys(this.treeOptions) < 1)
        {
            this.treeOptions =
            {
                key: this.key,
                parentkey: this.parentKey,
                childs: this.childs
            }
        }
        return this.treeOptions;
    }

    TreeArray=(dataArray, treeOptions=null)=>
    {
        if (!treeOptions) treeOptions = this._getTreeOptions();
        
        const positionObj = (list=[], data={}) => 
        {
            let parentObj = null;
            let sourcData = null;

            const _search = listObj => 
            {
                return listObj.some((obj, idx) =>  {
                    if (data[treeOptions.parentkey] == (obj[treeOptions.key] ?? '_'))
                        parentObj = obj;
                    else if ((data[treeOptions.key] ?? '|') == (obj[treeOptions.key] ?? '_'))
                        sourcData = { listObj, idx };
                    return ((parentObj && sourcData) || _search((obj[treeOptions.childs] ?? [])));
                });
            }
            
            if (!_search(list)) return;

            const parentChilds = (parentObj[treeOptions.childs] ?? []);
            parentChilds.push( ...sourcData.listObj.splice(sourcData.idx,1) );
            parentObj[treeOptions.childs] = parentChilds;
        }

        if (dataArray && dataArray.length > 0)
        {
            let copyArray = JSON.parse(JSON.stringify(dataArray));

            copyArray.forEach(data => {
                if (data[treeOptions.parentkey] != undefined) 
                    positionObj(dataArray, data);
            });
        }

        return dataArray;
    }
    setData(obj)
    {
        let treeOp = this._getTreeOptions();
        this.data = obj;
        this.TreeArray(obj[treeOp.childs],treeOp);
        
        if (this.data && this.data[treeOp.childs] && this.data[treeOp.childs].length > 0)
        {
            this.data[treeOp.childs].forEach(item => 
            {
                item[treeOp.key] = (item[treeOp.key] ?? this._generateUUID());
                item['_meta'] =  { percent:(item.meta?.percent ?? -1), progress:(item.meta?.progress ?? '100') };
                if (item[treeOp.childs] && item[treeOp.childs].length > 0)
                {
                    item[treeOp.childs].forEach(subItem => { 
                        subItem[treeOp.key] = (subItem[treeOp.key] ?? this._generateUUID());
                        subItem['_meta'] = { percent:(subItem.meta?.percent ?? -1), progress:(subItem.meta?.progress ?? '100') };
                    });
                }
            });
        }
        this._refreshView();
    }
    getData(withoutmeta = false)
    {
        let temp = JSON.parse(JSON.stringify(this.data));
        
        if (withoutmeta)
        {
            temp.items.forEach(t => {
                delete t._meta
                if (t.items && t.items.length > 0)
                    t.items.forEach(s => delete s._meta);
            });
        }
        
        return temp;
    }
    getItem(id, withoutindex=true)
    {
        let itm = null;
        let temp = JSON.parse(JSON.stringify(this.data));

        if (temp && temp.items && temp.items.length > 0)
        {
            temp.items.forEach((item, i) => 
            {
                if (item.id == id)
                {
                    itm = item;
                    if (!withoutindex) itm['index'] = i;
                }
                if (!itm && item.items && item.items.length > 0) 
                {
                    item.items.forEach((subItem, i2) => 
                    {
                        if (subItem.id == id)
                        {
                            itm = subItem;
                            if (!withoutindex)
                            {
                                itm['index']= i2;
                                itm['subindex']= i;
                            }
                        }
                    });
                }
            });
        }

        return itm;
    }
}

class StackEdit extends HTMLElement
{
    attributes = null;
    data = {};
    captionA = '';
    captionB = '';
    captionC = '';
    captionD = '';
    title = '';
    subtitle = '';
    colorField = '';
    backColorField = '';
    stylesField = '';

    _stackContainer = null;
    onElementClick = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return this.attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        if (this._ixRaiz) this._ixTemaLigar();   // reconectado: vuelve a tomar el tema
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow =      this.attachShadow({ mode: 'closed' });
            this.captionA =     (this.getAttribute('caption-a')??'a');
            this.captionB =     (this.getAttribute('caption-b')??'b');
            this.captionC =     (this.getAttribute('caption-c')??'c');
            this.captionD =     (this.getAttribute('caption-d')??'d');
            this.title =        (this.getAttribute('title')??'title');
            this.subtitle =     (this.getAttribute('subtitle')??'subtitle');
            this.colorField =   (this.getAttribute('color-field')??'#000');
            this.backColorField = (this.getAttribute('backcolor-field')??'#FFF');
            this.stylesField = (this.getAttribute('styles-field')??'styles');

            this._stackContainer = this._createFullElement('div', { id:'_stackContainer' });

            shadow.innerHTML = `
                <style>
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; }
                    .flex-column{ flex-direction: column; }
                    .wrap{ flex-wrap: wrap; }
                    .gap-1{gap:4px;} .gap-2{gap:8px;}
                    .justify-content-start{ justify-content: start; } .justify-content-center{ justify-content: center; } .justify-content-end{ justify-content: end; }
                    .align-items-start{ align-items: start; } .align-items-center{ align-items: center; } .align-items-end{ align-items: end; }
                    .fz-sm{ font-size: .8rem; } .fz-normal{ font-size: 1rem; } .fz-big1{ font-size: 1.2rem; } .fz-big2{ font-size: 1.4rem; }
                    .fw-bold{ font-weight: bold; }
                    .grow-1{ flex-grow: 1; }
                    .w-100{ width: 100%; }
                    .bordered{ border: 1px solid #DDD; }
                    .noborder{ border: none !important; outline: none !important; }
                    .rounded{ border-radius: 6px; }
                    .p-1{ padding: 4px; } .p-2{ padding: 8px; } .p-3{ padding: 12px; } .p-4{ padding: 16px; } .p-5{ padding: 32px; }
                    .ps-1{ padding-left: 4px; }.ps-2{ padding-left: 8px; }.ps-3{ padding-left: 12px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                    .pe-1{ padding-right: 4px; }.pe-2{ padding-right: 8px; }.pe-3{ padding-right: 12px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                    .borderx{ border-top: 6px solid transparent; border-bottom: 6px solid transparent; }
                    .text-secondary{ color: #888; }

                    .stack-item{ display: grid; grid-template-columns: 1.5rem 1fr; }
                    .container-item{ background-color: ${this.backColorField} !important; color: ${this.colorField} !important; outline: 1px solid #DDD; position: relative; margin-top: 1px; }
                    .mov-item{ background: transparent; color: currentColor; cursor: move; }
                    #_stackContainer{ min-height: 30vh; background-color: #F5F5F5; display: flex; flex-direction: column-reverse; }
                    .dragging{ background-color: #F0F8FF !important; transform: scale(1.02); box-shadow: 3px 3px 8px 0 #AAA; }
                    .border-t{ border-top-color: #005CC8; }
                    .border-b{ border-bottom-color: #005CC8; }
                    ` + (this.getAttribute('control-styles') ?? '') + `
                </style>
            `;

            shadow.appendChild(this._stackContainer);
            this._refreshView();

            if (this.hasAttribute('data') && this.getAttribute('data').trim())
            {
                try
                {
                    this.setData(JSON.parse(this.getAttribute('data')));
                }
                catch(error)
                {
                    alert('El valor del atributo "data" no contiene un formato JSON válido');
                    this.data = {};
                }
            }
            this._ixRaiz = shadow;
            this._ixTemaLigar();
        });
    }
    disconnectedCallback() { _ixSoltarTema(this); }

    // Tema (CONTROLES.md): la pila es un panel y cada elemento una tarjeta. color-field y backcolor-field con un valor
    // distinto del de omisión (#000 / #FFF) se respetan; con el de omisión, los colores salen del tema.
    _ixTemaLigar() { return _ixVincularTema(this, 'stack-edit', (V) => this._ixCss(V)); }
    static _ixColorPropio(v, omision) { const s = String(v ?? '').trim().toLowerCase().replace(/\s+/g, ''); return !!s && !omision.includes(s); }
    _ixCss(V)
    {
        const { FS } = _ixT, S = ':host #_stackContainer';
        const fondo = StackEdit._ixColorPropio(this.getAttribute('backcolor-field'), ['#fff', '#ffffff', 'white']);
        const texto = StackEdit._ixColorPropio(this.getAttribute('color-field'), ['#000', '#000000', 'black']);
        return _ixT.sm + `
:host{ color-scheme: var(--ix-t-cs, normal); }
${S}{ background-color: ${V('panel-bg', '#F3F5F8')}; color: ${V('fg', '#1F2328')}; border: 1px solid ${V('card-border', '#E1E5EA')}; border-radius: ${V('radius', '4px')}; padding: 4px 6px 6px; font-family: ${V('font', 'system-ui, sans-serif')}; font-size: ${FS}; }
${S} .container-item{ ${fondo ? '' : `background-color: ${V('bg', '#FFFFFF')} !important; `}${texto ? '' : `color: ${V('fg', '#1F2328')} !important; `}outline: 0; box-shadow: 0 0 0 1px ${V('card-border', '#E1E5EA')}; border-radius: ${V('radius', '4px')}; margin-top: 6px; }
${fondo ? '' : `${S} .container-item:hover{ background-color: ${V('hover-bg', '#EDF2F8')} !important; }\n`}${S} .text-secondary{ color: ${V('muted-fg', '#59636E')}; }
${S} .fz-normal{ font-size: ${FS}; }
${S} .fz-sm{ font-size: calc(${FS} - 2px); }
${S} .fw-bold{ font-weight: ${V('header-weight', '600')}; }
${S} .mov-item{ color: ${V('muted-fg', '#59636E')}; border-radius: ${V('radius', '4px')}; }
${S} .mov-item:focus-visible{ outline: 2px solid ${V('focus-ring', '#2F66CC')} !important; outline-offset: -2px; }
${S} .dragging{ background-color: ${V('sel-bg-soft', '#DCE7FA')} !important; box-shadow: 0 6px 18px rgba(0,0,0,.18); }
${S} .border-t{ border-top-color: ${V('accent', '#2F66CC')}; }
${S} .border-b{ border-bottom-color: ${V('accent', '#2F66CC')}; }
`;
    }
    _refreshView()
    {
        this._stackContainer.innerHTML = '';
        // Items List
        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => 
            {
                let id = (item.id ?? this._generateUUID());
                this._stackContainer.appendChild(this._createRowItem(item, id));
            });
        }
    }
    _createRowItem(item, id = '')
    {
        const containerItem = this._createFullElement('div', { class:'container-item ps-1 borderx', 'item-id':`${id}` });
        const rowItem = this._createFullElement('div', { class:'stack-item' });
        const movItem = this._createFullElement('button', { class: 'noborder mov-item', draggable: 'true' });
        const rowData = this._createFullElement('div', { class:'p-2 d-flex wrap gap-2' });

        movItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>`;

        // row data
        const sectionASide = this._createFullElement('div', { id:'sectionASide', class:'fz-sm grow-1' });
        const sectionBSide = this._createFullElement('div', { id:'sectionBSide', class:'fz-sm' });
        const sectionTitle = this._createFullElement('div', { id:'sectionTitle', class:'w-100 fw-bold fz-normal'});
        const sectionSubtl = this._createFullElement('div', { id:'sectionSubtl', class:'w-100 fz-normal'});
        const sectionCSide = this._createFullElement('div', { id:'sectionCSide', class:'fz-sm grow-1' });
        const sectionDSide = this._createFullElement('div', { id:'sectionDSide', class:'fz-sm' });

        const headItemSect = this._createFullElement('div', { id:'headItemSect', class:'w-100 d-flex align-items-center'});
        const bodyItemSect = this._createFullElement('div', { id:'bodyItemSect', class:'w-100 d-flex align-items-center wrap' });
        const footItemSect = this._createFullElement('div', { id:'footItemSect', class:'w-100 d-flex align-items-center'});

        sectionASide.textContent = (item?.[this.captionA]??'');
        sectionBSide.textContent = (item?.[this.captionB]??'');
        sectionTitle.textContent = (item?.[this.title]??'');
        sectionSubtl.textContent = (item?.[this.subtitle]??'');
        sectionCSide.textContent = (item?.[this.captionC]??'');
        sectionDSide.textContent = (item?.[this.captionD]??'');

        headItemSect.appendChild(sectionASide);
        headItemSect.appendChild(sectionBSide);
        bodyItemSect.appendChild(sectionTitle);
        bodyItemSect.appendChild(sectionSubtl);
        footItemSect.appendChild(sectionCSide);
        footItemSect.appendChild(sectionDSide);

        rowData.appendChild(headItemSect);
        rowData.appendChild(bodyItemSect);
        rowData.appendChild(footItemSect);

        rowItem.appendChild(movItem);
        rowItem.appendChild(rowData);

        containerItem.appendChild(rowItem);

        containerItem.addEventListener('click', () => {
            let item = this._getItem(containerItem.getAttribute('item-id'), false);
            let index = item.index;
            delete item.index;
            delete item.id;
            if (this.onElementClick)
                this.onElementClick(item, index);
        });

        containerItem.addEventListener('dragstart', (e) => {
            this._draggingItem = containerItem;
            e.dataTransfer.setData('text/plain', containerItem.getAttribute('item-id'));
            containerItem.classList.add('dragging');
        });
        containerItem.addEventListener('dragend', () => {
            containerItem.classList.remove('dragging');
            this._draggingItem = null;
        })
        containerItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this._draggingItem && containerItem.getAttribute('item-id') == this._draggingItem.getAttribute('item-id')) return;
            const rect = containerItem.getBoundingClientRect();
            const limity = (rect.y + (rect.height / 2));

            let y = (e.clientY < limity);

            containerItem.classList.toggle('border-b', !y);
            containerItem.classList.toggle('border-t', y);

            this._topPositionDragEvent = y;
        });
        containerItem.addEventListener('dragleave', (e) => {
            containerItem.classList.remove('border-b');
            containerItem.classList.remove('border-t');
        });
        containerItem.addEventListener('drop', (e) => {
            e.preventDefault();
            containerItem.classList.remove('border-b');
            containerItem.classList.remove('border-t');

            if (this._draggingItem && containerItem.getAttribute('item-id') == this._draggingItem.getAttribute('item-id')) return;

            if (this._draggingItem)
            {
                this._draggingItem.classList.remove('dragging');

                let index = 0;
                let sourceItem = this._getItem(this._draggingItem.getAttribute('item-id'), false);
                
                if (sourceItem)
                    this.data.splice(sourceItem.index, 1);

                let targetItem = this._getItem(containerItem.getAttribute('item-id'), false);
                
                if (this._topPositionDragEvent)
                    index = 1;
                
                if (targetItem)
                {
                    index += targetItem.index;
                    delete sourceItem.index;
                    this.data.splice(index, 0, sourceItem);
                }
            }
            this._refreshView();
        });

        if ((item?.[this.stylesField]??'') != '')
            containerItem.setAttribute('style', (item?.[this.stylesField]??''));

        return containerItem;
    }
    setData(obj)
    {
        this.data = obj;
        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => {
                item['id'] = (item.id ?? this._generateUUID());
            });
        }
        this._refreshView();
    }
    getData()
    {
        const copy = JSON.parse(JSON.stringify(this.data))
        
        if (copy && copy.length > 0)
            copy.forEach(item => {
                delete item.id;
                delete item.index;
            });
        
        return copy;
    }
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _generateUUID()
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    _getItem(id, withoutindex=true)
    {
        let itm = null;
        let temp = JSON.parse(JSON.stringify(this.data));
        
        if (temp && temp.length > 0)
        {
            temp.forEach((item, i) => 
            {
                if (item.id == id)
                {
                    itm = item;
                    if (!withoutindex) itm['index'] = i;
                }
            });
        }
        
        return itm;
    }
}

class DateRange extends HTMLElement
{
    attributes = null;
    data = {};
    onChange = null;

    _iptStr = null;
    _iptEnd = null;
    _hiddenInputStr = null;
    _hiddenInputEnd = null;
    _contnr = null;
    _dateContainer = null;
    _btnEdit = null;
    _btnDone = null;
    _btnUndo = null;
    onChanging = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return  attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow = this.attachShadow({ mode: 'closed' });
            this._contnr = this._createFullElement('div', { id:'DateRange_contnr', class:'w-100 d-flex border'});
            
            this._dateContainer = this._createFullElement('div', { class: "grow-1 d-flex flex-wrap gap-2 align-items-center gap-2 ps-2 wrap" })
            const cntnr1 = this._createFullElement('div', { id: 'DateRange_cntnr1', class:'d-flex wrap align-items-center' });
            const lblStr = this._createFullElement('span', { id:'DateRange_lblStr', class:'induxsoft-form-label text-secondary m-0'});
            this._iptStr = this._createFullElement('input', { type: 'date', id: 'DateRange_iptStr', class:'induxsoft-form-control input-date' });

            if (((this.getAttribute('hide-labels')??'') === 'true'))
            {
                this.setAttribute("start-label","");
                this.setAttribute("end-label","");
            }

            lblStr.textContent = this.hasAttribute("start-label") ?  this.getAttribute("start-label") : "Desde:";
            cntnr1.appendChild(lblStr);
            cntnr1.appendChild(this._iptStr);
            this._dateContainer.appendChild(cntnr1);

            const cntnr2 = this._createFullElement('div', { id:'DateRange_cntnr2', class:'d-flex wrap align-items-center' });
            const lblEnd = this._createFullElement('span', { id:'DateRange_lblEnd', class:'induxsoft-form-label text-secondary m-0'});
            this._iptEnd = this._createFullElement('input', { type: 'date', id: 'DateRange_iptEnd', class:'induxsoft-form-control input-date' });
            lblEnd.textContent = this.hasAttribute("end-label") ?  this.getAttribute("end-label") : "Hasta:";
            cntnr2.appendChild(lblEnd);
            cntnr2.appendChild(this._iptEnd);
            this._dateContainer.appendChild(cntnr2);

            this._contnr.appendChild(this._dateContainer);

            const controlsContainer = this._createFullElement('div', { class: 'd-flex' });
            this._btnEdit = this._createFullElement('button', { id: 'SafeInput_btnEdit', title: 'Edit', class: 'induxsoft-buttons d-flex justify-content-center align-items-center' });
            this._btnDone = this._createFullElement('button', { id: 'SafeInput_btnDone', title: 'Save', class: 'd-none induxsoft-buttons d-flex justify-content-center align-items-center' });
            this._btnUndo = this._createFullElement('button', { id: 'SafeInput_btnUndo', title: 'Cancel', class: 'd-none induxsoft-buttons d-flex justify-content-center align-items-center' });

            this._btnEdit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>`;
            this._btnDone.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>`;
            this._btnUndo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            this._btnEdit.classList.toggle('disable-element', ((this.getAttribute('disabled') ?? '') === 'true'));

            controlsContainer.appendChild(this._btnEdit);
            controlsContainer.appendChild(this._btnDone);
            controlsContainer.appendChild(this._btnUndo);

            this._contnr.appendChild(controlsContainer);

            this._btnEdit.addEventListener('click', () => {
                this._startEdit();
                this._showControlButtons(true);
                this._iptStr.focus();
            });
            this._btnDone.addEventListener('click', async () => {
                this._confirmEdit();
            });
            this._btnUndo.addEventListener('click', () => {
                this._cancelEdit();
                this._showControlButtons(false);
            });

            this._iptStr.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this._iptEnd.focus();
            });
            this._iptEnd.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') this._btnDone.focus();
            });

            const MO = new MutationObserver(()=>{
                this._iptStr.toggleAttribute('disabled', ((this.getAttribute('disabled')??'') === 'true'));
                this._iptEnd.toggleAttribute('disabled', ((this.getAttribute('disabled')??'') === 'true'));
            });

            MO.observe(this, {
                attributes: true,
                attributeFilter: ['disabled']
            });

            shadow.innerHTML = `
                <style>
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; } .d-none{ display: none !important; }
                    .wrap{ flex-wrap: wrap; }
                    .gap-1{gap:4px;} .gap-2{gap:8px;}
                    .justify-content-start{ justify-content: start; } .justify-content-center{ justify-content: center; } .justify-content-end{ justify-content: end; }
                    .align-items-start{ align-items: start; } .align-items-center{ align-items: center; } .align-items-end{ align-items: end; }
                    .grow-1{ flex-grow: 1; }
                    .w-100{ width: 100%; }
                    .text-secondary{ color: #888; }
                    .m-0{ margin: 0 !important; }
                    .border{ border: 1px solid #ced4da; }
                    .ps-1 { padding-left: 4px; } .ps-2 { padding-left: 8px; }
                    .disabled { background-color: #E9ECEF; }
                    .disable-element{ pointer-events: none; background-color: #e9ecef !important; opacity: 1;}
                    .waiting{ pointer-events: none; opacity: .5; cursor: progress; }

                    .induxsoft-form-control{ border: none; outline: 1px solid #ced4da; display: block; width: 100%; padding: 0.375rem 0.75rem !important; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-clip: padding-box; appearance: none; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                    .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] { background-color: #e9ecef; opacity: 1; }
                    .induxsoft-form-label{ margin-bottom: 0.5rem; }
                    .induxsoft-buttons{ font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                    .induxsoft-buttons:hover{ color: #212529;background-color: #F5F5F5; }

                    .input-date{
                        border: none;
                        outline: none;
                        text-align: end;
                        border-bottom: 1px solid transparent;
                        width: min-content !important;
                        font-size: .9rem;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .input-date:focus{
                        border-bottom: 1px solid #005CC8;
                    }
                </style>
            `

            if (this.hasAttribute('data') && this.getAttribute('data').trim() != '')
            {
                try {
                    this.data = JSON.parse(this.getAttribute('data'));
                }
                catch(error) {
                    alert('El valor del atributo "data" no contiene un formato JSON válido');
                    this.data = {};
                }
            }

            if (this.hasAttribute('start') && this.getAttribute('start').trim() != '')
                this.data.start = this.getAttribute('start').trim();
            if (this.hasAttribute('end') && this.getAttribute('end').trim() != '')
                this.data.end = this.getAttribute('end').trim();

            if (this.hasAttribute('hidden-input-name-end') && this.getAttribute('hidden-input-name-end').trim() != '')
            {
                this._hiddenInputEnd = this._createFullElement('input', { type:'hidden', name:this.getAttribute('hidden-input-name-end').trim() });
                this.after(this._hiddenInputEnd);
            }
            if (this.hasAttribute('hidden-input-name-start') && this.getAttribute('hidden-input-name-start').trim() != '')
            {
                this._hiddenInputStr = this._createFullElement('input', { type:'hidden', name:this.getAttribute('hidden-input-name-start').trim() });
                this.after(this._hiddenInputStr);
            }
            this._showControlButtons(false);
            shadow.appendChild(this._contnr);
            this._refreshDates();
            _ixgbLigar(this, shadow, this._contnr, V => DateRange._ixgbCss(V));   // tema (2026-11-03)
        });
        _ixgbReligar(this);
    }
    disconnectedCallback() { _ixgbSoltar(this); }
    static _ixgbCss(V)
    {
        const K = _ixgbK(V);
        return K.chico + `
.ixt.border{ ${K.campo} align-items:stretch; overflow:hidden; }
.ixt:focus-within{ ${K.foco} }
.ixt .disabled{ background:${V('input-disabled-bg', '#EEF1F4')}; }
.ixt > .grow-1{ padding-left:10px; column-gap:14px; row-gap:0; }
.ixt #DateRange_cntnr1, .ixt #DateRange_cntnr2{ gap:6px; }
.ixt .text-secondary{ color:${K.muted}; }
.ixt .induxsoft-form-control.input-date{ ${K.fecha} border-bottom:1px solid transparent; border-radius:0; }
.ixt .induxsoft-form-control.input-date:disabled{ background:transparent; color:${K.muted}; }
.ixt .input-date:focus{ border-bottom-color:${V('accent', '#2F66CC')}; }
.ixt .induxsoft-buttons{ ${K.icono} }
.ixt .induxsoft-buttons:hover{ background:${V('hover-bg', '#EDF2F8')}; color:${V('fg', '#1F2328')}; }
.ixt .induxsoft-buttons:focus-visible{ outline:2px solid ${V('accent', '#2F66CC')}; outline-offset:-2px; }
.ixt #SafeInput_btnDone{ color:${V('accent', '#2F66CC')}; }
.ixt #SafeInput_btnUndo:hover{ background:${V('error-bg', '#FDECEC')}; color:${V('error', '#C62828')}; }
.ixt .induxsoft-buttons.disable-element{ background:${V('input-disabled-bg', '#EEF1F4')} !important; color:${K.muted}; }
.ixt .waiting, .ixt.waiting{ opacity:.6; }
`;
    }

    /**
     * @param {string} tagName Nombre de etiqueta.
     * @param {object} attributes Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}
     * @returns Retorna un **nuevo elemento HTML**
     */
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _refreshDates=()=>
    {
        if (this.data && Object.entries(this.data).length > 0)
        {
            this._iptStr.value = (this.data.start ?? '');
            this._iptEnd.value = (this.data.end ?? '');
            if (this._hiddenInputStr) this._hiddenInputStr.value = (this.data.start ?? '');
            if (this._hiddenInputEnd) this._hiddenInputEnd.value = (this.data.end ?? '');
        }
        else
        {
            this._iptStr.value = '';
            this._iptEnd.value = '';
            if (this._hiddenInputStr) this._hiddenInputStr.value = '';
            if (this._hiddenInputEnd) this._hiddenInputEnd.value = '';
        }

        if (this.onChange) this.onChange(this.data);
    }
    
    // get disabled()
    // {
    //     return ((this.getAttribute('disabled')??'') === 'true');
    // }
    // set disabled(value)
    // {
    //     this.setAttribute('disabled',value);
    // }

    setData=(obj)=>
    {
        this.data = obj;
        this._refreshDates();
    }
    getData=()=>
    {
        return this.data;
    }
    _showControlButtons = (edit = false) => {
        this._btnEdit.classList.toggle('d-none', edit);
        this._btnDone.classList.toggle('d-none', !edit);
        this._btnUndo.classList.toggle('d-none', !edit);
        this._iptStr.toggleAttribute('disabled', !edit);
        this._iptEnd.toggleAttribute('disabled', !edit);
        this._dateContainer.classList.toggle('disabled', !edit);
    }
    _startEdit = () => {
        this._tempValue = {
            start: this._iptStr.value,
            end: this._iptEnd.value,
        }
    }
    _cancelEdit = () => {
        this._iptStr.value = this._tempValue.start;
        this._iptEnd.value = this._tempValue.end;
        if (this._hiddenInputEnd) { this._hiddenInputEnd.value = this._tempValue.end }
        if (this._hiddenInputStr) { this._hiddenInputStr.value = this._tempValue.start }
    }
    _confirmEdit = async () => {
        this._contnr.classList.add('waiting');
        this.style.cursor = 'progress';
        let newValue = {
            start: this._iptStr.value,
            end: this._iptEnd.value,
        }
        let res = await this._cancelChange(newValue);
        if (res) {
            this._cancelEdit();
        }
        else {
            this._showControlButtons(false);
            if (this._hiddenInputEnd) this._hiddenInputEnd.value = newValue.end;
            if (this._hiddenInputStr) this._hiddenInputStr.value = newValue.start;
        }
        this._contnr.classList.remove('waiting');
        this.style.cursor = 'initial';
    }
    _cancelChange = async (newValue) => {
        return new Promise(resolve => {
            if (this.onChanging)
                resolve(this.onChanging(this._tempValue, newValue));
            else
                resolve(false);
        });
    }
}

class SafeInput extends HTMLElement
{
    attributes = null;
    _inputTypes = ['text','email','number','textarea','date','time','datetime','select'];
    _tempValue = '';
    
    _inputSf = null;
    _inputHd = null;
    _btnEdit = null;
    _btnDone = null;
    _btnUndo = null;

    onChanging = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return  attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        if (this._ixRaiz) this._ixTemaLigar();   // reconectado: vuelve a tomar el tema
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow = this.attachShadow({ mode: 'closed' });

            const contanr = this._createFullElement('div', { id:'SafeInput_contnr', class:'d-flex justify-content-center' });
            this._btnEdit = this._createFullElement('button', { id:'SafeInput_btnEdit', title:'Edit', class:'induxsoft-buttons d-flex justify-content-center align-items-center' });
            this._btnDone = this._createFullElement('button', { id:'SafeInput_btnDone', title:'Save', class:'d-none induxsoft-buttons d-flex justify-content-center align-items-center' });
            this._btnUndo = this._createFullElement('button', { id:'SafeInput_btnUndo', title:'Cancel', class:'d-none induxsoft-buttons d-flex justify-content-center align-items-center' });
            this._inputSf = this._getProcessInput();

            this._btnEdit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>`;
            this._btnDone.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>`;
            this._btnUndo.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/></svg>`;
            this._btnEdit.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));
            this._inputSf.setAttribute('disabled','true');

            this._btnEdit.addEventListener('click', () => {
                this._startEdit();
                this._showControlButtons(true);
                this._inputSf.select();
            });
            this._inputSf.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this._inputSf.nodeName != "TEXTAREA")
                    this._confirmEdit(contanr);
            });
            this._btnDone.addEventListener('click', async () => {
                this._confirmEdit(contanr);
            });
            this._btnUndo.addEventListener('click', () => {
                this._cancelEdit();
                this._showControlButtons(false);
            });

            const MO = new MutationObserver(()=>{
                this._btnEdit.classList.toggle('disable-element', ((this.getAttribute('disabled')??'') === 'true'));
            });

            MO.observe(this, {
                attributes: true,
                attributeFilter: ['disabled']
            });

            shadow.innerHTML = `
                <style>
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; } .d-none{ display: none !important; }
                    .wrap{ flex-wrap: wrap; }
                    .gap-1{gap:4px;} .gap-2{gap:8px;}
                    .justify-content-start{ justify-content: start; } .justify-content-center{ justify-content: center; } .justify-content-end{ justify-content: end; }
                    .align-items-start{ align-items: start; } .align-items-center{ align-items: center; } .align-items-end{ align-items: end; }
                    .grow-1{ flex-grow: 1; }
                    .w-100{ width: 100%; }
                    .text-secondary{ color: #888; }
                    .disable-element{ pointer-events: none; background-color: #e9ecef !important; opacity: 1;}
                    .waiting{ pointer-events: none; opacity: .5; cursor: progress; }

                    .induxsoft-form-control{ border: none; outline: 1px solid #ced4da; display: block; width: 100%; padding: 0.375rem 0.75rem !important; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-clip: padding-box; appearance: none; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                    .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] { background-color: #e9ecef; opacity: 1; }
                    .induxsoft-form-label{ margin-bottom: 0.5rem; }
                    .induxsoft-form-select{ display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem !important;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline: 1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none; }
                    .induxsoft-form-select:disabled, .induxsoft-form-select[readonly] { background-color: #e9ecef; opacity: 1; }
                    .induxsoft-buttons{ font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                    .induxsoft-buttons:hover{ color: #212529;background-color: #F5F5F5; }

                    ` + (this.getAttribute('control-styles') ?? '') + `
                </style>
            `

            contanr.appendChild(this._inputSf);
            contanr.appendChild(this._btnEdit);
            contanr.appendChild(this._btnDone);
            contanr.appendChild(this._btnUndo);
            shadow.appendChild(contanr);
            this._ixRaiz = shadow;
            this._ixTemaLigar();
        });
    }
    disconnectedCallback() { _ixSoltarTema(this); }

    // Tema (CONTROLES.md): el contenedor es el campo (como InputKey 2) y los botones van dentro, separados por una
    // línea. Bloqueado (sin editar) se ve como solo lectura; «Guardar» es el botón principal.
    _ixTemaLigar() { return _ixVincularTema(this, 'safe-input', (V) => SafeInput._ixCss(V)); }
    static _ixCss(V)
    {
        const { H, PAD, FS } = _ixT, S = ':host #SafeInput_contnr';
        const campo = `${S} .induxsoft-form-control, ${S} .induxsoft-form-select`;
        return _ixT.sm + `
:host{ color-scheme: var(--ix-t-cs, normal); }
${S}{ align-items: stretch; box-sizing: border-box; min-height: ${H}; background-color: ${V('input-bg', '#FFFFFF')}; color: ${V('input-fg', '#1F2328')}; border: 1px solid ${V('input-border', '#8C959F')}; border-radius: ${V('radius', '4px')}; overflow: hidden; font-family: ${V('font', 'system-ui, sans-serif')}; font-size: ${FS}; transition: border-color .12s, box-shadow .12s; }
${S}:focus-within{ border-color: ${V('accent', '#2F66CC')}; box-shadow: ${_ixT.anillo(V)}; }
${S}:has(> :disabled){ background-color: ${V('input-disabled-bg', '#EEF1F4')}; }
${campo}{ flex: 1 1 auto; min-width: 0; border: 0; outline: 0; border-radius: 0; padding: ${PAD} !important; font-family: inherit; font-size: inherit; line-height: 1.4; color: ${V('input-fg', '#1F2328')}; background-color: transparent; }
${S} .induxsoft-form-select{ padding-right: 2rem !important; ${_ixT.flecha(V)} }
${S} .induxsoft-form-select option{ background-color: ${V('menu-bg', '#FFFFFF')}; color: ${V('menu-fg', '#1F2328')}; }
${S} .induxsoft-form-control:disabled, ${S} .induxsoft-form-control[readonly], ${S} .induxsoft-form-select:disabled{ background-color: transparent; color: ${V('input-fg', '#1F2328')}; -webkit-text-fill-color: currentColor; opacity: 1; }
${S} .induxsoft-form-control::placeholder{ color: ${V('muted-fg', '#59636E')}; opacity: 1; -webkit-text-fill-color: currentColor; }
${S} .induxsoft-buttons{ flex: 0 0 auto; box-sizing: border-box; min-width: calc(${H} - 2px); padding: 0 8px; border: 0; border-left: 1px solid ${V('border', '#E1E5EA')}; outline: 0; border-radius: 0; background-color: transparent; color: ${V('muted-fg', '#59636E')}; font-size: inherit; line-height: 1; }
${S} .induxsoft-buttons:hover{ background-color: ${V('hover-bg', '#EDF2F8')}; color: ${V('fg', '#1F2328')}; }
${S} .induxsoft-buttons:focus-visible{ outline: 2px solid ${V('accent', '#2F66CC')}; outline-offset: -2px; }
${S} #SafeInput_btnEdit{ color: ${V('accent', '#2F66CC')}; }
${S} #SafeInput_btnDone{ background-color: ${V('sel-bg', '#2F66CC')}; color: ${V('sel-fg', '#FFFFFF')}; border-left-color: ${V('sel-bg', '#2F66CC')}; }
${S} #SafeInput_btnDone:hover{ background-color: color-mix(in srgb, ${V('sel-bg', '#2F66CC')} 88%, ${V('fg', '#1F2328')}); color: ${V('sel-fg', '#FFFFFF')}; }
${S} #SafeInput_btnUndo:hover{ background-color: ${V('error-bg', '#FDECEC')}; color: ${V('error', '#C62828')}; }
${S} .induxsoft-buttons.disable-element, ${S} #SafeInput_btnEdit.disable-element{ background-color: ${V('input-disabled-bg', '#EEF1F4')} !important; color: ${V('muted-fg', '#59636E')}; }
:host([disabled="true"]) #SafeInput_contnr{ background-color: ${V('input-disabled-bg', '#EEF1F4')}; }
:host([disabled="true"]) #SafeInput_contnr .induxsoft-form-control, :host([disabled="true"]) #SafeInput_contnr .induxsoft-form-select{ color: ${V('muted-fg', '#59636E')}; }
`;
    }
    /**
     * @param {string} tagName Nombre de etiqueta.
     * @param {object} attributes Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}
     * @returns Retorna un **nuevo elemento HTML**
     */
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _getProcessInput=()=>
    {
        let attrType = (this.hasAttribute('type') ? this.getAttribute('type').trim().toLocaleLowerCase() : 'text');
        let inputType = (this._inputTypes.find(type => type == attrType) ?? 'text');

        let input = null;

        switch(inputType)
        {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
            case 'time':
            {
                input = this._createFullElement('input', { type: inputType, class:'induxsoft-form-control' });
                break;
            }
            case 'datetime':
            {
                input = this._createFullElement('input', { type: 'datetime-local', class:'induxsoft-form-control' });
                break;
            }
            case 'select':
            {
                input = this._createFullElement(inputType, { class:'induxsoft-form-select' });

                if (this.hasAttribute('data-select') && this.getAttribute('data-select').trim() != '')
                {
                    let options = {};

                    try{ options = JSON.parse(this.getAttribute('data-select').trim()); }
                    catch(error){ alert('El valor del atributo "data" no contiene un formato JSON válido\n'+error); }

                    Object.keys(options).forEach(key => {
                        let option = this._createFullElement('option', { value:key });
                        option.textContent = options[key];
                        input.appendChild(option);
                    });
                }
                break;
            }
            default:
            {
                input = this._createFullElement(inputType, { class:'induxsoft-form-control' });
                break;
            }
        }

        if (input) {
            input.value = (this.getAttribute('value')??'');
            if (this.getAttribute('placeholder')) input.setAttribute('placeholder', this.getAttribute('placeholder'));
            if (this.hasAttribute('onchange')) input.setAttribute('onchange', this.getAttribute('onchange'));
        }

        if (this._parseBool(this.getAttribute('hidden-input')))
        {
            this._inputHd = this._createFullElement('input', { type:'hidden', id:'SafeInput_inputHd', name:(this.getAttribute('input-name') ?? '') });
            this._inputHd.value = input.value;
            this.after(this._inputHd);
        }

        return input;
    }
    _showControlButtons=(edit=false)=>
    {
        this._btnEdit.classList.toggle('d-none', edit );
        this._btnDone.classList.toggle('d-none', !edit);
        this._btnUndo.classList.toggle('d-none', !edit);
        this._inputSf.toggleAttribute('disabled', !edit);
    }
    _startEdit=()=>
    {
        this._tempValue = (this._inputSf?.value ?? '');
    }
    _confirmEdit=async(contanr)=>
    {
        contanr.classList.add('waiting');
        this.style.cursor = 'progress';
        let res = await this._cancelChange();
        if (res) {
            this._cancelEdit();
        }
        else {
            this._showControlButtons(false);
            if (this._inputHd) this._inputHd.value = this._inputSf.value;
        }
        contanr.classList.remove('waiting');
        this.style.cursor = 'initial';
    }
    _cancelEdit=()=>
    {
        if (this._inputSf) this._inputSf.value = this._tempValue;
        if (this._inputHd) this._inputHd.value = this._tempValue;
    }
    _cancelChange=async()=>
    {
        return new Promise(resolve => {
            if (this.onChanging) 
                resolve(this.onChanging(this._tempValue, this._inputSf.value));
            else
                resolve(false);
        });
    }
    _parseBool=(value, _default = false)=>
    {
        if (value) return (value.toString().toLowerCase() === 'true');
        return _default;
    }
}

class MediaList extends HTMLElement
{
    attributes = null;
    data = [];
    contanr = null;
    dragSrc = null;
    _key_id = '__internal_id__';

    canArrange = true;
    canDrag = true;
    canDrop = true;
    canDelete = true;
    highlightFirst = true;
    mediaProp = 'url';
    miniatureProp = 'mini';
    labelProp = '';
    removeOnMove = true;
    backColorMedia = '#FFF';
    outlineSelected = false;
    maxSizeMedia = '8rem';
    onClicking = null;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }
    static get observedAttributes()
    {
        return  attributes;
    }
    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }
    connectedCallback()
    {
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow = this.attachShadow({ mode: 'closed' });
            const ppanel = this._createFullElement('div', { id:'MediaList_ppanel', class: 'p-1 bordered' });
            this.contanr = this._createFullElement('div', { id:'MediaList_contnr' });

            this._initProperties();
            
            shadow.innerHTML = `
                <style>
                    .bordered{ outline: 1px solid #DDD; }
                    .w-100{ width: 100%; } .h-100{ height: 100%; }
                    .p-05 { padding: 2px; } .p-1{ padding: 4px; } .p-2{ padding: 8px; } .p-3{ padding: 12px; } .p-4{ padding: 16px; } .p-5{ padding: 32px; }
                    .ps-1{ padding-left: 4px; }.ps-2{ padding-left: 8px; }.ps-3{ padding-left: 12px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                    .pe-1{ padding-right: 4px; }.pe-2{ padding-right: 8px; }.pe-3{ padding-right: 12px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                    
                    #MediaList_contnr { width: 100%; min-width: 1rem; min-height: 5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(1rem, ${this.maxSizeMedia})); grid-auto-rows: minmax(1rem, ${this.maxSizeMedia}); }
                    .media-item { border: 8px solid transparent; transition: .5s; position:relative; position: relative; }
                    .dragging { border: 24px solid transparent; }
                    .dragging .img { box-shadow: 4px 4px 8px 0 #DDD !important; }
                    .btn-delete { cursor:pointer; margin: 4px 4px 4px 0; display: flex; align-items:center; justify-content: center; }
                    .label-img { margin: 4px 0px 4px 4px; text-wrap: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1; font-size: 14px; }
                    .btn-delete, .label-img{ opacity: .9; background-color: #FFF; color: #000; }
                    .btn-delete:hover, .label-img:hover { opacity: 1; }
                    /* .label-img:hover{ position: absolute; left:0; text-wrap:wrap; bottom: 0; } */
                    .container-controls{ display: flex; justify-content: end; gap: 4px; position:absolute; bottom: 0px; right: 0px; width: 100%;}
                    .border-l { border-left: 24px solid transparent !important; border-top: 24px solid transparent !important; }
                    .border-r { border-right: 24px solid transparent !important; border-bottom: 24px solid transparent !important; }
                    .highlight { border-color: #E2F2FF; }
                    .drag-container { background-color: #F5F5F5; border: 1px dashed; }
                    .img{ background-repeat: no-repeat; background-size: contain; background-position: center; background-color: #FFF; }
                    .draggable-item { cursor: move; }
                    .outline-element { outline: 2px solid #000 !important; }
                </style>
            `;

            ppanel.appendChild(this.contanr);
            shadow.appendChild(ppanel);

            if (this.hasAttribute('data') && this.getAttribute('data').trim()) 
            {
                try {
                    this.setData(JSON.parse(this.getAttribute('data'))); }
                catch(error) {
                    alert('El valor del atributo "data" no contiene un formato JSON válido');
                    this.data = [];
                }
            }

            this._refreshView();
            _ixgbLigar(this, shadow, ppanel, V => MediaList._ixgbCss(V));   // tema (2026-11-03)
        });
        _ixgbReligar(this);
    }
    disconnectedCallback() { _ixgbSoltar(this); }
    static _ixgbCss(V)
    {
        const K = _ixgbK(V);
        return K.chico + `
.ixt{ outline:0; box-sizing:border-box; background:${V('input-bg', '#fff')}; color:${V('input-fg', '#1F2328')}; border:1px solid ${V('input-border', '#8C959F')}; border-radius:${V('radius', '4px')}; font-family:${K.font}; font-size:${K.FS}; color-scheme:var(--ix-t-cs, normal); }
.ixt .img.bordered{ outline:1px solid ${K.sep}; border-radius:${V('radius', '4px')}; }
:host(:not([back-color-media])) .ixt .img{ background-color:${V('input-bg', '#fff')} !important; }
.ixt .media-item.highlight{ border-color:${V('sel-bg-soft', '#DCE7F7')}; }
.ixt .media-item.highlight > .img.bordered{ outline-color:${V('accent', '#2F66CC')}; }
.ixt .btn-delete, .ixt .label-img{ opacity:.95; background:${V('bg', '#fff')}; color:${V('fg', '#1F2328')}; border-radius:${V('radius', '4px')}; font-family:inherit; }
.ixt .label-img{ font-size:12px; padding:2px 6px; }
.ixt .btn-delete{ min-width:22px; }
.ixt .btn-delete:hover{ opacity:1; background:${V('error-bg', '#FDECEC')}; color:${V('error', '#C62828')}; }
.ixt .drag-container{ background:${V('hover-bg', '#EDF2F8')}; border:1px dashed ${V('accent', '#2F66CC')}; }
.ixt .dragging .img{ box-shadow:0 6px 18px rgba(0,0,0,.18) !important; }
.ixt .outline-element{ outline:2px solid ${V('accent', '#2F66CC')} !important; }
`;
    }

    // Internal Functions
    _refreshView(preserveElements=false)
    {
        if (preserveElements) this.data = this.getData(false);
        this.contanr.innerHTML = '';

        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => this.contanr.appendChild(this._createMediaItem(item)));
        }
        this._setItemEvents();

        if (this.highlightFirst && this.contanr.firstChild)
            this.contanr.firstChild.classList.add('highlight');
        
    }
    _createMediaItem(item)
    {
        item[this._key_id] = (item[this._key_id] ?? this._generateUUID());
        const imgi = this._createFullElement('div', { class:'w-100 h-100 img bordered'});

        const container = this._createFullElement('div', { class:'media-item', draggable:'true', data: JSON.stringify(item), id: item[this._key_id] });
        const containerControls = this._createFullElement('div', { class:'container-controls' });
        container.appendChild(imgi);
        imgi.appendChild(containerControls);

        if (this.labelProp != '')
        {
            const text = (item[this.labelProp] ?? '')
            const label = this._createFullElement('small', { class:'p-05 label-img', title:text });
            label.textContent = text;
            containerControls.appendChild(label);
        }

        if (this.canDelete)
        {
            let btnDelete = this._createFullElement('div', { class:'p-05 btn-delete', title:'Eliminar' });
            btnDelete.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/></svg>';
            containerControls.appendChild(btnDelete);
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                this.contanr.removeChild(container);
            });
        }

        let img = '';
        if (item[this.miniatureProp])
            img = (item[this.miniatureProp] ?? '');
        if (img.trim() == '')
            img = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="lightgray" class="bi bi-image-alt" viewBox="0 0 16 15"><path d="M7 2.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm4.225 4.053a.5.5 0 0 0-.577.093l-3.71 4.71-2.66-2.772a.5.5 0 0 0-.63.062L.002 13v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.5l-4.777-3.947z"/></svg>';

        imgi.style.backgroundImage = `url('${img}')`;
        imgi.style.backgroundColor = this.backColorMedia;

        return container;
    }
    _initProperties()
    {
        this.canArrange = this._parseBool((this.getAttribute('can-arrange') ?? 'true'), true);
        this.canDrag = this._parseBool((this.getAttribute('can-drag') ?? 'true'), true);
        this.canDrop = this._parseBool((this.getAttribute('can-drop') ?? 'true'), true);
        this.canDelete = this._parseBool((this.getAttribute('can-delete') ?? 'true'), true);
        this.highlightFirst = this._parseBool((this.getAttribute('highlight-first') ?? 'true'), true);
        this.mediaProp = (this.getAttribute('media-prop') ?? 'url');
        this.miniatureProp = (this.getAttribute('miniature-prop') ?? 'mini');
        this.labelProp = (this.getAttribute('label-prop') ?? '');
        this.backColorMedia = (this.getAttribute('back-color-media') ?? '#FFF');
        this.outlineSelected = this._parseBool((this.getAttribute('outline-selected') ?? 'false'), false);
        let maxsize = (this.getAttribute('max-size-media') ?? '');
        this.maxSizeMedia = (maxsize.trim() != '' ? maxsize.trim() : '8rem');
    }
    _setItemEvents()
    {
        let _XPositionDragEvent = 0;
        const getTarget = (e) =>
        {
            let target = e.currentTarget;
            if (!e.target.classList.contains('media-item'))
                target = e.target.closest('.media-item');
            return target;
        }
        const handleClick = (e) =>
        {
            e.stopPropagation();
            let target = getTarget(e);
            this.contanr.querySelectorAll('.media-item').forEach(item => {
                item.firstChild.classList.remove('outline-element');
            });
            if (this.outlineSelected) target.firstChild.classList.add('outline-element');
            if (this.onClicking) this.onClicking(JSON.parse(target.getAttribute('data')));
        }
        const handleDragStart = (e) => 
        {
            e.stopPropagation();

            let target = getTarget(e);
            target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('application/json', target.getAttribute('data'));
        }
        const handleDragOver = (e) => 
        {
            e.stopPropagation();
            e.preventDefault();

            let target = getTarget(e);
            const rect = target.getBoundingClientRect();
            const limitx = (rect.x + (rect.width / 2));

            let x = (e.clientX > limitx);
            _XPositionDragEvent = x;

            target.classList.toggle('border-l', !x);
            target.classList.toggle('border-r', x);
        }
        const handleDragEnter = (e) => 
        {
            e.stopPropagation();
            let target = getTarget(e);
            target.classList.add('over');
        }
        const handleDragLeave = (e) => 
        {
            e.stopPropagation();
            let target = getTarget(e);
            target.classList.remove('border-l');
            target.classList.remove('border-r');
        }
        const handleDragEnd = (e) => 
        {
            e.stopPropagation();
            let target = getTarget(e);
            target.classList.remove('dragging');
            target.classList.remove('border-l');
            target.classList.remove('border-r');
            // if (this.removeOnMove)
            //     target.remove();
        }

        const handleDrop = (e,dropInItem=true) => 
        {
            e.stopPropagation();
            
            let itemData = null;
            let jsonData = e.dataTransfer.getData('application/json')
            try { itemData = JSON.parse(jsonData); }
            catch(error) { console.log(jsonData); }

            let target = e.target;
            if (dropInItem){
                target = getTarget(e);
            }
            
            target.classList.remove('dragging');
            target.classList.remove('border-l');
            target.classList.remove('border-r');
            target.classList.remove('drag-container');

            if (itemData)
            {
                // Obtenemos el item soltado si existe
                let item = null;
                this.contanr.querySelectorAll('.media-item').forEach(itm => { if (itm.id == itemData[this._key_id]) item = itm; });

                // Si no existe lo creamos
                if (!item){
                    item = this._createMediaItem(itemData);
                    setEvents(item);
                }
                else if(!this.canArrange)
                {
                    // Detenemos la operación para ordenación de items existentes
                    return false;
                }

                // Agregamos el item al lado del overItem o como hijo si es el contenedor principal
                if (dropInItem)
                {
                    if (_XPositionDragEvent) target.after(item);
                    else target.before(item);
                }
                else
                {
                    target.appendChild(item);
                }

                if (this.highlightFirst)
                {
                    this.contanr.childNodes.forEach(item => item.classList.remove('highlight'));
                    this.contanr.firstChild.classList.add('highlight');
                }
            }
            return false;
        }

        const dropItem = (e) => { handleDrop(e,true) };
        const dropMain = (e) => { handleDrop(e,false) };

        const setEvents = (item) => 
        {
            item.ondragstart =  (this.canDrag ? handleDragStart : null);
            item.ondragover =  (this.canDrop ? handleDragOver: null);
            item.ondragenter =  (this.canDrop ? handleDragEnter: null);
            item.ondragleave =  handleDragLeave;
            item.ondragend =  handleDragEnd;
            item.ondrop =  (this.canDrop ? dropItem : null);
            item.onclick = handleClick;

            item.classList.toggle('draggable-item', this.canDrag);
        }

        this.contanr.querySelectorAll('.media-item').forEach(item => {
            setEvents(item);
        });

        // Container
        const handleDragOverCntainr  = (e) => 
        {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        const handleDragEnterCntainr = (e) => 
        {
            e.stopPropagation();
            e.target.classList.add('drag-container');
        }
        const handleDragLeaveCntainr = (e) =>
        {
            e.stopPropagation();
            e.target.classList.remove('drag-container');
        }

        this.contanr.ondragover = (this.canDrop ? handleDragOverCntainr : null);
        this.contanr.ondragenter = (this.canDrop ? handleDragEnterCntainr : null);
        this.contanr.ondragleave = handleDragLeaveCntainr;
        this.contanr.ondrop = (this.canDrop ? dropMain : null);
    }

    // Public Functions
    setData(data)
    {
        this.data = data;
        if (this.data && this.data.length > 0) 
            this.data.forEach(item => item[this._key_id] = (item[this._key_id] ?? this._generateUUID()));
        this._refreshView();
    }
    getData(withoutid=true)
    {
        let data = [];
        this.contanr.querySelectorAll('.media-item').forEach(element => data.push(JSON.parse(element.getAttribute('data'))));
        if (withoutid) data.forEach(item => delete item[this._key_id]);
        return data;
    }
    addMedia(mediaData)
    {
        try
        {
            let itemData = (typeof(mediaData) == 'object' ? mediaData : JSON.parse(mediaData) );
            this.contanr.appendChild(this._createMediaItem(itemData));
            this._setItemEvents();
        }
        catch(error)
        {
            alert('No fué posible agregar el elemento, revise que los datos tengan un formato JSON válido\n\n');
        }
    }
    removeMediaByIndex(index)
    {
        let items = this.contanr.querySelectorAll('.media-item');
        
        if (index <= items.length-1) {
            items.forEach((item,i) => {
                if (i == index) this.contanr.removeChild(item);
            });
        }
    }
    refreshView()
    {
        this._refreshView(true);
    }

    // Util Functions
    /**
     * @param {string} tagName Nombre de etiqueta.
     * @param {object} attributes Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}
     * @returns Retorna un **nuevo elemento HTML**
     */
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _parseBool=(value, _default = false)=>
    {
        if (value) return (value.toString().toLowerCase() === 'true');
        return _default;
    }
    _generateUUID()
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

class FilterText extends HTMLElement
{
    attributes = null;
    actions = { 
        bloquear:0, 
        cancelar_filtro:1, 
        editar:2, 
        aceptar_edicion:3, 
        cancelar_edicion:4,
        default:5
    };
    action_handler = null;
    dispatch_submit = false;

    constructor() {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }
    static get observedAttributes() {
        return attributes;
    }
    attributeChangeCallback(property, oldValue, newValue) {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }
    connectedCallback()
    {
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow = this.attachShadow({ mode: 'closed' });
            this._writeStyles(shadow);
            
            let text_field = ((this.getAttribute('text-field')??'').trim() != '' ? this.getAttribute('text-field') : 's');
            let placeholder = (this.getAttribute('placeholder') ?? 'Buscar');
            let autosubmit = ((this.getAttribute('auto-submit') ?? 'false') == 'true');
            let id_field = this.id ?? text_field;
            
            const icon_filter = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="16" height="16" viewBox="0 0 8.4666665 8.4666669" version="1.1" id="svg6448" inkscape:version="1.0.2-2 (e86c870879, 2021-01-15)" sodipodi:docname="filter.svg"><defs id="defs6442" /><sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="2.8" inkscape:cx="-4.7783453" inkscape:cy="89.407866" inkscape:document-units="mm" inkscape:current-layer="layer1" inkscape:document-rotation="0" showgrid="false" units="px" inkscape:window-width="1920" inkscape:window-height="1017" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" /><metadata id="metadata6445"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title></dc:title></cc:Work></rdf:RDF></metadata><g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"><path d="M 7.7485116,0.71815461 V 1.4993056 H 7.3579362 l -1.9528767,2.929315 v 3.319891 H 3.0616071 V 4.4286206 L 1.1087301,1.4993056 H 0.71815466 V 0.71815461 Z M 2.0476733,1.4993056 3.8427577,4.1919316 v 2.775429 H 4.6239085 V 4.1919316 L 6.418993,1.4993056 Z" id="path7029" style="stroke-width:0.390575" /></g></svg>';
            const icon_filter_cancel = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="16" height="16" viewBox="0 0 8.4666665 8.4666669" version="1.1" id="svg6448" sodipodi:docname="filter-cancel.svg" inkscape:version="1.0.2-2 (e86c870879, 2021-01-15)"> <defs id="defs6442" /> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="2.8" inkscape:cx="-4.7783453" inkscape:cy="89.407866" inkscape:document-units="mm" inkscape:current-layer="layer1" inkscape:document-rotation="0" showgrid="false" units="px" inkscape:window-width="1920" inkscape:window-height="1017" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" /> <metadata id="metadata6445"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"> <path d="M 2.4278252,0.43472896 7.4281558,5.4354145 6.9281591,5.9354125 5.5763265,4.5839328 5.2817726,5.0262931 V 8.0319373 H 3.1601415 V 5.0262931 L 1.3921153,2.3742541 H 1.0385105 V 1.6670432 H 2.6597914 L 1.9278274,0.93472689 Z M 3.367,2.3742541 H 2.2421832 l 1.625169,2.4377537 V 7.3247277 H 4.5745619 V 4.8120078 L 5.0667801,4.0740343 Z M 7.4034047,1.6670432 V 2.3742541 H 7.0497977 L 6.3726441,3.3898079 5.8627454,2.8795565 6.199732,2.3742541 H 5.3570904 L 4.6498808,1.6670432 Z" id="path7056" style="stroke-width:0.353605" /> </g> </svg>';
            const icon_filter_edit = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="16" height="16" viewBox="0 0 8.4666665 8.4666669" version="1.1" id="svg6448" sodipodi:docname="filter-edit.svg" inkscape:version="1.0.2-2 (e86c870879, 2021-01-15)"><defs id="defs6442"><style id="style7085">.cls-1{fill:#101820;}</style></defs><sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="11.2" inkscape:cx="15.669823" inkscape:cy="31.978525" inkscape:document-units="mm" inkscape:current-layer="layer1" inkscape:document-rotation="0" showgrid="false" units="px" inkscape:window-width="1920" inkscape:window-height="1017" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" inkscape:snap-global="false" /><metadata id="metadata6445"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title /></cc:Work></rdf:RDF></metadata><g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"><g data-name="Layer 18" id="Layer_18" transform="matrix(0.18406198,0.00894607,-0.00890713,0.1832608,2.7189358,2.4995563)"><path class="cls-1" d="M 2,31 A 1,1 0 0 1 1,29.89 l 0.9,-8.17 a 1,1 0 0 1 0.29,-0.6 L 21.27,2.05 a 3.56,3.56 0 0 1 5.05,0 L 30,5.68 a 3.56,3.56 0 0 1 0,5.05 L 10.88,29.8 a 1,1 0 0 1 -0.6,0.29 L 2.11,31 Z m 8.17,-1.91 z M 3.86,22.28 3.13,28.87 9.72,28.14 28.54,9.31 a 1.58,1.58 0 0 0 0,-2.22 L 24.91,3.46 a 1.58,1.58 0 0 0 -2.22,0 z" id="path7091" /><path class="cls-1" d="m 26.52,13.74 a 1,1 0 0 1 -0.7,-0.29 L 18.55,6.18 A 1.0112616,1.0112616 0 0 1 20,4.77 L 27.23,12 a 1,1 0 0 1 0,1.41 1,1 0 0 1 -0.71,0.33 z" id="path7093" /><rect class="cls-1" height="2" transform="rotate(-45,14.718942,17.283215)" width="12.84" x="8.29" y="16.280001" id="rect7095" /></g><g id="g1095" style="fill:#000000" transform="matrix(0.95940959,0,0,0.95940959,-0.05552833,-0.48615617)"><rect style="fill:#000000;stroke:none;stroke-width:0.330123" id="rect1086" width="7.1343002" height="0.70870537" x="0.37797618" y="0.82682306" /><path style="fill:#000000;stroke:none;stroke-width:0.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="M 0.8031994,1.5355282 2.763951,4.204985 2.7403274,7.2287947 3.5199033,6.4728423 V 3.921503 L 1.7008929,1.5119048 Z" id="path1088" /><path style="fill:#000000;stroke:none;stroke-width:0.264583px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="M 6.1421131,1.5355282 4.3231027,4.0159969 4.3467262,5.7405134 5.1026786,5.1263021 5.1263021,4.1813616 7.0870536,1.5355283 Z" id="path1090" /></g></g></svg>';
            const icon_filter_edit_cancel = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="16" height="16" viewBox="0 0 8.4666665 8.4666669" version="1.1" id="svg6448" sodipodi:docname="filter-edit-cancel.svg" inkscape:version="1.0.2-2 (e86c870879, 2021-01-15)"> <defs id="defs6442"> <style id="style7085">.cls-1{fill:#101820;}</style> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="11.2" inkscape:cx="15.669823" inkscape:cy="31.978525" inkscape:document-units="mm" inkscape:current-layer="layer1" inkscape:document-rotation="0" showgrid="false" units="px" inkscape:window-width="1920" inkscape:window-height="1017" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" inkscape:snap-global="false" /> <metadata id="metadata6445"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"> <path d="M 7.3658104,4.4192907 C 7.1700608,4.1628903 6.9145586,3.8343028 6.749814,3.6534856 5.9799386,2.8085007 5.1064452,2.3151043 4.0325333,2.3151043 c -2.5057041,0 -3.7254276,1.7302543 -3.7254276,3.9215029 h 0.7843011 c 0,-1.8049948 0.9391242,-3.1372023 2.9411265,-3.1372023 0.8200474,0 1.5028188,0.3856653 2.1375286,1.0822994 0.1658044,0.18198 0.4818476,0.5970606 0.6983295,0.8784521 H 4.6207588 V 5.844457 H 8.1501115 V 2.3151043 H 7.3658104 Z" fill-rule="evenodd" id="path1097" style="stroke-width:0.39215" /> </g> </svg>';
            const icon_filter_edit_ok = '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="16" height="16" viewBox="0 0 8.4666665 8.4666669" version="1.1" id="svg6448" sodipodi:docname="filter-edit-ok.svg" inkscape:version="1.0.2-2 (e86c870879, 2021-01-15)"> <defs id="defs6442"> <style id="style7085">.cls-1{fill:#101820;}</style> </defs> <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" inkscape:pageopacity="0.0" inkscape:pageshadow="2" inkscape:zoom="11.2" inkscape:cx="15.669823" inkscape:cy="31.978525" inkscape:document-units="mm" inkscape:current-layer="layer1" inkscape:document-rotation="0" showgrid="false" units="px" inkscape:window-width="1920" inkscape:window-height="1017" inkscape:window-x="-8" inkscape:window-y="-8" inkscape:window-maximized="1" inkscape:snap-global="false" /> <metadata id="metadata6445"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g inkscape:label="Capa 1" inkscape:groupmode="layer" id="layer1"> <path clip-rule="evenodd" d="m 7.4336501,1.2011754 c -0.09656,-0.097219 -0.2537587,-0.097219 -0.3496598,0 L 3.3992157,4.8688131 c -0.09656,0.097878 -0.2540884,0.097878 -0.3499893,0 L 1.4347275,3.2246541 C 1.3869417,3.1758797 1.324326,3.1518221 1.2613806,3.1514925 1.1977762,3.151163 1.1331831,3.1752206 1.0847382,3.2246541 L 0.37124767,3.8659717 c -0.0474562,0.048774 -0.073161,0.1097421 -0.073161,0.1733468 0,0.063934 0.0257048,0.1308341 0.0734911,0.179279 L 1.9995883,5.92702 c 0.09623,0.097549 0.2540884,0.255736 0.3499893,0.3526257 L 3.0495563,6.985227 c 0.09623,0.09656 0.2534292,0.09656 0.3499893,0 L 8.1339593,2.2593823 c 0.096557,-0.096889 0.096557,-0.2560657 0,-0.3529554 z" fill-rule="evenodd" id="path1108" style="stroke-width:0.329556" /> </g> </svg>';

            const container = this._createFullElement('div', { class: 'd-flex' });
            const div_search = this._createFullElement('div', { class:'grow-1 p-relative d-flex' })
            const ipt_search = this._createFullElement('input', { class: 'induxsoft-form-control', placeholder: placeholder });
            const div_hidden = this._createFullElement('div', { class:'div-hidden' })
            const ipt_hidden = this._createFullElement('input', { type: "hidden", name: text_field, id: id_field });

            const btn_filter = this._createFullElement('button', { class: 'induxsoft-buttons button-icon', title:'Filtrar' }, icon_filter);
            const btn_filter_cancel = this._createFullElement('button', { class: 'induxsoft-buttons button-icon', title:'Cancelar' }, icon_filter_cancel);
            const btn_filter_edit = this._createFullElement('button', { class: 'induxsoft-buttons button-icon', title:'Editar' }, icon_filter_edit);
            const btn_filter_edit_cancel = this._createFullElement('button', { class: 'induxsoft-buttons button-icon', title:' Cancelar edición' }, icon_filter_edit_cancel);
            const btn_filter_edit_ok = this._createFullElement('button', { class: 'induxsoft-buttons button-icon', title:'Aplicar' }, icon_filter_edit_ok);
            
            div_search.appendChild(ipt_search);
            div_search.appendChild(div_hidden);
            container.appendChild(div_search);
            container.appendChild(btn_filter);
            container.appendChild(btn_filter_edit);
            container.appendChild(btn_filter_cancel);
            container.appendChild(btn_filter_edit_ok);
            container.appendChild(btn_filter_edit_cancel);

            // Ocultar/mostrar todos los botones
            const hidde_buttons = (hidde=true) =>
            {
                btn_filter.classList.toggle('d-none', hidde);
                btn_filter_cancel.classList.toggle('d-none', hidde);
                btn_filter_edit.classList.toggle('d-none', hidde);
                btn_filter_edit_cancel.classList.toggle('d-none', hidde);
                btn_filter_edit_ok.classList.toggle('d-none', hidde);
            }

            // Mostrar un botón
            const show_button = button =>
            {
                button.classList.remove('d-none');
            }

            // Desactivar/activar input search
            const disable_input = (disable = true) =>
            {
                ipt_search.disabled = disable;
                div_hidden.classList.toggle('d-none', !disable);
            }

            // Manejador de acciones del input search
            let temp_val = '';

            this.action_handler = (action) =>
            {
                hidde_buttons(true);

                switch (action) 
                {
                    case this.actions.bloquear:
                    {
                        show_button(btn_filter_edit);
                        show_button(btn_filter_cancel);
                        disable_input(true);
                        break;
                    }
                    case this.actions.cancelar_filtro:
                    {
                        ipt_search.value = '';
                        this._submitFilter(ipt_search, ipt_hidden);
                        break;
                    }
                    case this.actions.editar:
                    {
                        temp_val = ipt_search.value;
                        disable_input(false);
                        show_button(btn_filter_edit_cancel);
                        show_button(btn_filter_edit_ok);
                        ipt_search.select();
                        break;
                    }
                    case this.actions.aceptar_edicion:
                    {
                        this._submitFilter(ipt_search, ipt_hidden);
                        break;
                    }
                    case this.actions.cancelar_edicion:
                    {
                        ipt_search.value = temp_val;
                        this.action_handler(this.actions.bloquear);
                        break;
                    }
                    case this.actions.default:
                    {
                        show_button(btn_filter);
                        disable_input(false);
                        break;
                    }
                }
            }

            // Establecer valor inicial
            let value = (this.getAttribute('value') ?? '').trim();
            if (value == '' && (this.getAttribute('url-parse') ?? 'false') == 'true')
                value = (this._getURLParam(text_field) ?? '');

            ipt_search.value = value;
            ipt_hidden.value = ipt_search.value;

            // Eventos
            ipt_search.addEventListener('keydown', e => {
                if (e.key === "Enter") {
                    if (autosubmit) this.action_handler(this.actions.aceptar_edicion);
                    else this.action_handler(this.actions.bloquear);
                }
            });

            ipt_search.addEventListener('input', (e) => { ipt_hidden.value = ipt_search.value });

            div_hidden.addEventListener('click', e => this.action_handler(this.actions.editar));
            btn_filter.addEventListener('click', e => this.action_handler(this.actions.aceptar_edicion));
            btn_filter_cancel.addEventListener('click', e => this.action_handler(this.actions.cancelar_filtro));
            btn_filter_edit.addEventListener('click', e => this.action_handler(this.actions.editar));
            btn_filter_edit_cancel.addEventListener('click', e => this.action_handler(this.actions.cancelar_edicion));
            btn_filter_edit_ok.addEventListener('click', e => this.action_handler(this.actions.aceptar_edicion));

            let filtered = (ipt_search.value.trim() != '');
            let initial_action = (filtered ? this.actions.bloquear : this.actions.default);
            this.action_handler(initial_action);

            shadow.appendChild(container);
            this.after(ipt_hidden);
            _ixgbLigar(this, shadow, container, V => FilterText._ixgbCss(V));   // tema (2026-11-03)
        });
        _ixgbReligar(this);
    }
    disconnectedCallback() { _ixgbSoltar(this); }
    static _ixgbCss(V)
    {
        const K = _ixgbK(V);
        return K.chico + `
.ixt{ ${K.campo} align-items:stretch; overflow:hidden; }
.ixt:focus-within{ ${K.foco} }
.ixt .induxsoft-form-control{ ${K.texto} box-sizing:border-box; height:auto; min-width:0; align-self:stretch; }
.ixt .induxsoft-form-control::placeholder{ color:${K.muted}; opacity:1; }
.ixt .induxsoft-form-control:disabled{ background:${V('input-disabled-bg', '#EEF1F4')}; color:${K.muted}; }
.ixt .induxsoft-buttons{ ${K.icono} }
.ixt .induxsoft-buttons:hover{ background:${V('hover-bg', '#EDF2F8')}; color:${V('fg', '#1F2328')}; }
.ixt .induxsoft-buttons:focus-visible{ outline:2px solid ${V('accent', '#2F66CC')}; outline-offset:-2px; }
.ixt .induxsoft-buttons[title="Filtrar"], .ixt .induxsoft-buttons[title="Aplicar"]{ color:${V('accent', '#2F66CC')}; }
.ixt .induxsoft-buttons[title="Cancelar"]:hover, .ixt .induxsoft-buttons[title=" Cancelar edición"]:hover{ background:${V('error-bg', '#FDECEC')}; color:${V('error', '#C62828')}; }
.ixt .button-icon svg{ width:14px; height:14px; }
.ixt .button-icon svg, .ixt .button-icon svg *{ fill:currentColor !important; }
`;
    }
    _writeStyles(shadow)
    {
        shadow.innerHTML = `
            <style>
                .d-flex{ display: flex; }
                .d-none{ display: none !important; }
                .grow-1{ flex-grow: 1; }
                .p-relative{ position: relative; }
                .induxsoft-form-control{ border: none; outline: 1px solid #ced4da; display: block; width: 100%; padding: 0.375rem 0.75rem !important; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-clip: padding-box; appearance: none; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] { background-color: #e9ecef; opacity: 1; }
                .induxsoft-buttons{ font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                .induxsoft-buttons:hover{ color: #212529;background-color: #F5F5F5; }
                .button-icon{ display: flex; align-items: center; justify-content: center; }
                .div-hidden{ border: none; outline: none; position: absolute; inset: 0; background-color: transparent; }
            <style>
        `;
    }
    _createFullElement(tagName = 'div', attributes = {}, html='') {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        if (html) elem.innerHTML = html;
        return elem;
    }
    _getURLParam(param)
    {
        let values = window.location.search;
        const prms = new URLSearchParams(values);
        return prms.get(param);
    }
    _submitFilter(ipt_search, ipt_hidden)
    {
        let idform = 'form';
        if (this.hasAttribute('form') && this.getAttribute('form').trim() != "") idform = this.getAttribute('form');
        const form = this.closest(idform);
        
        if (!form)
        {
            alert('No se encontró el formulario con el selector especificado o dentro del documento');
            return;
        }
        
        ipt_hidden.value = ipt_search.value;

        if (!this.dispatch_submit) {
            form.submit();
        }
        else {
            const event = new Event('submit');
            form.dispatchEvent(event);
        }

        this.action_handler(this.actions.bloquear);
    }
}

class FilterDateRange extends HTMLElement
{
    attributes = null;
    _container = null;
    _field_va1 = null;
    _field_va2 = null;
    _field_mod = null;
    _selection = null;

    modes_panel = [
        { mode: 'month', panel: 'FDR_pnl_monthly' },
        { mode: 'lastdays', panel: '' },
        { mode: 'range', panel: 'FDR_pnl_range' }
    ]

    constructor() {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }
    static get observedAttributes() {
        return attributes;
    }
    attributeChangeCallback(property, oldValue, newValue) {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }
    connectedCallback()
    {
        _ixConstruirAlCargar(this, () =>   // IK-7 (2026-11-02)
        {
            const shadow = this.attachShadow({ mode: 'closed' });
            this._writeStyles(shadow);

            this._container = this._createFullElement('div', { id: 'FDR_container', class: 'border d-flex align-items-center gap-1' });
            this._field_va1 = this._createFullElement('input', { type: 'hidden', id: 'FDR_ipt_v1' });
            this._field_va2 = this._createFullElement('input', { type: 'hidden', id: 'FDR_ipt_v2' });
            this._field_mod = this._createFullElement('input', { type: 'hidden', id: 'FDR_ipt_md', name: (this.getAttribute('mode-field') ?? 'mode') });

            const panel_mode = this._createFullElement('div', { id: 'FDR_pnl_mode' });
            const panel_monthly = this._createFullElement('div', { id: 'FDR_pnl_monthly', class:'grow-1 panel' });
            const panel_range = this._createFullElement('div', { id: 'FDR_pnl_range', class:'grow-1 panel d-none' });

            const select_mode = this._createFullElement('select', { id: 'FDR_sel_mode', class: 'induxsoft-form-select' });
            panel_mode.appendChild(select_mode);

            this._container.appendChild(panel_mode);
            this._container.appendChild(panel_monthly);
            this._container.appendChild(panel_range);

            shadow.appendChild(this._container);
            this.after(this._field_mod);
            this.after(this._field_va1);
            this.after(this._field_va2);

            const now = new Date();

            if (!this.hasAttribute("years-options")) {
                let cy = now.getFullYear();
                let years = [];

                for (let i = (cy - 3); i < (cy + 4); i++) {
                    years.push(i);
                }

                this.setAttribute("years-options",years.join(","));
            }
            if (!this.hasAttribute("lastdays-options")) this.setAttribute("lastdays-options","3,7,15,30");
            if (!this.hasAttribute("custom-range")) this.setAttribute("custom-range","true");

            if ((this.getAttribute('selection')??'').trim() != '')
            {
                try { this._selection = JSON.parse((this.getAttribute('selection')??'{}')); }
                catch { alert('El atributo selection tiene un formato JSON inválido'); }
            }
            else if (!this._selection)
            {
                this._selection = {
                    mode: "month",
                    year: now.getFullYear(),
                    month: (now.getMonth()+1).toString()
                }
            }

            this._fillSelectMode(select_mode);
            this._printMonths(panel_monthly);
            this._printRange(panel_range);
            _ixgbLigar(this, shadow, this._container, V => FilterDateRange._ixgbCss(V));   // tema (2026-11-03)
        });
        _ixgbReligar(this);
    }
    disconnectedCallback() { _ixgbSoltar(this); }

    _createFullElement(tagName = 'div', attributes = {}, html = '') {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        if (html) elem.innerHTML = html;
        return elem;
    }
    _writeStyles(shadow) {
        shadow.innerHTML = `
            <style>
                .text-secondary{ color: #888; }
                .d-flex{ display: flex; }
                .grow-1{ flex-grow: 1; }
                .wrap{ flex-wrap: wrap; }
                .gap-1{gap:5px;} .gap-2{gap:8px;}
                .border{ border: 1px solid #ced4da; }
                .no-border{ border: none !important; outline: none !important; }
                .d-none{ display: none; }
                .align-items-center{ align-items: center; }
                .active-month { background-color: #005CC8 !important; color: #FFF !important; }
                .input-date{ font-size: .9rem !important; }
                .input-date:focus{ outline: 2px solid #005CC8 !important; }
                .fz-9{ font-size: .9rem; }
                /*#FDR_container{ background-color: #EDEDED; }*/
                #FDR_div_datef,#FDR_div_datet{ background-color:#FFF; padding-left: 4px;}
                #FDR_div_months{ display: grid; grid-template-columns: repeat(12, minmax(1rem, 6rem)); }
                .month-button{text-overflow: ellipsis;overflow: hidden;width: auto;}
                .induxsoft-form-control{ border: none; outline: 1px solid #ced4da; display: block; width: 100%; padding: 0.375rem 0.75rem !important; font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-clip: padding-box; appearance: none; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] { background-color: #e9ecef; opacity: 1; }
                .induxsoft-buttons{ font-weight: 400;line-height: 1.5;color: #212529;text-align: center;text-decoration: none;vertical-align: middle;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;user-select: none;background-color: #FFF;outline:1px solid #ced4da;border: none;padding: 0.375rem 0.75rem;font-size: 1rem;transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; }
                .induxsoft-buttons:hover{ color: #212529;background-color: #F5F5F5; }
                .induxsoft-form-select { display: block; width: 100%; padding: 0.375rem 2.25rem 0.375rem 0.75rem !important; -moz-padding-start: calc(0.75rem - 3px); font-size: 1rem; font-weight: 400; line-height: 1.5; color: #212529; background-color: #fff; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 16px 12px; border: none; outline: 1px solid #ced4da; -webkit-appearance: none; -moz-appearance: none; appearance: none; }
                #FDR_month_select{ display: none; }

                @media screen and (max-width:768px){
                    #FDR_div_months{
                        grid-template-columns: auto;
                        & .month-button{
                            display: none;
                        }
                        & #FDR_month_select{
                            display: initial;
                        }
                    }
                }
            <style>
        `;
    }
    _fillSelectMode(select)
    {
        let opt = this._createFullElement('option', { value: 'month' }, (this.getAttribute('label-months') ?? 'Por mes'));
        select.appendChild(opt);

        let lastDays = (this.getAttribute('lastdays-options') ?? '').split(',');
        let lablDays = (this.getAttribute('label-days') ?? 'Últ. @lastdays días');
        lastDays.forEach(day => {
            let opt = this._createFullElement('option', { value: day }, lablDays.replace('@lastdays', day));
            select.appendChild(opt);
        });

        if ((this.getAttribute('custom-range') ?? 'false') == 'true') {
            let opt = this._createFullElement('option', { value: 'range' }, (this.getAttribute('label-custom') ?? 'Personalizado'));
            select.appendChild(opt);
        }

        let range_field = (this.getAttribute('range-field') ?? 'range');

        select.addEventListener('change', e => {
            this._selectMode(select.value, lastDays);
            if (this._field_mod.value == 'lastdays')
            {
                this._setFieldValues({ name: range_field, value: select.value }, null);
                this._setTisSelection({[this._field_mod.name]: 'lastdays', [range_field]: select.value});
                if (this._isAutoSubmit())
                    this._submitFilter();
            }
        });

        if (this._selection && this._selection[this._field_mod.name])
        {
            if (this._selection[this._field_mod.name] == 'lastdays')
            {
                select.value = (this._selection[range_field] ?? '');
                this._setFieldValues({ name: range_field, value: select.value }, null);
            }
            else
                select.value = this._selection[this._field_mod.name];
        }
        this._selectMode(select.value, lastDays);
    }
    _selectMode(mode, lastDays=null)
    {
        const panels = this._container.querySelectorAll('.panel');
        panels.forEach(p => p.classList.add('d-none'));

        let mp = this.modes_panel.find(m => (m.mode == mode || (lastDays && lastDays.includes(mode) && m.mode == 'lastdays')));
        if (mp) this._field_mod.value = (mp.mode??'');
        
        if (mp && mp.panel != '') {
            const panel = this._container.querySelector('#' + mp.panel);
            if (panel) panel.classList.remove('d-none');
            switch (mp.mode)
            {
                case 'month': this._printMonths(panel); break;
                case 'lastdays': break;
                case 'range': this._printRange(panel); break;
            }
        }
    }
    _printMonths(panel)
    {
        panel.innerHTML = '';

        const container = this._createFullElement('div', { id: 'FDR_cont_montly', class: 'd-flex align-items-center' });
        const div_years = this._createFullElement('div', { id: 'FDR_div_years', class: 'd-flex' });
        const div_months = this._createFullElement('div', { id: 'FDR_div_months', class: 'grow-1' });

        const yearfield = (this.getAttribute('year-field') ?? 'year');
        const monthfield = (this.getAttribute('month-field') ?? 'month');

        const select_year = this._createFullElement('select', { id: 'FDR_sel_year', class: 'induxsoft-form-select', name: yearfield });
        div_years.appendChild(select_year);

        const now = new Date();
        
        let year_opts = (now.getFullYear().toString());
        if ((this.getAttribute('years-options') ?? '').trim() != '') year_opts = this.getAttribute('years-options');
        
        year_opts.split(',').forEach(y => {
            const opt = this._createFullElement('option', { value: y }, y);
            select_year.appendChild(opt);
        });

        const input_mont = this._createFullElement('input', { type: 'hidden', name: monthfield });
        container.appendChild(input_mont);

        if (this._selection && this._selection[this._field_mod.name] == 'month')
        {
            select_year.value = (this._selection[yearfield] ?? '');
            input_mont.value = (this._selection[monthfield] ?? '');
            this._setFieldValues(select_year, input_mont);
        }

        select_year.addEventListener('change', e => { 
            this._setFieldValues(select_year, input_mont);
            this._setTisSelection({[this._field_mod.name]: 'month', [yearfield]: select_year.value, [monthfield]: input_mont.value});
            if (this._isAutoSubmit())
                this._submitFilter();
        });

        const active_month = (button) => {
            div_months.querySelectorAll('.month-button').forEach(b => b.classList.remove('active-month'));
            button.classList.add('active-month');
        }

        const month_select = this._createFullElement('select', { id:'FDR_month_select', class:'induxsoft-form-select' });
        let select_template = ``;

        let names = (this.getAttribute('month-names') ?? 'Enero,Febrero,Marzo,Abril,Mayo,Junio,Julio,Agosto,Septiembre,Octubre,Noviembre,Diciembre').split(',');
        for (let i = 1; i <= 12; i++) {
            let oc = ((Number((input_mont.value ?? '-1')) != i) ? '' : 'active-month');
            const month = this._createFullElement('button', { type: 'button', class: 'induxsoft-buttons month-button ' + oc, value: i }, `<small>${(names[i-1] ?? '')}</small>`);
            div_months.appendChild(month);
            month.onclick = e => {
                active_month(month);
                input_mont.value = month.getAttribute('value');
                this._setFieldValues(select_year, input_mont);
                this._setTisSelection({[this._field_mod.name]:'month', [yearfield]: select_year.value, [monthfield]: input_mont.value});
                if (this._isAutoSubmit())
                    this._submitFilter();
            }

            select_template+=`
                <option value="${i}" ${(oc=='active-month'?'selected':'')}>${(names[i-1] ?? '')}</option>
            `;
        }

        month_select.innerHTML = select_template;
        div_months.appendChild(month_select);

        month_select.onchange = e => {
            input_mont.value = month_select.value;
            this._setFieldValues(select_year, input_mont);
            this._setTisSelection({[this._field_mod.name]:'month', [yearfield]: select_year.value, [monthfield]: input_mont.value});
            if (this._isAutoSubmit())
                this._submitFilter();
        }

        container.appendChild(div_years);
        container.appendChild(div_months);
        panel.appendChild(container);
    }
    _printRange(panel)
    {
        panel.innerHTML = '';

        const container = this._createFullElement('div', { id: 'FDR_cont_range', class: 'd-flex gap-1 align-items-center wrap' });

        const div_datef = this._createFullElement('div', { id: 'FDR_div_datef', class: 'd-flex align-items-center gap-2' }, `<small class="text-secondary">${ (this.getAttribute('label-from') ?? 'Desde:') }</small>`);
        const div_datet = this._createFullElement('div', { id: 'FDR_div_datet', class: 'd-flex align-items-center gap-2' }, `<small class="text-secondary">${ (this.getAttribute('label-to') ?? 'Hasta:') }</small>`);
        
        let name_datef = (this.getAttribute('from-field') ?? 'from');
        let name_datet = (this.getAttribute('to-field') ?? 'to');

        const input_datef = this._createFullElement('input', { type: 'date', id: 'FDR_ipt_datef', class: 'induxsoft-form-control no-border input-date', disabled: '', name: name_datef });
        const input_datet = this._createFullElement('input', { type: 'date', id: 'FDR_ipt_datet', class: 'induxsoft-form-control no-border input-date', disabled: '', name: name_datet });

        if (this._selection && this._selection[this._field_mod.name] == 'range')
        {
            input_datef.value = (this._selection[name_datef] ?? '');
            input_datet.value = (this._selection[name_datet] ?? '');
            this._setFieldValues(input_datef, input_datet);
        }

        const div_cntrls = this._createFullElement('div', { id:'FDR_div_cntrls', class:'d-flex align-items-center' });
        const btn_accept = this._createFullElement('button', { id: 'FDR_btn_accept', type: 'button', class: 'induxsoft-buttons no-border d-none' }, '<small>Aplicar</small>');
        const btn_cancel = this._createFullElement('button', { id: 'FDR_btn_cancel', type: 'button', class: 'induxsoft-buttons no-border d-none' }, '<small>Cancelar</small>');
        const btn_modify = this._createFullElement('button', { id: 'FDR_btn_modify', type: 'button', class: 'induxsoft-buttons no-border' }, '<small>Modificar</small>');

        div_datef.appendChild(input_datef);
        div_datet.appendChild(input_datet);

        container.appendChild(div_datef);
        container.appendChild(div_datet);

        div_cntrls.appendChild(btn_accept);
        div_cntrls.appendChild(btn_cancel);
        div_cntrls.appendChild(btn_modify);
        container.appendChild(div_cntrls);

        panel.appendChild(container);

        const edit_dates = (edit = true) =>
        {
            btn_accept.classList.toggle('d-none', !edit);
            btn_cancel.classList.toggle('d-none', !edit);
            btn_modify.classList.toggle('d-none', edit);

            input_datef.toggleAttribute('disabled', !edit);
            input_datet.toggleAttribute('disabled', !edit);
        }

        let tempf = '';
        let tempt = '';

        btn_cancel.onclick = () => {
            input_datef.value = tempf;
            input_datet.value = tempt;
            edit_dates(false); 
        }
        btn_modify.onclick = () => {
            edit_dates(true); 
            input_datef.focus();
            tempf = input_datef.value;
            tempt = input_datet.value;
        }
        btn_accept.onclick = () => {
            edit_dates(false);
            this._setFieldValues(input_datef, input_datet);
            this._setTisSelection({[this._field_mod.name]:'range', [name_datef]: input_datef.value, [name_datet]: input_datet.value});
            if (this._isAutoSubmit())
                this._submitFilter();
        }
        input_datef.addEventListener('keyup', e => {
            if (e.key == 'Enter') input_datet.focus();
        });
        input_datet.addEventListener('keyup', e => {
            if (e.key == 'Enter') btn_accept.focus();
        });
    }
    _setFieldValues(field1, field2)
    {
        this._field_va1.removeAttribute('name');
        this._field_va2.removeAttribute('name');
        if (field1?.name ?? null) this._field_va1.setAttribute('name', field1.name);
        if (field2?.name ?? null) this._field_va2.setAttribute('name', field2.name);
        this._field_va1.value = (field1?.value ?? '');
        this._field_va2.value = (field2?.value ?? '');
    }
    _submitFilter()
    {
        let idform = 'form';
        if (this.hasAttribute('form') && this.getAttribute('form').trim() != "") idform = this.getAttribute('form');
        const form = this.closest(idform);
        
        if (!form)
        {
            alert('No se encontró el formulario con el selector especificado o dentro del documento');
            return;
        }

        form.submit();
    }
    _isAutoSubmit()
    {
        return ((this.getAttribute('auto-submit') ?? 'false') == 'true');
    }
    _setTisSelection(obj){
        this._selection = {};
        Object.keys(obj??{}).forEach(k=>{
            this._selection[k]=obj[k];
        });
    }

    // Tema (2026-11-03, tests/theme/CONTROLES.md). Solo con tema: el <style data-ix-theme> y la clase ixt del contenedor.
    static _ixgbCss(V)
    {
        const K = _ixgbK(V);
        return K.chico + `
.ixt.border{ ${K.campo} align-items:stretch; gap:0; overflow:hidden; }
.ixt:focus-within{ ${K.foco} }
.ixt #FDR_pnl_mode{ display:flex; flex:0 0 auto; }
.ixt #FDR_div_years{ flex:0 0 auto; }
.ixt #FDR_pnl_mode .induxsoft-form-select, .ixt #FDR_div_years .induxsoft-form-select{ width:auto; }
.ixt .panel:not(.d-none){ display:flex; }
.ixt .panel > div{ flex:1 1 auto; }
.ixt #FDR_cont_montly{ align-items:stretch; }
.ixt .induxsoft-form-select{ ${K.select} border-right:1px solid ${K.sep}; }
.ixt .induxsoft-form-select:hover, .ixt .induxsoft-form-select:focus-visible{ background-color:${V('hover-bg', '#EDF2F8')}; color:${V('fg', '#1F2328')}; }
.ixt option{ background:${V('menu-bg', '#fff')}; color:${V('menu-fg', '#1F2328')}; }
.ixt #FDR_div_months{ align-items:stretch; }
.ixt #FDR_month_select{ border-right:0; }
.ixt .month-button{ outline:0; border:0; border-left:1px solid ${K.sep}; background:transparent; color:${V('input-fg', '#1F2328')}; font-family:inherit; font-size:inherit; line-height:1.2; padding:0 6px; }
.ixt .month-button:first-child{ border-left:0; }
.ixt .month-button:hover{ background:${V('hover-bg', '#EDF2F8')}; color:${V('fg', '#1F2328')}; }
.ixt .month-button.active-month{ background:${V('sel-bg', '#2F66CC')} !important; color:${V('sel-fg', '#fff')} !important; }
.ixt .induxsoft-buttons:focus-visible{ outline:2px solid ${V('accent', '#2F66CC')}; outline-offset:-2px; }
.ixt .induxsoft-buttons small{ font-size:inherit; }
.ixt #FDR_cont_range{ padding:0 4px 0 10px; gap:10px; }
.ixt #FDR_div_datef, .ixt #FDR_div_datet{ background:transparent; padding-left:0; gap:6px; }
.ixt .text-secondary{ color:${K.muted}; }
.ixt .induxsoft-form-control.input-date{ ${K.fecha} }
.ixt .induxsoft-form-control.input-date:disabled{ background:transparent; color:${K.muted}; }
.ixt .input-date:focus{ outline:0 !important; ${K.foco} }
.ixt #FDR_div_cntrls{ gap:4px; padding:3px 0; }
.ixt #FDR_div_cntrls .induxsoft-buttons{ ${K.boton} border:1px solid ${V('input-border', '#8C959F')} !important; min-height:calc(${K.H} - 8px); }
.ixt #FDR_div_cntrls .induxsoft-buttons:hover{ background:${V('hover-bg', '#EDF2F8')}; }
.ixt #FDR_div_cntrls #FDR_btn_accept{ background:${V('sel-bg', '#2F66CC')}; color:${V('sel-fg', '#fff')}; border-color:${V('sel-bg', '#2F66CC')} !important; }
`;
    }
}

// Tema de DateRange, MediaList, FilterText y FilterDateRange (2026-11-03, tests/theme/CONTROLES.md): se ligan con
// InduxsoftTheme.bind al terminar de construirse. Sin tema, o sin InduxsoftTheme (archivo suelto), no dejan nada.
function _ixgbLigar(el, raiz, marca, css)
{
    if (!raiz || el._ixgbH || !el.isConnected) return;
    el._ixgbRaiz = raiz; el._ixgbMarca = marca; el._ixgbCssFn = css;
    const T = (typeof window !== 'undefined') ? window.InduxsoftTheme : null;
    if (!T || typeof T.bind !== 'function') return;
    el._ixgbH = T.bind(el, { root: raiz, name: el.localName, css: (V, e) => css(V, e), onChange: e => _ixgbMarcar(marca, !!e.theme) });
}
function _ixgbMarcar(marca, si)
{
    // Solo se toca la clase si cambia: así, sin tema, el atributo class queda exactamente como lo dejó el control.
    if (marca && marca.classList.contains('ixt') !== si) marca.classList.toggle('ixt', si);
}
function _ixgbSoltar(el)
{
    if (el._ixgbH) { try { el._ixgbH.dispose(); } catch (e) { } el._ixgbH = null; }
    _ixgbMarcar(el._ixgbMarca, false);
}
function _ixgbReligar(el) { if (el._ixgbRaiz && !el._ixgbH) _ixgbLigar(el, el._ixgbRaiz, el._ixgbMarca, el._ixgbCssFn); }
/** Piezas comunes del CSS con tema (tabla de apariencia uniforme de CONTROLES.md). */
function _ixgbK(V)
{
    const H = 'var(--ix-h, var(--ix-t-h))', PAD = 'var(--ix-pad, var(--ix-t-pad))', FS = 'var(--ix-fs, var(--ix-t-fs))', ROW = 'var(--ix-row, var(--ix-t-row))';
    const font = V('font', 'system-ui, sans-serif'), muted = V('muted-fg', '#59636E'), sep = V('border', '#E1E5EA');
    const accent = V('accent', '#2F66CC'), ring = V('focus-ring', '#2F66CC');
    return {
        H, PAD, FS, ROW, font, muted, sep,
        chico: `:host([size="sm"]){ --ix-t-h:28px; --ix-t-pad:3px 8px; --ix-t-fs:13px; --ix-t-row:26px; }\n`,
        campo: `min-height:${H}; box-sizing:border-box; background:${V('input-bg', '#fff')}; color:${V('input-fg', '#1F2328')}; border:1px solid ${V('input-border', '#8C959F')}; border-radius:${V('radius', '4px')}; outline:0; font-family:${font}; font-size:${FS}; color-scheme:var(--ix-t-cs, normal); transition:border-color .12s, box-shadow .12s;`,
        foco: `border-color:${accent}; box-shadow:0 0 0 3px color-mix(in srgb, ${ring} 30%, transparent);`,
        texto: `outline:0; border:0; background:transparent; color:inherit; font-family:inherit; font-size:inherit; font-weight:inherit; line-height:1.4; padding:${PAD} !important; accent-color:${accent};`,
        fecha: `outline:0; border:0; text-align:start; background:transparent; color:inherit; font-family:inherit; font-size:inherit !important; line-height:1.4; padding:2px 4px !important; width:auto; border-radius:${V('radius', '4px')}; accent-color:${accent};`,
        icono: `outline:0; border:0; border-left:1px solid ${sep}; background:transparent; color:${muted}; min-width:calc(${H} - 2px); padding:0 8px; font-size:inherit; display:flex; align-items:center; justify-content:center; cursor:pointer;`,
        boton: `outline:0; background:${V('bg', '#fff')}; color:${V('fg', '#1F2328')}; border-radius:${V('radius', '4px')}; padding:2px 12px; font-family:inherit; font-size:inherit; line-height:1.3; cursor:pointer;`,
        // Flecha del select con gradientes en currentColor (la de hoy es un SVG gris fijo que no se ve en oscuro).
        select: `outline:0; border:0; background-color:transparent; color:inherit; font-family:inherit; font-size:inherit; line-height:1.4; padding:0 28px 0 10px !important; min-height:calc(${H} - 2px); height:auto; cursor:pointer; background-image:linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%); background-position:calc(100% - 15px) 52%, calc(100% - 10px) 52%; background-size:5px 5px, 5px 5px; background-repeat:no-repeat;`
    };
}

customElements.define('edit-select', EditSelect);
customElements.define('input-key', InputKey);
customElements.define('check-list', CheckList);
customElements.define('stack-edit', StackEdit);
customElements.define('date-range', DateRange);
customElements.define('safe-input', SafeInput);
customElements.define('media-list', MediaList);
customElements.define('filter-text', FilterText);
customElements.define('filter-date-range', FilterDateRange);