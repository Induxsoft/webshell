/* <induxsoft-theme v=1.1.0> */
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
 *
 * Este archivo se copia tal cual dentro de induxsoft.controls.editable.js e induxsoft.controls.js, entre los
 * marcadores induxsoft-theme (tests/tools/embed-theme.mjs). Se edita solo aquí.
 */
(function ()
{
    'use strict';
    var VERSION = '1.1.0';
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
    // Temas predeterminados (los de EditTable F8b, mismos valores). Claves sin '--et-'; 'color-scheme' no es variable.
    var EXPLICITOS = {
        claro: {
            'color-scheme': 'light',
            font: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 'font-size': '0.875rem',
            bg: '#FFFFFF', fg: '#1F2328', 'muted-fg': '#59636E',
            'header-bg': '#F3F5F8', 'header-fg': '#1F2328', 'header-border': '#D0D7DE', 'header-weight': '600',
            border: '#E1E5EA', 'row-alt-bg': '#F8FAFC', 'hover-bg': '#EDF2F8',
            'sel-bg': '#2F66CC', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#DCE7FA',
            'active-cell': '#0B3D91', 'active-bg': '#FFFFFF', 'active-fg': '#1F2328', 'active-border': '#FFFFFF',
            accent: '#2F66CC', 'focus-ring': '#2F66CC',
            'input-bg': '#FFFFFF', 'input-fg': '#1F2328', 'input-border': '#8C959F', 'input-disabled-bg': '#EEF1F4',
            'mark-bg': '#FFF1A8', 'mark-fg': '#1F2328', error: '#C62828', 'error-bg': '#FDECEC', warn: '#8A5A00', ok: '#1A7F37', 'neg-fg': '#C62828',
            'tooltip-bg': '#1F2328', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#6E7781', 'badge-color': '#FFFFFF',
            radius: '4px', 'chip-radius': '12px', 'badge-radius': '999px',
            'cell-pad-x': '6px', 'cell-pad-y': '4px', 'header-pad-x': '8px', 'row-height': '1.6rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.5rem', 'num-font': 'inherit'
        },
        oscuro: {
            'color-scheme': 'dark',
            font: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 'font-size': '0.875rem',
            bg: '#15181C', fg: '#E6EDF3', 'muted-fg': '#9DA7B3',
            'header-bg': '#1F242B', 'header-fg': '#E6EDF3', 'header-border': '#3A424C', 'header-weight': '600',
            border: '#2C333B', 'row-alt-bg': '#1A1E23', 'hover-bg': '#242B33',
            'sel-bg': '#2C5AA8', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#1E3352',
            'active-cell': '#8CC2FF', 'active-bg': '#0D1117', 'active-fg': '#E6EDF3', 'active-border': '#0D1117',
            accent: '#6CA8FF', 'focus-ring': '#8CC2FF',
            'input-bg': '#0D1117', 'input-fg': '#E6EDF3', 'input-border': '#5A6572', 'input-disabled-bg': '#1F242B',
            'mark-bg': '#6B5800', 'mark-fg': '#FFF6CC', error: '#FF8A80', 'error-bg': '#3D1F1F', warn: '#E3B341', ok: '#5FD07A', 'neg-fg': '#FF8A80',
            'tooltip-bg': '#E6EDF3', 'tooltip-fg': '#15181C', 'badge-bg': '#56606C', 'badge-color': '#FFFFFF',
            'select-arrow': "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23C9D1D9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e\")",
            radius: '4px', 'chip-radius': '12px', 'badge-radius': '999px',
            'cell-pad-x': '6px', 'cell-pad-y': '4px', 'header-pad-x': '8px', 'row-height': '1.6rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.5rem', 'num-font': 'inherit'
        },
        // Inspirado en la bandeja de agentes de agent.induxsoft.net (ai_broadcast.css).
        jade: {
            'color-scheme': 'light',
            font: '"Segoe UI", system-ui, -apple-system, Roboto, sans-serif', 'font-size': '0.875rem',
            bg: '#FFFFFF', fg: '#1A202C', 'muted-fg': '#5A6577',
            'header-bg': '#F4F6F9', 'header-fg': '#4A5568', 'header-border': '#E2E8F0', 'header-weight': '600',
            'header-transform': 'uppercase', 'header-spacing': '.04em', 'header-font-size': '0.72rem',
            border: '#E2E8F0', 'row-alt-bg': '#F8FAFB', 'hover-bg': '#EEF9F2',
            'sel-bg': '#D1FAE5', 'sel-fg': '#064E3B', 'sel-bg-soft': '#E6F7EE',
            'active-cell': '#128C4A', 'active-bg': '#FFFFFF', 'active-fg': '#1A202C', 'active-border': '#FFFFFF',
            accent: '#0F7A41', 'focus-ring': '#128C4A',
            'input-bg': '#FFFFFF', 'input-fg': '#1A202C', 'input-border': '#A0AEC0', 'input-disabled-bg': '#F4F6F9',
            'mark-bg': '#FDE68A', 'mark-fg': '#1A202C', error: '#C53030', 'error-bg': '#FFF5F5', warn: '#B45309', ok: '#0F7A41', 'neg-fg': '#C53030',
            'tooltip-bg': '#1A202C', 'tooltip-fg': '#FFFFFF', 'badge-bg': '#667781', 'badge-color': '#FFFFFF',
            radius: '8px', 'chip-radius': '20px', 'badge-radius': '999px',
            'cell-pad-x': '12px', 'cell-pad-y': '7px', 'header-pad-x': '12px', 'header-pad-y': '8px', 'row-height': '2rem',
            'input-pad-y': '0.25rem', 'input-pad-x': '0.6rem', 'num-font': 'inherit'
        },
        // Estilo «Libro mayor» de V12 (cuenta-maestra-dk2, recursos/libro-mayor.css).
        'libro-mayor': {
            'color-scheme': 'light',
            font: '"IBM Plex Sans", system-ui, sans-serif', 'font-size': '0.875rem',
            'num-font': '"IBM Plex Mono", ui-monospace, monospace',
            bg: '#FFFFFF', fg: '#1B1F24', 'muted-fg': '#5B6470',
            'header-bg': '#F3F4F6', 'header-fg': '#4E5661', 'header-border': '#D9DDE3', 'header-weight': '600',
            'header-transform': 'uppercase', 'header-spacing': '.04em', 'header-font-size': '0.75rem',
            border: '#E3E6EA', 'row-alt-bg': '#F8F9FA', 'hover-bg': '#EEF1F5',
            'sel-bg': '#1D4F91', 'sel-fg': '#FFFFFF', 'sel-bg-soft': '#E4ECF7',
            'active-cell': '#1B1F24', 'active-bg': '#FFFFFF', 'active-fg': '#1B1F24', 'active-border': '#FFFFFF',
            accent: '#1D4F91', 'focus-ring': '#1D4F91',
            'input-bg': '#FFFFFF', 'input-fg': '#1B1F24', 'input-border': '#9AA3AE', 'input-disabled-bg': '#F3F4F6',
            'mark-bg': '#FBEBD0', 'mark-fg': '#4A3200', error: '#A13A14', 'error-bg': '#FBE9E3', warn: '#6E4700', ok: '#1E6B3A', 'neg-fg': '#A13A14',
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
        ['accent', 'bg'], ['error', 'bg'], ['warn', 'bg'], ['ok', 'bg'], ['neg-fg', 'bg'],
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

class EditTable extends HTMLElement
{
    attributes = null;
    _table = null;
    _shadow = null;
    _current = null;
    _temp_dt = null;
    _current_row = null;
    _dataArrayBackup = null;
    _sorTable=true;
    // F1: versión y funciones disponibles (R6). La lista se llena en las fases siguientes.
    static version = "2.0.0-beta.2";   // integración F1+F2+F3+F4+F5+F6
    static features = [];

    constructor()
    {
        super();
        // F1 (C11): si el documento ya cargó, ese DOMContentLoaded nunca llegaría; no se registra.
        if (!EditTable._f1DocumentoCargado())
            document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    // F1 (C8): atributos observados. Los de §2-§9 de la spec se observan desde ya; en F1 solo
    // show-tree, hidde-selector y hide-row-selector tienen efecto después de la carga.
    static _f1Observados = ['show-tree', 'hidde-selector', 'hide-row-selector',
        'summary-scope', 'multi-select', 'column-chooser', 'column-reorder',
        'design-auto-save', 'design-key', 'design-auto-save-sort',
        'virtual-rows', 'group-panel'];   // F1: P28 de la spec §13

    static get observedAttributes()
    {
        return EditTable._f1Observados.slice();
    }

    // F1 (C9): true si DOMContentLoaded ya se disparó (o se está despachando).
    static _f1DocumentoCargado()
    {
        if (document.readyState === 'complete') return true;
        if (document.readyState === 'loading') return false;
        // 'interactive': puede ser antes del DOMContentLoaded (scripts defer) o después (scripts dinámicos).
        try {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) return nav.domContentLoadedEventStart > 0;
        } catch (e) { }
        return true;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    // F1 (C8): nombre estándar. Durante el parseo los atributos se leen al inicializar, como hoy.
    attributeChangedCallback(name, oldValue, newValue)
    {
        if (newValue === oldValue || !this._f1Inicializada) return;
        this._f3AtributoCambiado?.(name, newValue);   // F3: column-chooser, column-reorder y design-*
        switch (name)
        {
            case 'hidde-selector':
            {
                this.hiddeSelector = (newValue == 'true');
                const selector = this.EdiTable.GetSelector();
                if (selector) selector.classList.toggle('transparent', this.hiddeSelector);
                break;
            }
            case 'hide-row-selector':
            {
                this.hiddeRowSelector = (newValue == 'true');
                const tbody = this._table?.querySelector('tbody');
                if (tbody && this.CSS.RowSelected)
                {
                    if (this.hiddeRowSelector) tbody.querySelectorAll('tr.' + this.CSS.RowSelected).forEach(tr => tr.classList.remove(this.CSS.RowSelected));
                    else { const tr = this.CurrentTd()?.closest('tr'); if (tr) tr.classList.add(this.CSS.RowSelected); }
                }
                break;
            }
            case 'multi-select':   // F4 (C8, P28)
                this.MultiSelect = newValue;
                break;
            case 'show-tree':
            {
                this._initTreeValues();
                this._printTreeData();
                break;
            }
        }
        this._f2AtributoCambiado(name, newValue);   // F2: summary-scope
        this._f5AtributoCambiado?.(name, newValue);   // F5: virtual-rows
        this._f6AtributoCambiado(name, newValue);   // F6: group-panel
        this._f8bAtributoCambiado(name, newValue);   // F8b: theme, palette, striped, density
    }

    // F1 (C9, C11): se inicializa una sola vez. Mientras la página carga, en DOMContentLoaded y en el
    // mismo orden de hoy; si ya cargó, de inmediato. Al reconectar solo se vuelven a crear los
    // listeners globales, el intervalo y los observadores.
    _f1Inicializada = false;
    _f1EsperandoCarga = false;

    connectedCallback()
    {
        if (this._f1Inicializada) { this._f1Reconectar(); return; }
        if (this._f1EsperandoCarga) return;

        if (EditTable._f1DocumentoCargado())
        {
            this.attributes = this.getAttributeNames();
            this._f1Inicializar();
            return;
        }

        this._f1EsperandoCarga = true;
        document.addEventListener('DOMContentLoaded', () =>
        {
            this._f1EsperandoCarga = false;
            this._f1Inicializar();
        });
    }

    disconnectedCallback()
    {
        // F1 (C11)
        if (this._f1Inicializada) this._f1Liberar();
    }

    _f1Inicializar()
    {
        {
            this._shadow = this.attachShadow({ mode: 'closed' });
            this._initOtherValues();
            
            this._shadow.innerHTML = `
                <style>
                    .EdiTable-Selector{
                        width: 100%;
                        height: 100%;
                        text-align: inherit;
                        justify-content: inherit;
                        display: flex;
                        align-items: center;
                        background-color: rgba(255,255,255,.7);
                        cursor: text;
                        border: 1px solid #FFF;
                        border-radius: 3px;
                        outline: none;
                        color: #000;
                    }
                    .EdiTable-Input-Check{
                        height: 100%;
                    }
                    .EdiTable-Cell
                    {
                        height: 1.4rem;
                        outline: 1px solid #EDEDED;
                        position: relative;
                        padding: 4px;
                    }
                    .EdiTable-Row-Selected
                    {
                        background-color: #3D75DD !important;
                        color: #FFF !important;
                    }
                    
                    table{ width: 100%; font-size: 1rem; border-spacing: 1px; }
                    tbody tr {
                        position: relative;
                    }
                    tbody tr:hover {
                        background-color: #F5F5F5;
                    }
                    thead {
                        background-color: #F5F5F5;
                        position: sticky;
                        top: 0;
                        z-index: 100;
                    }
                    thead tr th{
                        padding: 4px 8px;
                        outline: 1px solid #DDD;
                        font-weight: normal;
                        position: relative;
                        cursor: pointer;
                    }
                    .Editable-Input-Number,
                    .Editable-Input-Text, 
                    .Editable-Input-Memo, 
                    .Editable-Input-Date, 
                    .Editable-Input-DateTime,
                    .Editable-Input-Select {
                        position: absolute;
                        top: 0;
                        left: 0;
                        box-sizing: border-box;
                        height: 100%;
                        border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .Editable-Input-Select{
                        display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                    }
                    .Editable-Input-Memo{
                        resize:none;
                    }
                    .EdiTable-Button{
                        padding: 2px;
                        background-color: transparent;
                        color: #3D75DD;
                        border: 0;
                        cursor: pointer;
                        position: absolute;
                        right: 6px;
                        top: 2px;
                        bottom: 0;
                    }
                    .haschild td:first-of-type {
                        padding-left: 2rem;
                    }
                    .haschild td:first-of-type::before {
                        content:' \\23F5';
                    }
                    .haschild td:first-of-type::before:hover {
                        background-color: red;
                    }
                    .sizable-border {
                        position: absolute; 
                        top: 0; 
                        right: 0; 
                        width: 5px;
                        min-height: 1rem;
                        cursor: col-resize;
                        background-color: transparent;
                    }
                    th.ascendent::after{
                        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23BBB' class='bi bi-caret-down-fill' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
                    }
                    th.descendent::after{
                        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23BBB' class='bi bi-caret-up-fill' viewBox='0 0 16 16'%3E%3Cpath d='m7.247 4.86-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z'/%3E%3C/svg%3E");
                    }

                    .tr-border-bottom td{ 
                        transition: border .1s; 
                        border-bottom: 6px solid #888; 
                        outline: 0;
                    }
                    
                    .icon-child div::before{ 
                        content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='%23555' class='bi bi-indent' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M3 8a.5.5 0 0 1 .5-.5h6.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H3.5A.5.5 0 0 1 3 8Z'/%3E%3Cpath fill-rule='evenodd' d='M12.5 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5Z'/%3E%3C/svg%3E");
                        /* content: 'Children';
                        font-size: .8rem;
                        font-weight: 500;
                        color: #888; */
                        background-color: #F5F5F5 !important;
                        z-index:1000000; 
                        position: absolute; 
                        left: 2px;
                        top: 0;
                        bottom: 0;
                        padding: 2px 4px 0 4px;
                        display:flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .bg-child {
                        background-color: #F5F5F5 !important;
                        color: #000 !important;
                    }
                    .dragging{ background-color: #EDEDED !important; color: #000 !important; border: 0 !important; outline: 0 !important; }
                    .cell-collapsable {  }
                    .collapse-btn { cursor: pointer; }
                    .cell-content { width: 100%; height: 100%; display: flex; align-items: center; overflow: hidden; }
                    .hidde-row{ display: none; }
                    .hidde-col{ display: none !important; }
                    .container-cell-content { display: flex; gap:2px; width:-webkit-fill-available; height: 100%; align-items: center;}

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

                    .transparent{ background-color: transparent !important; border: none !important; outline: none !important; color: inherit !important; }
                    a{ color: inherit; }
                    ` + this._getExtraCss() + (this.getAttribute('control-styles') ?? '') + `
                    @media print
                    {
                        .no-print{ display: none !important; }
                    }
                    @media screen and (max-width: 768px) {
                        .table-cards {
                            /* row to cards */
                            & th{ display:none !important; }
                            & td{ display:block !important; }
                            & td::before{ content: attr(data-cell) ": "; font-weight: 600; }
                            & td{ display: grid !important; grid-template-columns: 35% 65% !important; word-wrap: break-word; }
                            /* cards styles */
                            & td:first-child{ padding-top:2rem !important; }
                            & td:last-child{ padding-bottom:2rem !important; }
                            & .EdiTable-Cell{ outline: none; padding-left: 1rem; height: auto; }
                            & tbody tr{ outline: 1px solid #DDD; }
                        }
                    }
                </style>
            `;

            // F1 (C5): readonly="false", "0" o "no" en el host significan editable.
            this.ReadOnly = this.hasAttribute("readonly") && !this._f1EsFalso(this.getAttribute("readonly"));
            if (this.hasAttribute('data') && this.getAttribute('data').trim() != "")
            {
                try{ this.DataArray = JSON.parse(this.getAttribute('data')); }
                catch{ alert('El valor del atributo "data" tiene un formato JSON inválido'); this.DataArray = []; }
            }
            if (this.hasAttribute('html-encode')) this.htmlEncode = (this.getAttribute('html-encode')=='true');
            const container1 = this._createFullElement('div', { style:'min-height: 2rem; max-height: 100%; overflow: auto; padding-bottom: 5px' });
            this._table = this._getFullTable();
            this._f2Iniciar();   // F2: summary-scope, valueType y tfoot de totales (solo si alguna columna declara summary)
            container1.appendChild(this._table);
            this.innerHTML = '';
            this._shadow.appendChild(container1);
            
            this._initTreeValues();

            if (this.ShowAsTree) this._printTreeData();

            this.Initialize(this._table.getAttribute('id'));

            if(this.hasAttribute('sorTable'))this._sorTable=this.getAttribute('sorTable').trim().toLowerCase()=="true";
            
            this.sorTable=this._sorTable;
            // F1 (C7): la propiedad pública sorTable lee y escribe _sorTable (antes no tenía efecto).
            Object.defineProperty(this, 'sorTable', {
                configurable: true, enumerable: true,
                get: () => this._sorTable,
                set: (v) => { this._sorTable = v; }
            });
            //this._processAtributesColumn();
            this._resizableGrid(this._table);
            this._setSortEvent();
            this._setMoveEvent();
            this._f4Iniciar();   // F4: multi-select (columna del sistema y selección)
            this._f3Inicializar?.();   // F3: columnas fijas, selector, reordenar y diseño guardado
            this._f6Iniciar();   // F6: group-panel y group-summary
            this._f8Iniciar();   // F8a: search-bar, enter-mode, skip-readonly y row-rules

            // Si no se ha proporcionado el atributo data para el dataArray se genera a partir del contenido de la tabla
            if (this.DataArray.length < 1) this.UpdateData();
            this._current_row = this.CurrentRowIndex();

            // Vista de impresión activada.
            // F1 (C3): antes de ocultar se guarda el estado de cada columna de impresión.
            // F1 (C11): los listeners de window quedan registrados para liberarlos al desconectar.
            this._f1Global(window, 'beforeprint', () => {
                this._f5AntesDeImprimir?.();   // F5: con virtual-rows se dibujan todas antes de imprimir
                this._f1EstadoImpresion = new Map();
                this.Columns.forEach(col => {
                    if ((col?.class??"").includes("hide-on-print") || (col?.class??"").includes("no-print"))
                    {
                        if (col.field != undefined && !this._f1EstadoImpresion.has(col.field))
                            this._f1EstadoImpresion.set(col.field, this._f1ColumnaOculta(col.field));
                        this.hideColumn(col.field, true);
                    }
                });
            });
            // Vista de impresión desactivada.
            // F1 (C3): cada columna vuelve exactamente al estado que tenía antes de imprimir.
            this._f1Global(window, 'afterprint', () => {
                const antes = this._f1EstadoImpresion ?? new Map();
                this._f1EstadoImpresion = null;
                this.Columns.forEach(col => {
                    if ((col?.class??"").includes("hide-on-print") || (col?.class??"").includes("no-print"))
                        this.hideColumn(col.field, (antes.get(col.field) ?? false));
                });
                this._f5DespuesDeImprimir?.();   // F5: regresa al modo virtual
            });

            this.setAutoConfirm();
            this.checkAndSetRowCards();
            this._f5Iniciar?.();   // F5: virtual-rows (después de UpdateData y de la vista de tarjetas)
            this._f8bIniciar();   // F8b: variables --et-* en el CSSOM y theme/palette/striped/density
            this._impIniciar();   // Impresión: sin scroll ni recorte (regla en el CSSOM, no cambia el texto de los <style>)
        }
        this._f1Inicializada = true;
        // F1 (C11): si lo sacaron del documento antes de inicializarse, no deja nada activo.
        if (!this.isConnected) this._f1Liberar();
    }

    // ========================= F1: listeners globales, intervalo y observadores (C11)

    _f1Globales = [];          // [{target, type, fn}] de window y document
    _f1Intervalos = [];        // ids de setAutoConfirm
    _f1NumIntervalos = 0;      // cuántos había al desconectar
    _f1Conectada = true;

    _f1Global(target, type, fn)
    {
        this._f1Globales.push({ target, type, fn });
        if (this._f1Conectada) target.addEventListener(type, fn);
    }

    _f1Liberar()
    {
        if (!this._f1Conectada) return;
        this._f1Conectada = false;
        this._f1Globales.forEach(g => g.target.removeEventListener(g.type, g.fn));
        this._f1NumIntervalos = this._f1Intervalos.length;
        this._f1Intervalos.forEach(id => clearInterval(id));
        this._f1Intervalos = [];
        try { this._teardownViewWatcher(); } catch (e) { }
        if (this._selIO) { this._selIO.disconnect(); this._selIO = null; }
        if (this._widthRO) { this._widthRO.disconnect(); this._widthRO = null; this._lastWidth = -1; }
        if (this._ensureRaf) { cancelAnimationFrame(this._ensureRaf); this._ensureRaf = 0; }
        this._f3Liberar?.();   // F3: ResizeObserver de las columnas fijas y menú abierto
        this._f5Liberar?.();   // F5: scroll del contenedor
        this._tpgLiberar?.();   // TP: deja de escuchar el tema de la página (InduxsoftTheme)
    }

    _f1Reconectar()
    {
        if (this._f1Conectada) return;
        this._f1Conectada = true;
        this._f1Globales.forEach(g => g.target.addEventListener(g.type, g.fn));
        const n = this._f1NumIntervalos;
        this._f1NumIntervalos = 0;
        for (let i = 0; i < n; i++) this.setAutoConfirm();
        try {
            this._setupViewWatcher();
            this._setupSelectionKeeper();
            if (this._selTr && this._selTr.isConnected) this._trackSelection(this._selTr);
        } catch (e) { console.error('EditTable: error al reconectar', e); }
        this._f3Reconectar?.();   // F3
        this._f5Reconectar?.();   // F5
        this._tpgReconectar?.();   // TP: vuelve a resolver el tema de la página en su nuevo lugar
    }

    // F1 (C5): lectura de atributos booleanos: "false", "0" y "no" significan falso.
    _f1EsFalso(value)
    {
        return ['false', '0', 'no'].includes(String(value ?? '').trim().toLowerCase());
    }

    _getFullTable=()=>
    {
        const table = this._createFullElement('table', { id:(this.getAttribute('id')??'f077fb41716141eeb7ecb1ed0a1ce292') });
        const thead = (this._replaceTagNameElement(this.querySelector('edit-thead'), 'thead') ?? this._createFullElement('thead'));
        const tbody = (this._replaceTagNameElement(this.querySelector('edit-tbody'), 'tbody') ?? this._createFullElement('tbody'));

        table.appendChild(thead);
        table.appendChild(tbody);

        if (thead.hasChildNodes())
        {
            thead.querySelectorAll('*').forEach(e => { if (e.tagName.toLocaleLowerCase() != 'edit-tr' && e.tagName.toLocaleLowerCase() != 'edit-th') e.remove(); });

            thead.querySelectorAll('edit-tr').forEach(editTr => editTr.replaceWith(this._replaceTagNameElement(editTr, 'tr')));
            thead.querySelectorAll('tr').forEach(tr => {
                tr.querySelectorAll('edit-th').forEach(editTh => {
                    editTh.innerHTML = `<span>${editTh.textContent}</span>`;
                    this._setColumnWith(editTh);
                    editTh.replaceWith(this._replaceTagNameElement(editTh, 'th'));
                });
            });
        }

        if (tbody.hasChildNodes())
        {
            tbody.querySelectorAll('*').forEach(e => { if (e.tagName.toLocaleLowerCase() != 'edit-tr' && e.tagName.toLocaleLowerCase() != 'edit-td') e.remove(); });
            
            tbody.querySelectorAll('edit-tr').forEach(editTr => editTr.replaceWith(this._replaceTagNameElement(editTr, 'tr')));
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.querySelectorAll('edit-td').forEach(editTd => {
                    editTd.classList.add('EdiTable-Cell');
                    editTd.replaceWith(this._replaceTagNameElement(editTd, 'td'));
                });
            });
        }

        this._processAtributesColumn(thead);

        if (this.DataArray && this.DataArray.length > 0 && thead.hasChildNodes() && !tbody.hasChildNodes())
        {
            this.DataArray.forEach((data, idx) => {

                const tr = this._createFullElement('tr');

                // F1 (A4): misma celda que antes, encapsulada; este camino no aplica árbol ni hideColumns.
                this.Columns.forEach((column, i) => this._f1PintarCelda(tr, column, i, data, idx, false, false));

                this._decorateRow(tr, idx, data);
                tbody.appendChild(tr);
            });  
        }

        return table;
    }
    // F1 (A4): una celda de datos tal como la dibujaban _getFullTable y _printRows (mismo orden de
    // operaciones). arbol: contenedor del botón de expandir en la primera celda; ocultas: aplica hideColumns.
    // InsertRow sigue con su propio camino: unificarlo cambiaría el DOM (data-cell, plantillas, onTdPaint).
    _f1PintarCelda=(tr, column, i, data, idx, arbol, ocultas)=>
    {
        const td = this._createFullElement('td', { class:'EdiTable-Cell' });
        tr.appendChild(td);

        let coldf = this.GetColumnDefOfTd(td);
        let value = (this._isBadgesCol(column) ? '' : (data[column.field] ?? ''));

        let valideEncode = true;

        if(coldf.template) {
            valideEncode = false;
            value = this.applyTemplate(coldf.template, data);
        }

        let container = null;
        if (i==0 && arbol)
        {
            container = this._createFullElement('div', { class:'container-cell-content' })
            const content = this._createFullElement('div', { iscellcontent:'true', class:'cell-content' });
            container.appendChild(content);
            td.appendChild(container);
        }

        this.SetTdValue(td, value, valideEncode, coldf);

        // F1 (C20): data-cell conserva el título declarado aunque changeColumnTitle cambie Columns[i].title
        // (control-styles de los paquetes usa td[data-cell='<título>']).
        // Solo se consulta el mapa si changeColumnTitle cambió algún título (M1: sin trabajo extra por celda).
        td.setAttribute('data-cell',((this._f1TitulosDeclarados.size && this._f1TitulosDeclarados.has(i)) ? this._f1TitulosDeclarados.get(i) : (coldf?.title??'')));
        if (column?.rules != null) this._f8ReglasCelda(td, column, data);   // F8a: formato condicional, antes de onTdPaint
        if (this.onTdPaint) this.onTdPaint(td, idx, this.ColIndexOfTd(td), (coldf?.field??''));
        if (ocultas && this.hideColumns.includes(td.cellIndex)) td.classList.add('hidde-col');
        return container;
    }
    _setColumnWith=(th)=>
    {
        if (th)
        {
            if(th.hasAttribute('minwidth')){
                th.style.minWidth = th.getAttribute('minwidth');
                //th.removeAttribute('minwidth');
            } 
            if(th.hasAttribute('maxwidth')){
                th.style.maxWidth = th.getAttribute('maxwidth');
                //th.removeAttribute('maxwidth');
            }
            if(th.hasAttribute('width')){
                th.style.width = th.getAttribute('width');
                //th.removeAttribute('width');
            }
        }
    }
    _getColdefByTh=(th)=>
    {
        let def = {};
        if (th && th.hasAttributes())
            th.getAttributeNames().forEach(attrName => def[attrName] = th.getAttribute(attrName));
        return def
    }
    _replaceTagNameElement=(element, tagName)=>
    {
        if (!element) return null;

        let attributes = {};

        if (element.hasAttributes())
            element.getAttributeNames().forEach(attrName => attributes[attrName] = element.getAttribute(attrName));

        const newElement = this._createFullElement(tagName, attributes);
        newElement.innerHTML = element.innerHTML;

        return newElement;
    }
    _createFullElement=(tagName="div", attributes={})=>
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    _processAtributesColumn=(element)=>
    {
        let listColumns = (element ? element.querySelectorAll('th') : this._shadow.querySelectorAll('th'));
        if (listColumns && listColumns.length > 0)
        {
            listColumns.forEach((column, i) => {
                let attributes = column.getAttributeNames();
                let settings = {};
                if (attributes && attributes.length > 0){
                    attributes.forEach(attr => {
                        settings[attr] = this._getAttributeColumn(attr, column.getAttribute(attr));
                    });
                }
                settings['title'] = column.textContent;
                this.Columns[i] = settings;
            });
        }
        // F1 (A3): estado de columnas por field (orden declarado, ancho y si está oculta).
        this._f1EstadoColumnas = new Map();
        this._f1Ocultas = [];
        this.Columns.forEach((col, i) => {
            if (col && col.field != undefined && !this._f1EstadoColumnas.has(col.field))
                this._f1EstadoColumnas.set(col.field, { field: col.field, orden: i, ancho: (col.width ?? null), oculta: false });
        });
    }
    // ========================= F1: estado de columnas por field (A3)
    _f1EstadoColumnas = new Map();
    _f1Ocultas = [];           // fields ocultos, en el orden en que se ocultaron
    _f1EstadoColumna=(field)=>
    {
        let st = this._f1EstadoColumnas.get(field);
        if (!st)
        {
            st = { field, orden: this._f1EstadoColumnas.size, ancho: null, oculta: false };
            this._f1EstadoColumnas.set(field, st);
        }
        return st;
    }
    _f1ColumnaOculta=(field)=>
    {
        return !!this._f1EstadoColumnas.get(field)?.oculta;
    }
    // hideColumns se deriva del estado: índices de celda de los fields ocultos, en el orden en que se ocultaron.
    _f1DerivarHideColumns=()=>
    {
        const idx = [];
        this._f1Ocultas.forEach(field => {
            const th = this._table?.querySelector(`thead th[field="${field}"]`);
            const ci = (th ? th.cellIndex - this._f4SysDe(th.parentElement) : -1);   // F4: índice de datos
            if (th && !idx.includes(ci)) idx.push(ci);
        });
        return idx;
    }
    _getAttributeColumn=(attr, value)=>
    {
        switch (attr)
        {
            case 'type':
            {
                value = eval('this.EdiTable.Const.Columns.Types.' + value);
                break;
            }
            case 'options':
            {
                value = JSON.parse(value);
                break;   
            }
        }
        return value;
    }
    _resizableGrid=(table)=>
    {
        // F1 (A2): solo las filas del thead (hoy la primera fila de la tabla es siempre la del thead).
        const rows = (table.querySelector('thead') ?? table).querySelectorAll('tr');
        if (!rows || rows.length < 1) return;
        
        const cols = rows[0].querySelectorAll('th');
        if (!cols || cols.length < 1) return;
        
        cols.forEach(col => {
            const sizableBorder = this._createFullElement('div', { class:'sizable-border', style:`height:${table.offsetHeight}px;` });
            this._addSizableFunction(sizableBorder);
            col.appendChild(sizableBorder);
        });
    }
    _addSizableFunction=(element)=>
    {
        var pageX,curCol,nxtCol,curColWidth,nxtColWidth;

        element.onclick = (e) => { e.stopPropagation(); e.preventDefault(); }

        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            curCol = e.target.parentElement;
            nxtCol = curCol.nextElementSibling;
            pageX = e.pageX;
            curColWidth = curCol.offsetWidth
            if (nxtCol)
                nxtColWidth = nxtCol.offsetWidth
        });
        // F1 (C11): listeners de document registrados para liberarlos al desconectar.
        this._f1Global(document, 'mousemove', (e) => {
            e.stopPropagation();
            if (curCol) {
                var diffX = e.pageX - pageX;
                if (nxtCol)
                    nxtCol.style.width = (nxtColWidth - (diffX))+'px';
                curCol.style.width = (curColWidth + diffX)+'px';
            }
        });
        this._f1Global(document, 'mouseup', (e) => {
            e.stopPropagation();
            // F1 (A3): el ancho queda también en el estado por field.
            [curCol, nxtCol].forEach(th => {
                const f = th?.getAttribute?.('field');
                if (f != undefined && th.style.width) this._f1EstadoColumna(f).ancho = th.style.width;
            });
            if (curCol) this._f3Redimensionado?.(curCol, curColWidth);   // F3: posiciones de las fijas y LayoutChanged 'resize'
            curCol = undefined;
            nxtCol = undefined;
            nxtCol = undefined;
            pageX = undefined;
            nxtColWidth = undefined;
            curColWidth = undefined;
        });    
    }
    _getRowIndex=(tr)=>
    {
        // F1 (A1): índice de DataArray a partir del mapa interno tr → índice.
        let tbody = tr?.parentElement;
        if (!tbody) return -1;
        if (this._f5Activo && tbody === this._f1TBodyPrincipal()) return (this._f5Idx.get(tr) ?? -1);   // F5: índice de DataArray (relleno y grupos: -1)
        if (tbody === this._f1TBodyPrincipal()) return this._f1IndiceDeTr(tr, tbody);
        // Un tr fuera del tbody principal (por ejemplo, de una tabla dentro de una plantilla): como antes.
        let index = -1;
        tbody.querySelectorAll('tr').forEach((_tr, i) => { if (_tr === tr) index = i });
        return index;
    }
    // ========================= F1: mapa interno tr → índice de DataArray (A1)
    // WeakMap, sin atributos en el DOM. En F1 el índice es la posición del tr entre los tr del tbody
    // (la misma cuenta que hacía _getRowIndex con querySelectorAll('tr')).
    // Reconstrucción perezosa (M1 de la revisión): un MutationObserver sobre los hijos del tbody marca el mapa
    // como sucio; takeRecords() lo hace síncrono, así que también ve los cambios que haga un consumidor.
    // Con el mapa sucio, las consultas usan el DOM (como antes) y el mapa solo se reconstruye cuando se
    // consulta otra vez sin cambios de por medio. Borrar u ordenar no recorre filas si nadie consulta.
    // Si el tbody tiene tr anidados (tablas dentro de plantillas), se usa siempre el DOM.
    // A partir de F5/F6 (virtualización, agrupación) el mapa deja de ser la posición.
    _f1Indices = new WeakMap();
    _f1Orden = [];
    _f1TBody = null;
    _f1MO = null;
    _f1Estado = 0;            // 0 sucio, 1 sucio con una consulta ya respondida por el DOM, 2 válido
    _f1Anidados = false;
    _f1TBodyPrincipal=()=>
    {
        return this._table?.querySelector('tbody') ?? null;
    }
    // Revisa si hubo cambios desde la última consulta. Devuelve true si el mapa es válido.
    _f1MapaValido=(tbody)=>
    {
        if (this._f1TBody !== tbody)
        {
            if (this._f1MO) this._f1MO.disconnect();
            this._f1TBody = tbody;
            this._f1Estado = 0;
            this._f1MO = (typeof MutationObserver != 'undefined') ? new MutationObserver(() => { this._f1Estado = 0; }) : null;   // el callback también consume los registros
            if (this._f1MO) this._f1MO.observe(tbody, { childList: true });
        }
        if (!this._f1MO) return false;
        if (this._f1MO.takeRecords().length) this._f1Estado = 0;
        return (this._f1Estado === 2 && !this._f1Anidados);
    }
    _f1Reindexar=(tbody)=>
    {
        const filas = tbody.getElementsByTagName('tr');
        this._f1Indices = new WeakMap();
        this._f1Orden = new Array(filas.length);
        for (let i = 0; i < filas.length; i++) { this._f1Indices.set(filas[i], i); this._f1Orden[i] = filas[i]; }
        this._f1Anidados = (filas.length !== tbody.rows.length);
        this._f1Estado = 2;
    }
    _f1IndiceDeTr=(tr, tbody)=>
    {
        if (this._f6Grupos.length) return this._f6IndiceDeTr(tr);   // F6: índice de DataArray saltando las filas de grupo
        if (this._f1MapaValido(tbody)) return (this._f1Indices.get(tr) ?? -1);
        if (this._f1Estado === 1 && this._f1MO && !this._f1Anidados)
        {
            this._f1Reindexar(tbody);
            return (this._f1Indices.get(tr) ?? -1);
        }
        this._f1Estado = 1;
        return Array.prototype.indexOf.call(tbody.getElementsByTagName('tr'), tr);
    }
    _f1TrDeIndice=(row, tbody)=>
    {
        if (this._f6Grupos.length) return this._f6TrDeIndice(row);   // F6
        if (this._f1MapaValido(tbody)) return this._f1Orden[row];
        return tbody.getElementsByTagName('tr')[row];
    }
    _getVisibleRowIndex=(tr)=>
    {
        let index = -1;
        let tbody = tr?.parentElement;
        if (tbody) tbody.querySelectorAll('tr:not(.hidde-row)').forEach((_tr, i) => { if (_tr === tr) index = i });
        return index;
    }
    _getVisibleColumnIndex=(td)=>
    {
        let index = -1;
        let tr = td?.parentElement;
        if (tr) tr.querySelectorAll('td:not(.hidde-col):not(.et-sel-col)').forEach((_td, i) => { if (_td === td) index = i });   // F4
        return index;
    }
    _getCurren=(setnew=false)=>
    {
        if (!this._current || setnew)
            this._current = Object.assign({}, this);
        return this._current;
    }
    _setSortEvent=()=>
    {
        // F1 (A2): solo los th del thead (antes: todos los th de la tabla).
        const fields = this._table.querySelectorAll('thead th');
        fields.forEach(field => {
            let par = 0;
            field.onclick = e => 
            {
                if(this._sorTable)
                {
                    e.stopPropagation();
                    fields.forEach(f=>{f.classList.remove('ascendent');f.classList.remove('descendent')});
                    par++;
                    let desc = (par%2==0);
                    field.classList.toggle('ascendent',desc);
                    field.classList.toggle('descendent',!desc);
                    if (this.ShowAsTree)
                    {
                        let options = this._getTreeOptions();
                        this.GetTree(options);
                        this.SortTree(this.DataArray, (field.getAttribute('field')??''), desc, options);
                        this.SetTree(this.DataArray, options);
                    }
                    else
                    {
                        this.Sort(this.DataArray, (field.getAttribute('field')??''), desc);
                    }
                    this._printRows();
                    this._f3Ordenado?.((field.getAttribute('field')??''), desc);   // F3: layout.sort y LayoutChanged 'sort'
                }
            };
        });
    }
    _moveData(sourceData, targetData, moveAsChild=false, treeOptions=null, onTopIfNotAsChild=false)
    {
        let success = false;

        var eventArgs = {
            source: sourceData,
            target: targetData,
            child: moveAsChild,
            sender:this._getCurren(),
            cancel:false
        };

        if (this.Events[this.EdiTable.Const.Events.BeforeMoveRow]!=undefined)
            this.Events[this.EdiTable.Const.Events.BeforeMoveRow](eventArgs);

        if (eventArgs.cancel)
            return success;

        if (!treeOptions) treeOptions = this._getTreeOptions();
        if ((sourceData[treeOptions.key]??'_') === (targetData[treeOptions.key]??'|')) return success;

        let source = null;
        let target = null;
        let isChil = false;

        const search = l => 
        {
            return l.some((obj, idx) => 
            {
                if (sourceData[treeOptions.key] == (obj[treeOptions.key]??'_')) 
                    source = { obj, l, idx };
                else if (targetData[treeOptions.key] == (obj[treeOptions.key] ?? '_')) 
                    target = { obj, l, idx };
                return ((source && target) || search((obj[treeOptions.childs]??[])));
            });
        }

        const targetChild = l => 
        {
            return l.some(obj => 
            {
                if (targetData[treeOptions.key] == (obj[treeOptions.key] ?? '_')){
                    isChil = true;
                    console.log('Can not add a parent row like child row');
                }
                return (isChil || targetChild((obj[treeOptions.childs]??[])));
            });
        }
        
        try
        {
            this.GetTree(treeOptions);

            if(search(this.DataArray) && !targetChild((source?.obj[treeOptions.childs]??[])))
            {
                let sameLevel = (source.l == target.l);
                let notaddidx = (sameLevel && source.idx <= target.idx);
                
                if (!moveAsChild)
                {
                    let data = source.l.splice(source.idx, 1)[0];
                    data[treeOptions.parentkey] = target.obj[treeOptions.parentkey];
                    target.l.splice((target.idx + (notaddidx ? 0 : 1) - (onTopIfNotAsChild ? 1 : 0)), 0, data);
                }
                else
                {
                    const parentChilds = (target.obj[treeOptions.childs]??[]);
                    let data = source.l.splice(source.idx, 1)[0];
                    data[treeOptions.parentkey] = target.obj[treeOptions.key]
                    parentChilds.unshift(data);
                    target.obj[treeOptions.childs] = parentChilds;
                }
                success = true;
            }
        }
        catch(error)
        {
            console.log(error);
            success = false
        }
        finally 
        {
            if (success && this.Events[this.EdiTable.Const.Events.RowMoved]!=undefined)
                this.Events[this.EdiTable.Const.Events.RowMoved](eventArgs);

            this.SetTree(this.DataArray, treeOptions);
            
            if (this._dataArrayBackup)
            {
                let tempBack = JSON.parse(JSON.stringify(this._dataArrayBackup));
                this.backup();
                this._dataArrayBackup.forEach(data => { 
                    let back = tempBack.find(temp => (temp[treeOptions.key] == data[treeOptions.key]));
                    if (back && back.isDirty != undefined) data.isDirty = back.isDirty;
                });
            }
        }

        return success;
    }
    _setMoveEvent=()=>
    {
        if (!this.CanMoveRow) return;

        let asChild = false;

        const getTr = (e) =>
        {
            let tr = e.currentTarget;
            if (tr.tagName != 'TR') tr = e.target.closest('tr');
            return tr;
        }
        const handleDragStart = (e) => 
        {
            e.stopPropagation();

            let tr = getTr(e);
            tr.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';

            const indexRow = this._getRowIndex(tr);
            const data = (this.DataArray[indexRow] ?? {});
            this._resolveKey(data);
            asChild = false;

            e.dataTransfer.setData('application/json', JSON.stringify(data));
        }
        const handleDragOver = (e) => 
        {
            e.stopPropagation();
            e.preventDefault();
            
            let tr = getTr(e);

            let td = (this._f4SysDe(tr) ? tr.cells[1] : null) ?? tr.firstChild;   // F4: primera celda de datos
            let cr = td.getBoundingClientRect();
            let lx = (cr.x + (cr.width / 2));

            asChild = (e.clientX > lx);

            tr.classList.add('tr-border-bottom');
            tr.classList.toggle('icon-child', asChild);
            tr.classList.toggle('bg-child', asChild);
        }
        const handleDragEnter = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            tr.classList.add('tr-border-bottom');
        }
        const handleDragLeave = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            tr.classList.remove('tr-border-bottom');
            tr.classList.remove('icon-child');
            tr.classList.remove('bg-child');
        }
        const handleDragEnd = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            tr.classList.remove('dragging');
            tr.classList.remove('tr-border-bottom');
            tr.classList.remove('icon-child');
            tr.classList.remove('bg-child');
        }

        const handleDrop = (e) => 
        {
            e.stopPropagation();
            let tr = getTr(e);
            let sourceData = JSON.parse(e.dataTransfer.getData('application/json'));
            
            tr.classList.remove('dragging');
            tr.classList.remove('tr-border-bottom');
            tr.classList.remove('icon-child');
            tr.classList.remove('bg-child');

            if (sourceData && Object.keys(sourceData).length > 0)
            {
                let targetData = this.DataArray[this._getRowIndex(tr)];
                if (targetData)
                {
                    this._resolveKey(targetData);
                    if (this._moveData(sourceData, targetData, asChild))
                        this._printRows();
                }
            }
            
            return false;
        }

        const trs = this._table.querySelectorAll('tbody tr:not(.et-spacer)');   // F5: sin las filas de relleno

        trs.forEach(tr => 
        {
            tr.setAttribute('draggable', 'true');
            tr.ondragstart =  handleDragStart;
            tr.ondragover =  handleDragOver;
            tr.ondragenter =  handleDragEnter;
            tr.ondragleave =  handleDragLeave;
            tr.ondragend =  handleDragEnd;
            tr.ondrop =  handleDrop;
        });
    }
    _generateUUID=()=>
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    _resolveKey=(data)=>
    {
        let treeOptions = this._getTreeOptions();
        if (data[treeOptions.key] === undefined) data[treeOptions.key] = this._generateUUID();
    }
    _format=(number, decimals=0, thousandSeparator=false)=>
    {
        const roundedNumber = number.toFixed(decimals);
        let integerPart = '', fractionalPart = '';
        
        if (decimals == 0) 
        {
            integerPart = roundedNumber;
            this.NumFormat.decimals="";
        } 
        else 
        {
            this.NumFormat.decimals=this.NumFormat.default_decimals;
            let numberParts = roundedNumber.split('.');
            integerPart = numberParts[0];
            fractionalPart = numberParts[1];
        }

        if (thousandSeparator)
            integerPart = integerPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${this.NumFormat.thousands}`);

        return `${integerPart}${this.NumFormat.decimals}${fractionalPart}`;
    }
    _initOtherValues()
    {
        if (this.hasAttribute('hidde-selector')) this.hiddeSelector = (this.getAttribute('hidde-selector')=='true');
        if (this.hasAttribute('hide-row-selector')) this.hiddeRowSelector = (this.getAttribute('hide-row-selector')=='true');
        if (this.hasAttribute('auto-confirm')) this.autoConfirm = (this.getAttribute('auto-confirm')=='true');
        if (this.hasAttribute('min-row-height')) this.minRowHeight = this.getAttribute('min-row-height');
        if (this.hasAttribute('max-row-height')) this.maxRowHeight = this.getAttribute('max-row-height');
        if (this.hasAttribute('row-height')) this.rowHeight = this.getAttribute('row-height');
        if (this.hasAttribute('cards-responsive')) this.cardsResponsive = (this.getAttribute('cards-responsive')=='true');
        if (this.hasAttribute('editable-responsive')) this.editableResponsive = (this.getAttribute('editable-responsive')=='true');
        // F1 (P37): opción nueva, apagada por omisión.
        if (this.hasAttribute('click-propagation')) this.ClickPropagation = (this.getAttribute('click-propagation')=='true');
        this._readVisualAttributes();
    }
    autoConfirm=false;
    ClickPropagation=false;   // F1 (P37): true deja que el clic de una celda llegue a la fila y a los ancestros
    _fireBlur=true;
    setAutoConfirm()
    {
        // F1 (C11): el id queda registrado para liberarlo al desconectar.
        if (!this._f1Conectada) { this._f1NumIntervalos++; return; }
        this._f1Intervalos.push(setInterval(()=>
        {
            if (document.activeElement!=this)
            {
                if (this.Editing && this.autoConfirm)
                {
                    // F1 (C15): marca el confirmar automático para que un badInput no robe el foco.
                    this._f1AutoConfirmando = true;
                    try { this.ConfirmEdit(this.CurrentTd()); }
                    finally { this._f1AutoConfirmando = false; }
                }

                if (!this._fireBlur)
                {
                    this._fireBlur=true;
                    if (this._getCurren().Events[this.EdiTable.Const.Events.LostFocus]!=undefined)
                        this._getCurren().Events[this.EdiTable.Const.Events.LostFocus]();
                    //LanzarEvento lostFocus   
                }
            } 
            //else { this._fireBlur=false;}
        },1000));
    }

    checkAndSetRowCards()
    {
        var editable=null;
        if(!this.editableResponsive) editable = this.Columns.find(col => {
            const type = (col?.type ?? '').toString().toLowerCase();
            return type != 'noeditable' && type != 'badges';
        });

        this._cardsNoEditable = !editable;
        this._cardsEligible = (!editable && this.cardsResponsive);
        this._applyCardsConfig();
        this._setupViewWatcher();
        this._setupSelectionKeeper();
    }


    // ========================= EDITABLE FUNCTIONS
    
    _EdiTable = () => { return {
        Const : {
            HTML:{
                Selector:'<div id="__table_selector" class="EdiTable-Selector" tabindex="0"></div>',
                Button:'<button id="__table_button" class="EdiTable-Button"></button>',
                Inputs:{
                    "Text":'<input type="text" id="__table_input" class="Editable-Input-Text"/>',
                    "Number":'<input type="number" id="__table_input" class="Editable-Input-Number"/>',
                    "Date":'<input type="date" id="__table_input" class="Editable-Input-Date"/>',
                    "DateTime":'<input type="datetime-local" id="__table_input" class="Editable-Input-DateTime"/>',
                    "Memo":'<textarea id="__table_input" class="Editable-Input-Memo"></textarea>',
                    "Select":'<select id="__table_input" class="Editable-Input-Select"/>',
                    "Check":'<input type="checkbox" id="__table_input" class="Editable-Input-Check"/>'
                },
                TR:"tr", 
                TD:"td",
                TABLE:"table",
                THEAD:"thead",
                TBODY:"tbody",
                TH:"th"
            },
            Columns:{
                Types:{
                    Text:"Text",
                    Number:"Number",
                    Date:"Date",
                    DateTime:"DateTime",
                    Memo:"Memo",
                    Check:"Check",
                    Select:"Select",
                    Custom:"Custom",
                    NoEditable:"NoEditable",
                    Badges:"Badges"
                }
            },
            Events:{
                BeforeCellFocus:"beforecellfocus",
                EnterCell:"entercell",
                LeaveCell:"leavecell",
                StartEdition:"startedition",
                ConfirmEdition:"confirmedition",
                CancelEdition:"canceledition",
                InputCreated:"inputcreated",
                BeforeUpdateCell:"beforeupdatecell",
                BeforeSetInput:"beforesetinput",
                FieldUpdated:"fieldupdated",
                RowAdded:"rowadded",
                RowDeleted:"rowdeleted",
                BeforeRowDelete:"beforerowdelete",
                BeforeMoveRow:"beforemoverow",
                RowMoved:"rowmoved",
                RowChanged:"rowchanged",
                LostFocus:"lostfocus",
                IsDirtyChanged:"isdirtychanged",
                OnSort:"onsort",
                BadgeClick:"badgeclick",
                ViewModeChanged:"viewmodechanged",
                MaskInvalid:"maskinvalid",          // F1 (C15): badInput del control nativo de Number
                ColumnFixedChanged:"columnfixedchanged",            // F3 (§6)
                ColumnVisibilityChanged:"columnvisibilitychanged",  // F3 (§7)
                BeforeColumnMove:"beforecolumnmove",                // F3 (§8)
                ColumnMoved:"columnmoved",                          // F3 (§8)
                LayoutChanged:"layoutchanged",                      // F3 (§9)
                LayoutRejected:"layoutrejected",                    // F3 (§9)
                SelectionChanged:"selectionchanged",   // F4 (§4.1)
                BeforeCopy:"beforecopy"                // F4 (§4.2)
            },
            SelectorId:"__table_selector",
            InputId:"__table_input",
            ButtonOptionId:"__table_button"
        },
        focusedTable:null,
        Converts:{
            Boolean:{
                ToString:function(value)
                {
                    if (value) return "Sí";
                    return "No";
                },
                FromString:function(value)
                {
                    switch (value.trim().toLowerCase())
                    {
                        case "sí":
                        case "si":
                        case "s":
                        case "y":
                        case "yes":
                        case "ok":
                        case "1":
                        case "t":
                        case "on":
                        case "true":
                        case "cierto":
                            return true;
                    }
    
                    return false;
                }
            }
        },
        GetSelector:function()
        {
            return this._shadow.querySelector("#"+this.EdiTable.Const.SelectorId);
        }.bind(this),
        GetButtonOption:function()
        {
            return this._shadow.querySelector("#"+this.EdiTable.Const.ButtonOptionId);
        }.bind(this),
        GetInput:function()
        {
            var input=this._shadow.querySelector("#"+this.EdiTable.Const.InputId);
            if (!input?.tagName)
                return undefined;
            
            return input;
        }.bind(this),
        GetInputValue:function(input, _current, columnDef)
        {
            var tag=input.tagName;
    
            if (tag==undefined)
            {
                return "";
            }
    
            switch(tag.toLowerCase())
            {
                case "input":
                    switch (input.getAttribute('type').toLowerCase())
                    {
                        case "checkbox":
                            return  columnDef.Converts.ToString(input.checked);
                        default:
                            return input.value;
                    }
                    break;
                case "textarea":
                    return input.value;
                case "select":
                    return input.value;
            }
    
            
        }.bind(this),
        SetInputVal: function (input, text, _current, columnDef)
        {
            switch(input.tagName.toLowerCase())
            {
                case "input":
                {
                    switch (input.getAttribute('type').toLowerCase())
                    {
                        case "checkbox":
                        {
                            input.checked = columnDef.Converts.FromString(text);
                            break;
                        }   
                    }
                    break;
                }
            }

            input.value = text;
        }.bind(this),
        SetSelectorKeyEventHandler:function(selector, _current)
        {
            const funct = (e) => {
                if (this._f6Tecla(e, selector)) return;   // F6: Ctrl+Inicio/Fin, RePág/AvPág y Ctrl+Supr en el orden visible
                if (this._f4Tecla(e)) return;   // F4: Ctrl+C copia (§4.2), Espacio marca la fila (§4.1)
                if (this._f8Tecla?.(e, selector)) return;   // F8a: F3 de la búsqueda, Ctrl+F a la barra, Tab/Enter de la secuencia de captura
                if (this._f8Tecleo?.(e, selector, _current)) return;   // F8a: tecleo rápido (lector de códigos) sin perder caracteres
                // F1 (C2): Ctrl o Meta con una letra no empieza la edición. Ctrl/Meta + C, V, X y A
                // conservan su comportamiento nativo (no se cancelan); AltGr (Ctrl+Alt) sigue escribiendo.
                const f1Atajo = (e.ctrlKey || e.metaKey) && !e.altKey && !(e.getModifierState && e.getModifierState('AltGraph'))
                    && (e.key ?? '').trim().length == 1;
                if (f1Atajo)
                {
                    if (!['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                e.preventDefault();
                switch(e.key)
                {
                    case "Home":
                        if (e.ctrlKey)
                            _current.NavToHome();
                        else
                            _current.NavToFirstCell(_current.CurrentRowIndex());
                        break;
                    case "End":
                        if (e.ctrlKey)
                            _current.NavToEnd();
                        else
                            _current.NavToLastCell(_current.CurrentRowIndex());
                        break;
                    case "PageUp":
                        if (_current.CurrentRowIndex()-_current.PagOffSet<0)
                            _current.NavTo(0,_current.CurrentColIndex());
                        else
                            _current.NavTo(_current.CurrentRowIndex()-_current.PagOffSet,_current.CurrentColIndex());
                        break;
                    case "PageDown":
                        if (_current.CurrentRowIndex()+_current.PagOffSet>_current.TRCount()-1)
                            _current.NavTo(_current.TRCount()-1,_current.CurrentColIndex());
                        else
                            _current.NavTo(_current.CurrentRowIndex()+_current.PagOffSet,_current.CurrentColIndex());
                        break;
                    case "Insert":
                        if (_current.AutoDelRow && e.ctrlKey) _current.InsertRow(_current.CurrentRowIndex());
                        break;
                    case "Enter":
                    case "F2":
                        setTimeout(function(){
                            _current.StartEdit(selector.closest('td'),"");
                        },1);
                        break;
                    case "Delete":
                        if (_current.AutoDelRow && e.ctrlKey) _current.DeleteCurrentRow();
                        if (!e.ctrlKey)
                        {
                            setTimeout(function(){
                                _current.StartEdit(selector.closest('td'),"",true);
                            },1);
                        }
                        break;
                    case "ArrowUp":
                        _current.NavUp(selector.closest('td'));
                        break;
                    case "ArrowLeft":
                        _current.NavLeft(selector.closest('td'));
                        break;
                    case "Tab":
                    case "ArrowRight":
                        _current.NavRight(selector.closest('td'));
                        break;
                    case "ArrowDown":
                        _current.NavDown(selector.closest('td'));
                        break;
                    case "F4":
                        _current.showInputKey(selector.closest('td'), '', false);
                        break;
                    default:
                        if (e.key.trim().length==1)
                        {
                            setTimeout(function(){
                                _current.StartEdit(selector.closest('td'),e.key);
                            },1);
                        }
                        break;
                }
                e.stopPropagation();
            }

            selector.removeEventListener('keydown', funct);
            selector.addEventListener('keydown', funct);
        }.bind(this),
        SetInputStdEventHandler:function(input, _current)
        {
            input.addEventListener("keydown",function(e){
                switch(e.key)
                {
                    case "ArrowUp":
                        _current.NavUp(input.closest('td'));
                        e.stopPropagation();
                        break;
                    case "Escape":
                        _current.CancelEdit(input.closest('td'));
                        e.stopPropagation();
                        break
                    case "Tab":
                    case "Enter":
                        e.preventDefault();
                        _current.NavRight(input.closest('td'));
                        e.stopPropagation();
                        break;
                    case "ArrowLeft":
                        if (input.selectionStart==0 || input.getAttribute('type').toLowerCase()=="checkbox")
                        {
                            _current.NavLeft(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowRight":
                        if (input.selectionStart==input.value.length || input.getAttribute("type").toLowerCase()=="checkbox")
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowDown":
                        _current.NavDown(input.closest('td'));
                        e.stopPropagation();
                        break;
                }
                
            });
        }.bind(this),
        SetInputTextareaEventHandler:function(input, _current)
        {
            input.addEventListener("keydown",function(e){
                switch(e.key)
                {
                    case "Escape":
                        _current.CancelEdit(input.closest('td'));
                        e.stopPropagation();
                        break
                    case "Tab":
                    case "Enter":
                        if (e.ctrlKey)
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowLeft":
                        if (input.selectionStart==0)
                        {
                            _current.NavLeft(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowRight":
                        if (input.selectionStart==input.value.length)
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                }
                
            });
        }.bind(this),
        SetInputSelectEventHandler:function(input, _current)
        {
            input.addEventListener("keydown",function(e){
                switch(e.key)
                {
                    case "Escape":
                        _current.CancelEdit(input.closest('td'));
                        e.stopPropagation();
                        break
                    case "Enter":
                        if (e.ctrlKey)
                        {
                            _current.NavRight(input.closest('td'));
                            e.stopPropagation();
                        }
                        break;
                    case "ArrowLeft":
                        _current.NavLeft(input.closest('td'));
                        e.stopPropagation();
                        break;
                    case "Tab":
                    case "ArrowRight":
                        _current.NavRight(input.closest('td'));
                        e.stopPropagation();
                        break;
                }
                
            });
        }.bind(this),
        SetInputEventHandler:function(input, _current)
        {
            input.addEventListener("click",function(e){
                e.stopPropagation();
            });
    
            switch(input.tagName.toLowerCase())
            {
                case "input":
                    this.EdiTable.SetInputStdEventHandler(input, _current);
                    break;
                case "textarea":
                    this.EdiTable.SetInputTextareaEventHandler(input, _current);
                    break;
                case "select":
                    this.EdiTable.SetInputSelectEventHandler(input, _current);
                    break;
            }
            
        }.bind(this)
    }};

    EdiTable = this._EdiTable();

    // ========================= EDITABLE WC FUNCTIONS

    Events = {};
    TheadRowIndex = 0;
    AutoAddRow = true;
    AutoDelRow = true;
    EverMove = true; //Si es true, deplazamiento a la izquierda en la primera celda sube una fila y se mueve a la última, a la derecha en la última baja una fila y va a la primer celda
    PagOffSet = 10; //Desplazamiento con AvPag PrevPag
    DataArray = []; //Contiene un array asociado a las filas
    ColumnsDefaultType = this.EdiTable.Const.Columns.Types.Text;
    ReadOnly = false;
    
    ShowAsTree = true;
    CanMoveRow = false;
    TreeOptions = {};
    Key = "id";
    ParentKey = "idp";
    Childs = "__items";
    ButtonOnClick = null;
    onTdPaint = null;
    NumFormat = {
        default_decimals:".",
        thousands:",",
        decimals:"."
    }
    hiddeSelector = false;
    hiddeRowSelector = false;
    htmlEncode = false;
    minRowHeight = "none";
    maxRowHeight = "none";
    rowHeight = "100%";
    cardsResponsive = false;
    editableResponsive=false;
    CSS = {
        Cell:"EdiTable-Cell",
        RowSelected: "EdiTable-Row-Selected"
    };
    sorTable=true;
    Initialize = (tableId) =>
    {
        // F1 (A2): solo los td del tbody (antes: todos los td de la tabla).
        let tds = this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+"#"+tableId+" > "+this.EdiTable.Const.HTML.TBODY+" "+this.EdiTable.Const.HTML.TD);
        tds.forEach(td => {
            td.onclick = e => {
                // F1 (P37): con click-propagation="true" el clic sigue a la fila y a los ancestros.
                if (!this.ClickPropagation) e.stopPropagation();
                else if (e._f1EdiTableProcesado) return;   // ya lo procesó el selector (inició la edición)
                this.CellFocus(td);
            }
        });
        this["tableId"]=tableId;
    }
    Columns=[];
    /**
     * 
     * @returns Retorna la referencia al elemento ***thead*** de la tabla.
     */
    GetTHead=()=>
    {
        return this._shadow.querySelector(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.THEAD);
    }
    /**
     * 
     * @returns Retorna la referencia ***tbody*** de la tabla.
     */
    GetTBody=()=>{
        var tbody= this._shadow.querySelector(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.TBODY);

        if (!tbody)
        {
            this._shadow.querySelector("#"+this.tableId).innerHTML = "<tbody></tbody>";
            tbody=this._shadow.querySelector(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" "+this.EdiTable.Const.HTML.TBODY);
        }

        return tbody;
    }
    /**
     * 
     * @returns Retorna el **número** de columnas de la tabla.
     */
    ColumnsCount=()=>
    {
        var cols=this.THCount();

        if (cols<1)
            if (this.Columns)
                if (this.Columns.length>0)
                    cols=this.Columns.length;
        
        return cols;
    }
    /**
     * Mueve el selector a la primera columna y primera fila de la tabla.
     */
    NavToHome=()=>
    {
        this.NavTo(0,0);
    }
    /**
     * Mueve el selector a la última columna y última fila de la tabla.
     */
    NavToEnd=()=>
    {
        // F1 (C6): última fila, en la columna actual (índice visible, el que recibe NavTo).
        const td = this.CurrentTd();
        let col = (td ? this._getVisibleColumnIndex(td) : 0);
        if (col < 0) col = 0;
        this.NavTo(this.TRCount()-1, col);
    }
    /**
     * Mueve el selector a la primer columna de la fila especificada.
     * @param {Number} row Índice de la fila.
     */
    NavToFirstCell=(row)=>
    {
        this.NavTo(row,0);
    }
    /**
     * Mueve el selector a la última columna de la fila especificada.
     * @param {Number} row Índice de la fila.
     */
    NavToLastCell=(row)=>
    {
        this.NavTo(row,(this._table.querySelectorAll('thead th:not(.hidde-col):not(.et-sel-col)').length-1));   // F4
    }
    /**
     * Mueve el selector a la columna y fila especificada.
     * @param {Number} row Índice de la fila.
     * @param {Number} col Índice de la columna.
     */
    NavTo=(row, col)=>
    {
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || col>cols-1 || col<0 || row<0) return;
        if (this._f6NavTo(row, col)) return;   // F6: row es índice de DataArray
        
        let tbody=this.GetTBody();
        // F5: getElementsByTagName da los mismos tr que querySelectorAll sin armar la lista completa; en virtual, GetTrByIndex.
        let td = (this._f5Activo ? this.GetTrByIndex(row) : tbody.getElementsByTagName(this.EdiTable.Const.HTML.TR)[row]).querySelectorAll(this.EdiTable.Const.HTML.TD+':not(.hidde-col):not(.et-sel-col)')[col];   // F4
        this.CellFocus( td );
    }
    /**
     * @param {Number} row Índice de la fila.
     * @returns Retorna la referencia al elemento ***tr*** de la fila especificada.
     */
    GetTrByIndex=(row)=>
    {
        if (this._f5Activo) return this._f5Asegurar(row);   // F5 (P22): desplaza y dibuja la fila
        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return undefined;
        
        let tbody=this.GetTBody();

        // F1 (A1): inverso del mapa interno índice → tr.
        if (tbody === this._f1TBodyPrincipal()) return this._f1TrDeIndice(row, tbody);
        return tbody.querySelectorAll(this.EdiTable.Const.HTML.TR)[row];
    }
    /**
     * Elimina la fila seleccionada.
     */
    DeleteCurrentRow=()=>
    {
        let col=this.CurrentColIndex();
        let row=this.CurrentRowIndex();

        if (this.DeleteRow(row))
            this.NavTo(row,col);
    }
    /**
     * Elimina la fila especificada.
     * @param {Number} row Índice de la fila a eliminar.
     * @returns Retorna ***true*** si la fila fué eliminada, en caso contrario: ***false***.
     */
    DeleteRow=(row)=>
    {
        var eventArgs={
            sender:this._getCurren(),
            rowIndex:row,
            cancel:false
        };

        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeRowDelete]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.BeforeRowDelete](eventArgs);

        if (eventArgs.cancel) return false;

        let rows=this.TRCount();
        let cols=this.ColumnsCount();

        if (rows<1 || cols<1 || row>rows-1 || row<0) return false;

        const f4Fila = this.DataArray[row];   // F4
        this._f8AlBorrar?.(row);   // F8a: base de getChanges antes de quitar la fila; errores de la fila
        if (this._f5Activo) this._f5QuitarFila(row); else   // F5: en virtual la fila puede no estar dibujada
        this.GetTrByIndex(row).remove();
        this.DataArray.splice(row, 1);
        if(this._dataArrayBackup) this._dataArrayBackup.splice(row, 1);
        if (this._f5Activo) this._f5TrasBorrar(row);   // F5: reindexa las filas dibujadas
        this._f6FilaBorrada(row);   // F6
        this._f4FilaBorrada(f4Fila, row);   // F4: la fila borrada sale de la selección
        this._f2Programar();   // F2: recálculo de totales (RowDeleted)

        if (this._getCurren().Events[this.EdiTable.Const.Events.RowDeleted]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.RowDeleted](eventArgs);

        return true;
    }
    /**
     * Actualiza los valores que se muestran de la fila especificada.
     * @param {Number} row Índice de la fila.
     * @returns Retorna ***true*** si se completó la tarea, en caso contrario: ***false***.
     */
    UpdateRow=(row)=>
    {
        let tr=(this._f5Activo ? this._f5TrDibujado(row) : this.GetTrByIndex(row));   // F5: sin desplazar
        if (tr==undefined && this._f5Activo) { this._f2Programar(); this._f6Programar(); return (row >= 0 && row < this.DataArray.length); }   // F5: se dibujará desde el modelo; F5+F6: grupos

        if (tr==undefined) return false;
        var tds=tr.querySelectorAll(this.EdiTable.Const.HTML.TD+':not(.et-sel-col)');   // F4: celdas de datos

        if (tds==undefined) return false;

        const data = (this.DataArray[row] ?? {});

        for(let i=0;i<this.TDCount(tr);i++)
        {
            const col = this.Columns[i];
            if (col==undefined || this._isBadgesCol(col)) continue;

            if (col.template)
            {
                // Antes UpdateRow no evaluaba plantillas; un error en ellas no debe interrumpir al código que lo llama.
                let html;
                try { html = this.applyTemplate(col.template, data); }
                catch (err) { console.error('EditTable.UpdateRow: error en template de "' + (col.field ?? i) + '"', err); continue; }
                this.SetTdValue(tds[i], html, false);
            }
            else if (col.field!=undefined)
                this.SetTdValue(tds[i], (data[col.field] ?? ''), true);
                //tds[i].innerHTML = (this.DataArray[row][this.Columns[i].field] ?? '');
        }

        this._decorateRow(tr, row, data);
        this._f2Programar();   // F2: recálculo de totales (restore, UpdateRow)
        this._f6Programar();   // F6: subtotales y grupo de la fila

        return true;
    }
    /**
     * Actualiza los objetos del dataArray con los valores todas las filas de la tabla.
     */
    UpdateData=()=>
    {
        if (this._f5Activo) return this._f5UpdateData();   // F5: con virtualización solo las filas dibujadas
        for(let i=0;i<this.TRCount();i++)
            this.UpdateDataRow(i);
    }
    /**
     * Actualiza el objeto del dataArray con el valor de la fila especificada.
     * @param {Number} row Índice de la fila.
     * @returns Retorna ***true*** si se completó la tarea, en caso contrario: ***false***.
     */
    UpdateDataRow=(row)=>
    {
        let tr=(this._f5Activo ? this._f5TrDibujado(row) : this.GetTrByIndex(row));   // F5: sin desplazar
        if (tr==undefined && this._f5Activo) return (row >= 0 && row < this.DataArray.length);   // F5: el modelo ya tiene el dato

        if (tr==undefined) return false;
        var tds=tr.querySelectorAll(this.EdiTable.Const.HTML.TD+':not(.et-sel-col)');   // F4: celdas de datos

        if (tds==undefined) return false;

        const f5NumTd = this.TDCount(tr);   // F5: se cuenta una vez por fila (antes, en cada vuelta)
        for(let i=0;i<f5NumTd;i++)
        {
            if (this.Columns[i]!=undefined && !this._isBadgesCol(this.Columns[i]))
            {
                if (this.Columns[i].field!=undefined)
                {
                    if (tds[i]==this.CurrentTd())
                    {
                        if (!this.Editing)
                        {
                            this.UpdateDataMember(row,this.Columns[i].field,this.EdiTable.GetSelector().innerHTML);
                        }
                    }
                    else
                    {
                        //this.UpdateDataMember(row,this.Columns[i].field,tds[i].innerHTML);
                        this.UpdateDataMember(row,this.Columns[i].field,this.GetTdValue(tds[i], true));
                    }
                }
            }
        }

        return true;
    }

    setIsDirtyByValue=(row,field,value)=>{
        if (!this._dataArrayBackup) return;

        this.setIsDirty(row, this.DataArray[row][field]!=value);
        this.setIsDirty(row, this._dataArrayBackup[row][field]!=value);
    }
    /**
     * 
     * @param {Number} row Índice de la fila.
     * @param {String} field Nombre del campo a actualizar.
     * @param {String} value Valor del campo a actualizar.
     * @param {Boolean} stopfire Detiene la ejecución del evento descendiente *FieldUpdated* del elemento en cuestión.
     * @returns Retorna la información del **objeto** de la fila especificada.
     */
    UpdateDataMember=(row, field, value, stopfire = false)=>
    {
        value = this._f2AlActualizar(row, field, value);   // F2: recálculo de totales y value-type="number" (C12)
        this._f8AntesDeActualizar?.(row, field, value);   // F8a: getChanges guarda el original antes de escribir
        if (this.DataArray[row]==undefined)
            this.DataArray[row]={};

        if (field!=undefined && value!=undefined)
        {
            this.setIsDirtyByValue(row, field, value);

            this.DataArray[row][field]=value;

            var eventArgs={
                sender:this._getCurren(),
                row:row,
                field:field,
                value:value
            };
            
            if (this._getCurren().Events[this.EdiTable.Const.Events.FieldUpdated]!=undefined && !stopfire)
                this._getCurren().Events[this.EdiTable.Const.Events.FieldUpdated](eventArgs);
        }
        this._f6AlActualizar(row, field, stopfire);   // F6: subtotales y filas nuevas en su grupo
        this._f8TrasActualizar?.(row, field, stopfire);   // F8a: reglas de la fila, caché de la búsqueda, errores y resaltado

        return this.DataArray[row];
    }
    /**
     * Agrega una nueva fila a la tabla.
     */
    AddRow=()=>
    {
        return this.InsertRow();
    }
    /**
     * Crea una nueva fila en el índice especificado.
     * @param {Number} rw índice de la nueva fila.
     * @param {Boolean} nofocus Bloquea la selcción y foco automático al crear la fila.
     */
    InsertRow=(rw, nofocus = false)=>
    {
        if (this._f8AlInsertar?.(rw, nofocus) === false) return;   // F8a: BeforeRowLeave hacia la fila nueva; base de getChanges
        if (this._f5Activo) return this._f5Insertar(rw, nofocus);   // F5: en virtual se inserta en el modelo y se dibuja
        var tbody=this.GetTBody();
        var cols=this.ColumnsCount();
        
        if (rw!=undefined)
        {
            this.DataArray.splice(rw,0,{});
        }

        if (cols<1)
            return;

        if (tbody)
        {
            var nr=(this._f6InsertarTr(tbody, rw) ?? tbody.insertRow(rw));   // F6: con grupos, al final de los datos o junto a la fila rw
            var indexRow=this._getRowIndex(nr);

            for (let i=0;i<cols;i++)
            {
                let cell=nr.insertCell();
                let coldef=this.Columns[i];

                if (this.CSS.Cell)
                    cell.classList.add(this.CSS.Cell);

                    if (coldef!=undefined)
                        if (coldef.default!=undefined)
                        {
                            this.UpdateDataMember(indexRow,coldef.field,coldef.default,true)
                            //cell.append(coldef.default);
                            this.SetTdValue(cell,coldef.default);
                        }
            }
            // F1 (C1): un solo manejador de clic por celda, igual al de Initialize (recibe el td, no el
            // elemento interno). Antes cada InsertRow agregaba otro listener a todas las celdas.
            Array.from(nr.cells).forEach(td => {
                td.onclick = e => {
                    if (!this.ClickPropagation) e.stopPropagation();   // F1 (P37)
                    else if (e._f1EdiTableProcesado) return;
                    this.CellFocus(td);
                }
            });
            this._f4FilaInsertada(nr);   // F4: celda del sistema de la fila nueva
            // F1 (A2): solo los td del tbody. F5: sin columnas ocultas no hay nada que aplicar (no recorre la tabla).
            if (this.hideColumns.length) this._shadow.querySelectorAll(this.EdiTable.Const.HTML.TABLE+"#"+this.tableId+" > "+this.EdiTable.Const.HTML.TBODY+" "+this.EdiTable.Const.HTML.TD).forEach(td => {
                if (this.hideColumns.includes(this.ColIndexOfTd(td))) td.classList.add('hidde-col');   // F4: índice de datos
            });
            this._f6TrasColumnas();   // F6: el ciclo anterior también toca las celdas de las filas de grupo

            this._setMoveEvent();
            this._decorateRow(nr, indexRow, this.DataArray[indexRow]);
            this._f3TrasDibujar?.();   // F3

            if (!nofocus)
                this.CellFocus(nr.querySelector('td:not(.hidde-col):not(.et-sel-col)'));   // F4
            
            this._f2Programar();   // F2: recálculo de totales (RowAdded)
            var eventArgs={
                sender:this._getCurren(),
                tr:nr,
                rowIndex:indexRow,
            };

            if (this._getCurren().Events[this.EdiTable.Const.Events.RowAdded]!=undefined)
                this._getCurren().Events[this.EdiTable.Const.Events.RowAdded](eventArgs);
        }
    }
    /**
     * @returns Retorna el **número** de filas del elemento *tbody* de la tabla.
     */
    TRCount=()=>
    {
        if (this._f5Activo) return this.DataArray.length;   // F5 (P22): en modo virtual, todas las filas del modelo
        if (this._f6Grupos.length) return this._f6NumFilas();   // F6: sin las filas de grupo
        var tbody=this.GetTBody();
        if (tbody)
        {
            // F5: la misma cuenta que querySelectorAll('tr') (todos los tr del tbody), sin recorrerlo en cada llamada.
            return tbody.getElementsByTagName(this.EdiTable.Const.HTML.TR).length;
        }

        return 0;
    }
    /**
     * 
     * @returns Retorna el **número** de columnas del elemento *thead* de la tabla.
     */
    THCount=()=>
    {
        var thead=this.GetTHead();
        if (thead)
        {
            let tr=thead.querySelectorAll(this.EdiTable.Const.HTML.TR)[this.TheadRowIndex];

            if (tr)
            {
                let ths=tr.querySelectorAll(this.EdiTable.Const.HTML.TH+':not(.et-sel-col)');   // F4: sin la columna del sistema
                if (ths) return ths.length;
            }
        }

        return 0;
    }
    /** 
     * @param {HTMLTableRowElement} tr Referencia a una fila *tr* de la tabla.
     * @returns Retorna el **número** de celdas *td* de la fila especificada.
     */
    TDCount=(tr)=>
    {
        if (tr)
        {
            let tds=tr.querySelectorAll(this.EdiTable.Const.HTML.TD+':not(.et-sel-col)');   // F4
            if (tds) return tds.length;
        }

        return 0;
    }
    /**
     * @returns Retorna la **celda** *td* actualmente seleccionada.
     */
    CurrentTd=()=>
    {
        if (this.EdiTable.focusedTable!=this._getCurren())
            return null;
        
        var selector=undefined;
        
        if (this.Editing)
        {
            selector=this.EdiTable.GetInput();
            if (selector==undefined)
                selector=this.EdiTable.GetSelector();
        }
        else
        {
            selector=this.EdiTable.GetSelector();
        }

        if (selector==undefined)
            return null;

        if (selector==null)
            return null;

        return selector.closest('td');
        
    }
    /**
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna el elemento ***tr*** de la celda especificada.
     */
    TrOfTd=(td)=>
    {
        if (td==undefined)
            return null;

        if (td==null)
            return null;
        
        return td.closest('tr');
    }
    /**
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna el **índice** del elemento *tr* de la celda especificada, -1 si la celda es *undefined* o *null*.
     */
    RowIndexOfTd=(td)=>
    {
        if (td==undefined)
            return -1;

        if (td==null)
            return -1;
        
        return this._getRowIndex(td.closest('tr'));
    }
    /**
     * @returns Retorna el **índice** de la fila *tr* de la celda *td* actualmente seleccionada, -1 si no hay niguna celda selccionada.
     */
    CurrentRowIndex=()=>
    {
        let current_td=this.CurrentTd();
        if (current_td==null)
            return -1;
        
        return this._getRowIndex(current_td.closest('tr'));
    }
    /**
     * 
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna el **índice** de la celda *td* especificada en relación a su fila *tr*, -1 si la celda es *undefined*, *null*, o no pertenece a una fila *tr*.
     */
    ColIndexOfTd=(td)=>
    {
        if (td==undefined)
            return -1;

        if (td==null)
            return -1;
        
        return td.cellIndex - this._f4SysDe(td.parentElement);   // F4: índice de datos (la celda del sistema da -1)
    }
    /**
     * @returns Retorna el **índice** de la celda *td* actualmente seleccionada en relación a su fila, -1 si la celda es *null*, o no pertenece a una fila *tr*.
     */
    CurrentColIndex=()=>
    {
        let current_td=this.CurrentTd();

        if (current_td==null)
            return -1;
        
        return current_td.cellIndex - this._f4SysDe(current_td.parentElement);   // F4: índice de datos
    }
    /**
     * Ejecuta el evento LeaveCell de la celda especificada.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    LeaveCell=(td)=>
    {
        if (this._getCurren().Events[this.EdiTable.Const.Events.LeaveCell]==undefined)
        return;

        var eventArgs={
            td:td,
            sender:this._getCurren(),
        };

        this._getCurren().Events[this.EdiTable.Const.Events.LeaveCell](eventArgs);
    }
    /**
     * Ejecuta el evento EnterCell de la celda especificada.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    EnterCell=(td)=>
    {
        
        if (this._getCurren().Events[this.EdiTable.Const.Events.EnterCell]==undefined)
        return;

        var eventArgs={
            td:td,
            sender:this._getCurren(),
        };

        this._getCurren().Events[this.EdiTable.Const.Events.EnterCell](eventArgs);
    }
    Editing=false;
    /**
     * @returns Retorna información del **objeto** de la columna actualmente seleccionada.
     */
    GetColumnDef=()=>
    {
        let columnDef=this.Columns[this.CurrentColIndex()];
        if (columnDef==undefined)
            columnDef={type:this.ColumnsDefaultType};

        if (columnDef.type==undefined)
                columnDef.type=this.ColumnsDefaultType;

        if (columnDef.type==this.EdiTable.Const.Columns.Types.Check)
        {
            if (columnDef["Converts"]==undefined)
                columnDef["Converts"]=this.EdiTable.Converts.Boolean;
        }
        return columnDef;
    }
    /**
     * @param {Number} td Referencia a un elemento *td* de la tabla.
     * @returns Retorna información del **objeto** de la columna *td* especificada.
     */
    GetColumnDefOfTd=(td)=>
    {
        let columnDef=this.Columns[this.ColIndexOfTd(td)];
        if (columnDef==undefined)
            return null;

        return columnDef;
    }
    /**
     * Se preparan los datos y eventos descendientes al iniciar la edición de un elemento *td*.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @param {String} text Texto que se pasará como parámetro en los eventos descendientes.
     * @param {*} clear Si se establece el valor de *text* será vacio.
     */
    StartEdit=(td,text,clear)=>
    {
        if (this._f6EsGrupo(td)) return;   // F6: las filas de grupo no se editan
        if (this.ReadOnly) return;
        
        let columnDef=this.GetColumnDef();

        // F1 (C5): readonly="false", "0" o "no" en la columna significan editable.
        if ((columnDef?.readonly??false) && !this._f1EsFalso(columnDef.readonly)) return;
        // F1 (C17): la edición se abrió con el valor de la celda (Enter, F2, clic), no con una tecla ni con Supr.
        const f1ConValorActual = ((text==undefined || String(text).trim()==="") && !clear);
        this._f1Edicion = null;
        if (columnDef.type==this.EdiTable.Const.Columns.Types.NoEditable || this._isBadgesCol(columnDef)) return;

        this.Editing=true;
        
        if (this.Events[this.EdiTable.Const.Events.StartEdition]!=undefined)
        {
            var eventArgs={
                td:td,
                sender:this._getCurren(),
                coldef:columnDef,
                text:text
            };

            this._getCurren().Events[this.EdiTable.Const.Events.StartEdition](eventArgs);
        }

        if (columnDef.type==this.EdiTable.Const.Columns.Types.Custom)
        {
            this.Editing=false;
            return;
        }

        let selector=this.EdiTable.GetSelector();

        this["temp_html"]=selector.innerHTML;

        if (text==undefined)
            text=selector.textContent;

        if (text.trim()==="")
            text=selector.textContent;

        if (clear)
            text="";
        
        selector.style.display = 'none';

        if (!this._f2CrearEditor(td, columnDef))   // F2: editor propio (input de texto) con mask, calc o locale
        switch(columnDef.type)
        {
            case this.EdiTable.Const.Columns.Types.Memo:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Memo;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Memo, false);
                break;
            case this.EdiTable.Const.Columns.Types.Date:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Date;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Date, false);
                break;
            case this.EdiTable.Const.Columns.Types.DateTime:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.DateTime;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.DateTime, false);
                break;
            case this.EdiTable.Const.Columns.Types.Select:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Select;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Select, false);
                break;
            case this.EdiTable.Const.Columns.Types.Check:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Check;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Check, false);
                break;
            case this.EdiTable.Const.Columns.Types.Number:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Number;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Number, false);
                break;
            case this.EdiTable.Const.Columns.Types.Text:
                //td.innerHTML = this.EdiTable.Const.HTML.Inputs.Text;
                this.SetTdValue(td, this.EdiTable.Const.HTML.Inputs.Text, false);
                break;
        }
        let input=this.EdiTable.GetInput();

        if (columnDef.type==this.EdiTable.Const.Columns.Types.Select && columnDef.options!=undefined)
        {
            Object.entries(columnDef.options).forEach(([key, value]) => {
                const option = this._createFullElement('option');
                option.value = key;
                option.textContent = value;
                input.appendChild(option);
            });

            if (columnDef.keyfield!=undefined)
            {
                if (this.DataArray[this.RowIndexOfTd(td)]!=undefined)
                    if (this.DataArray[this.RowIndexOfTd(td)][columnDef.keyfield]!=undefined)
                        text=this.DataArray[this.RowIndexOfTd(td)][columnDef.keyfield];
            }
        }

        if (Number(columnDef.maxlength??0) && (columnDef.type==this.EdiTable.Const.Columns.Types.Text || columnDef.type==this.EdiTable.Const.Columns.Types.Memo))
        {
            if (input) input.setAttribute('maxlength', columnDef.maxlength);
        }

        // F1 (C13): el control nativo de Number acepta decimales (sin step, cualquier decimal queda :invalid).
        // Se pone antes de InputCreated para que el consumidor todavía pueda cambiarlo.
        if (input && input.tagName == 'INPUT' && (input.getAttribute('type') ?? '').toLowerCase() == 'number' && !input.hasAttribute('step'))
            input.setAttribute('step', 'any');

        var eventArgs={
            input:input,
            td:td,
            sender:this._getCurren(),
            text:text,
            coldef:columnDef
        };
        const f1TextoAntesDeEventos = text;   // F1 (C17)

        if (this._getCurren().Events[this.EdiTable.Const.Events.InputCreated]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.InputCreated](eventArgs);

        
        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput](eventArgs);
        
        // F1 (C18): el editor nativo de fecha recibe el valor en el formato que acepta.
        let f1Texto = eventArgs.text;
        const f1Tipo = (input?.tagName == 'INPUT' ? (input.getAttribute('type') ?? '').toLowerCase() : '');
        if (f1Tipo == 'date' || f1Tipo == 'datetime-local') f1Texto = this._f1FechaParaEditor(f1Texto, f1Tipo);

        this.EdiTable.SetInputVal(input, f1Texto, this._getCurren(), columnDef);
        this._f2PrepararEditor(input, columnDef, td, f1ConValorActual);   // F2: máscara, valor inicial, inputmode, segundos

        // F1 (C17): valor con el que se abrió el editor, para saber al confirmar si el usuario lo cambió.
        // Si el consumidor propuso otro texto en InputCreated/BeforeSetInput, confirmar sí lo guarda, como hoy.
        if (input && f1ConValorActual && eventArgs.text === f1TextoAntesDeEventos)
            this._f1Edicion = { input, inicial: this.EdiTable.GetInputValue(input, this._getCurren(), columnDef) };

        input.focus();
        this.EdiTable.SetInputEventHandler(input,this._getCurren()); 
        this._f8PrepararEditor?.(input);   // F8a: Tab/Enter del editor con secuencia de captura
                                
    }
    /**
     * Actualiza los valores de la columna modificada en el dataArray e inicializa sus eventos descendientes.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     * @param {String} displayText Texto que se pasará como parámetro en los eventos descendientes.
     * @returns Retorna ***true*** si se culminó la edición, en caso contrario: ***false***.
     */
    ConfirmEdit=(td,displayText)=>
    {
        if (this._f2AntesDeConfirmar(td) === false) return false;   // F2: MaskInvalid del editor propio; marca value-type
        if (!this.Editing)
            return true;
        
        var columnDef=this.GetColumnDef();

        this.Editing=false;

        let input=this.EdiTable.GetInput();
        var eventArgs={
            input:input,
            text:displayText,
            td:td,
            sender:this._getCurren(),
            coldef:columnDef,
            cancel:false
        };

        // F1 (C17): true si el usuario no cambió lo que mostraba el editor al abrirse.
        let f1SinCambio = false;
        let f1TextoLeido;

        if (input!=undefined)
        {
            // F1 (C15): si el control nativo de Number no entiende lo tecleado (badInput), no se confirma.
            // Solo input[type=number]: Date y DateTime se quedan como hoy (R8).
            const f1BadInput = (input.tagName == 'INPUT' && (input.getAttribute('type') ?? '').toLowerCase() == 'number'
                && input.validity && input.validity.badInput);
            // El aviso y el foco solo en un confirmar del usuario (Enter, Tab, clic en otra celda). Desde el
            // intervalo de auto-confirm, o con el foco fuera de la tabla, no se confirma y el editor se deja igual.
            const f1DelUsuario = (!this._f1AutoConfirmando && (this._f1ConfirmDesdeCelda || !!this._shadow?.activeElement));   // foco dentro de la tabla (también si está anidada en otro shadow)
            if (f1BadInput && !f1DelUsuario)
            {
                this.Editing = true;
                return false;
            }
            if (f1BadInput && !this._f1BadInputAvisado.has(input))
            {
                const f1Args = { sender: this._getCurren(), td: td, input: input, row: this.RowIndexOfTd(td),
                    field: columnDef.field, value: input.value, reason: 'badInput', cancel: true };
                this._f1BadInputAvisado.add(input);
                // F1: un solo listener por editor (B1 de la revisión).
                if (!this._f1BadInputEscuchado.has(input))
                {
                    this._f1BadInputEscuchado.add(input);
                    input.addEventListener('input', () => this._f1BadInputAvisado.delete(input));
                }
                this._fireEvent(this.EdiTable.Const.Events.MaskInvalid, f1Args);
                if (f1Args.cancel)
                {
                    this._f1BadInputPendiente = input;
                    this.Editing = true;
                    if (input.isConnected) input.focus();
                    return false;
                }
                this._f1BadInputPendiente = null;
            }
            else if (f1BadInput && this._f1BadInputPendiente === input)
            {
                // Ya se avisó y el consumidor pidió no confirmar: sigue en edición sin volver a avisar.
                this.Editing = true;
                if (input.isConnected) input.focus();
                return false;
            }

            eventArgs.text=this.EdiTable.GetInputValue(input, this._getCurren(), columnDef);
            f1SinCambio = (this._f1Edicion != null && this._f1Edicion.input === input && eventArgs.text === this._f1Edicion.inicial);

            if (columnDef.keyfield!=undefined && columnDef.type==this.EdiTable.Const.Columns.Types.Select)
            {
                var combo=input;
                if (combo.selectedIndex<0)
                    eventArgs.text="";
                else
                    eventArgs.text=combo.options[combo.selectedIndex].text;

                this._f6Confirmando = !f1SinCambio;   // F6: edición del usuario
                if (!f1SinCambio) this.UpdateDataMember (this.RowIndexOfTd(eventArgs.td),columnDef.keyfield,input.value);
            }
            f1TextoLeido = eventArgs.text;

            if (this.Events[this.EdiTable.Const.Events.BeforeUpdateCell]!=undefined)
                this.Events[this.EdiTable.Const.Events.BeforeUpdateCell](eventArgs);
            this._f8TrasBeforeUpdate?.(eventArgs, td, columnDef);   // F8a: e.error marca la celda y sigue editando

            if (eventArgs.cancel)
            {
                this.Editing=true;
                return false;
            }

            input.remove();
            eventArgs.input=undefined;
        }

        if (this._getCurren().Events[this.EdiTable.Const.Events.ConfirmEdition]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.ConfirmEdition](eventArgs);
        
        if (eventArgs.cancel)
            return false;

        if (columnDef.type == 'Text' && columnDef.inputkey)
        {
            this.showInputKey(td, eventArgs.text);
            return true;
        }
        
        // F1 (C17): sin cambios del usuario (ni del consumidor en los eventos), DataArray no se toca y
        // no se disparan FieldUpdated ni IsDirtyChanged; la celda vuelve a mostrar lo de antes, como al cancelar.
        this._f1Edicion = null;
        if (f1SinCambio && eventArgs.text === f1TextoLeido)
        {
            if (this["temp_html"]!=undefined) this.SetTdValue(td, this["temp_html"], true);
            return true;
        }

        //td.innerHTML = eventArgs.text;
        this.SetTdValue(td, eventArgs.text, true);
        this._f6Confirmando = true;   // F6: edición del usuario
        this.UpdateDataMember(this.RowIndexOfTd(td),columnDef.field,eventArgs.text);

        return true;
    }
    // ========================= F1: edición (C15, C18)
    _f1BadInputAvisado = new WeakSet();
    _f1BadInputEscuchado = new WeakSet();
    _f1AutoConfirmando = false;
    _f1ConfirmDesdeCelda = false;
    _f1BadInputPendiente = null;
    _f1Edicion = null;
    _f1Dos=(n)=> String(n).padStart(2, '0');
    // F1 (C18): convierte el valor al formato que acepta el control nativo. Lo que no se puede convertir
    // con seguridad (por ejemplo 01/02/2026) se deja igual: el control abre vacío y C17 evita perderlo.
    _f1FechaParaEditor=(texto, tipo)=>
    {
        if (texto == undefined) return texto;
        const t = String(texto).trim();
        if (tipo == 'date')
        {
            if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return texto;
            const m = /^(\d{4}-\d{2}-\d{2})[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:Z|[+-]\d{2}:?\d{2})?$/i.exec(t);
            return (m ? m[1] : texto);   // la fecha tal como viene, sin convertir zona horaria
        }
        if (tipo == 'datetime-local')
        {
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(t)) return texto;
            const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(t);
            if (!m) return texto;
            if (!m[7]) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` + (m[6] ? `:${m[6]}` : '');
            // Con zona (Z u offset) se convierte a hora local.
            const zona = (m[7].toUpperCase() == 'Z' ? 'Z' : (m[7].includes(':') ? m[7] : m[7].slice(0, 3) + ':' + m[7].slice(3)));
            const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}${zona}`);
            if (isNaN(d)) return texto;
            const s = d.getSeconds();
            return `${d.getFullYear()}-${this._f1Dos(d.getMonth()+1)}-${this._f1Dos(d.getDate())}T${this._f1Dos(d.getHours())}:${this._f1Dos(d.getMinutes())}` + (s ? `:${this._f1Dos(s)}` : '');
        }
        return texto;
    }
    /**
     * Cancela la edición de la celda *td* especificada y restablece su valor.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    CancelEdit=(td)=>
    {
        if (!this.Editing)
            return;

        this.Editing=false;

        let input=this.EdiTable.GetInput();

        if (input!=undefined)
        {
            input.remove();

            if (this["temp_html"]!=undefined && this.EdiTable.focusedTable==this._getCurren())
            {
                //td.innerHTML = this["temp_html"];
                this.SetTdValue(td, this["temp_html"], true);
            }

            this.CellFocus(td);
        }

        if (this.Events[this.EdiTable.Const.Events.CancelEdition]!=undefined)
        {
            var eventArgs={
                td:td,
                sender:this._getCurren(),
            };

            this._getCurren().Events[this.EdiTable.Const.Events.CancelEdition](eventArgs);
        }
    }
    /**
     * Establece el foco a la celda *td* especificada.
     * @param {HTMLTableCellElement} td Referencia a un elemento *td* de la tabla.
     */
    CellFocus=(td)=>
    {
        if (this._f6EsGrupo(td)) { this._f6EnfocarGrupo(td.closest('tr')); return; }   // F6 (P24)
        this._fireBlur=false;

        var eventArgs={
            td:td,
            sender:this._getCurren(),
            cancel:false
        };

        if (this._getCurren().Events[this.EdiTable.Const.Events.BeforeCellFocus]!=undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.BeforeCellFocus](eventArgs);

        if (eventArgs.cancel) return;
        if (this._f8SalirDeFila?.(td) === false) return;   // F8a: BeforeRowLeave (cancelable) al cambiar de fila

        let selector=this.EdiTable.GetSelector();
        let input=this.EdiTable.GetInput();
        const f8Ref = (input!=undefined ? this._f8RefTd?.(td) : null);   // F8a: por si al confirmar se vuelve a dibujar

        if (input!=undefined)
        {
            if (this.EdiTable.focusedTable!=null)
            {
                // F1 (C15): el clic en otra celda es un confirmar del usuario aunque el foco ya haya salido del editor.
                this._f1ConfirmDesdeCelda = true;
                let f1Ok;
                try { f1Ok = this.EdiTable.focusedTable.ConfirmEdit(input.closest('td')); }
                finally { this._f1ConfirmDesdeCelda = false; }
                if (!f1Ok) return;
            }
            else
                input.remove();
        }
        if (f8Ref && td && !td.isConnected) { td = this._f8TdVigente?.(f8Ref); if (!td) return; eventArgs.td = td; selector = this.EdiTable.GetSelector(); }   // F8a: celda equivalente de la fila redibujada

        if (selector!=undefined)
        {
            // F1 (C19): la celda que se deja se toma antes de quitar el selector (antes LeaveCell recibía null).
            const f1TdAnterior = selector.closest('td');
            this.SetTdValue(f1TdAnterior, selector.innerHTML, true);
            if (this.EdiTable.focusedTable!=null)
            {
                this.LeaveCell(f1TdAnterior);
            }

            selector.remove();
        }

        let txt=this.GetTdValue(td, false);
        //let txt=td.innerHTML;

        let button = '';
        let coldef = this.GetColumnDefOfTd(td);

        if (coldef && (coldef['button'] ?? '') == 'true') button = this.EdiTable.Const.HTML.Button;
        this.SetTdValue(td,this.EdiTable.Const.HTML.Selector+button, false);
        //td.innerHTML = this.EdiTable.Const.HTML.Selector;
        
        let btn = this.EdiTable.GetButtonOption();
        
        if (btn)
        {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.showInputKey(td, '', false);
            }
            btn.innerHTML = ((coldef['buttondata']??'').trim() != '' ?
                coldef['buttondata']:
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16"><path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>');
            
            if (this.ButtonOnClick)
            {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    let rowIndex = this.RowIndexOfTd(td);
                    let colIndex = this.ColIndexOfTd(td);
                    this.ButtonOnClick(rowIndex, colIndex, coldef);
                }
            }
        }

        selector=this.EdiTable.GetSelector();
        selector.classList.toggle('transparent', this.hiddeSelector);
        selector.innerHTML = txt;
        this.EdiTable.focusedTable=this._getCurren(true);

        selector.focus();
        this.EnterCell(selector.closest('td'));

        const clickFunc = (e) => {
            if (!this.ClickPropagation) e.stopPropagation();   // F1 (P37)
            else e._f1EdiTableProcesado = true;
            this.StartEdit(selector.closest('td'),"");  
        }
        selector.removeEventListener('click', clickFunc);
        selector.addEventListener('click', clickFunc);

        this.EdiTable.SetSelectorKeyEventHandler(selector, this._getCurren());
        if (this.CSS.RowSelected)
        {
            // F5: solo los tr que tienen la clase (antes se recorrían todos); el resultado es el mismo.
            let trs = Array.from(td.closest('tr').parentElement.getElementsByClassName(this.CSS.RowSelected)).filter(tr => tr.tagName == 'TR');
            if (trs && trs.length > 0) trs.forEach(tr => tr.classList.remove(this.CSS.RowSelected));
            if(!this.hiddeRowSelector) td.closest('tr').classList.add(this.CSS.RowSelected);
        }
        this._trackSelection(td.closest('tr'));

        if (this._current_row != this.CurrentRowIndex())
        {
            eventArgs['index'] = this.CurrentRowIndex();
            eventArgs['previous_index'] = this._current_row;
            if (this._getCurren().Events[this.EdiTable.Const.Events.RowChanged]!=undefined)
                this._getCurren().Events[this.EdiTable.Const.Events.RowChanged](eventArgs);
        }

        this._current_row = this.CurrentRowIndex();
        this._f6TrasFoco(td);   // F6: las filas nuevas que se dejan se colocan en su grupo
        this._f8TrasFoco?.(td);   // F8a: resaltado de la búsqueda en la fila que se deja y en la nueva
    }
    /**
     * Mueve el selector una celda hacia arriba de la celda *td* especificada.
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     */
    NavUp=(active_cell)=>
    {
        if (this._f6Nav(active_cell, -1)) return;   // F6: recorre también las filas de grupo
        if (this._f5Activo) return this._f5Nav(active_cell, -1);   // F5: en virtual, por el modelo
        let active_cell_index=active_cell.cellIndex;
        let parent_tr = active_cell.parentElement;
        let parent_tbody = active_cell.parentElement.parentElement;
        let target_tr = this._f5Vecina(parent_tr, -1) ?? parent_tbody?.querySelectorAll(this.EdiTable.Const.HTML.TR+":not(.hidde-row)")[(this._getVisibleRowIndex(parent_tr) - 1)];   // F5: sin recorrer el tbody
        let target_cell = target_tr?.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index];
        if( this._getRowIndex(parent_tr) != 0 ) 
            this.CellFocus(target_cell);
    }
    /**
     * Mueve el selector hacia la izquierda de la celda *td* especificada.
     * Si la propiedad *EverMove* está establecida en *true* y el indice de la celda *td* especificada es igual a 0 o es la primera de la fila el selector subirá una fila y se posicionará al final de ésta.
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     */
    NavLeft=(active_cell)=>
    {
        let active_cell_index=active_cell.cellIndex;
        if (this._getVisibleColumnIndex(active_cell)==0)
        {
            if (!this.EverMove)
                return;
            
            this.NavUp(active_cell);
            this.NavToLastCell(this.CurrentRowIndex());
            return;
        }

        let parent_tr = active_cell.parentElement;
        let target_cell = parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col):not(.et-sel-col)")[this._getVisibleColumnIndex(active_cell)-1];   // F4
        this.CellFocus(target_cell);
    }
    /**
     * Mueve el selector hacia la derecha de la celda *td* especificada.
     * Si la propiedad *EverMove* está establecida en *true* y la celda *td* especificada es la última de la fila el selector bajará una fila y se posicionará al principio de ésta.
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     * @returns 
     */
    NavRight=(active_cell)=>
    {
        let active_cell_index=active_cell.cellIndex;

        let parent_tr = active_cell.parentElement;
        // console.log(active_cell_index);
        // console.log(parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col)").length);
        if (this._getVisibleColumnIndex(active_cell)==parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col):not(.et-sel-col)").length-1)   // F4
        {
            if (!this.EverMove)
                return;
            
            this.NavDown(active_cell);
            this.NavToFirstCell(this.CurrentRowIndex());
            return;
        }

        let target_cell = parent_tr.querySelectorAll(this.EdiTable.Const.HTML.TD+":not(.hidde-col):not(.et-sel-col)")[this._getVisibleColumnIndex(active_cell)+1];   // F4
        this.CellFocus(target_cell);
    }
    /**
     * Mueve el selector una celda hacia abajo de la celda *td* especificada.
     * Si no hay más celdas por bajar y la propiedad *AutoAddRow* está establecida en *true* se agregará una fila nueva hacia abajo de la tabla
     * @param {HTMLTableCellElement} active_cell Referencia a un elemento *td* de la tabla.
     */
    NavDown=(active_cell)=> 
    {
        if (this._f6Nav(active_cell, 1)) return;   // F6
        if (this._f5Activo) return this._f5Nav(active_cell, 1);   // F5: en virtual, por el modelo
        let active_cell_index=active_cell.cellIndex;
        let parent_tr = active_cell.parentElement;
        let parent_tbody = active_cell.parentElement.parentElement;
        let target_tr = this._f5Vecina(parent_tr, 1) ?? parent_tbody?.querySelectorAll(this.EdiTable.Const.HTML.TR+":not(.hidde-row)")[(this._getVisibleRowIndex(parent_tr) + 1)];   // F5: sin recorrer el tbody
        let target_cell = target_tr?.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell_index];
        if( target_tr!=undefined) 
            this.CellFocus(target_cell);
        else
        {
            if (this.AutoAddRow)
                this.AddRow();
        }
    }

    GetTdHtml=(td)=>
    {
        // const cellContent = td.querySelector('div[iscellcontent=true]');
        // if (cellContent)
        //     cellContent.innerHTML = '@value';
        // else
        //     td.innerHTML = '@value';
        return td.innerHTML;
    }
    GetTdValue=(td, valideEncode=false)=>
    {
        if (td && td.tagName.toLowerCase() != 'td') td = td.closest('td');
        if (td == undefined) return td.innerHTML;   // F5: sin celda, la misma excepción que antes
        // F5: si el primer hijo es el contenido de la celda, es lo primero que encontraría querySelector.
        const f5Primero = td.firstElementChild;
        const cellContent = ((f5Primero && f5Primero.tagName == 'DIV' && f5Primero.getAttribute('iscellcontent') === 'true') ? f5Primero : td.querySelector('div[iscellcontent=true]'));
        let value = (cellContent ? cellContent.innerHTML : td.innerHTML);   // F5: sin serializar la celda completa si no hace falta

        let coldef = this.GetColumnDefOfTd(td);
        const f2Leido = this._f2LeerCelda(coldef, value, valideEncode);   // F2: quita máscara, locale o date-display
        if (f2Leido !== undefined) value = f2Leido; else   // F2
        if (this._withFormat(coldef, value))
            value = value.replace(/[^0-9.-]+/g, "");

        // El contenido de una columna con plantilla es HTML ya renderizado, no texto de usuario.
        if (valideEncode && this.htmlEncode && !coldef?.template) value = this.getHtmlDecode(value);
        
        return value;
    }
    applyTemplate=(template, DataRow)=>
    {
        if (this.TemplateEncode && DataRow && typeof DataRow == 'object') DataRow = this._encodeRow(DataRow);
        let expr="`"+template+"`";
        return eval(expr);
    }
    SetTdValue=(td, value, valideEncode=false, coldef=null)=>
    {
        if(!coldef) coldef = this.GetColumnDefOfTd(td);
        if (this._f8bMarcas) this._f8bTd(td, value, coldef);   // F8b: et-num / et-neg (solo con tema)
        value = this._f2Presentar(coldef, value);   // F2: máscara, decimal del locale y date-display (solo visual)

        if (this._withFormat(coldef, value))
            value = this._aplyFormat(coldef, value);

        // Con html-encode, al quitar el foco de una celda con plantilla su HTML se escapaba y se veía como texto.
        if (valideEncode && this.htmlEncode && !coldef?.template) value = this.setHtmlEncode(value);

        let cellContent = td.querySelector('div[iscellcontent=true]');
        if (!cellContent) cellContent = td.closest('div[iscellcontent=true]');
        
        if (cellContent)
        {
            this._f5Html(cellContent, value);   // F5
            this._setRowSizes(cellContent,coldef);
            return;
        }
        else
        {
            cellContent = this._createFullElement('div', { iscellcontent:'true', class:'cell-content' });
            this._f5Html(cellContent, value);   // F5
            this._setRowSizes(cellContent,coldef);
            // F5: el mismo nodo en lugar de serializarlo y volver a interpretarlo (antes: td.innerHTML = outerHTML).
            td.innerHTML = '';
            td.appendChild(cellContent);
        }
        //td.innerHTML = value;
    }
    _setRowSizes(cellContent,coldef)
    {
        if (cellContent)
        {
            // Sizes
            cellContent.style.minHeight = this.minRowHeight;
            cellContent.style.maxHeight = this.maxRowHeight;
            cellContent.style.height = this.rowHeight;
            if (coldef?.minwidth) cellContent.style.minWidth = coldef.minwidth;
            if (coldef?.maxwidth) cellContent.style.maxWidth = coldef.maxwidth;
            if (coldef?.width) cellContent.style.width = coldef.width;
            // Align
            cellContent.style.justifyContent = (coldef?.textalign??'');
            cellContent.style.textAlign = (coldef?.textalign??'');

            if (this.maxRowHeight != 'none' || this.rowHeight != '100%')
            {
                cellContent.style.display = 'block';
            }
        }
    }
    _withFormat(coldef, value)
    {
        value = value.toString();
        return (value
            && !value.includes('__table_selector') 
            && !value.includes('__table_input') 
            && coldef 
            && ((coldef.type ?? '').toString().toLowerCase() == 'number' || (coldef.type ?? '').toString().toLowerCase() == 'noeditable')
            && (coldef.format??'') == 'true');
    }
    _aplyFormat(coldef, value)
    {
        const f2 = this._f2FormatoLocale(coldef, value); if (f2 != null) return f2;   // F2 (C16): separadores del locale explícito
        let decimals = Number(coldef.decs??0);
        let thousand = ((coldef.thousandssep??'false') == 'true');
        value = this._format(Number(value), decimals, thousand);
        value = `${(coldef.prefix??'')}${value}`;
        value = `${value}${(coldef.sufix??'')}`;
        return value;
    }
    // ========================= SORT FUNCTIONS
    
    _TreeValueIndent = 1;
    _TreeUnitIndent = 'rem';
    _expandOnStart = false;

    _refreshTable=()=>
    {
        let rows = this.TRCount();
        for (let i = 0; i < rows; i++)
            this.UpdateRow(i);
    }
    _initTreeValues=()=>
    {
        let v = (this.getAttribute('show-tree') ?? '').trim();
        this.ShowAsTree = (v == 'true');

        v = (this.getAttribute('can-move-row') ?? (this.ShowAsTree ? 'true' : 'false')).trim();
        this.CanMoveRow = (v == 'true');

        v = (this.getAttribute('key') ?? '').trim();
        this.Key = (v != '' ? v : this.Key);
        
        v = (this.getAttribute('parentkey') ?? '').trim();
        this.ParentKey = (v != '' ? v : this.ParentKey);

        v = (this.getAttribute('childs-field') ?? '').trim();
        this.Childs = (v != '' ? v : this.Childs);
    }
    _getTreeOptions=()=>
    {
        if (!this.TreeOptions || Object.keys(this.TreeOptions) < 1) 
        {
            this.TreeOptions = {
                key: this.Key,
                parentkey: this.ParentKey,
                childs: this.Childs
            }
        }
        return this.TreeOptions;
    }
    _printTreeData=()=>
    {
        if (this.ShowAsTree) this.SetTree(this.GetTree());
        else this.TableArray(this.DataArray);
        this._printRows();
    }
    _printRows=()=>
    {
        if (this._f5DebeVirtualizar?.()) return this._f5PrintRows();   // F5: con virtual-rows solo se dibuja lo visible
        const thead = this._table.querySelector('thead');
        const tbody = this._table.querySelector('tbody');

        const trs = tbody.querySelectorAll('tr');
        let rowsExpanded = [];

        trs.forEach(r => {
            if (r.querySelector('span[expanded=true]') && (r.getAttribute('id')??''))
                rowsExpanded.push(r.getAttribute('id'));
        });

        // F1 (M1): el redibujo completo no deja registros en el observador del mapa; el mapa queda sucio.
        if (this._f1MO) { this._f1MO.disconnect(); this._f1MO = null; this._f1TBody = null; }
        tbody.innerHTML = '';
        let dataArray = this.DataArray;

        // F5 (§10): en árbol, sin copia JSON profunda: se dibujan los objetos de DataArray con el nivel aparte.
        // Si los datos no permiten hacerlo con el mismo resultado (llaves repetidas, ciclos…), el camino de antes.
        const f5Arbol = (this.ShowAsTree ? this._f5OrdenArbol(this.DataArray) : null);
        const f5Nivel = (data, idx) => (f5Arbol ? f5Arbol.nivel[idx] : data['__level__']);
        if (f5Arbol) dataArray = f5Arbol.filas;
        else if (this.ShowAsTree)
        {
            let treeArray = this.TreeArray(JSON.parse(JSON.stringify(this.DataArray)));
            dataArray = this.TableArray(treeArray, null, false);
        }
        const f5Frag = document.createDocumentFragment();   // F5: las filas se agregan juntas al final
        const f5PorId = new Map();   // F5: id → primer tr con ese id (para volver a expandir)
        const f5Hijos = new Map();   // F5: valor de parent → sus tr, en orden (lo que daría _getChildRows)

        if (dataArray && dataArray.length > 0 && thead.hasChildNodes())
        {
            let treeOptions = this._getTreeOptions();
            
            dataArray.forEach((data, idx) => 
            {
                const tr = this._createFullElement('tr', { id: (data[treeOptions.key]??''), parent: (data[treeOptions.parentkey]??''), indent: (f5Nivel(data, idx)??0) });   // F5
                let container = null;
                
                // F1 (A4): misma celda que _getFullTable, más el contenedor del árbol y hideColumns.
                this.Columns.forEach((column, i) =>
                {
                    const c = this._f1PintarCelda(tr, column, i, data, idx, this.ShowAsTree, true);
                    if (c) container = c;
                });

                if (this.ShowAsTree)
                {
                    const expand = this._createFullElement('span', { class:'collapse-btn', expanded: this._expandOnStart });
                    expand.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>'
                    
                    const td = tr.firstChild;                    
                    td.classList.add('cell-collapsable');
                    let ident = Number(f5Nivel(data, idx)??0);   // F5
                    tr.setAttribute('indent', ident);
                    this._setIndent(td, ident);
                    if((f5Arbol ? f5Arbol.hijos[idx] : data['__havechilds__']) && container) container.prepend(expand);   // F5
                    else this._setIndent(td, ident+.7);

                    expand.onclick = e => {
                        e.stopPropagation();
                        if (expand.getAttribute('expanded') == 'true')
                            this.CollapseRow(tr);
                        else
                            this.ExpandRow(tr);
                    }
                    if (!this._expandOnStart) {
                        expand.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';
                        if (ident > 0) {
                            tr.classList.add('hidde-row');
                            expand.setAttribute('expanded','false');
                        }
                    }
                }

                this._decorateRow(tr, idx, data);
                f5Frag.appendChild(tr);   // F5
                const f5Id = tr.getAttribute('id'); if (!f5PorId.has(f5Id)) f5PorId.set(f5Id, tr);   // F5
                const f5P = tr.getAttribute('parent'); (f5Hijos.get(f5P) ?? f5Hijos.set(f5P, []).get(f5P)).push(tr);   // F5
            });  
        }
        tbody.appendChild(f5Frag);   // F5
        // F5: sin tr anidados, el primer tr con ese id sale del mapa (mismo resultado que querySelector).
        const f5SinAnidados = (tbody.getElementsByTagName('tr').length === tbody.rows.length);
        if (f5SinAnidados) this._f5HijosCache = f5Hijos;   // F5: ExpandRow no cambia la estructura mientras vuelve a expandir
        try {
        rowsExpanded.forEach(trId => {
            const tr = ((f5SinAnidados && !/['\\]/.test(trId)) ? f5PorId.get(trId) : tbody.querySelector(`tr[id='${trId}']`));   // F5
            if (tr) this.ExpandRow(tr);
        });
        } finally { this._f5HijosCache = null; }   // F5
        this.Initialize(this._table.getAttribute('id'));
        this._f6TrasDibujar();   // F6: mapa de índices y filas de grupo (antes de F4 y F3)
        this._setMoveEvent();
        this._f4TrasDibujar();   // F4: celdas del sistema y selección después de redibujar
        this._f3TrasDibujar?.();   // F3: clases y left de las columnas fijas en las filas nuevas
        this._f2Programar();   // F2: recálculo de totales (DataArray asignado, ordenar, árbol)
        this._f8TrasDibujar?.();   // F8a: en árbol con filtro, se ven las filas que pasan
    }

    _setIndent=(td, indent=0)=>
    {
        if (!td) return;
        td.style.paddingLeft = `${this._TreeValueIndent*Number(indent)}${this._TreeUnitIndent}`;
    }
    _getCurrentRow=()=>
    {
        return this.TrOfTd(this.CurrentTd());
    }
    _getChildRows=(row)=>
    {
        let parent_id = (row.getAttribute('id')??'___');
        if (this._f5HijosCache && !/['\\]/.test(parent_id)) return (this._f5HijosCache.get(parent_id) ?? []);   // F5: dentro de _printRows, sin consultar
        // F1 (A2): solo las filas del tbody.
        const child_rows = this._table.querySelectorAll(`tbody tr[parent='${parent_id}']`);
        return child_rows;
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
                    if (data[treeOptions.parentkey] == (obj[treeOptions.key]??'_'))
                        parentObj = obj;
                    else if ((data[treeOptions.key] ?? '|') == (obj[treeOptions.key] ?? '_'))
                        sourcData = { listObj, idx };
                    return ((parentObj && sourcData) || _search((obj[treeOptions.childs]??[])));
                });
            }
            
            if (!_search(list)) return;

            const parentChilds = (parentObj[treeOptions.childs]??[]);
            parentChilds.push( ...sourcData.listObj.splice(sourcData.idx, 1) );
            parentObj[treeOptions.childs] = parentChilds;
        }

        // F5 (§10): sin copia JSON cuando las llaves lo permiten (únicas, sin ciclos): mismo árbol en O(n).
        if (dataArray && dataArray.length > 0 && this._f5TreeArrayRapido(dataArray, treeOptions)) return dataArray;
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
    TableArray=(treeArray, treeOptions=null, treeInfo=true)=>
    {
        if (!treeOptions) treeOptions = this._getTreeOptions();
        let newArray = [];
        let level = -1;

        if (treeArray && treeArray.length > 0)
        {
            const moveToFirstLevel = listObj => 
            {
                level++;
                listObj.forEach(obj => {
                    let childsObj = (obj[treeOptions.childs]??[]);
                    newArray.push(obj);
                    if (!treeInfo) {
                        obj['__level__']=level;
                        obj['__havechilds__']=((obj[treeOptions.childs]??[]).length > 0);
                    }
                    if (childsObj.length > 0) {
                        delete obj[treeOptions.childs];
                        moveToFirstLevel(childsObj);
                        level--;
                    }
                });
            }

            moveToFirstLevel(treeArray);
        }
        return newArray;
    }
    SetTree=(treeData, treeOptions=null)=>
    {
        if (treeOptions) this.TreeOptions = treeOptions;
        if (treeData && treeData.length > 0)
            this.DataArray = this.TableArray(treeData, this.TreeOptions);
    }
    GetTree=(treeOptions)=>
    {
        return this.TreeArray(this.DataArray, treeOptions);
    }
    RowIndentation=(row, treeOptions=null)=>
    {
        if (!row) return null;
        return Number((row.getAttribute('indent') ?? 0));
    }
    RowIndent=(row, inFront=true, treeOptions=null)=>
    {
        if (!row) return;
        if (!treeOptions) treeOptions = this._getTreeOptions();

        const indexRow = this._getRowIndex(row);
        let sourceData = this.DataArray[indexRow];
        let targetData = null;

        if (!sourceData) return;

        if (inFront)
        {
            // Obtener el hermano superior
            let flag = false;
            const search = (list) => 
            {
                return list.some((obj, idx) => 
                {
                    if (sourceData[treeOptions.key] == (obj[treeOptions.key]??'_')) {
                        flag = true;
                        targetData = list[idx-1];
                    }
                    return (flag || search((obj[treeOptions.childs]??[])));
                });
            }

            this.GetTree(treeOptions);
            let match = search(this.DataArray);
            this.SetTree(this.DataArray, treeOptions);

            if (!match) return;
        }
        else
        {
            // Obtener el padre
            targetData = this.DataArray.find(d => (d[treeOptions.key] ?? '_') == (sourceData[treeOptions.parentkey] ?? '|'));
            if (!targetData) return;
        }

        if (sourceData && targetData)
        {
            if(this._moveData(sourceData, targetData, inFront, treeOptions))
                this._printRows();
        }
    }

    ExpandRow(row)
    {
        if (!row) return;

        const btnCollapse = row.querySelector('span.collapse-btn')
        if (btnCollapse) {
            btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';
            btnCollapse.setAttribute('expanded', 'true');
        }

        const removeHidde = rows =>{
            if (rows && rows.length > 0) {
                rows.forEach(r => {
                    r.classList.remove('hidde-row');
                    // const btnCollapse = r.querySelector('span.collapse-btn')
                    // if (btnCollapse) {
                    //     btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-down-fill" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>';
                    //     btnCollapse.setAttribute('expanded', 'true');
                    // }
                    //removeHidde(this._getChildRows(r));
                });
            }
        }
        const rows = this._getChildRows(row);
        removeHidde(rows);
        this._f8Reocultar?.(rows);   // F8a: las filas filtradas siguen ocultas
    }
    CollapseRow(row)
    {
        if (!row) return;

        const btnCollapse = row.querySelector('span.collapse-btn')
        if (btnCollapse) {
            btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';
            btnCollapse.setAttribute('expanded', 'false');
        }

        const removeHidde = rows =>{
            if (rows && rows.length > 0) {
                rows.forEach(r => {
                    r.classList.add('hidde-row');
                    const btnCollapse = r.querySelector('span.collapse-btn')
                    if (btnCollapse) {
                        btnCollapse.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16"><path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/></svg>';
                        btnCollapse.setAttribute('expanded', 'false');
                    }
                    removeHidde(this._getChildRows(r));
                });
            }
        }
        const rows = this._getChildRows(row);
        removeHidde(rows);
    }

    Sort=(dataArray, field, desc=false)=>
    {
        if (dataArray && dataArray.length > 0)
        {
            let orientation = (!desc) ? "ASC" : "DESC";
            this.OnSort(field,orientation);

            // F1 (C10): si se ordena DataArray y hay respaldo alineado, el respaldo se reordena igual.
            // Se ordenan índices con el mismo comparador (sort es estable): queda el mismo orden que antes.
            const f1Respaldo = this._dataArrayBackup;
            const f1ConRespaldo = (dataArray === this.DataArray && Array.isArray(f1Respaldo) && f1Respaldo.length === dataArray.length);
            const f1Original = (f1ConRespaldo ? dataArray.slice() : null);
            const f1Indices = (f1ConRespaldo ? dataArray.map((_, i) => i) : null);

            const f1Comparar = (a,b) =>
            {
                let valA = (a[field]??'');
                let valB = (b[field]??'');

                let numb = (typeof valA === 'number' && typeof valB === 'number');

                if (!numb) {
                    valA = valA.toString().toUpperCase();
                    valB = valB.toString().toUpperCase();
                }

                if (!desc) return (valA > valB ? 1 : valA < valB ? -1 : 0);
                else return (valB > valA ? 1 : valB < valA ? -1 : 0);
            };

            if (!f1ConRespaldo) dataArray.sort(f1Comparar);
            else
            {
                f1Indices.sort((i, j) => f1Comparar(f1Original[i], f1Original[j]));
                const f1Back = f1Respaldo.slice();
                f1Indices.forEach((k, pos) => { dataArray[pos] = f1Original[k]; f1Respaldo[pos] = f1Back[k]; });
            }
        }
    }
    SortTree=(treeArray,field,desc, treeOptions=null)=>
    {
        if (!treeOptions) treeOptions = this._getTreeOptions();

        const sortData = (list) => 
        {
            if (list && list.length > 0)
            {
                list.sort((a,b) => 
                {
                    if ((a[treeOptions.childs]??[]).length > 0) { sortData(a[treeOptions.childs]); }
                    if ((b[treeOptions.childs]??[]).length > 0) { sortData(b[treeOptions.childs]); }

                    let valA = (a[field]??'');
                    let valB = (b[field]??'');

                    let numb = (typeof valA === 'number' && typeof valB === 'number');

                    if (!numb) {
                        valA = valA.toString().toUpperCase();
                        valB = valB.toString().toUpperCase();
                    }

                    if (!desc) return (valA > valB ? 1 : valA < valB ? -1 : 0);
                    else return (valB > valA ? 1 : valB < valA ? -1 : 0);
                });
                // F1 (C21): también los descendientes de las listas en que el comparador no se llamó
                // (por ejemplo, una lista de un solo elemento). Ordenar dos veces lo ya ordenado no cambia nada.
                list.forEach(o => { if ((o?.[treeOptions.childs]??[]).length > 0) sortData(o[treeOptions.childs]); });
            }
        }

        sortData(treeArray);
    }

    setInputKey(column, inputkey)
    {
        let coldef = this.Columns.find(c => c.field == column)
        coldef['inputkey'] = inputkey;
    }
    showInputKey=(td, searchText='', autoselect=true)=>
    {
        let coldef = this.GetColumnDefOfTd(td);
        if (coldef && coldef.inputkey) coldef.inputkey.searchText(searchText, autoselect);
    }
    replaceSymbols={
        "'":"&apos;",
        '"':"&quot;",
        ">":"&gt;",
        "<":"&lt;",
    };
    setHtmlEncode(value)
    {
        if (typeof value !== 'string') return value;
        for(const r in this.replaceSymbols)
            value = value.replaceAll(r, this.replaceSymbols[r]);
        return value;
    }
    getHtmlDecode(value)
    {
        if (typeof value !== 'string') return value;
        for(const r in this.replaceSymbols)
            value = value.replaceAll(this.replaceSymbols[r], r);
        return value;
    }
    backup()
    {
        this._dataArrayBackup = JSON.parse(JSON.stringify(this.DataArray));
    }
    restore()
    {
        if (!this._dataArrayBackup) return;

        this._dataArrayBackup.forEach(data => delete data.isDirty);
        this.DataArray = JSON.parse(JSON.stringify(this._dataArrayBackup));
        // F1 (C4): después de restaurar ya no hay cambios; IsDirtyChanged solo si el valor cambió.
        this._f1ReiniciarIsDirty(0);
        this._refreshTable();
    }
    restoreRow(indexRow)
    {
        if (!this._dataArrayBackup) return;

        let objBack = this._dataArrayBackup[indexRow];
        // F1 (C4): la fila restaurada deja de contar como modificada.
        const f1EraSucia = (objBack?.isDirty === true);
        delete objBack.isDirty;
        const f8Viejo = this.DataArray[indexRow];   // F8a
        this.DataArray[indexRow] = JSON.parse(JSON.stringify(objBack));
        this._f8Reemplazar?.(f8Viejo, this.DataArray[indexRow]);   // F8a: getChanges sigue a la fila restaurada
        if (f1EraSucia) this._f1ReiniciarIsDirty(Math.max(0, this._count_isdirty - 1));
        this.UpdateRow(indexRow);
    }
    _f1ReiniciarIsDirty(valor)
    {
        const antes = (this._count_isdirty > 0);
        this._count_isdirty = valor;
        if (antes != (this._count_isdirty > 0))
        {
            if (this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged]!=undefined)
                this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged]();
        }
    }
    _count_isdirty=0;
    get IsDirty()
    {
        if (this._count_isdirty>0) return true;
        return false;

    }
    setIsDirty(indexRow, value)
    {
        if (!this._dataArrayBackup) return;

        let backLength = this._dataArrayBackup.length;
        let dataLength = this.DataArray.length;

        if (indexRow <= dataLength-1  && indexRow > backLength-1)
        {
            for (let index = backLength; index <= indexRow; index++) 
            {
                this._dataArrayBackup.push(JSON.parse(JSON.stringify(this.DataArray[index])));
            }
        }

        if (value!=this.getIsDirty(indexRow))
        {
            let c=this._count_isdirty;
            if (value) this._count_isdirty++; else this._count_isdirty--;
            if (this._count_isdirty>0 !=c>0)
            {
                if (this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged]!=undefined)
                    this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged]();
            }
        }

        let obj = this._dataArrayBackup[indexRow];
        if (obj) obj['isDirty'] = value;
        
    }
    getIsDirty(indexRow)
    {
        let obj = this._dataArrayBackup[indexRow];
        return (obj?.isDirty ?? false);
    }
    OnSort = (field, sort) => {
        if (this._getCurren().Events[this.EdiTable.Const.Events.OnSort]==undefined) return;

        this.Columns.forEach((col) => { delete col.sort });
        
        let columnDef = this.Columns.find((col) => { return (col.field === field) });
        let thead = this.GetTHead();
        let th = thead.querySelector(`[field=${field}]`);
        
        columnDef["sort"] = sort;

        var eventArgs={
            th:th,
            coldef:columnDef,
            caption:th.textContent
        };

        this._getCurren().Events[this.EdiTable.Const.Events.OnSort](eventArgs);
    }
    changeColumnTitle(field,title)
    {
        const th = this._table.querySelector(`thead > tr th[field="${field}"] span`);
        if (!th) return false;

        th.textContent = title;
        // F1 (C20): Columns[i].title también cambia (la exportación CSV de V12 lo lee).
        // i es la posición del th entre los th del thead, como en _processAtributesColumn.
        const f1Th = th.closest('th');
        const f1i = Array.from(this._table.querySelectorAll('thead th:not(.et-sel-col)')).indexOf(f1Th);   // F4
        if (f1i >= 0 && this.Columns[f1i])
        {
            const f4Ci = f1Th.cellIndex - this._f4SysDe(f1Th.parentElement);   // F4: índice de datos
            if (!this._f1TitulosDeclarados.has(f4Ci)) this._f1TitulosDeclarados.set(f4Ci, this.Columns[f1i].title);
            this.Columns[f1i].title = f1Th.textContent;
        }
        return true;
    }
    // ========================= MEJORAS VISUALES: TARJETAS, BADGES Y DECORACIÓN DE FILAS
    //
    // Todo lo de esta sección es opcional. Si no se usa ningún atributo ni propiedad nueva,
    // el componente genera exactamente el mismo DOM y el mismo CSS que antes.

    CardsMode = null;                   // 'auto' | 'always' | 'never' | null (null: se deriva de cards-responsive)
    CardsBreakpoint = '768px';          // Ancho por debajo del cual se muestran tarjetas (modo auto)
    CardsBreakpointTarget = 'viewport'; // 'viewport' | 'container'
    CardsLayout = 'grid';               // 'grid' | 'stacked' | 'slots'
    CardsFieldGap = null;               // Distancia vertical entre campos de la tarjeta (def. 4px)
    CardsPadding = null;                // Relleno de la tarjeta (def. '2rem 0' en grid/stacked, '.6rem .75rem' en slots)
    CardsGap = null;                    // Separación entre tarjetas (def. 0)
    CardsLabelWidth = null;             // Ancho de la etiqueta (def. 35%; '0' oculta etiquetas)
    CardsHideEmpty = false;             // Oculta en la tarjeta los campos sin valor
    CardColumns = null;                 // Array<string|{field,order,slot,label,hideEmpty}> alternativa a los atributos de columna
    BadgesField = '__badges';           // Campo reservado de cada fila con sus badges
    BadgeTooltip = 'native';            // 'native' (title) | 'custom'
    BadgeSelectsRow = false;            // Si el clic en un badge también selecciona la celda
    RowClassField = null;               // Campo de cada fila con clases CSS para su <tr>
    TemplateEncode = false;             // Escapa los valores de DataRow dentro de las plantillas (template)
    NativeEvents = false;               // Permite registrar eventos nativos (click, etc.) con addEventListener
    Locale = null;                      // Idioma para format="relative" (def. lang del documento o es-MX)
    RowBadges = null;                   // (row, irow) => badge | badge[]
    BadgeOnClick = null;                // (irow, badge, row, event) => void
    RowClass = null;                    // (row, irow) => 'clase1 clase2' | string[]
    RowAccent = null;                   // (row, irow) => color CSS | null
    CellClass = null;                   // (row, field, irow, coldef) => 'clase' | string[]
    onRowPaint = null;                  // (tr, irow, row) => void
    onCardPaint = null;                 // (tr, irow, row) => void  (solo en vista de tarjetas)
    RelativeDateFormatter = null;       // (value, date) => string

    _cardsAttrs = false;
    _cardsEligible = false;
    _cardsNoEditable = false;
    _isCardView = false;
    _viewReady = false;
    _viewWatch = null;
    _cardsInfo = null;
    _tipEl = null;
    _badgeOverrides = new Map();
    _badgeOverridesObj = new WeakMap();
    _hasBadgeOverrides = false;

    /** Indica si en este momento la tabla se muestra como tarjetas. */
    get IsCardView() { return this._isCardView; }

    _readVisualAttributes()
    {
        const a = (n) => (this.hasAttribute(n) ? (this.getAttribute(n) ?? '').trim() : '');
        let v;
        if ((v = a('cards-mode')))              { this.CardsMode = v.toLowerCase(); this._cardsAttrs = true; }
        if ((v = a('cards-breakpoint')))        { this.CardsBreakpoint = v; this._cardsAttrs = true; }
        if ((v = a('cards-breakpoint-target'))) { this.CardsBreakpointTarget = v.toLowerCase(); this._cardsAttrs = true; }
        if ((v = a('cards-layout')))            { this.CardsLayout = v.toLowerCase(); this._cardsAttrs = true; }
        if ((v = a('cards-field-gap')))         { this.CardsFieldGap = v; this._cardsAttrs = true; }
        if ((v = a('cards-padding')))           { this.CardsPadding = v; this._cardsAttrs = true; }
        if ((v = a('cards-gap')))               { this.CardsGap = v; this._cardsAttrs = true; }
        if ((v = a('cards-label-width')))       { this.CardsLabelWidth = v; this._cardsAttrs = true; }
        if ((v = a('cards-hide-empty')))        { this.CardsHideEmpty = (v == 'true'); this._cardsAttrs = true; }
        if ((v = a('badges-field')))            this.BadgesField = v;
        if ((v = a('badge-tooltip')))           this.BadgeTooltip = v.toLowerCase();
        if ((v = a('badge-selects-row')))       this.BadgeSelectsRow = (v == 'true');
        if ((v = a('row-class-field')))         this.RowClassField = v;
        if ((v = a('template-encode')))         this.TemplateEncode = (v == 'true');
        if ((v = a('native-events')))           this.NativeEvents = (v == 'true');
        if ((v = a('locale')))                  this.Locale = v;
        if ((v = a('keep-selection-visible')))  this.KeepSelectionVisible = (v == 'false' ? false : (v == 'if-visible' ? 'if-visible' : true));
    }

    _getExtraCss=()=>
    {
        return `
                    /* ===== EditTable: decoración de filas ===== */
                    tbody tr.et-accent > td:first-child { box-shadow: inset 3px 0 0 var(--et-row-accent); }
                    td.et-rel .cell-content { display: none !important; }
                    td.et-rel::after { content: attr(data-rel); white-space: nowrap; }
                    td.et-rel:has(#__table_selector) .cell-content { display: flex !important; }
                    td.et-rel:has(#__table_selector)::after { content: none; }
                    table.et-cards-custom:not(.et-cards) .et-table-hidden { display: none !important; }

                    /* ===== EditTable: badges ===== */
                    .et-badge-wrap { display: flex; align-items: center; gap: var(--et-badges-gap, .4rem); width: 100%; height: 100%; min-width: 0; }
                    .et-badge-wrap > .cell-content { flex: 1 1 auto; min-width: 0; }
                    .et-badges { display: inline-flex; align-items: center; flex: 0 0 auto; gap: var(--et-badges-gap, .25rem); }
                    .et-badges-overlay-start, .et-badges-overlay-end { position: absolute; top: 1px; z-index: 2; }
                    .et-badges-overlay-start { inset-inline-start: 1px; }
                    .et-badges-overlay-end { inset-inline-end: 1px; }
                    .et-badges-overlay-start .et-badge, .et-badges-overlay-end .et-badge { --et-badge-size: 1.05rem; }
                    .et-badge {
                        box-sizing: border-box; position: relative;
                        display: inline-flex; align-items: center; justify-content: center; gap: .2em;
                        min-width: var(--et-badge-size, 1.5rem); height: var(--et-badge-size, 1.5rem); padding: 0 .35em;
                        border-radius: 999px; background: var(--et-badge-bg, #8696A0); color: var(--et-badge-color, #FFF);
                        font-size: calc(var(--et-badge-size, 1.5rem) * .46); font-weight: 600; line-height: 1;
                        white-space: nowrap; user-select: none; overflow: hidden;
                    }
                    .et-badge svg { width: 62%; height: 62%; flex: 0 0 auto; }
                    .et-badge.et-badge-img { padding: 0; }
                    .et-badge img { width: 100%; height: 100%; object-fit: cover; }
                    .et-badge.et-clickable { cursor: pointer; }
                    .et-badge:focus-visible { outline: 2px solid #3D75DD; outline-offset: 1px; }
                    .et-tooltip {
                        position: fixed; display: none; z-index: 2147483000; pointer-events: none;
                        max-width: 280px; padding: .3rem .55rem; border-radius: 4px;
                        background: #1F2328; color: #FFF; font-size: .75rem; line-height: 1.3; white-space: normal;
                    }

                    /* ===== EditTable: vista de tarjetas configurable ===== */
                    table.et-cards { display: block; border-spacing: 0; }
                    table.et-cards thead, table.et-cards th { display: none !important; }
                    table.et-cards tbody { display: flex; flex-direction: column; gap: var(--et-card-gap, 0px); }
                    table.et-cards tbody tr {
                        display: flex; flex-direction: column; position: relative; box-sizing: border-box;
                        outline: 1px solid #DDD; padding: var(--et-card-padding, 2rem 0);
                    }
                    table.et-cards tbody tr.et-accent { box-shadow: inset 4px 0 0 var(--et-row-accent); }
                    table.et-cards tbody tr.et-accent > td:first-child { box-shadow: none; }
                    table.et-cards td {
                        display: grid !important; grid-template-columns: var(--et-card-label-width, 35%) minmax(0, 1fr) !important;
                        word-wrap: break-word; outline: none; height: auto;
                        padding: var(--et-card-field-gap, 4px) 4px var(--et-card-field-gap, 4px) 1rem;
                    }
                    table.et-cards td::before { content: attr(data-card-label) ": "; font-weight: 600; }
                    table.et-cards td.et-nolabel::before, table.et-cards.et-cards-nolabels td::before { content: none; }
                    table.et-cards td.et-nolabel, table.et-cards.et-cards-nolabels td { grid-template-columns: minmax(0, 1fr) !important; }

                    table.et-cards.et-layout-stacked td { grid-template-columns: minmax(0, 1fr) !important; }
                    table.et-cards.et-layout-stacked td::before { font-size: .78em; font-weight: 500; opacity: .7; }

                    table.et-cards.et-layout-slots tbody tr {
                        display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center;
                        column-gap: .75rem; row-gap: var(--et-card-field-gap, 2px); padding: var(--et-card-padding, .6rem .75rem);
                    }
                    table.et-cards.et-layout-slots td { display: block !important; padding: 0; min-width: 0; }
                    table.et-cards.et-layout-slots td::before { content: none; }
                    table.et-cards.et-layout-slots td.et-haslabel { display: flex !important; align-items: baseline; gap: .3em; }
                    table.et-cards.et-layout-slots td.et-haslabel::before { content: attr(data-card-label) ":"; font-weight: 600; flex: 0 0 auto; }
                    table.et-cards.et-layout-slots td.et-haslabel > * { min-width: 0; }
                    table.et-cards.et-layout-slots td[data-card-slot=avatar] { grid-column: 1; grid-row: span var(--et-avatar-rows, 3); }
                    table.et-cards.et-layout-slots td[data-card-slot=avatar] .et-badge { --et-badge-size: var(--et-avatar-size, 2.6rem); width: var(--et-badge-size); padding: 0; }
                    table.et-cards.et-layout-slots td[data-card-slot=title],
                    table.et-cards.et-layout-slots td[data-card-slot=subtitle],
                    table.et-cards.et-layout-slots td[data-card-slot=body] { grid-column: 2; }
                    table.et-cards.et-layout-slots td[data-card-slot=meta],
                    table.et-cards.et-layout-slots td[data-card-slot=badge] { grid-column: 3; justify-self: end; text-align: end; }
                    table.et-cards.et-layout-slots td[data-card-slot=footer] { grid-column: 1 / -1; font-size: .85em; }
                    table.et-cards.et-layout-slots td[data-card-slot=title] { font-weight: 600; }
                    table.et-cards.et-layout-slots td[data-card-slot=title] .cell-content,
                    table.et-cards.et-layout-slots td[data-card-slot=subtitle] .cell-content,
                    table.et-cards.et-layout-slots td[data-card-slot=meta] .cell-content { display: block; white-space: nowrap; text-overflow: ellipsis; }
                    table.et-cards.et-layout-slots td[data-card-slot=meta] { font-size: .78em; opacity: .75; }
                    table.et-cards.et-layout-slots td[data-card-slot=subtitle] { font-size: .86em; opacity: .8; }
                    table.et-cards.et-layout-slots td[data-card-slot=meta] .cell-content,
                    table.et-cards.et-layout-slots td[data-card-slot=badge] .cell-content { justify-content: flex-end; }

                    /* Ocultamientos: al final y con especificidad de id (:not(#…)) para ganar a cualquier layout */
                    table.et-cards tbody td.et-card-hidden:not(#__et_none),
                    table.et-cards tbody td.et-hide-empty:not(#__et_none),
                    table.et-cards tbody td.hidde-col:not(#__et_none) { display: none !important; }
        `;
    }

    // ---------- Vista de tarjetas ----------

    _isBadgesCol=(col)=> ((col?.type ?? '').toString().toLowerCase() == 'badges');

    _getCardsInfo=()=>
    {
        if (this._cardsInfo && this._cardsInfo.n === this.Columns.length) return this._cardsInfo;

        const keys = ['card', 'table', 'cardorder', 'cardlabel', 'cardslot', 'cardhideempty'];
        const badgeCols = [];
        this.Columns.forEach((c, i) => { if (this._isBadgesCol(c)) badgeCols.push(i); });

        this._cardsInfo = {
            n: this.Columns.length,
            columnAttrs: this.Columns.some(c => c && keys.some(k => c[k] !== undefined)),
            anyCard: this.Columns.some(c => c && c.card !== undefined),
            badgeCols
        };
        return this._cardsInfo;
    }

    _usesCustomCards=()=>
    {
        if (this._cardsAttrs || this.CardsMode || Array.isArray(this.CardColumns)) return true;
        if ((this.CardsLayout ?? 'grid') != 'grid' || (this.CardsBreakpoint ?? '768px') != '768px') return true;
        if ((this.CardsBreakpointTarget ?? 'viewport') != 'viewport' || this.CardsHideEmpty) return true;
        if (this.CardsFieldGap || this.CardsPadding || this.CardsGap || this.CardsLabelWidth) return true;
        return this._getCardsInfo().columnAttrs;
    }

    _cardsModeValue=()=>
    {
        const m = (this.CardsMode ?? '').toString().toLowerCase();
        if (m == 'auto' || m == 'always' || m == 'never') return m;
        return (this.cardsResponsive ? 'auto' : 'never');
    }

    _cardDef=(coldef, i)=>
    {
        const def = { show: true, order: null, slot: null, label: null, hideEmpty: null };
        if (!coldef) return def;

        if (this._getCardsInfo().anyCard) def.show = ((coldef.card ?? '') == 'true');
        if ((coldef.cardorder ?? '') !== '' && !isNaN(Number(coldef.cardorder))) def.order = Number(coldef.cardorder);
        if (coldef.cardslot) def.slot = coldef.cardslot.toLowerCase();
        if (coldef.cardlabel !== undefined) def.label = coldef.cardlabel;
        if (coldef.cardhideempty !== undefined) def.hideEmpty = (coldef.cardhideempty == 'true');

        if (Array.isArray(this.CardColumns))
        {
            const idx = this.CardColumns.findIndex(c => (typeof c == 'string' ? c : c?.field) == coldef.field);
            def.show = (idx >= 0);
            if (idx >= 0)
            {
                const c = this.CardColumns[idx];
                def.order = idx;
                if (c && typeof c == 'object')
                {
                    if (c.order !== undefined) def.order = Number(c.order);
                    if (c.slot) def.slot = String(c.slot).toLowerCase();
                    if (c.label !== undefined) def.label = c.label;
                    if (c.hideEmpty !== undefined) def.hideEmpty = !!c.hideEmpty;
                }
            }
        }
        return def;
    }

    _applyCardsConfig=()=>
    {
        const t = this._table;
        if (!t) return;

        if (!this._usesCustomCards())
        {
            // Comportamiento original, sin cambios.
            t.classList.toggle('table-cards', !!this._cardsEligible);
            return;
        }

        t.classList.remove('table-cards');
        t.classList.add('et-cards-custom');
        const layout = (this.CardsLayout || 'grid');
        ['grid', 'stacked', 'slots'].forEach(l => t.classList.toggle('et-layout-' + l, layout == l));

        const vars = {
            '--et-card-field-gap': this.CardsFieldGap,
            '--et-card-padding': this.CardsPadding,
            '--et-card-gap': this.CardsGap,
            '--et-card-label-width': this.CardsLabelWidth
        };
        Object.keys(vars).forEach(k => { if (vars[k]) t.style.setProperty(k, vars[k]); else t.style.removeProperty(k); });

        const lw = (this.CardsLabelWidth ?? '').toString().trim().toLowerCase();
        t.classList.toggle('et-cards-nolabels', ['0', '0px', '0%', 'none'].includes(lw));

        const headRow = t.querySelectorAll('thead tr')[this.TheadRowIndex];
        if (headRow) headRow.querySelectorAll('th:not(.et-sel-col)').forEach((th, i) => th.classList.toggle('et-table-hidden', ((this.Columns[i]?.table ?? '') == 'false')));   // F4: sin la columna del sistema
    }

    _toPx=(value)=>
    {
        const s = String(value ?? '').trim();
        const n = parseFloat(s);
        if (isNaN(n)) return 768;
        if (/rem$/i.test(s)) return n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
        if (/em$/i.test(s)) return n * (parseFloat(getComputedStyle(this).fontSize) || 16);
        return n;
    }

    _teardownViewWatcher=()=>
    {
        const w = this._viewWatch;
        if (!w) return;
        if (w.mq && w.fn) w.mq.removeEventListener('change', w.fn);
        if (w.ro) w.ro.disconnect();
        this._viewWatch = null;
    }

    _setupViewWatcher=()=>
    {
        this._teardownViewWatcher();
        if (!this._table) return;

        const evaluate = () => this._setCardView(this._computeCardView());
        const custom = this._usesCustomCards();
        const mode = this._cardsModeValue();
        const watch = {};

        if (!custom)
        {
            if (this._cardsEligible && window.matchMedia)
            {
                watch.mq = window.matchMedia('screen and (max-width: 768px)');
                watch.fn = evaluate;
                watch.mq.addEventListener('change', evaluate);
            }
        }
        else if (mode == 'auto' && this._cardsNoEditable)
        {
            if ((this.CardsBreakpointTarget ?? 'viewport') == 'container' && window.ResizeObserver)
            {
                watch.ro = new ResizeObserver(() => evaluate());
                watch.ro.observe(this._table.parentElement ?? this._table);
            }
            else if (window.matchMedia)
            {
                watch.mq = window.matchMedia(`screen and (max-width: ${this.CardsBreakpoint || '768px'})`);
                watch.fn = evaluate;
                watch.mq.addEventListener('change', evaluate);
            }
        }

        this._viewWatch = watch;
        this._setCardView(this._computeCardView(), !this._viewReady);
        this._viewReady = true;
    }

    _computeCardView=()=>
    {
        const w = this._viewWatch ?? {};
        if (!this._usesCustomCards())
            return !!(this._cardsEligible && w.mq && w.mq.matches);

        const mode = this._cardsModeValue();
        if (mode == 'always') return true;
        if (mode == 'never' || !this._cardsNoEditable) return false;

        if (w.ro)
        {
            const box = this._table?.parentElement ?? this._table;
            const width = box ? box.getBoundingClientRect().width : 0;
            return (width > 0 && width <= this._toPx(this.CardsBreakpoint));
        }
        return !!(w.mq && w.mq.matches);
    }

    _setCardView=(value, silent=false)=>
    {
        value = !!value;
        const changed = (value !== this._isCardView);
        this._isCardView = value;

        if (this._table && this._usesCustomCards()) this._table.classList.toggle('et-cards', value);
        if (!changed) return;
        this._f5Reevaluar?.();   // F5: en tarjetas no se virtualiza

        this.RefreshBadges();
        this._scheduleEnsureSelection();
        if (value && typeof this.onCardPaint == 'function')
            this._eachRow((tr, i, data) => this.onCardPaint(tr, i, data));

        if (!silent) this._fireEvent(this.EdiTable.Const.Events.ViewModeChanged, { sender: this._getCurren(), mode: (value ? 'cards' : 'table') });
    }

    /**
     * Vuelve a aplicar la configuración visual (tarjetas, clases, badges) después de cambiar
     * propiedades por JS, por ejemplo: CardsMode, CardsLayout, CardColumns, RowClass o RowBadges.
     */
    RefreshView=()=>
    {
        this._cardsInfo = null;
        this._applyCardsConfig();
        this._setupViewWatcher();
        this.RefreshDecorations();
    }

    // ---------- Mantener visible la fila seleccionada al redimensionar ----------

    // true (predeterminado): al cambiar el ancho, si la fila seleccionada quedó fuera del área visible, se desplaza hasta ella.
    // 'if-visible': solo si la fila era visible antes del cambio (respeta si el usuario se desplazó a otra parte).
    // false: desactivado.
    KeepSelectionVisible = true;
    _selTr = null;
    _selVisible = false;
    _selIO = null;
    _widthRO = null;
    _lastWidth = -1;
    _ensureRaf = 0;
    _ensureWasVisible = false;
    _keepUntil = 0;

    _trackSelection=(tr)=>
    {
        this._selTr = tr ?? null;
        this._selVisible = !!tr; // recién seleccionada: el usuario la está viendo
        if (!window.IntersectionObserver) return;

        if (!this._selIO)
        {
            // Sin raíz explícita: considera el recorte de todos los contenedores con scroll, incluidos los de la página.
            this._selIO = new IntersectionObserver((entries) => {
                entries.forEach(en => { if (en.target === this._selTr) this._selVisible = en.isIntersecting; });
            });
        }
        this._selIO.disconnect();
        if (tr) this._selIO.observe(tr);
    }

    _getSelectedTr=()=>
    {
        const ok = (tr) => !!(tr && tr.isConnected && this._table && this._table.contains(tr));
        if (ok(this._selTr)) return this._selTr;

        // La tabla se volvió a pintar (ordenamiento, recarga): buscar la selección actual
        let tr = this._table?.querySelector('tbody tr.' + this.CSS.RowSelected) ?? null;
        if (!ok(tr)) tr = this.CurrentTd()?.closest('tr') ?? null;
        if (!ok(tr)) return null;

        this._trackSelection(tr);
        return tr;
    }

    _setupSelectionKeeper=()=>
    {
        if (this._widthRO || !window.ResizeObserver || !this._table) return;

        const box = this._table.parentElement ?? this._table;
        this._widthRO = new ResizeObserver((entries) => {
            const w = Math.round(entries[entries.length - 1].contentRect.width);
            if (w === this._lastWidth) return; // solo cambios de ancho; los de alto (datos nuevos) no mueven el scroll
            const first = (this._lastWidth < 0);
            this._lastWidth = w;
            if (!first) this._scheduleEnsureSelection();
        });
        this._widthRO.observe(box);
    }

    _scheduleEnsureSelection=()=>
    {
        if (!this.KeepSelectionVisible) return;

        // Modo 'if-visible': se evalúa con el estado anterior al cambio (el IntersectionObserver aún no lo actualiza)
        // y durante un redimensionamiento continuo se mantiene la intención de la primera evaluación.
        const wasVisible = (this.KeepSelectionVisible !== 'if-visible')
            || this._selVisible || (performance.now() < this._keepUntil);
        if (this._ensureRaf) { this._ensureWasVisible = this._ensureWasVisible || wasVisible; return; }

        this._ensureWasVisible = wasVisible;
        this._ensureRaf = requestAnimationFrame(() => {
            this._ensureRaf = 0;
            if (this._ensureWasVisible) this.EnsureSelectionVisible();
        });
    }

    _composedParent=(el)=> (el.assignedSlot ?? el.parentElement ?? (el.parentNode instanceof ShadowRoot ? el.parentNode.host : null));

    /** Contenedor con scroll vertical más cercano al componente (cruza el shadow DOM). Nunca la página. */
    _getScrollContainer=(from)=>
    {
        const pageScroller = document.scrollingElement ?? document.documentElement;
        let el = from;
        while (el)
        {
            el = this._composedParent(el);
            if (!el || el === document.body || el === document.documentElement || el === pageScroller) return null;

            const oy = getComputedStyle(el).overflowY;
            if ((oy == 'auto' || oy == 'scroll' || oy == 'overlay') && el.scrollHeight > el.clientHeight + 1) return el;
        }
        return null;
    }

    /**
     * Si la fila seleccionada (o su tarjeta) está fuera del área visible de su contenedor con scroll,
     * desplaza solo ese contenedor lo mínimo necesario. No mueve la página ni otros contenedores,
     * ni el scroll horizontal.
     * @param {{behavior?: 'auto'|'smooth'}} options
     * @returns {boolean} true si había una fila seleccionada.
     */
    EnsureSelectionVisible=(options={})=>
    {
        const tr = this._getSelectedTr();
        if (!tr) return false;

        const firstTd = tr.querySelector('td:not(.hidde-col):not(.et-sel-col)');   // F4
        const isCard = !!(firstTd && getComputedStyle(firstTd).display != 'table-cell');
        const selTd = this.CurrentTd();
        const target = (!isCard && selTd && tr.contains(selTd)) ? selTd : tr;

        const box = this._getScrollContainer(target);
        if (!box) return true;

        // Área visible del contenedor: la suya, recortada por los contenedores superiores y la ventana
        // (solo para medir; a ellos nunca se les mueve el scroll).
        const b = box.getBoundingClientRect();
        let viewTop = b.top + box.clientTop;
        let viewBottom = viewTop + box.clientHeight;
        let clipTop = Math.max(viewTop, 0), clipBottom = Math.min(viewBottom, window.innerHeight);
        for (let el = this._composedParent(box); el && el !== document.documentElement; el = this._composedParent(el))
        {
            if (getComputedStyle(el).overflowY == 'visible') continue;
            const a = el.getBoundingClientRect();
            clipTop = Math.max(clipTop, a.top + el.clientTop);
            clipBottom = Math.min(clipBottom, a.top + el.clientTop + el.clientHeight);
        }
        if (clipBottom - clipTop > 20) { viewTop = clipTop; viewBottom = clipBottom; } // si casi no se ve, usar el área propia

        const thead = this._table.querySelector('thead');
        const headCss = thead ? getComputedStyle(thead) : null;
        if (headCss && headCss.display != 'none' && headCss.position == 'sticky')
        {
            const h = thead.getBoundingClientRect();
            if (h.bottom > viewTop && h.top < viewTop + 2) viewTop = h.bottom; // el encabezado está pegado arriba
        }

        const r = target.getBoundingClientRect();
        let delta = 0;
        if (r.top < viewTop) delta = r.top - viewTop;                                         // quedó arriba
        else if (r.bottom > viewBottom) delta = Math.min(r.bottom - viewBottom, r.top - viewTop); // quedó abajo (si no cabe, alinea arriba)

        if (Math.abs(delta) >= 1) box.scrollTo({ top: box.scrollTop + delta, behavior: (options.behavior ?? 'auto') });

        this._keepUntil = performance.now() + 400;
        return true;
    }

    // ---------- Decoración de filas ----------

    _eachRow=(fn)=>
    {
        const tbody = this._table?.querySelector('tbody');
        if (!tbody) return;
        if (this._f5Activo) { Array.from(tbody.rows).forEach(tr => { const i = this._f5Idx.get(tr); if (i !== undefined) fn(tr, i, (tr._etData ?? this.DataArray[i] ?? {})); }); return; }   // F5: solo filas de datos dibujadas
        if (this._f6Grupos.length) return this._f6CadaFila(fn);   // F6: sin filas de grupo, con el índice de DataArray
        Array.from(tbody.rows).forEach((tr, i) => fn(tr, i, (tr._etData ?? this.DataArray[i] ?? {})));
    }

    /** Vuelve a aplicar clases, acentos, atributos de tarjeta y badges a todas las filas. */
    RefreshDecorations=()=>
    {
        this._eachRow((tr, i, data) => this._decorateRow(tr, i, data));
    }

    _splitClasses=(value)=>
    {
        if (!value) return [];
        const list = Array.isArray(value) ? value : String(value).split(/\s+/);
        return list.map(c => String(c ?? '').trim()).filter(c => c && c != this.CSS.RowSelected && c != this.CSS.Cell);
    }

    _decorateRow=(tr, idx, data)=>
    {
        // Un error en los hooks del desarrollador (RowClass, RowBadges, onRowPaint…) no debe interrumpir el pintado.
        try { this._decorateRowImpl(tr, idx, data); }
        catch (err) { console.error('EditTable: error al decorar la fila ' + idx, err); }
    }

    _decorateRowImpl=(tr, idx, data)=>
    {
        if (!tr) return;
        data = data ?? {};
        tr._etData = data;
        this._f4MarcarFila(tr, idx);   // F4: et-row-checked según la selección del modelo

        // Clases de la fila
        (tr._etClasses ?? []).forEach(c => tr.classList.remove(c));
        let rowClasses = [];
        if (this.RowClassField) rowClasses = rowClasses.concat(this._splitClasses(data[this.RowClassField]));
        if (typeof this.RowClass == 'function') rowClasses = rowClasses.concat(this._splitClasses(this.RowClass(data, idx)));
        rowClasses.forEach(c => tr.classList.add(c));
        tr._etClasses = rowClasses;

        // Acento de color
        const accent = (typeof this.RowAccent == 'function') ? this.RowAccent(data, idx) : null;
        tr.classList.toggle('et-accent', !!accent);
        if (accent) tr.style.setProperty('--et-row-accent', String(accent));
        else tr.style.removeProperty('--et-row-accent');

        // Celdas
        const custom = this._usesCustomCards();
        const slots = ((this.CardsLayout || 'grid') == 'slots');
        const ranks = { avatar: 0, title: 1, meta: 2, subtitle: 3, badge: 4, body: 5, footer: 6 };

        this._f4CeldasDatos(tr).forEach((td, i) => {   // F4: sin la celda del sistema
            const coldef = this.Columns[i];

            (td._etClasses ?? []).forEach(c => td.classList.remove(c));
            td._etClasses = [];
            if (typeof this.CellClass == 'function' && coldef)
            {
                td._etClasses = this._splitClasses(this.CellClass(data, coldef.field, idx, coldef));
                td._etClasses.forEach(c => td.classList.add(c));
            }

            this._applyRelative(td, coldef, data);

            if (!custom || !coldef) return;

            const def = this._cardDef(coldef, i);
            const explicitLabel = (def.label !== null && def.label !== undefined);
            const label = explicitLabel ? String(def.label) : String(coldef.title ?? '');
            const slot = (def.slot || 'body');

            td.classList.toggle('et-card-hidden', !def.show);
            td.classList.toggle('et-table-hidden', ((coldef.table ?? '') == 'false'));
            td.setAttribute('data-card-label', label);
            td.setAttribute('data-card-slot', slot);
            td.classList.toggle('et-nolabel', label.trim() == '');
            td.classList.toggle('et-haslabel', explicitLabel && label.trim() != '');
            td.style.order = String((slots ? (ranks[slot] ?? 5) * 1000 : 0) + (def.order ?? i));

            const empty = (!this._isBadgesCol(coldef) && this._isTdEmpty(td));
            td.classList.toggle('et-empty', empty);
            td.classList.toggle('et-hide-empty', empty && (def.hideEmpty ?? this.CardsHideEmpty));
        });

        this._f8Decorar(tr, idx, data);   // F8a: reglas, errores, filtro y resaltado (antes de onRowPaint)
        this._paintBadges(tr, data, idx);

        if (typeof this.onRowPaint == 'function') this.onRowPaint(tr, idx, data);
        if (this._isCardView && typeof this.onCardPaint == 'function') this.onCardPaint(tr, idx, data);
    }

    _isTdEmpty=(td)=>
    {
        if (td.classList.contains('et-rel')) return !(td.getAttribute('data-rel') ?? '').trim();
        const cc = td.querySelector('div[iscellcontent=true]');
        const node = cc ?? td;
        if ((node.textContent ?? '').trim() != '') return false;
        return !node.querySelector('img,svg,input,button,video,canvas,iframe');
    }

    // ---------- Fechas relativas: <edit-th format="relative"> ----------

    _applyRelative=(td, coldef, data)=>
    {
        const on = !!(coldef && (coldef.format ?? '') == 'relative' && coldef.field);
        const txt = on ? this._formatRelative(data?.[coldef.field]) : null;

        if (txt === null || txt === '')
        {
            if (td.classList.contains('et-rel'))
            {
                td.classList.remove('et-rel');
                td.removeAttribute('data-rel');
                if (td._etRelTitle) { td.removeAttribute('title'); td._etRelTitle = false; }
            }
            return;
        }

        td.classList.add('et-rel');
        td.setAttribute('data-rel', txt);
        if (!td.hasAttribute('title') || td._etRelTitle) { td.title = String(data[coldef.field]); td._etRelTitle = true; }
        if (coldef.textalign) td.style.textAlign = coldef.textalign;
    }

    _formatRelative=(raw)=>
    {
        if (raw === undefined || raw === null || String(raw).trim() == '') return null;
        const s = String(raw).trim();
        const date = new Date(/^\d{4}-\d{2}-\d{2} /.test(s) ? s.replace(' ', 'T') : s);
        if (isNaN(date.getTime())) return null;

        if (typeof this.RelativeDateFormatter == 'function') return this.RelativeDateFormatter(raw, date);

        const locale = this.Locale || document.documentElement.lang || 'es-MX';
        const now = new Date();
        const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const diffDays = Math.round((day(now) - day(date)) / 86400000);

        try
        {
            if (diffDays == 0) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
            if (diffDays == 1)
            {
                const t = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day');
                return t.charAt(0).toUpperCase() + t.slice(1);
            }
            if (diffDays > 1 && diffDays < 7)
            {
                const t = date.toLocaleDateString(locale, { weekday: 'long' });
                return t.charAt(0).toUpperCase() + t.slice(1);
            }
            return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
        }
        catch { return s; }
    }

    // ---------- Badges ----------

    _normBadges=(value)=>
    {
        if (value === undefined || value === null || value === false || value === '') return [];
        const list = Array.isArray(value) ? value : [value];
        return list
            .filter(b => b !== undefined && b !== null && b !== false && b !== '')
            .map(b => (typeof b == 'object' ? b : { text: String(b) }));
    }

    _badgeKey=(data)=>
    {
        // Sin efectos secundarios: no inicializa TreeOptions (se lee antes de _initTreeValues).
        const k = (this.TreeOptions && Object.keys(this.TreeOptions).length > 0) ? this.TreeOptions.key : this.Key;
        const v = data?.[k];
        return (v === undefined || v === null || v === '') ? null : ('k:' + v);
    }

    _getBadgeOverride=(data)=>
    {
        if (!this._hasBadgeOverrides) return undefined;
        const k = this._badgeKey(data);
        if (k && this._badgeOverrides.has(k)) return this._badgeOverrides.get(k);
        if (data && typeof data == 'object' && this._badgeOverridesObj.has(data)) return this._badgeOverridesObj.get(data);
        return undefined;
    }

    _setBadgeOverride=(data, list)=>
    {
        const k = this._badgeKey(data);
        if (list === undefined)
        {
            if (k) this._badgeOverrides.delete(k);
            if (data && typeof data == 'object') this._badgeOverridesObj.delete(data);
            return;
        }
        this._hasBadgeOverrides = true;
        if (k) this._badgeOverrides.set(k, list);
        if (data && typeof data == 'object') this._badgeOverridesObj.set(data, list);
    }

    _effectiveBadges=(data, idx)=>
    {
        const o = this._getBadgeOverride(data);
        if (o !== undefined) return this._normBadges(o);
        if (typeof this.RowBadges == 'function') return this._normBadges(this.RowBadges(data, idx));
        return this._normBadges(data?.[this.BadgesField]);
    }

    _rowContext=(irow)=>
    {
        const tr = this.GetTrByIndex(irow);
        if (!tr) return null;
        return { tr, data: (tr._etData ?? this.DataArray[irow] ?? {}) };
    }

    /** Reemplaza los badges de la fila (tiene precedencia sobre RowBadges y el campo reservado). */
    SetRowBadges=(irow, badges)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        this._setBadgeOverride(ctx.data, this._normBadges(badges));
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Agrega un badge a la fila; si trae un id que ya existe, lo reemplaza. */
    AddRowBadge=(irow, badge)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        const b = this._normBadges(badge)[0];
        if (!b) return false;
        const list = this._effectiveBadges(ctx.data, irow).slice();
        const pos = (b.id !== undefined && b.id !== null) ? list.findIndex(x => x.id == b.id) : -1;
        if (pos >= 0) list[pos] = b; else list.push(b);
        this._setBadgeOverride(ctx.data, list);
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Elimina un badge por id, o todos los de la fila si no se indica id. */
    RemoveRowBadge=(irow, id)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        const list = (id === undefined) ? [] : this._effectiveBadges(ctx.data, irow).filter(x => x.id != id);
        this._setBadgeOverride(ctx.data, list);
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Descarta los cambios hechos con SetRowBadges/AddRowBadge/RemoveRowBadge y vuelve a RowBadges o al campo reservado. */
    ResetRowBadges=(irow)=>
    {
        const ctx = this._rowContext(irow);
        if (!ctx) return false;
        this._setBadgeOverride(ctx.data, undefined);
        this._paintBadges(ctx.tr, ctx.data, irow);
        return true;
    }

    /** Devuelve los badges efectivos de la fila. */
    GetRowBadges=(irow)=>
    {
        const ctx = this._rowContext(irow);
        return ctx ? this._effectiveBadges(ctx.data, irow) : [];
    }

    /** Vuelve a dibujar los badges de todas las filas sin reconstruir la tabla. */
    RefreshBadges=()=>
    {
        this._eachRow((tr, i, data) => this._paintBadges(tr, data, i));
    }

    _ensureBadgeWrap=(td)=>
    {
        let cc = td.querySelector('div[iscellcontent=true]');
        if (!cc)
        {
            cc = this._createFullElement('div', { iscellcontent: 'true', class: 'cell-content' });
            cc.innerHTML = td.innerHTML;
            td.innerHTML = '';
            td.appendChild(cc);
            this._setRowSizes(cc, this.GetColumnDefOfTd(td));
        }

        const parent = cc.parentElement;
        if (parent && parent !== td) return { wrap: parent, cc };

        const wrap = this._createFullElement('div', { class: 'et-badge-wrap' });
        td.insertBefore(wrap, cc);
        wrap.appendChild(cc);
        return { wrap, cc };
    }

    _paintBadges=(tr, data, idx)=>
    {
        if (!tr) return;

        tr.querySelectorAll('.et-badges').forEach(e => e.remove());
        tr.querySelectorAll('td.et-badge-host').forEach(td => td.classList.remove('et-badge-host'));

        const list = this._effectiveBadges(data, idx);
        if (!list.length) return;

        const info = this._getCardsInfo();
        const cells = this._f4CeldasDatos(tr);   // F4

        // Columnas de tipo Badges: el desarrollador decide dónde se ven
        if (info.badgeCols.length)
        {
            const groups = info.badgeCols.map(ci => ({ ci, g: (this.Columns[ci]?.badgegroup ?? '').trim() }));
            const claimed = new Set(groups.filter(x => x.g).map(x => x.g));

            groups.forEach(({ ci, g }) => {
                const sub = list.filter(b => (g ? (b.group ?? '') == g : !claimed.has(b.group ?? '')));
                const td = cells[ci];
                if (!td || !sub.length) return;
                const { wrap, cc } = this._ensureBadgeWrap(td);
                td.classList.add('et-badge-host');
                wrap.insertBefore(this._buildBadges(sub, 'inline'), cc);
            });
            return;
        }

        // Anfitrión automático: primera (o última) celda visible en la vista actual
        const visible = (td) => !td.classList.contains('hidde-col')
            && !(this._isCardView ? td.classList.contains('et-card-hidden') : td.classList.contains('et-table-hidden'));

        const byPos = {};
        list.forEach(b => {
            let p = (b.position ?? 'start').toString().toLowerCase();
            if (!['start', 'end', 'overlay-start', 'overlay-end'].includes(p)) p = 'start';
            (byPos[p] = byPos[p] ?? []).push(b);
        });

        Object.keys(byPos).forEach(pos => {
            const td = pos.endsWith('end') ? cells.slice().reverse().find(visible) : cells.find(visible);
            if (!td) return;
            const box = this._buildBadges(byPos[pos], pos);
            td.classList.add('et-badge-host');

            if (pos.startsWith('overlay')) { td.appendChild(box); return; }

            const { wrap, cc } = this._ensureBadgeWrap(td);
            if (pos == 'end') wrap.appendChild(box);
            else wrap.insertBefore(box, cc);
        });
    }

    _buildBadges=(list, pos)=>
    {
        const box = this._createFullElement('span', { class: 'et-badges et-badges-' + pos, part: 'badges' });
        list.forEach(b => box.appendChild(this._buildBadge(b)));
        return box;
    }

    _hasBadgeClickHandler=(b)=>
    {
        const ev = this.EdiTable.Const.Events.BadgeClick;
        return !!(typeof b.onClick == 'function' || typeof this.BadgeOnClick == 'function'
            || this.Events[ev] || this._getCurren().Events?.[ev]);
    }

    _buildBadge=(b)=>
    {
        const el = document.createElement('span');
        el.className = 'et-badge';
        this._splitClasses(b.className).forEach(c => el.classList.add(c));
        el.setAttribute('part', 'badge');
        if (b.id !== undefined && b.id !== null) el.setAttribute('data-badge-id', String(b.id));
        if (b.bg) el.style.background = String(b.bg);
        if (b.color) el.style.color = String(b.color);
        if (b.size) el.style.setProperty('--et-badge-size', String(b.size));

        const hasIcon = (b.icon !== undefined && b.icon !== null && String(b.icon) !== '');
        const hasText = (b.text !== undefined && b.text !== null && String(b.text) !== '');
        if (hasIcon) this._setBadgeIcon(el, String(b.icon));
        if (hasText)
        {
            if (hasIcon) { const s = document.createElement('span'); s.textContent = String(b.text); el.appendChild(s); }
            else el.textContent = String(b.text);
        }

        const tip = (b.tooltip !== undefined && b.tooltip !== null) ? String(b.tooltip) : '';
        const custom = (this.BadgeTooltip == 'custom');
        if (tip)
        {
            el.setAttribute('aria-label', tip);
            if (custom) el.setAttribute('data-tip', tip);
            else el.title = tip;
        }

        const clickable = this._hasBadgeClickHandler(b);
        if (clickable)
        {
            el.classList.add('et-clickable');
            el.setAttribute('role', 'button');
            el.tabIndex = 0;
        }
        else if (tip && custom) el.tabIndex = 0; // para mostrar el tooltip al tocarlo en pantallas táctiles

        el.addEventListener('click', (e) => this._onBadgeClick(e, b, el));
        el.addEventListener('keydown', (e) => {
            if ((e.key == 'Enter' || e.key == ' ') && el.classList.contains('et-clickable'))
            {
                e.preventDefault();
                e.stopPropagation();
                this._onBadgeClick(e, b, el);
            }
        });

        if (tip && custom)
        {
            el.addEventListener('mouseenter', () => this._showTip(el));
            el.addEventListener('focus', () => this._showTip(el));
            el.addEventListener('mouseleave', () => this._hideTip());
            el.addEventListener('blur', () => this._hideTip());
        }
        return el;
    }

    _setBadgeIcon=(el, icon)=>
    {
        const t = icon.trim();

        if (/^<svg[\s>]/i.test(t))
        {
            // Sin xmlns el DOMParser no crea un elemento SVG real y no se dibuja.
            const src = /\sxmlns\s*=/.test(t.slice(0, t.indexOf('>'))) ? t : t.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
            const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
            const svg = doc.documentElement;
            if (!svg || svg.nodeName.toLowerCase() != 'svg' || doc.querySelector('parsererror')) return;

            svg.querySelectorAll('script,foreignObject,iframe,animate,set').forEach(n => n.remove());
            [svg, ...svg.querySelectorAll('*')].forEach(n => {
                Array.from(n.attributes).forEach(a => {
                    const name = a.name.toLowerCase();
                    const val = (a.value ?? '').trim().toLowerCase();
                    if (name.startsWith('on')) n.removeAttribute(a.name);
                    else if ((name == 'href' || name == 'xlink:href') && !val.startsWith('#')) n.removeAttribute(a.name);
                    else if (val.startsWith('javascript:')) n.removeAttribute(a.name);
                });
            });
            svg.setAttribute('aria-hidden', 'true');
            el.appendChild(document.importNode(svg, true));
            return;
        }

        if (/^img:/i.test(t))
        {
            const src = t.slice(4).trim();
            const safe = /^https?:\/\//i.test(src) || /^data:image\/(png|jpe?g|gif|webp);/i.test(src) || /^\.{0,2}\//.test(src);
            if (!safe) return;
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            el.classList.add('et-badge-img');
            el.appendChild(img);
            return;
        }

        el.textContent = t;
    }

    _onBadgeClick=(e, b, el)=>
    {
        if (!el.classList.contains('et-clickable')) return; // sin manejador: el clic sigue a la celda como siempre
        e.stopPropagation();
        this._hideTip();

        const tr = el.closest('tr');
        const td = el.closest('td');
        const irow = this._getRowIndex(tr);
        const row = tr?._etData ?? this.DataArray[irow];
        const args = { sender: this._getCurren(), irow, badge: b, row, td, event: e, cancel: false };

        this._fireEvent(this.EdiTable.Const.Events.BadgeClick, args);
        if (!args.cancel)
        {
            if (typeof b.onClick == 'function') b.onClick(args);
            else if (typeof this.BadgeOnClick == 'function') this.BadgeOnClick(irow, b, row, e);
        }
        if (this.BadgeSelectsRow && td && !args.cancel) this.CellFocus(td);
    }

    _showTip=(el)=>
    {
        const tip = el.getAttribute('data-tip');
        if (!tip || !this._shadow) return;

        if (!this._tipEl)
        {
            this._tipEl = this._createFullElement('div', { class: 'et-tooltip', role: 'tooltip', part: 'tooltip' });
            this._shadow.appendChild(this._tipEl);
            this._table?.parentElement?.addEventListener('scroll', () => this._hideTip(), { passive: true });
        }

        const t = this._tipEl;
        t.textContent = tip;
        t.style.display = 'block';
        const r = el.getBoundingClientRect();
        const tr = t.getBoundingClientRect();
        let top = r.top - tr.height - 6;
        if (top < 4) top = r.bottom + 6;
        let left = r.left + (r.width / 2) - (tr.width / 2);
        left = Math.max(4, Math.min(left, window.innerWidth - tr.width - 4));
        t.style.top = top + 'px';
        t.style.left = left + 'px';
    }

    _hideTip=()=>
    {
        if (this._tipEl) this._tipEl.style.display = 'none';
    }

    _fireEvent=(name, args)=>
    {
        const handler = this.Events[name] ?? this._getCurren().Events?.[name];
        if (typeof handler == 'function') handler(args);
        if (name == 'selectionchanged' || name == 'groupchanged' || name == 'grouptoggled') this._f2Programar?.();   // F2: totales con summary-scope
    }

    _escapeHtml=(value)=>
    {
        return String(value)
            .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }

    _encodeRow=(row)=>
    {
        const out = {};
        Object.keys(row).forEach(k => { const v = row[k]; out[k] = (typeof v == 'string') ? this._escapeHtml(v) : v; });
        return out;
    }

    hideColumn(fieldColumn,hide=true)
    {
        let th = this._table.querySelector(`thead th[field="${fieldColumn}"]`);
        if (!th) return false;

        this._table.querySelectorAll('tbody tr:not(.et-spacer)').forEach(tr => tr._f6Grupo || tr.cells[th.cellIndex].classList.toggle('hidde-col',hide));   // F5: sin las filas de relleno; F6: sin las filas de grupo
        th.classList.toggle('hidde-col', hide);
        this._f2OcultarCeldaPie(th.cellIndex, hide);   // F2: la celda del pie sigue a la columna

        // F1 (A3): el estado se guarda por field; hideColumns (índices de celda) se deriva de él.
        const f1Field = th.getAttribute('field');
        this._f1EstadoColumna(f1Field).oculta = !!hide;
        if (!hide) this._f1Ocultas = this._f1Ocultas.filter(f => f !== f1Field);
        else if (!this._f1Ocultas.includes(f1Field)) this._f1Ocultas.push(f1Field);
        this.hideColumns = this._f1DerivarHideColumns();
        this._f6TrasColumnas();   // F6: celdas de las filas de grupo
        this._f3TrasOcultar?.(f1Field, !!hide);   // F3: recalcula las fijas y el menú

        this.RefreshBadges();
        return true;
    }
    hideColumns=[];
    _f1TitulosDeclarados = new Map();   // F1 (C20): cellIndex → título declarado, para data-cell

    // ===== F4: selección de varias filas, portapapeles y exportar (spec §4.1, §4.2 y §5)
    // La selección vive en el modelo: un Set con los objetos de DataArray. Sobrevive a ordenar, a
    // UpdateRow y a insertar o borrar filas; al asignar un DataArray con otros objetos, se vacía.
    // Con multi-select="checkbox" hay una celda del sistema (th/td.et-sel-col) al principio de cada fila;
    // no está en Columns ni pasa por onTdPaint, y todo lo que cuenta celdas habla de columnas de datos.
    static { this.features.push('multiselect', 'clipboard', 'export'); }

    _f4Modo = null;            // 'checkbox' | 'row' | null
    _f4Sel = new Set();        // objetos de DataArray seleccionados
    _f4Indices = new Map();    // objeto → índice de DataArray en el último aviso (para 'removed')
    _f4Ancla = null;           // objeto de la última fila marcada (Mayús+clic)
    _f4Listo = false;          // ya se inicializó la tabla
    _f4Escucha = false;
    _f4Estilo = null;
    _f4ThSel = null;           // th.et-sel-col, si existe

    get MultiSelect() { return this._f4Modo; }
    set MultiSelect(v)
    {
        const m = this._f4Normalizar(v);
        if (m === this._f4Modo) return;
        this._f4Modo = m;
        if (this._f4Listo)
        {
            this._f4Aplicar();
            // Integración F2/F3: la celda del sistema cambió después de inicializar. El pie (F2) rehace sus
            // celdas y sus totales, y F3 recalcula el left de las fijas (también en el pie).
            if (this._f2CeldasPie?.()) this._f2Programar?.();
            this._f6TrasColumnas();   // F6: celda del sistema en las filas de grupo
            this._f3Posiciones?.();
        }
    }

    /** Número de celdas del sistema al principio de cada fila (0 sin multi-select="checkbox"). F2 y F3 lo leen. */
    _etSysCols() { return (this._f4ThSel && this._f4ThSel.isConnected) ? 1 : 0; }

    _f4Normalizar(v)
    {
        v = String(v ?? '').trim().toLowerCase();
        return (v === 'checkbox' || v === 'row') ? v : null;
    }
    // Celdas del sistema de una fila concreta (las filas recién dibujadas todavía no las tienen).
    _f4SysDe(tr)
    {
        if (!this._f4ThSel) return 0;
        const c = tr?.cells?.[0];
        return (c && c.classList.contains('et-sel-col')) ? 1 : 0;
    }
    _f4CeldasDatos(tr)
    {
        const a = Array.from(tr.cells);
        return this._f4SysDe(tr) ? a.slice(1) : a;
    }

    _f4Iniciar()
    {
        if (this.hasAttribute('multi-select')) this._f4Modo = this._f4Normalizar(this.getAttribute('multi-select'));
        this._f4Listo = true;
        if (this._f4Modo || this._f4Sel.size) this._f4Aplicar();
    }
    _f4Aplicar()
    {
        if (!this._table) return;
        this._f4Preparar();
        if (this._f4Modo === 'checkbox') this._f4PonerColumna(); else this._f4QuitarColumna();
        this._f4Repintar();
    }
    // CSS y listeners de clic: solo se agregan cuando se usa la función (R1).
    _f4Preparar()
    {
        if (!this._f4Estilo && this._shadow)
        {
            const st = document.createElement('style');
            st.setAttribute('data-et', 'f4');
            st.textContent = `
                tbody tr.et-row-checked{ background-color: #DCE8FB; }
                th.et-sel-col, td.et-sel-col{ width: 2rem; min-width: 2rem; text-align: center; padding: 0 4px; cursor: default; }
                th.et-sel-col input, td.et-sel-col input{ cursor: pointer; margin: 0; vertical-align: middle; }
                .table-cards td.et-sel-col::before, table.et-cards td.et-sel-col::before{ content: none !important; }
                @media print{ .et-sel-col{ display: none !important; } }`;
            this._shadow.appendChild(st);
            this._f4Estilo = st;
            this._f8bReescribirTodo?.();   // F8b: variables del tema en la hoja nueva
        }
        if (!this._f4Escucha && this._table)
        {
            this._f4Escucha = true;
            // En captura: corre antes que td.onclick (CellFocus) y que el clic del selector (StartEdit).
            this._table.addEventListener('click', (e) => this._f4Clic(e), true);
            this._table.addEventListener('mousedown', (e) => this._f4Presion(e), true);
        }
    }
    _f4PonerColumna()
    {
        const thead = this._table.tHead;
        const hr = thead?.rows?.[0];
        if (!hr) return;
        if (!this._f4ThSel)
        {
            const th = document.createElement('th');
            th.className = 'et-sel-col';
            if (thead.rows.length > 1) th.rowSpan = thead.rows.length;
            th.innerHTML = '<input type="checkbox" tabindex="-1" aria-label="Seleccionar todas">';
            hr.insertBefore(th, hr.firstChild);
            this._f4ThSel = th;
        }
        const tbody = this._f1TBodyPrincipal();
        if (tbody) Array.from(tbody.rows).forEach(tr => this._f4FilaNueva(tr));
    }
    _f4QuitarColumna()
    {
        if (!this._f4ThSel) return;
        const tbody = this._f1TBodyPrincipal();
        if (tbody) Array.from(tbody.rows).forEach(tr => { if (this._f4SysDe(tr)) tr.cells[0].remove(); });
        this._f4ThSel.remove();
        this._f4ThSel = null;
    }
    _f4FilaNueva(tr)
    {
        if (!this._f4ThSel || !tr || this._f4SysDe(tr) || tr.classList.contains('et-spacer')) return;   // F5: el relleno no lleva casilla
        const td = document.createElement('td');
        td.className = 'et-sel-col';
        td.innerHTML = '<input type="checkbox" tabindex="-1" aria-label="Seleccionar fila">';
        tr.insertBefore(td, tr.firstChild);
        if (this._f4Sel.size) td.firstChild.checked = this._f4Sel.has(this.DataArray[this._getRowIndex(tr)]);
    }
    _f4MarcarFila(tr, idx)
    {
        if (!tr || (!this._f4Sel.size && !this._f4Modo && !tr.classList.contains('et-row-checked'))) return;
        const on = (this._f4Sel.size > 0 && idx >= 0 && this._f4Sel.has(this.DataArray[idx]));
        tr.classList.toggle('et-row-checked', on);
        if (this._f4SysDe(tr)) { const c = tr.cells[0].querySelector('input'); if (c) c.checked = on; }
    }
    _f4Repintar()
    {
        const tbody = this._f1TBodyPrincipal();
        if (tbody) Array.from(tbody.rows).forEach(tr => this._f4MarcarFila(tr, this._getRowIndex(tr)));
        this._f4Encabezado();
    }
    _f4Encabezado()
    {
        const i = this._f4ThSel?.querySelector('input');
        if (!i) return;
        const u = (this._f8Visibles?.() ?? this.DataArray).filter(r => r && typeof r == 'object'), n = u.length;   // F8a: con filtro, las visibles
        const s = u.filter(o => this._f4Sel.has(o)).length;
        i.checked = (n > 0 && s >= n);
        i.indeterminate = (s > 0 && s < n);
    }

    // ---------- puntos de enganche ----------
    _f4TrasDibujar()
    {
        if (!this._f4Listo || (!this._f4Modo && !this._f4Sel.size)) return;
        this._f4Podar();
        if (this._f4ThSel) { const tb = this._f1TBodyPrincipal(); if (tb) Array.from(tb.rows).forEach(tr => this._f4FilaNueva(tr)); }
        this._f4Encabezado();
    }
    _f4FilaInsertada(tr)
    {
        if (!this._f4ThSel) return;
        this._f4FilaNueva(tr);
        this._f4Encabezado();
    }
    _f4FilaBorrada(obj, row)
    {
        if (!this._f4Sel.size && !this._f4ThSel) return;
        if (obj && this._f4Sel.has(obj) && !this.DataArray.includes(obj))
        {
            this._f4Sel.delete(obj);
            this._f4Avisar([], [row]);
        }
        else this._f4Encabezado();
    }
    // Quita de la selección los objetos que ya no están en DataArray (por ejemplo, un DataArray nuevo).
    _f4Podar()
    {
        if (!this._f4Sel.size) return;
        const vivos = new Set();
        this.DataArray.forEach(r => { if (this._f4Sel.has(r)) vivos.add(r); });
        if (vivos.size === this._f4Sel.size) return;
        const removed = [...this._f4Sel].filter(o => !vivos.has(o)).map(o => this._f4Indices.get(o)).filter(i => i !== undefined);
        this._f4Sel = vivos;
        this._f4Avisar([], removed);
    }

    // ---------- cambios de selección ----------
    _f4Indice()
    {
        const m = new Map();
        this.DataArray.forEach((r, i) => { if (r && typeof r == 'object' && !m.has(r)) m.set(r, i); });
        return m;
    }
    _f4Objetos(indices)
    {
        const out = [];
        (Array.isArray(indices) ? indices : [indices]).forEach(i => {
            const n = Number(i);
            if (!Number.isInteger(n) || n < 0 || n >= this.DataArray.length) return;
            const r = this.DataArray[n];
            if (r && typeof r == 'object') out.push(r);
        });
        return out;
    }
    // Aplica una selección nueva (Set de objetos). Solo avisa si algo cambió (P14).
    _f4Fijar(nuevo)
    {
        const antes = this._f4Sel;
        const idx = this._f4Indice();
        const added = [], removed = [];
        nuevo.forEach(o => { if (!antes.has(o) && idx.has(o)) added.push(idx.get(o)); });
        antes.forEach(o => { if (!nuevo.has(o)) { const i = idx.has(o) ? idx.get(o) : this._f4Indices.get(o); if (i !== undefined) removed.push(i); } });
        const iguales = (antes.size === nuevo.size) && [...nuevo].every(o => antes.has(o));
        if (iguales) return false;
        this._f4Sel = nuevo;
        if (this._f4Listo) { this._f4Preparar(); this._f4Repintar(); }
        this._f4Avisar(added, removed);
        return true;
    }
    _f4Avisar(added, removed)
    {
        const ord = (a, b) => a - b;
        const selected = this.getSelectedRows();
        this._f4Indices = new Map(selected.map(i => [this.DataArray[i], i]));
        if (this._f4Listo) this._f4Encabezado();
        // F2 (summary-scope="selected") recalcula al cambiar la selección.
        if (this.SummaryScope === 'selected' && typeof this.RefreshSummaries === 'function')
        {
            try { this.RefreshSummaries(); } catch (err) { console.error('EditTable: RefreshSummaries', err); }
        }
        const fn = this._getCurren().Events[this.EdiTable.Const.Events.SelectionChanged];
        if (fn) fn({ selected, added: [...new Set(added)].sort(ord), removed: [...new Set(removed)].sort(ord) });
    }
    _f4Alternar(i)
    {
        const r = this._f4Objetos([i])[0];
        if (!r) return;
        const s = new Set(this._f4Sel);
        if (s.has(r)) s.delete(r); else s.add(r);
        this._f4Fijar(s);
    }
    _f4Rango(i, agregar)
    {
        let a = (this._f4Ancla ? this.DataArray.indexOf(this._f4Ancla) : -1);
        if (a < 0) a = this.CurrentRowIndex();
        if (a < 0) a = i;
        const s = agregar ? new Set(this._f4Sel) : new Set();
        if (this._f6Grupos.length) { this._f6IndicesEntre(a, i).forEach(k => this._f4Objetos([k]).forEach(o => s.add(o))); this._f4Fijar(s); return; }   // F6: rango en el orden visible
        for (let k = Math.min(a, i); k <= Math.max(a, i); k++) this._f4Objetos([k]).forEach(o => s.add(o));
        this._f4Fijar(s);
    }

    // ---------- ratón y teclado ----------
    _f4CeldaDe(e)
    {
        const cell = e.target?.closest?.('td,th');
        return (cell && cell.closest('table') === this._table) ? cell : null;
    }
    _f4Presion(e)
    {
        if (!this._f4Modo && !this._f4ThSel) return;
        const cell = this._f4CeldaDe(e);
        if (!cell) return;
        // La casilla no se lleva el foco: el teclado sigue en la celda actual (§4.1: no cambia la celda actual).
        if (cell.classList.contains('et-sel-col')) e.preventDefault();
        else if (this._f4Modo === 'row' && e.shiftKey && cell.tagName === 'TD') e.preventDefault();   // sin seleccionar texto
    }
    _f4Clic(e)
    {
        if (!this._f4Modo && !this._f4ThSel) return;
        const cell = this._f4CeldaDe(e);
        if (!cell) return;
        const tbody = this._f1TBodyPrincipal();
        if (cell.classList.contains('et-sel-col'))
        {
            e.stopPropagation();
            if (cell.tagName === 'TH') { this._f4Todas(); return; }
            const i = this._getRowIndex(cell.parentElement);
            if (i < 0) return;
            if (e.shiftKey) this._f4Rango(i, true); else this._f4Alternar(i);
            this._f4Ancla = this.DataArray[i];
            this._f4MarcarFila(cell.parentElement, i);   // la casilla nativa ya cambió: se alinea con el modelo
            return;
        }
        if (this._f4Modo !== 'row' || cell.tagName !== 'TD' || cell.parentElement?.parentElement !== tbody) return;
        const input = this.EdiTable.GetInput();
        if (this.Editing && input && cell.contains(input)) return;
        const i = this._getRowIndex(cell.parentElement);
        if (i < 0) return;
        const ctrl = (e.ctrlKey || e.metaKey);
        if (!ctrl && !e.shiftKey) { this._f4Ancla = this.DataArray[i]; return; }   // clic normal: sigue como hoy
        e.stopPropagation();
        e.preventDefault();
        if (e.shiftKey) this._f4Rango(i, ctrl);
        else { this._f4Alternar(i); this._f4Ancla = this.DataArray[i]; }
        if (this.CurrentTd() !== cell) this.CellFocus(cell);   // Ctrl+clic no inicia la edición
    }
    _f4Todas()
    {
        const u = (this._f8Visibles?.() ?? this.DataArray).filter(r => r && typeof r == 'object'), n = u.length;   // F8a: con filtro, las visibles
        if (n > 0 && u.filter(o => this._f4Sel.has(o)).length >= n) this.ClearSelection(); else this.SelectAll();
    }
    // Teclado del selector (sin edición en curso). true si la tecla se atendió aquí.
    _f4Tecla(e)
    {
        if (e.altKey || (e.getModifierState && e.getModifierState('AltGraph'))) return false;
        const ctrl = (e.ctrlKey || e.metaKey);
        if (ctrl && !e.shiftKey && (e.key ?? '').toLowerCase() === 'c')
        {
            e.preventDefault();
            e.stopPropagation();
            this.copySelection();
            return true;
        }
        if (!ctrl && (e.key === ' ' || e.key === 'Spacebar') && this._f4Modo)
        {
            e.preventDefault();
            e.stopPropagation();
            const i = this.CurrentRowIndex();
            if (i >= 0) { this._f4Alternar(i); this._f4Ancla = this.DataArray[i]; }
            return true;
        }
        return false;
    }

    // ---------- API de selección (§4.1) ----------
    /** Índices de DataArray seleccionados, ordenados. */
    getSelectedRows=()=>
    {
        if (!this._f4Sel.size) return [];
        const r = [];
        this.DataArray.forEach((o, i) => { if (this._f4Sel.has(o)) r.push(i); });
        return r;
    }
    /** Objetos de DataArray seleccionados, en el orden de DataArray. */
    getSelectedData=()=> this.getSelectedRows().map(i => this.DataArray[i]);
    SelectRows=(indices, add=false)=>
    {
        const s = add ? new Set(this._f4Sel) : new Set();
        this._f4Objetos(indices ?? []).forEach(o => s.add(o));
        return this._f4Fijar(s);
    }
    UnselectRows=(indices)=>
    {
        const s = new Set(this._f4Sel);
        this._f4Objetos(indices ?? []).forEach(o => s.delete(o));
        return this._f4Fijar(s);
    }
    SelectAll=()=> this._f4Fijar(new Set((this._f8Visibles?.() ?? this.DataArray).filter(r => r && typeof r == 'object')));   // F8a: con filtro, solo las visibles
    ClearSelection=()=> this._f4Fijar(new Set());
    IsRowSelected=(i)=>
    {
        const r = this.DataArray[Number(i)];
        return !!(r && this._f4Sel.has(r));
    }

    // ---------- columnas y valores ----------
    // Orden: el de Columns (R3, F3 lo mantiene igual al del DOM). Visibilidad: el estado por field de F1.
    _f4Columnas({ incluirOcultas = false, sinImpresion = false, conField = false } = {})
    {
        const out = [];
        this.Columns.forEach((col, i) => {
            if (!col || this._isBadgesCol(col)) return;
            if (col.field == undefined && (conField || !col.template)) return;
            const cls = String(col.class ?? '');
            if (sinImpresion && (cls.includes('no-print') || cls.includes('hide-on-print'))) return;
            const oculta = (col.field != undefined && this._f1ColumnaOculta(col.field));
            if (oculta && !incluirOcultas) return;
            out.push({ i, col, oculta });
        });
        return out;
    }
    _f4Titulo(col) { return String(col.title ?? col.field ?? '').trim(); }
    // Valor del modelo (forma de InduxsoftExcel.fromEditTable v1): Select con keyfield → texto, o la llave con raw;
    // Select sin keyfield → texto de options, o la llave con raw.
    _f4Valor(col, data, raw)
    {
        if (!data) return undefined;
        let v = (col.field != undefined ? data[col.field] : undefined);
        if (String(col.type ?? '').toLowerCase() === 'select' && col.options && typeof col.options == 'object')
        {
            if (col.keyfield != undefined) { if (raw) v = data[col.keyfield]; }
            else if (!raw && Object.prototype.hasOwnProperty.call(col.options, v)) v = col.options[v];
        }
        return v;
    }
    // Texto como se ve (formato numérico, plantilla como texto) o crudo.
    _f4Texto(col, data, raw)
    {
        if (!data) return '';
        let v = this._f4Valor(col, data, raw);
        if (!raw && col.template)
        {
            try { const t = document.createElement('template'); t.innerHTML = String(this.applyTemplate(col.template, data) ?? ''); v = t.content.textContent; }
            catch (err) { }
        }
        if (v === undefined || v === null) return '';
        if (!raw && v !== '' && this._withFormat(col, v)) return this._aplyFormat(col, v);
        return String(v);
    }
    _f4FilasExportar(selectedOnly, visibleOnly)
    {
        if (visibleOnly && this._f8FiltrarIdx) return this._f8FiltrarIdx(this._f4FilasExportar(selectedOnly));   // F8a: visibleOnly
        if (!selectedOnly) return this.DataArray.map((_, i) => i);
        const s = this.getSelectedRows();
        if (s.length || this._f4Modo) return s;
        const c = this.CurrentRowIndex();
        return (c >= 0 ? [c] : []);
    }

    // ---------- portapapeles (§4.2) ----------
    /** TSV (\r\n) de las filas seleccionadas o, sin selección, de la celda actual. opts: {headers, raw}. */
    getClipboardText=(opts={})=>
    {
        opts = opts ?? {};
        const raw = !!opts.raw;
        const tsv = (s) => (/[\t\r\n"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
        let cols, lineas, headers = opts.headers;
        const filas = (opts.visibleOnly && this._f8FiltrarIdx ? this._f8FiltrarIdx(this.getSelectedRows()) : this.getSelectedRows());   // F8a: visibleOnly
        if (filas.length)
        {
            cols = this._f4Columnas();
            if (headers === undefined) headers = true;   // P13: filas completas llevan títulos
            lineas = filas.map(r => cols.map(c => this._f4Texto(c.col, this.DataArray[r], raw)));
        }
        else
        {
            const td = this.CurrentTd();
            const r = this.RowIndexOfTd(td), col = this.Columns[this.ColIndexOfTd(td)];
            if (!td || r < 0 || !col) return '';
            cols = [{ col }];
            if (headers === undefined) headers = false;
            lineas = [[this._f4Texto(col, this.DataArray[r], raw)]];
        }
        if (headers) lineas.unshift(cols.map(c => this._f4Titulo(c.col)));
        return lineas.map(l => l.map(tsv).join('\t')).join('\r\n');
    }
    /** Copia al portapapeles (BeforeCopy permite cambiar el texto o cancelar). Devuelve una promesa con true si se copió. */
    copySelection=(opts={})=>
    {
        const eventArgs = { text: this.getClipboardText(opts), cancel: false };
        const fn = this._getCurren().Events[this.EdiTable.Const.Events.BeforeCopy];
        if (fn) fn(eventArgs);
        if (eventArgs.cancel) return Promise.resolve(false);
        const text = String(eventArgs.text ?? '');
        try
        {
            if (navigator.clipboard && typeof navigator.clipboard.writeText == 'function')
                return navigator.clipboard.writeText(text).then(() => true, () => this._f4CopiarExec(text));
        }
        catch (err) { }
        return Promise.resolve(this._f4CopiarExec(text));
    }
    // Sin navigator.clipboard (origen no seguro): execCommand sobre un textarea temporal dentro del shadow.
    _f4CopiarExec(text)
    {
        const raiz = this._shadow ?? document.body;
        const prev = (this._shadow?.activeElement ?? document.activeElement);
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
        raiz.appendChild(ta);
        let ok = false;
        try { ta.select(); ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        try { if (prev && prev !== ta && typeof prev.focus == 'function') prev.focus({ preventScroll: true }); } catch (err) { }
        return ok;
    }

    // ---------- exportar (§5) ----------
    /** {columns, rows, summary}: la forma que recibe InduxsoftExcel.fromData. opts: {selectedOnly, raw, includeHidden}. */
    getExportData=(opts={})=>
    {
        opts = opts ?? {};
        const raw = !!opts.raw;
        const cols = this._f4Columnas({ incluirOcultas: !!opts.includeHidden, sinImpresion: true, conField: true });
        const columns = cols.map(({ col, oculta }) => {
            const x = {};
            for (const k of ['field', 'title', 'type', 'format', 'width', 'decs', 'prefix', 'sufix', 'thousandssep'])
                if (col[k] !== undefined) x[k] = col[k];
            x.title = this._f4Titulo(col);
            x.type = (col.type ?? this.ColumnsDefaultType);
            const ancho = this._f1EstadoColumnas.get(col.field)?.ancho;
            if (ancho) x.width = ancho;
            if (oculta) x.hidden = true;
            return x;
        });
        const rows = this._f4FilasExportar(!!opts.selectedOnly, !!opts.visibleOnly).map(i => {   // F8a: visibleOnly
            const d = this.DataArray[i], o = {};
            cols.forEach(({ col }) => { o[col.field] = this._f4Valor(col, d, raw); });
            return o;
        });
        let summary = null;
        if (typeof this.getSummaries == 'function')
        {
            // Integración F2+F4: sin columnas con total, null (getSummaries da {}).
            try { const s = this.getSummaries(); summary = (s && Object.keys(s).length) ? s : null; } catch (err) { summary = null; }
        }
        return { columns, rows, summary };
    }
    /** CSV RFC 4180. opts: {selectedOnly, raw, includeHidden, headers=true, delimiter=',', bom=false, includeSummary=false}. */
    exportCSV=(opts={})=>
    {
        opts = opts ?? {};
        const raw = !!opts.raw;
        const sep = String(opts.delimiter ?? opts.separator ?? ',');
        const esc = (s) => { s = String(s ?? ''); return (s.includes(sep) || /["\r\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s; };
        const cols = this._f4Columnas({ incluirOcultas: !!opts.includeHidden, sinImpresion: true, conField: true });
        const lineas = [];
        if (opts.headers !== false) lineas.push(cols.map(c => esc(this._f4Titulo(c.col))).join(sep));
        this._f4FilasExportar(!!opts.selectedOnly, !!opts.visibleOnly).forEach(i => lineas.push(cols.map(c => esc(this._f4Texto(c.col, this.DataArray[i], raw))).join(sep)));
        if (opts.includeSummary && typeof this.getSummaries == 'function')
        {
            let s = null;
            try { s = this.getSummaries(); } catch (err) { s = null; }
            if (s && cols.some(c => s[c.col.field] != null))
                lineas.push(cols.map(c => {
                    const v = s[c.col.field];
                    if (v == null) return '';
                    return esc(!raw && this._withFormat(c.col, v) ? this._aplyFormat(c.col, v) : v);
                }).join(sep));
        }
        return (opts.bom ? '﻿' : '') + lineas.join('\r\n');
    }
    /** Descarga exportCSV(opts) como archivo (con BOM por omisión, para que Excel lea los acentos). */
    downloadCSV=(fileName='export.csv', opts={})=>
    {
        const csv = this.exportCSV(Object.assign({ bom: true }, opts ?? {}));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (fileName || 'export.csv');
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
    }
    // ===== F4: fin

    addEventListener(type, listener) {
        const known = Object.values(this.EdiTable.Const.Events);
        if (typeof type == "string" && !known.includes(type.toLowerCase()))
        {
            // Antes se ignoraban en silencio; ahora pueden habilitarse con native-events="true".
            if (this.NativeEvents) super.addEventListener(...arguments);
            return;
        }
        if (typeof type != "string" || typeof listener != "function") return;

        switch (type.toLowerCase()) {
            case this.EdiTable.Const.Events.BeforeCellFocus:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeCellFocus] = listener
                break;
            case this.EdiTable.Const.Events.EnterCell:
                this._getCurren().Events[this.EdiTable.Const.Events.EnterCell] = listener
                break;
            case this.EdiTable.Const.Events.LeaveCell:
                this._getCurren().Events[this.EdiTable.Const.Events.LeaveCell] = listener
                break;
            case this.EdiTable.Const.Events.StartEdition:
                this._getCurren().Events[this.EdiTable.Const.Events.StartEdition] = listener
                break;
            case this.EdiTable.Const.Events.ConfirmEdition:
                this._getCurren().Events[this.EdiTable.Const.Events.ConfirmEdition] = listener
                break;
            case this.EdiTable.Const.Events.CancelEdition:
                this._getCurren().Events[this.EdiTable.Const.Events.CancelEdition] = listener
                break;
            case this.EdiTable.Const.Events.InputCreated:
                this._getCurren().Events[this.EdiTable.Const.Events.InputCreated] = listener
                break;
            case this.EdiTable.Const.Events.BeforeSetInput:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeSetInput] = listener
                break;
            case this.EdiTable.Const.Events.BeforeUpdateCell:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeUpdateCell] = listener
                break;
            case this.EdiTable.Const.Events.FieldUpdated:
                this._getCurren().Events[this.EdiTable.Const.Events.FieldUpdated] = listener
                break;
            case this.EdiTable.Const.Events.RowAdded:
                this._getCurren().Events[this.EdiTable.Const.Events.RowAdded] = listener
                break;
            case this.EdiTable.Const.Events.BeforeRowDelete:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeRowDelete] = listener
                break;
            case this.EdiTable.Const.Events.RowDeleted:
                this._getCurren().Events[this.EdiTable.Const.Events.RowDeleted] = listener
                break;
            case this.EdiTable.Const.Events.BeforeMoveRow:
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeMoveRow] = listener
                break;
            case this.EdiTable.Const.Events.RowMoved:
                this._getCurren().Events[this.EdiTable.Const.Events.RowMoved] = listener
                break;
            case this.EdiTable.Const.Events.RowChanged:
                this._getCurren().Events[this.EdiTable.Const.Events.RowChanged] = listener
                break;
            case this.EdiTable.Const.Events.LostFocus:
                this._getCurren().Events[this.EdiTable.Const.Events.LostFocus] = listener
                break;
            case this.EdiTable.Const.Events.IsDirtyChanged:
                this._getCurren().Events[this.EdiTable.Const.Events.IsDirtyChanged] = listener
                break;
            case this.EdiTable.Const.Events.OnSort:
                this._getCurren().Events[this.EdiTable.Const.Events.OnSort] = listener
                break;
            case this.EdiTable.Const.Events.BadgeClick:
                this._getCurren().Events[this.EdiTable.Const.Events.BadgeClick] = listener
                break;
            case this.EdiTable.Const.Events.ViewModeChanged:
                this._getCurren().Events[this.EdiTable.Const.Events.ViewModeChanged] = listener
                break;
            case this.EdiTable.Const.Events.MaskInvalid:   // F1 (C15, R4)
                this._getCurren().Events[this.EdiTable.Const.Events.MaskInvalid] = listener
                break;
            case this.EdiTable.Const.Events.ColumnFixedChanged:   // F3
                this._getCurren().Events[this.EdiTable.Const.Events.ColumnFixedChanged] = listener
                break;
            case this.EdiTable.Const.Events.ColumnVisibilityChanged:   // F3
                this._getCurren().Events[this.EdiTable.Const.Events.ColumnVisibilityChanged] = listener
                break;
            case this.EdiTable.Const.Events.BeforeColumnMove:   // F3
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeColumnMove] = listener
                break;
            case this.EdiTable.Const.Events.ColumnMoved:   // F3
                this._getCurren().Events[this.EdiTable.Const.Events.ColumnMoved] = listener
                break;
            case this.EdiTable.Const.Events.LayoutChanged:   // F3
                this._getCurren().Events[this.EdiTable.Const.Events.LayoutChanged] = listener
                break;
            case this.EdiTable.Const.Events.LayoutRejected:   // F3
                this._getCurren().Events[this.EdiTable.Const.Events.LayoutRejected] = listener
                break;
            case this.EdiTable.Const.Events.SelectionChanged:   // F4 (R4)
                this._getCurren().Events[this.EdiTable.Const.Events.SelectionChanged] = listener
                break;
            case this.EdiTable.Const.Events.BeforeCopy:   // F4 (R4)
                this._getCurren().Events[this.EdiTable.Const.Events.BeforeCopy] = listener
                break;
            case this.EdiTable.Const.Events.BeforeGroup:    // F6 (R4)
            case this.EdiTable.Const.Events.GroupChanged:   // F6 (R4)
            case this.EdiTable.Const.Events.GroupToggled:   // F6 (R4)
            case this.EdiTable.Const.Events.SummaryCalculated:   // F2 (R4)
            case this.EdiTable.Const.Events.ValueTypeFallback:   // F2 (R4)
            case this.EdiTable.Const.Events.SearchChanged:    // F8a (R4)
            case this.EdiTable.Const.Events.FilterChanged:    // F8a (R4)
            case this.EdiTable.Const.Events.BeforeRowLeave:   // F8a (R4)
                this._getCurren().Events[type.toLowerCase()] = listener
                break;
        }
    }
    // ===== F5: rendimiento con miles de filas (spec §10)
    //
    // 1. Siempre activo, sin cambios visibles (enganches marcados «F5:» en el código existente): TRCount sin
    //    recorrer el tbody (UpdateData deja de ser O(n²)), NavUp/NavDown por hermanos, NavTo y CellFocus sin
    //    listas completas, InsertRow sin recorrer la tabla si no hay columnas ocultas, _printRows con un
    //    fragmento y, en árbol, sin copias JSON profundas (TreeArray en O(n) cuando las llaves son únicas y no
    //    hay ciclos; si no, el camino de antes). _printRows() y _printTreeData() siguen dibujando todo.
    // 2. Virtualización opcional (virtual-rows="true" / VirtualRows): solo se dibujan las filas visibles más
    //    VirtualOverscan (10) de margen; arriba y abajo van filas de relleno tr.et-spacer (sin celdas) en el
    //    mismo tbody, sin nada que envuelva la tabla. El modelo (DataArray) es la fuente de verdad: lo editado
    //    ya está ahí, y UpdateData/UpdateDataRow solo leen las filas dibujadas. TRCount() = DataArray.length;
    //    GetTrByIndex(i) desplaza y dibuja la fila (P22). La fila con el selector o el editor se conserva
    //    dibujada aunque salga de la vista. No se virtualiza en árbol ni en la vista de tarjetas.
    //    Con row-height en px, ese es el alto de cada fila (P21); si no, se mide.
    //
    // Punto de extensión para F6 (agrupación): _f5Filas() devuelve la lista de «filas lógicas» que se dibujan,
    // en orden. Una fila de datos es {tipo:'datos', indice} (índice de DataArray). F6 puede sobrescribirla para
    // intercalar entradas de otro tipo (por ejemplo {tipo:'grupo', ...}) y definir _f5DibujarEntrada(entrada,
    // pos), que devuelve el tr de esa entrada (sin índice de datos: _getRowIndex da -1). Una fila de datos que
    // no está en la lista (grupo colapsado) no se dibuja. Todo lo demás (relleno, desplazamiento, teclado,
    // mapa tr → índice) trabaja sobre las posiciones de esa lista; al cambiarla, llamar _f5Rearmar().
    static { this.features.push('virtual'); }

    VirtualOverscan = 10;        // virtual-overscan
    ScrollContainer = null;      // scroll-container: selector o elemento
    _f5Pedido = false;           // virtual-rows
    _f5Listo = false;
    _f5Activo = false;           // está virtualizando
    _f5Todo = false;             // RenderAll(): todas dibujadas hasta RenderVisible()
    _f5PorImprimir = false;
    _f5Lista = [];               // filas lógicas (_f5Filas)
    _f5Pos = [];                 // índice de DataArray → posición en _f5Lista (-1 si no se dibuja)
    _f5Trs = new Map();          // posición → tr dibujado
    _f5PosTr = new WeakMap();    // tr → posición
    _f5Idx = new WeakMap();      // tr → índice de DataArray (solo filas de datos)
    _f5Datos = null;             // DataArray con el que se armó la lista
    _f5Largo = 0;
    _f5Paso = 0;                 // alto de una fila, medido (incluye border-spacing)
    _f5Cont = null;              // contenedor de scroll: elemento o window
    _f5FnScroll = null;
    _f5Globales = false;
    _f5RO = null;
    _f5Estilo = null;
    _f5Pintando = false;
    _f5FnDoc = null;
    _f5Clave = '';                // última ventana dibujada (para no rehacer nada si no cambió)
    _f5Sucio = true;

    get VirtualRows() { return this._f5Pedido; }
    set VirtualRows(v) { v = this._f5Bool(v); if (v === this._f5Pedido) return; this._f5Pedido = v; this._f5Reevaluar(); }

    _f5Bool(v) { return (v === true) || (v !== false && v != null && !this._f1EsFalso(v)); }

    /** Dibuja todas las filas (por ejemplo, antes de clonar la tabla para imprimir) hasta RenderVisible(). */
    RenderAll()
    {
        if (!this._f5Activo) return false;
        this._f5Todo = true;
        this._f5Sucio = true;
        this._f5Sincronizar();
        this._f5Pintar();
        return true;
    }
    /** Vuelve al modo virtual: solo las filas visibles más el margen. */
    RenderVisible()
    {
        if (!this._f5Activo) return false;
        this._f5Todo = false;
        this._f5Sucio = true;
        if (this._f5Sincronizar()) return true;
        if (!this._f5Cont || (this._f5Cont !== window && !this._f5Cont.isConnected) || this._f5Cont === window) this._f5ElegirContenedor();
        this._f5Pintar();
        return true;
    }

    // ---------- enganches ----------
    _f5Iniciar()
    {
        if (this.hasAttribute('virtual-rows')) this._f5Pedido = this._f5Bool(this.getAttribute('virtual-rows'));
        if (this.hasAttribute('virtual-overscan')) this.VirtualOverscan = Number(this.getAttribute('virtual-overscan'));
        if (this.hasAttribute('scroll-container')) this.ScrollContainer = this.getAttribute('scroll-container');
        this._f5Listo = true;
        if (this._f5Pedido) this._f5Reevaluar();
    }
    _f5AtributoCambiado(name, v)
    {
        if (name == 'virtual-rows') this.VirtualRows = (v !== null && this._f5Bool(v));
    }
    _f5Debe()
    {
        // F5+F6 (decisión de integración): en árbol no se virtualiza; se avisa una vez por consola.
        if (this._f5Listo && this._f5Pedido && this.ShowAsTree && !this._f5AvisoArbol) { this._f5AvisoArbol = true; console.warn('EditTable: virtual-rows no se aplica con show-tree; el árbol se dibuja completo.'); }
        return this._f5Listo && this._f5Pedido && !!this._table && !this.ShowAsTree && !this._isCardView;
    }
    // Desde _printRows: true si hay que dibujar en modo virtual. Si dejó de aplicar (árbol, tarjetas), sale del modo.
    _f5DebeVirtualizar()
    {
        if (this._f5Debe()) return true;
        if (this._f5Activo) this._f5Salir();
        return false;
    }
    _f5Reevaluar()
    {
        if (!this._f5Listo || !this._table) return;
        if (this._f5Debe()) { if (this._f5Activo) this.RenderVisible(); else this._f5PrintRows(); }
        else if (this._f5Activo) { this._f5Salir(); this._printRows(); }
    }
    _f5AntesDeImprimir() { if (this._f5Activo && !this._f5Todo) { this._f5PorImprimir = true; this.RenderAll(); } }
    _f5DespuesDeImprimir() { if (this._f5PorImprimir) { this._f5PorImprimir = false; this.RenderVisible(); } }
    _f5Liberar()
    {
        this._f5Escuchar(null);
        if (this._f5FnDoc) document.removeEventListener('scroll', this._f5FnDoc, { capture: true });
    }
    _f5Reconectar()
    {
        if (this._f5FnDoc) document.addEventListener('scroll', this._f5FnDoc, { capture: true, passive: true });
        if (this._f5Activo) { this._f5ElegirContenedor(); this._f5Pintar(); }
    }

    // ---------- modelo ----------
    /** Filas lógicas que se dibujan (punto de extensión de F6, ver arriba). */
    _f5Filas()
    {
        { const f6 = this._f6FilasV?.(); if (f6) return f6; }   // F5+F6: con grupos, filas de grupo y de datos visibles
        { const f8 = this._f8FilasV?.(); if (f8) return f8; }   // F8a: sin las filas filtradas
        const n = (this.DataArray ?? []).length, out = new Array(n);
        for (let i = 0; i < n; i++) out[i] = { tipo: 'datos', indice: i };
        return out;
    }
    _f5Armar()
    {
        const datos = (this.DataArray ?? []);
        this._f5Sucio = true;
        this._f5Datos = datos;
        this._f5Largo = datos.length;
        const thead = this._table.querySelector('thead');
        this._f5Lista = ((thead && thead.hasChildNodes()) ? this._f5Filas() : []);
        this._f5Pos = new Int32Array(datos.length).fill(-1);
        this._f5Lista.forEach((e, p) => { if (e && e.tipo === 'datos' && e.indice >= 0 && e.indice < datos.length) this._f5Pos[e.indice] = p; });
        this._f6TrasArmar?.();   // F5+F6: pathKey → posición de cada fila de grupo
    }
    // Vuelve a armar la lista conservando las filas dibujadas. mapa: índice viejo → índice nuevo (o -1).
    _f5Rearmar(mapa = (i) => i)
    {
        const viejos = Array.from(this._f5Trs.values());
        this._f5Armar();
        this._f5Trs = new Map();
        viejos.forEach(tr => {
            if (tr._f6Grupo) { const pg = (this._f6PosGrupo?.get(tr._f6Grupo.pathKey) ?? -1); if (pg < 0) tr.remove(); else { this._f5PosTr.set(tr, pg); this._f5Trs.set(pg, tr); } return; }   // F5+F6
            const i0 = this._f5Idx.get(tr);
            const i = (i0 === undefined ? -1 : mapa(i0));
            const p = ((i >= 0 && i < this._f5Pos.length) ? this._f5Pos[i] : -1);
            if (p < 0) { tr.remove(); return; }
            this._f5Idx.set(tr, i);
            this._f5PosTr.set(tr, p);
            this._f5Trs.set(p, tr);
        });
        this._f6TrasRearmar?.();   // F5+F6: orden del DOM y conteos de las filas de grupo dibujadas
    }
    // Si alguien reasignó o cambió el largo de DataArray sin _printRows. true si volvió a dibujar todo.
    _f5Sincronizar()
    {
        if (!this._f5Activo) return false;
        if ((this.DataArray ?? []) !== this._f5Datos) { this._f5PrintRows(); return true; }
        if (this.DataArray.length !== this._f5Largo) { this._f5Rearmar(); this._f5Pintar(); }
        return false;
    }
    _f5TrDibujado(i)
    {
        if (!this._f5Activo) return undefined;
        this._f5Sincronizar();
        const p = (Number.isInteger(i) && i >= 0 && i < this._f5Pos.length) ? this._f5Pos[i] : -1;
        return (p >= 0 ? this._f5Trs.get(p) : undefined);
    }
    _f5DatosVisibles()   // F2 (summary-scope="visible"): filas de datos de la lista, dibujadas o no
    {
        const d = (this.DataArray ?? []);
        return this._f5Lista.filter(e => e && e.tipo === 'datos').map(e => d[e.indice]).filter(r => r != undefined);
    }

    // ---------- dibujo ----------
    _f5PrintRows()
    {
        const tbody = this._table.querySelector('tbody');
        if (!this._f5Activo) { this._f5Activo = true; this._f5Entrar(); }
        if (this._f1MO) { this._f1MO.disconnect(); this._f1MO = null; this._f1TBody = null; }   // como _printRows
        this._f6AlRedibujarV?.();   // F5+F6: el mapa propio de F6 no se usa en virtual
        tbody.innerHTML = '';
        this._f5Trs = new Map();
        this._f5PosTr = new WeakMap();
        this._f5Idx = new WeakMap();
        this._f5Armar();
        // Primero un solo relleno con el alto total, para saber qué contenedor desplaza; después, las filas visibles.
        if (this._f5Lista.length) tbody.appendChild(this._f5Relleno(this._f5Lista.length));
        this._f5ElegirContenedor();
        this._f5Pintar();
        this._f4TrasDibujar();
        this._f3TrasDibujar?.();   // puede cambiar qué contenedor desplaza (et-fixed-cont)
        this._f5ElegirContenedor();
        this._f5Pintar();
        this._f2Programar();
    }
    _f5Entrar()
    {
        if (!this._f5Estilo)
        {
            const st = document.createElement('style');
            st.setAttribute('data-et', 'f5');
            st.textContent = `
                table.et-virtual > tbody > tr.et-spacer, table.et-virtual > tbody > tr.et-spacer:hover { background: transparent !important; }
                table.et-vfija > tbody > tr:not(.et-spacer) > td { height: var(--et-vtd) !important; max-height: var(--et-vtd); padding-top: 0 !important; padding-bottom: 0 !important; box-sizing: border-box; overflow: hidden; }
                table.et-vfija > tbody > tr:not(.et-spacer) > td .cell-content { height: var(--et-vtd) !important; min-height: 0 !important; max-height: var(--et-vtd) !important; display: flex !important; }
                @media print { table.et-virtual > tbody > tr.et-spacer { display: none; } }`;
            this._shadow.appendChild(st);
            this._f5Estilo = st;
            this._f8bReescribirTodo?.();   // F8b: variables del tema en la hoja nueva
        }
        this._table.classList.add('et-virtual');
        const h = /^\s*([\d.]+)px\s*$/i.exec(String(this.rowHeight ?? ''));
        if (h) { this._table.classList.add('et-vfija'); this._table.style.setProperty('--et-vtd', Math.max(1, Number(h[1]) - this._f5Espacio()) + 'px'); this._f5Paso = Number(h[1]); }
        if (!this._f5Globales)
        {
            this._f5Globales = true;
            const fn = () => { if (this._f5Activo && !this._f5Todo) this._f5Pintar(); };
            this._f1Global(window, 'scroll', fn);
            this._f1Global(window, 'resize', fn);
            // El scroll de un elemento no burbujea: en captura se ve el de cualquier contenedor de la página y el
            // del div interno (dentro del shadow), aunque cambie cuál desplaza (por ejemplo, con columnas fijas).
            this._f5FnDoc = fn;
            if (this._f1Conectada) document.addEventListener('scroll', fn, { capture: true, passive: true });
            this._shadow.addEventListener('scroll', fn, { capture: true, passive: true });
        }
    }
    _f5Salir()
    {
        this._f5Activo = false;
        this._f5Todo = false;
        this._f5Escuchar(null);
        this._table?.classList.remove('et-virtual', 'et-vfija');
        this._table?.style.removeProperty('--et-vtd');
        this._f5Trs = new Map();
        this._f5Lista = [];
    }
    _f5Espacio()
    {
        const cs = getComputedStyle(this._table);
        if (cs.borderCollapse == 'collapse') return 0;
        const v = String(cs.borderSpacing ?? '').trim().split(/\s+/);
        return (parseFloat(v[1] ?? v[0]) || 0);
    }
    _f5Margen() { const v = Number(this.VirtualOverscan); return (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 10); }
    _f5PasoActual() { return (this._f5Paso > 0 ? this._f5Paso : 30); }
    // Área visible (coordenadas de la ventana): la ventana recortada por cada ancestro con overflow (cruzando el
    // shadow DOM). No depende de cuál de ellos es el que desplaza: el div interno, el de la página (V12) o la ventana.
    // Si la tabla queda fuera de la ventana, se usa el área del contenedor más cercano.
    _f5Vista()
    {
        let top = 0, bottom = window.innerHeight, propio = null;
        let el = this._table;
        while ((el = this._composedParent(el)))
        {
            if (el === document.body || el === document.documentElement) break;
            if (getComputedStyle(el).overflowY == 'visible') continue;
            const r = el.getBoundingClientRect(), ct = r.top + el.clientTop, cb = ct + el.clientHeight;
            if (!propio) propio = { top: ct, bottom: cb };
            top = Math.max(top, ct);
            bottom = Math.min(bottom, cb);
        }
        if (bottom <= top && propio) { top = propio.top; bottom = propio.bottom; }
        return { top, bottom: Math.max(bottom, top + 1) };
    }
    _f5Calcular()
    {
        const n = this._f5Lista.length;
        if (!n) return [0, 0];
        const paso = this._f5PasoActual(), m = this._f5Margen(), v = this._f5Vista();
        const tb = this._table.tBodies[0].getBoundingClientRect().top;
        let a = Math.floor((v.top - tb) / paso) - m, b = Math.ceil((v.bottom - tb) / paso) + m;
        a = Math.min(Math.max(a, 0), n - 1);
        b = Math.min(Math.max(b, 0), n);
        if (b <= a) b = Math.min(n, a + 1 + 2 * m);
        return [a, b];
    }
    _f5FilaActual()
    {
        const el = this._shadow?.getElementById(this.EdiTable.Const.InputId) ?? this._shadow?.getElementById(this.EdiTable.Const.SelectorId);
        const tr = el?.closest('tr') ?? this._shadow?.activeElement?.closest?.('tr.et-group-row');   // F5+F6: o la fila de grupo con el foco
        return (tr ? (this._f5PosTr.get(tr) ?? -1) : -1);
    }
    _f5Relleno(filas)
    {
        const tr = document.createElement('tr');
        tr.className = 'et-spacer';
        tr.setAttribute('aria-hidden', 'true');
        tr._f5Filas = filas;
        tr.style.height = Math.max(0, filas * this._f5PasoActual() - this._f5Espacio()) + 'px';
        return tr;
    }
    // Dibuja la ventana [a, b) (por omisión, la que se ve), más la fila actual y `extra`, con rellenos en los huecos.
    _f5Pintar(rango = null, extra = -1)
    {
        if (!this._f5Activo || this._f5Pintando) return;
        this._f5Pintando = true;
        try
        {
            const tbody = this._table.tBodies[0];
            const n = this._f5Lista.length;
            let [a, b] = (this._f5Todo ? [0, n] : (rango ?? this._f5Calcular()));
            const fija = this._f5FilaActual();
            const clave = a + ',' + b + ',' + fija + ',' + extra + ',' + n;
            if (!this._f5Sucio && clave === this._f5Clave) return;
            this._f5Sucio = false;
            this._f5Clave = clave;
            const dentro = (k) => (k >= a && k < b) || k === fija || k === extra;
            const orden = [];
            if (fija >= 0 && fija < a) orden.push(fija);
            if (extra >= 0 && extra < a && extra !== fija) orden.push(extra);
            orden.sort((x, y) => x - y);
            for (let k = a; k < b; k++) orden.push(k);
            [fija, extra].filter((k, j, l) => k >= b && k < n && l.indexOf(k) === j).sort((x, y) => x - y).forEach(k => orden.push(k));

            for (const [k, tr] of Array.from(this._f5Trs)) if (!dentro(k) || k >= n) { tr.remove(); this._f5Trs.delete(k); }
            Array.from(tbody.querySelectorAll(':scope > tr.et-spacer')).forEach(s => s.remove());

            // Filas nuevas: se insertan después de la anterior de la secuencia, sin mover las que ya están
            // (moverlas le quitaría el foco al selector o al editor). Las consecutivas van en un fragmento.
            const nuevas = [];
            let prev = null, frag = null;
            const vaciar = (antesDe) => { if (frag) { tbody.insertBefore(frag, antesDe); frag = null; } };
            for (const k of orden)
            {
                let tr = this._f5Trs.get(k);
                if (tr) { vaciar(tr); prev = tr; continue; }
                tr = this._f5Crear(k);
                this._f5Trs.set(k, tr);
                nuevas.push(tr);
                if (!frag) { frag = document.createDocumentFragment(); }
                frag.appendChild(tr);
                if (frag.childNodes.length === 1) frag._f5Ref = (prev ? prev.nextSibling : tbody.firstChild);
            }
            if (frag) vaciar(frag._f5Ref ?? null);
            // Rellenos en los huecos.
            let ultimo = -1;
            for (const k of orden)
            {
                if (k > ultimo + 1) tbody.insertBefore(this._f5Relleno(k - ultimo - 1), this._f5Trs.get(k));
                ultimo = k;
            }
            if (n - 1 > ultimo) tbody.appendChild(this._f5Relleno(n - 1 - ultimo));

            nuevas.forEach(tr => this._f5TrasCrear(tr));
            if (nuevas.length)
            {
                this._f3TrasDibujar?.();   // F3: clases y left de las columnas fijas
                if (this.CanMoveRow) this._setMoveEvent();
            }
            this._f5Medir(a, b);
        }
        finally { this._f5Pintando = false; }
    }
    // Paso real de las filas (offsetTop entre la primera y la última de la ventana). Si cambió, ajusta los rellenos.
    _f5Medir(a, b)
    {
        if (b - a < 2) return;
        const t1 = this._f5Trs.get(a), t2 = this._f5Trs.get(b - 1);
        if (!t1 || !t2 || !t1.isConnected || !t2.isConnected) return;
        const paso = (t2.offsetTop - t1.offsetTop) / (b - 1 - a);
        if (!(paso > 0) || Math.abs(paso - this._f5Paso) < 0.25) return;
        this._f5Paso = paso;
        Array.from(this._table.tBodies[0].querySelectorAll(':scope > tr.et-spacer')).forEach(s =>
            s.style.height = Math.max(0, s._f5Filas * paso - this._f5Espacio()) + 'px');
    }
    _f5Crear(p)
    {
        const e = this._f5Lista[p];
        if (!e || e.tipo !== 'datos')
        {
            const tr = (typeof this._f5DibujarEntrada == 'function' ? this._f5DibujarEntrada(e, p) : null) ?? document.createElement('tr');
            this._f5PosTr.set(tr, p);
            return tr;
        }
        const k = e.indice, data = (this.DataArray[k] ?? {}), o = this._getTreeOptions();
        const tr = this._createFullElement('tr', { id: (data[o.key]??''), parent: (data[o.parentkey]??''), indent: (data['__level__']??0) });
        this._f5Idx.set(tr, k);   // antes de pintar: onTdPaint y onRowPaint reciben el índice de DataArray
        this._f5PosTr.set(tr, p);
        this.Columns.forEach((column, i) => this._f1PintarCelda(tr, column, i, data, k, false, true));
        this._decorateRow(tr, k, data);
        return tr;
    }
    // Lo que _printRows hace después de dibujar, solo para la fila nueva (ya en el DOM).
    _f5TrasCrear(tr)
    {
        if (!this._f5Idx.has(tr)) return;
        Array.from(tr.cells).forEach(td => {
            td.onclick = e => {
                if (!this.ClickPropagation) e.stopPropagation();   // como Initialize (F1, P37)
                else if (e._f1EdiTableProcesado) return;
                this.CellFocus(td);
            };
        });
        if (this._f4ThSel) this._f4FilaNueva(tr);   // F4: celda del sistema y su casilla
    }

    // ---------- desplazamiento ----------
    _f5ElegirContenedor()
    {
        let c = null;
        const sc = this.ScrollContainer;
        if (sc && typeof sc == 'object' && sc.nodeType === 1) c = sc;
        else if (typeof sc == 'string' && sc.trim())
        {
            try { c = (this.getRootNode()?.querySelector?.(sc) ?? document.querySelector(sc)); } catch (e) { c = null; }
        }
        if (!c)
        {
            // El ancestro más cercano con overflow-y auto o scroll que de verdad desplaza (cruza el shadow DOM).
            let el = this._table;
            while ((el = this._composedParent(el)))
            {
                if (el === document.body || el === document.documentElement) break;
                const oy = getComputedStyle(el).overflowY;
                if ((oy == 'auto' || oy == 'scroll' || oy == 'overlay') && el.scrollHeight > el.clientHeight + 1) { c = el; break; }
            }
        }
        this._f5Escuchar(c ?? window);
    }
    _f5Escuchar(c)
    {
        if (c === this._f5Cont && (!c || this._f5FnScroll)) return;
        if (this._f5Cont && this._f5Cont !== window && this._f5FnScroll) this._f5Cont.removeEventListener('scroll', this._f5FnScroll);
        if (this._f5RO) { this._f5RO.disconnect(); this._f5RO = null; }
        this._f5Cont = c;
        if (!c) { this._f5FnScroll = null; return; }
        this._f5FnScroll = () => { if (this._f5Activo && !this._f5Todo) this._f5Pintar(); };
        if (c !== window)
        {
            c.addEventListener('scroll', this._f5FnScroll, { passive: true });
            if (typeof ResizeObserver != 'undefined') { this._f5RO = new ResizeObserver(this._f5FnScroll); this._f5RO.observe(c); }
        }
    }
    // Asegura que la fila en la posición p esté dibujada y a la vista; devuelve su tr.
    _f5IrA(p)
    {
        if (!(p >= 0 && p < this._f5Lista.length)) return undefined;
        this._f5ElegirContenedor();
        if (!this._f5Trs.has(p))
        {
            const vis = Math.ceil((this._f5Vista().bottom - this._f5Vista().top) / this._f5PasoActual()), m = this._f5Margen();
            this._f5Pintar([Math.max(0, p - m), Math.min(this._f5Lista.length, p + vis + m)], p);
        }
        const tr = this._f5Trs.get(p);
        if (tr && !this._f5Todo) { this._f5Mostrar(tr); this._f5Pintar(null, p); }
        return this._f5Trs.get(p);
    }
    // Desplaza solo en vertical el contenedor (o la ventana) lo mínimo para que tr quede a la vista, bajo el thead fijo.
    _f5Mostrar(tr)
    {
        const c = this._f5Cont ?? window;
        let { top, bottom } = (c === window ? { top: 0, bottom: window.innerHeight } : (() => { const r = c.getBoundingClientRect(); return { top: r.top + c.clientTop, bottom: r.top + c.clientTop + c.clientHeight }; })());
        const thead = this._table.tHead;
        if (thead && getComputedStyle(thead).position == 'sticky')
        {
            const h = thead.getBoundingClientRect();
            if (h.bottom > top && h.top < top + 2) top = h.bottom;
        }
        const r = tr.getBoundingClientRect();
        let d = 0;
        if (r.top < top) d = r.top - top;
        else if (r.bottom > bottom) d = Math.min(r.bottom - bottom, r.top - top);
        if (Math.abs(d) < 1) return;
        if (c === window) window.scrollBy(0, d); else c.scrollTop += d;
    }

    // ---------- operaciones en modo virtual ----------
    _f5Asegurar(row)   // GetTrByIndex
    {
        if (this._f5Sincronizar()) { }
        const rows = this.DataArray.length, cols = this.ColumnsCount();
        if (rows < 1 || cols < 1 || !(row <= rows - 1) || row < 0) return undefined;
        let p = this._f5Pos[row];
        if (p < 0 && this._f6Grupos?.length) p = (this._f6MostrarFilaV?.(row) ?? -1);   // F5+F6: expande los grupos que la contienen
        return (p >= 0 ? this._f5IrA(p) : undefined);
    }
    _f5Nav(active_cell, d)
    {
        const p = this._f5PosTr.get(active_cell?.parentElement);
        if (p === undefined) return;
        const q = p + d;
        if (q < 0) return;
        if (q >= this._f5Lista.length) { if (d > 0 && this.AutoAddRow) this.AddRow(); return; }
        const tr = this._f5IrA(q);
        const td = tr?.querySelectorAll(this.EdiTable.Const.HTML.TD)[active_cell.cellIndex];
        if (td) this.CellFocus(td);
    }
    _f5UpdateData()
    {
        this._f5Sincronizar();
        Array.from(this._f5Trs.values()).map(tr => this._f5Idx.get(tr)).filter(i => i !== undefined)
            .sort((x, y) => x - y).forEach(i => this.UpdateDataRow(i));
    }
    _f5QuitarFila(row)
    {
        const tr = this._f5TrDibujado(row);
        if (!tr) return;
        this._f5Trs.delete(this._f5PosTr.get(tr));
        tr.remove();
        this._f5Sucio = true;
    }
    _f5TrasBorrar(row)
    {
        this._f5Rearmar(i => (i === row ? -1 : (i > row ? i - 1 : i)));
        this._f5Pintar();
    }
    // InsertRow en modo virtual: la fila se crea en el modelo (sin índice, al final), se dibuja y se desplaza a ella.
    _f5Insertar(rw, nofocus = false)
    {
        this._f5Sincronizar();
        const nuevo = {};
        if (rw != undefined) this.DataArray.splice(rw, 0, nuevo); else this.DataArray.push(nuevo);
        const i = this.DataArray.indexOf(nuevo);
        this._f6InsertadaV?.(nuevo, (rw != undefined ? this.DataArray[i + 1] : null));   // F5+F6: pendiente hasta que se confirma (§11)
        this._f5Rearmar(j => (j >= i ? j + 1 : j));
        if (this.ColumnsCount() < 1) { this._f5Pintar(); return; }
        this.Columns.forEach(c => { if (c != undefined && c.default != undefined) this.UpdateDataMember(i, c.field, c.default, true); });
        const tr = this._f5IrA(this._f5Pos[i]);
        if (!tr) return;
        this._f3TrasDibujar?.();
        if (!nofocus) this.CellFocus(tr.querySelector('td:not(.hidde-col):not(.et-sel-col)'));
        this._f2Programar();
        const eventArgs = { sender: this._getCurren(), tr: tr, rowIndex: i };
        if (this._getCurren().Events[this.EdiTable.Const.Events.RowAdded] != undefined)
            this._getCurren().Events[this.EdiTable.Const.Events.RowAdded](eventArgs);
    }

    // ---------- siempre activo ----------
    // el.innerHTML = value, sin pasar por el intérprete de HTML cuando el texto no tiene marcas ni entidades
    // (sin <, &, \r ni \0 el resultado es el mismo nodo de texto).
    _f5Html(el, value)
    {
        const v = (value === null ? '' : String(value));
        if (/[<&\r\0]/.test(v)) el.innerHTML = v; else el.textContent = v;
    }
    // NavUp/NavDown: la fila visible vecina por hermanos. null si no se puede decidir así (tr anidados en
    // plantillas, la fila actual oculta o no hay vecina): entonces se usa el camino de antes.
    _f5Vecina(tr, d)
    {
        if (!tr || tr.classList.contains('hidde-row')) return null;
        const tb = tr.parentElement;
        if (!tb || tb.getElementsByTagName('tr').length !== tb.rows.length) return null;
        let x = tr;
        do { x = (d > 0 ? x.nextElementSibling : x.previousElementSibling); } while (x && (x.tagName !== 'TR' || x.classList.contains('hidde-row')));
        return x ?? null;
    }
    // Jerarquía por llave y llave del padre, con el mismo resultado que TreeArray sobre una copia, en O(n).
    // null si no se puede garantizar (llaves repetidas, de tipos mezclados o vacías, ciclos, hijos ya anidados,
    // objetos que no son simples); en ese caso se usa el camino de antes.
    _f5Jerarquia(arr, o, simples)
    {
        if (!Array.isArray(arr) || !arr.length) return null;
        const porLlave = new Map();
        let tipo = null;
        for (let n = 0; n < arr.length; n++)
        {
            const x = arr[n];
            if (!x || typeof x != 'object' || Array.isArray(x)) return null;
            const pr = Object.getPrototypeOf(x);
            if (pr !== Object.prototype && pr !== null) return null;
            const ch = x[o.childs];
            if (ch !== undefined && !(Array.isArray(ch) && ch.length === 0)) return null;
            const k = x[o.key], tk = typeof k;
            if (!(tk == 'string' || (tk == 'number' && isFinite(k)))) return null;
            if (tipo === null) tipo = tk; else if (tipo !== tk) return null;
            if (porLlave.has(k)) return null;
            porLlave.set(k, x);
            if (simples && !this._f5Simple(x)) return null;
        }
        const padre = new Map();
        for (const x of arr)
        {
            const p = x[o.parentkey];
            if (p == undefined) continue;
            if (typeof p !== tipo || (tipo == 'number' && !isFinite(p))) return null;
            const P = porLlave.get(p);
            if (P === x) return null;
            if (P) padre.set(x, P);
        }
        const estado = new Map();
        for (const x of arr)
        {
            let y = x;
            const camino = [];
            while (y && !estado.has(y)) { estado.set(y, 1); camino.push(y); y = padre.get(y); }
            if (y && estado.get(y) === 1) return null;   // ciclo
            camino.forEach(z => estado.set(z, 2));
        }
        const hijos = new Map(), raices = [];
        for (const x of arr)
        {
            const P = padre.get(x);
            if (P) { let l = hijos.get(P); if (!l) hijos.set(P, (l = [])); l.push(x); }
            else raices.push(x);
        }
        return { raices, hijos };
    }
    // Valores que la copia JSON dejaría iguales (para dibujar el objeto de DataArray en lugar de la copia).
    _f5Simple(x)
    {
        for (const k of Object.keys(x))
        {
            const v = x[k], t = typeof v;
            if (v == null || t == 'string' || t == 'boolean') continue;
            if (t == 'number') { if (isFinite(v)) continue; return false; }
            if (t == 'object')
            {
                const pr = Object.getPrototypeOf(v);
                if ((Array.isArray(v) || pr === Object.prototype || pr === null) && typeof v.toJSON != 'function') continue;
            }
            return false;
        }
        return true;
    }
    // TreeArray sin copia JSON: mismo árbol (mismos objetos, hijos en el orden de DataArray). false si no aplica.
    _f5TreeArrayRapido(arr, o)
    {
        const j = this._f5Jerarquia(arr, o, false);
        if (!j) return false;
        j.hijos.forEach((l, P) => { const a = (P[o.childs] ?? []); for (const x of l) a.push(x); P[o.childs] = a; });
        arr.length = 0;
        for (const x of j.raices) arr.push(x);
        return true;
    }
    // _printRows en árbol: filas en orden de árbol con su nivel, sin modificar DataArray. Cada fila es una copia
    // superficial con los mismos valores que daba la copia JSON (sin las llaves undefined) más __level__ y
    // __havechilds__: onRowPaint, las plantillas y tr._etData siguen recibiendo una copia (R1, banco
    // arbol/ontdpaint-en-arbol), pero sin copia profunda.
    _f5OrdenArbol(arr)
    {
        const o = this._getTreeOptions();
        const j = this._f5Jerarquia(arr, o, true);
        if (!j) return null;
        const filas = [], nivel = [], hijos = [];
        const pila = [];
        for (let i = j.raices.length - 1; i >= 0; i--) pila.push([j.raices[i], 0]);
        while (pila.length)
        {
            const [x, nv] = pila.pop();
            const h = j.hijos.get(x);
            const c = {};
            for (const k of Object.keys(x)) if (x[k] !== undefined) Object.defineProperty(c, k, { value: x[k], writable: true, enumerable: true, configurable: true });
            c['__level__'] = nv;
            c['__havechilds__'] = !!(h && h.length);
            filas.push(c); nivel.push(nv); hijos.push(!!(h && h.length));
            if (h) for (let i = h.length - 1; i >= 0; i--) pila.push([h[i], nv + 1]);
        }
        return { filas, nivel, hijos };
    }
    // ===== F5: fin

    // ===== F3: columnas fijas (§6), mostrar y ocultar (§7), reordenar (§8) y diseño (§9) =====
    //
    // Sin fixed, column-chooser ni column-reorder no se agrega nada al DOM ni al CSS (R1). Lo único
    // activo por omisión es el guardado automático de anchos en IndexedDB (§9.2, D3), con sus salvaguardas.
    // Los eventos nuevos solo se llaman si el consumidor registró un manejador para ellos.

    static { EditTable.features.push('fixed', 'chooser', 'reorder', 'layout'); }

    DesignAutoSave = true;          // §9.2: design-auto-save
    DesignKey = null;               // §9.2: design-key (reemplaza pathname + '#' + id)
    DesignAutoSaveSort = false;     // §9.2: design-auto-save-sort (orden de filas y agrupación)

    _f3Chooser = false;
    _f3Reorder = false;
    _f3Declarado = null;            // [{col, field, fixed, width}] en el orden de edit-thead
    _f3Huella = '';
    _f3Orden = null;                // {field, dir} del último orden por clic o por diseño
    _f3Usuario = false;             // true mientras corre una acción del usuario (se autoguarda)
    _f3Silencio = false;            // true mientras se aplica un diseño (sin LayoutChanged)
    _f3Timer = 0;
    _f3RO = null;
    _f3ROClave = '';
    _f3TeniaFijas = false;
    _f3EstiloEl = null;
    _f3Menu = null;
    _f3MenuCampo = null;
    _f3Boton = null;
    _f3Indicador = null;
    _f3Arrastre = null;
    _f3Globales = false;

    get ColumnChooser() { return this._f3Chooser; }
    set ColumnChooser(v) { this._f3Chooser = this._f3Bool(v); if (this._f1Inicializada) this._f3AplicarChooser(); }
    get ColumnReorder() { return this._f3Reorder; }
    set ColumnReorder(v) { this._f3Reorder = this._f3Bool(v); if (this._f1Inicializada) this._f3AplicarReorder(); }

    _f3Bool(v)
    {
        if (v === true) return true;
        if (v === false || v == null) return false;
        return !this._f1EsFalso(v);
    }
    _f3Sys() { return (this._etSysCols?.() ?? 0); }
    _f3FilaEnc()
    {
        const th = this._table?.tHead;
        if (!th) return null;
        return th.rows[this.TheadRowIndex] ?? th.rows[0] ?? null;
    }
    _f3Indice(field) { return (field == undefined ? -1 : this.Columns.findIndex(c => c && c.field === field)); }
    _f3EsFija(field) { return !!this._f1EstadoColumnas.get(field)?.fija; }
    _f3Visible(c) { return !!c && (c.field == undefined || !this._f1ColumnaOculta(c.field)); }
    _f3ThDe(field)
    {
        const i = this._f3Indice(field);
        return (i < 0 ? null : (this._f3FilaEnc()?.cells[this._f3Sys() + i] ?? null));
    }
    _f3NumFijas() { return this.Columns.filter(c => c && c.field != undefined && this._f3EsFija(c.field)).length; }

    _f3Disparar(nombre, args)
    {
        const k = this.EdiTable.Const.Events[nombre];
        if (!k) return null;
        let ev = this._getCurren().Events;
        if (!ev || !Object.prototype.hasOwnProperty.call(ev, k)) ev = this.Events;
        if (!ev || !Object.prototype.hasOwnProperty.call(ev, k)) return null;
        const fn = ev[k];
        if (typeof fn !== 'function') return null;
        const a = (typeof args === 'function') ? args() : args;
        a.sender = this._getCurren();
        try { fn(a); } catch (e) { console.error('EditTable: error en el manejador de ' + nombre, e); }
        return a;
    }
    _f3ComoUsuario(fn)
    {
        const antes = this._f3Usuario;
        this._f3Usuario = true;
        try { return fn(); } finally { this._f3Usuario = antes; }
    }
    _f3Cambio(reason)
    {
        if (this._f3Silencio) return;
        this._f3Disparar('LayoutChanged', () => ({ layout: this.getLayout(), reason }));
        if (this._f3Usuario) this._f3ProgramarGuardado(reason);
    }

    // ---------- ciclo de vida (enganches) ----------
    _f3Inicializar()
    {
        try
        {
            const a = (n) => this.getAttribute(n);
            if (this.hasAttribute('column-chooser')) this._f3Chooser = this._f3Bool(a('column-chooser'));
            if (this.hasAttribute('column-reorder')) this._f3Reorder = this._f3Bool(a('column-reorder'));
            if (this.hasAttribute('design-auto-save')) this.DesignAutoSave = this._f3Bool(a('design-auto-save'));
            if (this.hasAttribute('design-key')) this.DesignKey = ((a('design-key') ?? '').trim() || null);
            if (this.hasAttribute('design-auto-save-sort')) this.DesignAutoSaveSort = this._f3Bool(a('design-auto-save-sort'));

            this._f3Declarado = this.Columns.map(c => ({
                col: c, field: c?.field,
                fixed: (c?.field != undefined && ['left', 'true'].includes(String(c?.fixed ?? '').trim().toLowerCase())),
                width: (c?.width ?? null)
            }));
            this._f3Huella = EditTable._f3Sha256(this._f3Declarado.map(d => String(d.field ?? '')).join('\u001f'));
            this._f3Declarado.forEach(d => { if (d.fixed) this._f1EstadoColumna(d.field).fija = true; });
            if (this._f3Declarado.some(d => d.fixed))
            {
                this._f3Permutar(this._f3Normalizar(this.Columns.slice()));
                this._f3Posiciones();
            }
            if (this._f3Chooser) this._f3AplicarChooser();
            if (this._f3Reorder) this._f3AplicarReorder();
            // Después de los DOMContentLoaded de los consumidores (pueden poner DesignKey o DataArray).
            // La base se abre desde ya para que la restauración llegue lo antes posible.
            if (this.DesignAutoSave && this._f3Llave()) EditTable._f3AbrirBd();
            setTimeout(() => this._f8Restaurar(), 0);   // F8a: _f3Restaurar + LayoutChanged 'restore' y LayoutReady
        }
        catch (e) { console.error('EditTable F3: error al inicializar', e); }
    }
    _f3AtributoCambiado(name, v)
    {
        switch (name)
        {
            case 'column-chooser': this.ColumnChooser = (v !== null && this._f3Bool(v)); break;
            case 'column-reorder': this.ColumnReorder = (v !== null && this._f3Bool(v)); break;
            case 'design-auto-save': this.DesignAutoSave = (v === null ? true : this._f3Bool(v)); break;
            case 'design-key': this.DesignKey = ((v ?? '').trim() || null); break;
            case 'design-auto-save-sort': this.DesignAutoSaveSort = (v !== null && this._f3Bool(v)); break;
        }
    }
    _f3Liberar()
    {
        if (this._f3RO) { this._f3RO.disconnect(); this._f3ROClave = ''; }
        this._f3CerrarMenu(false);
        this._f3FinArrastre();
    }
    _f3Reconectar() { if (this._f3TeniaFijas) this._f3Posiciones(); }
    _f3TrasDibujar() { if (this._f3TeniaFijas) this._f3Posiciones(); }
    _f3TrasOcultar(field, hide)
    {
        if (this._f3TeniaFijas) this._f3Posiciones();
        this._f3ActualizarMenu();
    }
    _f3Redimensionado(th, antes)
    {
        if (Math.abs((th?.offsetWidth ?? 0) - (antes ?? 0)) < 1) return;
        if (this._f3TeniaFijas) this._f3Posiciones();
        this._f3ComoUsuario(() => this._f3Cambio('resize'));
    }
    _f3Ordenado(field, desc)
    {
        if (!field) return;
        this._f3Orden = { field, dir: (desc ? 'DESC' : 'ASC') };
        this._f3ComoUsuario(() => this._f3Cambio('sort'));
    }

    // ---------- reordenar físicamente: Columns, thead, tbody y tfoot juntos (R3) ----------
    _f3Normalizar(orden)
    {
        const fija = (c) => (c && c.field != undefined && this._f3EsFija(c.field));
        return [...orden.filter(fija), ...orden.filter(c => !fija(c))];
    }
    _f3Permutar(orden)
    {
        const cols = this.Columns, n = cols.length;
        if (!Array.isArray(orden) || orden.length !== n) return false;
        const perm = orden.map(c => cols.indexOf(c));
        if (perm.some(p => p < 0) || new Set(perm).size !== n) return false;
        if (perm.every((p, k) => p === k)) return false;

        const t = this._table, sys = this._f3Sys();
        const activo = this._shadow?.activeElement ?? null;
        // F1 (C20) guarda los títulos declarados por índice de datos (el i de Columns que usa _f1PintarCelda;
        // F4 también guarda cellIndex - sys): se reasignan a la nueva posición. (Integración: antes se restaba sys.)
        const titulos = [];
        this._f1TitulosDeclarados.forEach((v, k) => { const c = cols[k]; if (c) titulos.push([c, v]); });

        const filas = [];
        if (t.tHead) filas.push(...t.tHead.rows);
        Array.from(t.tBodies).forEach(tb => filas.push(...tb.rows));
        if (t.tFoot) filas.push(...t.tFoot.rows);   // F2: el pie se mueve con las columnas
        filas.forEach(tr => {
            const celdas = Array.from(tr.cells);
            if (celdas.length !== sys + n) return;   // filas de grupo o de relleno
            const datos = celdas.slice(sys);
            const frag = document.createDocumentFragment();
            perm.forEach(p => frag.appendChild(datos[p]));
            tr.appendChild(frag);
        });

        const nuevas = perm.map(p => cols[p]);
        cols.splice(0, n, ...nuevas);
        this._f1TitulosDeclarados.clear();
        titulos.forEach(([c, v]) => this._f1TitulosDeclarados.set(cols.indexOf(c), v));
        cols.forEach((c, i) => { if (c?.field != undefined) this._f1EstadoColumna(c.field).orden = i; });
        this.hideColumns = this._f1DerivarHideColumns();
        this._cardsInfo = null;
        this._f6TrasColumnas();   // F6: filas de grupo en el orden nuevo
        if (this.ShowAsTree) this._printRows();   // el botón del árbol vive en la primera columna
        if (activo && activo.isConnected && this._shadow.activeElement !== activo)
            try { activo.focus({ preventScroll: true }); } catch (e) { }
        return true;
    }

    // ---------- §6 columnas fijas ----------
    IsColumnFixed(field) { return this._f3Indice(field) >= 0 && this._f3EsFija(field); }
    FixColumn(field, fixed = true)
    {
        fixed = !!fixed;
        const i = this._f3Indice(field);
        if (i < 0 || this._f3EsFija(field) === fixed) return false;
        const col = this.Columns[i];
        const resto = this.Columns.filter(c => c !== col);
        this._f1EstadoColumna(field).fija = fixed;
        resto.splice(this._f3NumFijas() - (fixed ? 1 : 0), 0, col);   // al final del grupo de las fijas
        this._f3Permutar(this._f3Normalizar(resto));
        this._f3Posiciones();
        this._f3ActualizarMenu();
        this._f3Disparar('ColumnFixedChanged', { field, fixed });
        this._f3Cambio('fixed');
        return true;
    }
    _f3Posiciones()
    {
        const t = this._table;
        if (!t) return;
        const n = this.Columns.length, sys = this._f3Sys();
        const fijas = [];
        this.Columns.forEach((c, i) => { if (c?.field != undefined && this._f3EsFija(c.field)) fijas.push(i); });
        if (!fijas.length && !this._f3TeniaFijas) return;
        this._f3Estilo();
        this._f3TeniaFijas = fijas.length > 0;
        t.classList.toggle('et-has-fixed', fijas.length > 0);

        const enc = this._f3FilaEnc();
        const visible = (cell) => cell && !cell.classList.contains('hidde-col');
        const left = new Map();
        let acc = 0, ultima = -1;
        const obs = [];
        if (fijas.length)
        {
            for (let s = 0; s < sys; s++) { const c = enc?.cells[s]; left.set(s, acc); if (visible(c)) { acc += c.getBoundingClientRect().width; obs.push(c); } }
            fijas.forEach(i => { const c = enc?.cells[sys + i]; left.set(sys + i, acc); if (visible(c)) { acc += c.getBoundingClientRect().width; ultima = sys + i; obs.push(c); } });
        }
        const filas = [];
        if (t.tHead) filas.push(...t.tHead.rows);
        Array.from(t.tBodies).forEach(tb => filas.push(...tb.rows));
        if (t.tFoot) filas.push(...t.tFoot.rows);
        filas.forEach(tr => {
            const cells = tr.cells;
            if (cells.length !== sys + n) return;
            for (let k = 0; k < cells.length; k++)
            {
                const cell = cells[k], l = left.get(k);
                if (l !== undefined)
                {
                    if (!cell.classList.contains('et-fixed')) cell.classList.add('et-fixed');
                    const px = l + 'px';
                    if (cell.style.left !== px) cell.style.left = px;
                    if (cell.classList.contains('et-fixed-last') !== (k === ultima)) cell.classList.toggle('et-fixed-last', k === ultima);
                }
                else if (cell.classList.contains('et-fixed'))
                {
                    cell.classList.remove('et-fixed', 'et-fixed-last');
                    cell.style.left = '';
                }
            }
        });

        // sticky se pega al ancestro con scroll más cercano: si el contenedor interno no desplaza nada,
        // deja de ser contenedor de scroll para que lo sea el de la página (sin crear contenedores nuevos).
        const cont = t.parentElement;
        if (cont)
        {
            if (fijas.length)
            {
                const libre = (cont.scrollWidth <= cont.clientWidth + 1 && cont.scrollHeight <= cont.clientHeight + 1);
                if (cont.classList.contains('et-fixed-cont') !== libre) cont.classList.toggle('et-fixed-cont', libre);
            }
            else if (cont.classList.contains('et-fixed-cont')) cont.classList.remove('et-fixed-cont');
        }

        // Los anchos de las fijas pueden cambiar sin que nadie llame (contenido, ventana): ResizeObserver.
        if (typeof ResizeObserver !== 'undefined')
        {
            if (!this._f3RO) this._f3RO = new ResizeObserver(() => { if (this._f3TeniaFijas) this._f3Posiciones(); });
            const clave = obs.map(c => c.cellIndex).join(',') + '|' + obs.length;
            if (clave !== this._f3ROClave || !this._f3ROVivos?.every(c => c.isConnected))
            {
                this._f3RO.disconnect();
                obs.forEach(c => this._f3RO.observe(c));
                this._f3ROClave = clave;
                this._f3ROVivos = obs;
            }
        }
    }

    // ---------- §7 mostrar y ocultar ----------
    IsColumnVisible(field) { return this._f3Indice(field) >= 0 && !this._f1ColumnaOculta(field); }
    getVisibleColumns() { return this.Columns.filter(c => this._f3Visible(c)); }
    HideColumn(field) { return this._f3Visibilidad(field, false); }
    ShowColumn(field) { return this._f3Visibilidad(field, true); }
    _f3Visibilidad(field, visible)
    {
        if (this._f3Indice(field) < 0 || this.IsColumnVisible(field) === visible) return false;
        if (!visible && this.getVisibleColumns().length <= 1) return false;   // siempre queda una visible
        this.hideColumn(field, !visible);
        if (!visible) this._f3SacarFoco();
        this._f3Disparar('ColumnVisibilityChanged', { field, visible });
        this._f3Cambio('visibility');
        return true;
    }
    // Si la celda actual quedó oculta, el foco pasa a la visible más cercana de la misma fila.
    _f3SacarFoco()
    {
        const td = this.CurrentTd();
        if (!td || !td.classList.contains('hidde-col')) return;
        const celdas = Array.from(td.parentElement?.cells ?? []).slice(this._f3Sys());
        const i = celdas.indexOf(td);
        const vis = (c) => !c.classList.contains('hidde-col');
        const dest = celdas.slice(i + 1).find(vis) ?? celdas.slice(0, Math.max(0, i)).reverse().find(vis);
        if (dest) this.CellFocus(dest);
    }

    _f3AplicarChooser()
    {
        const cont = this._table?.parentElement;
        if (!cont) return;
        if (this._f3Chooser)
        {
            this._f3Estilo();
            cont.classList.add('et-chooser-host');
            if (!this._f3Boton)
            {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'et-chooser-btn';
                b.title = 'Columnas';
                b.setAttribute('aria-label', 'Columnas');
                b.setAttribute('aria-haspopup', 'menu');
                b.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2h4v12H1zm5 0h4v12H6zm5 0h4v12h-4z"/></svg>';
                b.addEventListener('click', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    if (this._f3MenuAbierto()) { this._f3CerrarMenu(true); return; }
                    const r = b.getBoundingClientRect();
                    this._f3AbrirMenu(r.right, r.bottom + 2, null, true);
                });
                this._f3Boton = b;
            }
            if (!this._f3Boton.isConnected) cont.appendChild(this._f3Boton);
            this._f3EventosUI();
        }
        else
        {
            this._f3CerrarMenu(false);
            this._f3Boton?.remove();
            this._f3Menu?.remove();
            this._f3Menu = null;
            cont.classList.remove('et-chooser-host');
        }
    }
    _f3MenuAbierto() { return !!this._f3Menu && this._f3Menu.classList.contains('et-open'); }
    _f3AbrirMenu(x, y, field, alinearDerecha = false)
    {
        const cont = this._table?.parentElement;
        if (!cont) return;
        let m = this._f3Menu;
        if (!m)
        {
            m = document.createElement('div');
            m.className = 'et-chooser';
            m.setAttribute('role', 'menu');
            m.tabIndex = -1;
            m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this._f3CerrarMenu(true); } });
            this._f3Menu = m;
        }
        if (!m.isConnected) cont.appendChild(m);
        if (field == undefined)
        {
            const td = this.CurrentTd();
            field = (td ? this.Columns[td.cellIndex - this._f3Sys()]?.field : undefined);
        }
        this._f3MenuCampo = (this._f3Indice(field) >= 0 ? field : null);
        this._f3LlenarMenu();
        m.classList.add('et-open');
        m.style.left = '0px'; m.style.top = '0px';
        const r = m.getBoundingClientRect();
        let left = (alinearDerecha ? x - r.width : x), top = y;
        left = Math.max(4, Math.min(left, window.innerWidth - r.width - 4));
        if (top + r.height > window.innerHeight - 4) top = Math.max(4, window.innerHeight - r.height - 4);
        m.style.left = Math.round(left) + 'px';
        m.style.top = Math.round(top) + 'px';
        try { m.focus({ preventScroll: true }); } catch (e) { }
    }
    _f3CerrarMenu(devolverFoco)
    {
        if (!this._f3MenuAbierto()) return;
        this._f3Menu.classList.remove('et-open');
        if (devolverFoco)
        {
            const sel = this.EdiTable.GetSelector();
            try { (sel ?? this._f3Boton)?.focus({ preventScroll: true }); } catch (e) { }
        }
    }
    _f3LlenarMenu()
    {
        const m = this._f3Menu;
        if (!m) return;
        m.textContent = '';
        const f = this._f3MenuCampo;
        const col = (f != null ? this.Columns[this._f3Indice(f)] : null);
        const tit = (col ? String(col.title ?? f) : '');
        const opcion = (texto, accion, apagada) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('role', 'menuitem');
            b.textContent = texto;
            b.disabled = !!apagada;
            b.addEventListener('click', (e) => { e.preventDefault(); this._f3CerrarMenu(true); this._f3ComoUsuario(accion); });
            m.appendChild(b);
        };
        const fija = (col ? this._f3EsFija(f) : false);
        opcion(col ? (fija ? `Soltar «${tit}» (dejar de fijar)` : `Fijar «${tit}» a la izquierda`) : 'Fijar o soltar columna', () => this.FixColumn(f, !fija), !col);
        opcion(col ? `Ajustar ancho de «${tit}»` : 'Ajustar ancho', () => this._f3AjustarAncho(f), !col);
        opcion('Restablecer diseño', () => this.ResetLayout(), false);
        m.appendChild(document.createElement('hr'));
        this.Columns.forEach(c => {
            if (!c || c.field == undefined || this._f1EsFalso(c.chooser ?? '')) return;
            const lab = document.createElement('label');
            lab.setAttribute('role', 'menuitemcheckbox');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = this.IsColumnVisible(c.field);
            cb.addEventListener('change', () => {
                const ok = this._f3ComoUsuario(() => (cb.checked ? this.ShowColumn(c.field) : this.HideColumn(c.field)));
                if (!ok) cb.checked = this.IsColumnVisible(c.field);
            });
            cb._f3Campo = c.field;
            const sp = document.createElement('span');
            sp.textContent = String(c.title ?? c.field);
            lab.append(cb, sp);
            m.appendChild(lab);
        });
    }
    _f3ActualizarMenu()
    {
        if (!this._f3MenuAbierto()) return;
        this._f3Menu.querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = this.IsColumnVisible(cb._f3Campo); });
    }
    // "Ajustar ancho": el ancho del contenido más largo (encabezado y celdas dibujadas).
    _f3AjustarAncho(field)
    {
        const th = this._f3ThDe(field);
        if (!th) return false;
        const i = this._f3Indice(field), sys = this._f3Sys();
        const medir = (el) => { if (!el) return 0; const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
        let w = medir(th.querySelector('span') ?? th) + 30;
        const filas = Array.from(this._table.tBodies[0]?.rows ?? []).slice(0, 1000);
        filas.forEach(tr => {
            const td = tr.cells[sys + i];
            if (!td || td.classList.contains('hidde-col')) return;
            w = Math.max(w, medir(td.querySelector('div[iscellcontent]') ?? td) + 18);
        });
        const css = Math.ceil(w) + 'px';
        th.style.width = css;
        this._f1EstadoColumna(field).ancho = css;
        if (this._f3TeniaFijas) this._f3Posiciones();
        this._f3Cambio('resize');
        return true;
    }

    // ---------- §8 reordenar ----------
    _f3DestinoValido(from, to)
    {
        const n = this.Columns.length;
        if (from === to || from < 0 || to < 0 || from >= n || to >= n) return false;
        const c = this.Columns[from];
        if (!c || this._f1EsFalso(c.reorder ?? '')) return false;
        const nf = this._f3NumFijas();
        const fija = (c.field != undefined && this._f3EsFija(c.field));
        return (fija ? to < nf : to >= nf);   // fijas y no fijas no se mezclan
    }
    MoveColumn(field, toIndex)
    {
        const from = this._f3Indice(field);
        const n = this.Columns.length;
        let to = Math.trunc(Number(toIndex));
        if (from < 0 || !isFinite(to)) return false;
        to = Math.max(0, Math.min(n - 1, to));
        if (!this._f3DestinoValido(from, to)) return false;
        const args = { field, from, to, cancel: false };
        this._f3Disparar('BeforeColumnMove', args);
        if (args.cancel) return false;
        const orden = this.Columns.slice();
        const [c] = orden.splice(from, 1);
        orden.splice(to, 0, c);
        this._f3Permutar(orden);
        this._f3Posiciones();
        this._f3ActualizarMenu();
        this._f3Disparar('ColumnMoved', { field, from, to });
        this._f3Cambio('move');
        return true;
    }
    _f3AplicarReorder()
    {
        const enc = this._f3FilaEnc();
        if (!enc) return;
        if (this._f3Reorder) { this._f3Estilo(); this._f3EventosUI(); }
        const sys = this._f3Sys();
        Array.from(enc.cells).forEach((th, k) => {
            if (k < sys) return;
            const c = this.Columns[k - sys];
            const movible = (this._f3Reorder && c && c.field != undefined && !this._f1EsFalso(c.reorder ?? ''));
            if (movible)
            {
                th.setAttribute('draggable', 'true');
                if (!th.hasAttribute('tabindex')) { th.setAttribute('tabindex', '0'); th._f3Tab = true; }
            }
            else if (th.getAttribute('draggable') === 'true')
            {
                th.removeAttribute('draggable');
                if (th._f3Tab) { th.removeAttribute('tabindex'); th._f3Tab = false; }
            }
        });
    }
    _f3ThDeEvento(e)
    {
        let el = e.target;
        if (el && el.nodeType !== 1) el = el.parentElement;
        const th = el?.closest?.('th');
        return (th && th.parentElement === this._f3FilaEnc() ? th : null);
    }
    _f3MostrarIndicador(x)
    {
        const cont = this._table?.parentElement;
        if (!cont) return;
        if (!this._f3Indicador)
        {
            this._f3Indicador = document.createElement('div');
            this._f3Indicador.className = 'et-drop-indicator';
        }
        const ind = this._f3Indicador;
        if (!ind.isConnected) cont.appendChild(ind);
        const r = this._table.getBoundingClientRect();
        const top = Math.max(0, r.top), bottom = Math.min(window.innerHeight, r.bottom);
        ind.style.left = Math.round(x - 1) + 'px';
        ind.style.top = Math.round(top) + 'px';
        ind.style.height = Math.max(0, Math.round(bottom - top)) + 'px';
    }
    _f3OcultarIndicador() { this._f3Indicador?.remove(); }
    _f3FinArrastre()
    {
        this._f3Arrastre = null;
        this._f3OcultarIndicador();
        this._table?.tHead?.querySelectorAll('th.et-dragging').forEach(th => th.classList.remove('et-dragging'));
    }

    // Listeners del encabezado (menú contextual, arrastre y teclado), y del documento para cerrar el menú.
    // Solo se instalan con column-chooser o column-reorder.
    _f3EventosUI()
    {
        const thead = this._table?.tHead;
        if (thead && !thead._f3UI)
        {
            thead._f3UI = true;
            thead.addEventListener('contextmenu', (e) => {
                if (!this._f3Chooser) return;
                const th = this._f3ThDeEvento(e);
                if (!th) return;
                e.preventDefault(); e.stopPropagation();
                this._f3AbrirMenu(e.clientX, e.clientY, th.getAttribute('field'));
            });
            thead.addEventListener('dragstart', (e) => {
                if (!this._f3Reorder) return;
                const th = this._f3ThDeEvento(e);
                const f = th?.getAttribute('field');
                const i = this._f3Indice(f);
                if (i < 0 || this._f1EsFalso(this.Columns[i].reorder ?? '')) return;
                this._f3Arrastre = f;
                try { e.dataTransfer.setData('text/plain', f); e.dataTransfer.effectAllowed = 'move'; } catch (x) { }
                th.classList.add('et-dragging');
            });
            const destino = (e) => {
                const th = this._f3ThDeEvento(e);
                if (!th || this._f3Arrastre == null) return null;
                const t = this._f3Indice(th.getAttribute('field'));
                const from = this._f3Indice(this._f3Arrastre);
                if (t < 0 || from < 0) return null;
                const r = th.getBoundingClientRect();
                const antes = (e.clientX < r.left + r.width / 2);
                const to = (antes ? (from > t ? t : t - 1) : (from > t ? t + 1 : t));
                if (!this._f3DestinoValido(from, to)) return null;
                return { to, x: (antes ? r.left : r.right) };
            };
            const sobre = (e) => {
                if (this._f3Arrastre == null) return;
                const d = destino(e);
                if (d) { e.preventDefault(); try { e.dataTransfer.dropEffect = 'move'; } catch (x) { } this._f3MostrarIndicador(d.x); }
                else this._f3OcultarIndicador();
            };
            thead.addEventListener('dragenter', sobre);
            thead.addEventListener('dragover', sobre);
            thead.addEventListener('drop', (e) => {
                if (this._f3Arrastre == null) return;
                e.preventDefault(); e.stopPropagation();
                const d = destino(e), f = this._f3Arrastre;
                this._f3FinArrastre();
                if (d) this._f3ComoUsuario(() => this.MoveColumn(f, d.to));
            });
            thead.addEventListener('dragend', () => this._f3FinArrastre());
            thead.addEventListener('keydown', (e) => {
                if (!this._f3Reorder || !(e.ctrlKey && e.shiftKey) || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
                const th = this._f3ThDeEvento(e);
                const f = th?.getAttribute('field');
                const i = this._f3Indice(f);
                if (i < 0) return;
                e.preventDefault(); e.stopPropagation();
                const paso = (e.key === 'ArrowLeft' ? -1 : 1);
                let j = i + paso;
                while (j >= 0 && j < this.Columns.length && !this._f3Visible(this.Columns[j])) j += paso;
                if (j < 0 || j >= this.Columns.length) return;
                this._f3ComoUsuario(() => this.MoveColumn(f, j));
                try { th.focus({ preventScroll: true }); } catch (x) { }
            });
        }
        if (!this._f3Globales)
        {
            this._f3Globales = true;
            this._f1Global(document, 'mousedown', (e) => {
                if (!this._f3MenuAbierto()) return;
                const ruta = e.composedPath?.() ?? [];
                if (!ruta.includes(this._f3Menu) && !ruta.includes(this._f3Boton)) this._f3CerrarMenu(false);
            });
            this._f1Global(document, 'keydown', (e) => { if (e.key === 'Escape' && this._f3MenuAbierto()) this._f3CerrarMenu(true); });
        }
    }

    _f3Estilo()
    {
        if (this._f3EstiloEl || !this._shadow) return;
        const st = document.createElement('style');
        st.textContent = `
                    /* ===== EditTable F3: columnas fijas, selector de columnas y reordenar ===== */
                    table.et-has-fixed th.et-fixed, table.et-has-fixed td.et-fixed { position: sticky; z-index: 2; background-color: var(--et-fixed-bg, #FFF); background-clip: padding-box; }
                    table.et-has-fixed thead > tr > th.et-fixed { z-index: 3; background-color: var(--et-fixed-head-bg, #F5F5F5); }
                    table.et-has-fixed tfoot td.et-fixed, table.et-has-fixed tfoot th.et-fixed { z-index: 3; }
                    table.et-has-fixed tbody tr:hover > td.et-fixed { background-color: var(--et-fixed-hover-bg, #F5F5F5); }
                    table.et-has-fixed tbody tr.EdiTable-Row-Selected > td { background-color: inherit !important; }
                    table.et-has-fixed .et-fixed-last { box-shadow: 4px 0 4px -2px rgba(0,0,0,.18); }
                    table.et-has-fixed tbody tr.et-accent > td.et-fixed-last:first-child { box-shadow: inset 3px 0 0 var(--et-row-accent), 4px 0 4px -2px rgba(0,0,0,.18); }
                    .et-fixed-cont { overflow: visible !important; }
                    table.et-cards .et-fixed { position: static !important; box-shadow: none !important; }
                    .et-chooser-host { position: relative; }
                    .et-chooser-btn { position: absolute; top: 3px; right: 8px; z-index: 101; width: 20px; height: 20px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid #CCC; border-radius: 3px; background: #FFF; color: #555; cursor: pointer; }
                    .et-chooser-btn:hover { background: #F0F4FB; }
                    .et-chooser { display: none; position: fixed; z-index: 100000; min-width: 190px; max-height: 60vh; overflow: auto; padding: 4px 0; background: #FFF; color: #212529; border: 1px solid #CCC; border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,.18); font-size: .9rem; text-align: left; outline: none; }
                    .et-chooser.et-open { display: block; }
                    .et-chooser > button { display: block; width: 100%; padding: 4px 12px; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
                    .et-chooser > button:disabled { color: #999; cursor: default; }
                    .et-chooser > button:not(:disabled):hover, .et-chooser > label:hover { background: #F0F4FB; }
                    .et-chooser > hr { border: 0; border-top: 1px solid #EEE; margin: 4px 0; }
                    .et-chooser > label { display: flex; gap: 6px; align-items: center; padding: 3px 12px; white-space: nowrap; cursor: pointer; }
                    .et-drop-indicator { position: fixed; width: 3px; background: #3D75DD; z-index: 100001; pointer-events: none; }
                    thead th.et-dragging { opacity: .5; }
                    @media screen and (max-width: 768px) { .table-cards .et-fixed { position: static !important; box-shadow: none !important; } }
                    @media print {
                        .et-chooser-btn, .et-chooser, .et-drop-indicator { display: none !important; }
                        table.et-has-fixed .et-fixed { position: static !important; box-shadow: none !important; }
                    }
        `;
        this._shadow.appendChild(st);
        this._f3EstiloEl = st;
        this._f8bReescribirTodo?.();   // F8b: variables del tema en la hoja nueva
    }

    // ---------- §9.1 objeto de diseño ----------
    _f3Ancho(c)
    {
        const st = this._f1EstadoColumnas.get(c.field);
        const w = (st?.ancho ?? c.width ?? null);
        if (w == null || String(w).trim() === '') return null;
        const m = /^\s*(-?\d+(?:\.\d+)?)\s*px\s*$/i.exec(String(w));
        return (m ? Math.round(Number(m[1]) * 100) / 100 : String(w));
    }
    getLayout()
    {
        const columns = [];
        this.Columns.forEach((c, i) => {
            if (!c || c.field == undefined) return;
            columns.push({ field: c.field, order: i, width: this._f3Ancho(c), hidden: this._f1ColumnaOculta(c.field), fixed: this._f3EsFija(c.field) });
        });
        let groups = [];
        try { if (typeof this.getGroups === 'function') groups = (this.getGroups() ?? []).slice(); } catch (e) { }
        return { v: 1, columns, sort: (this._f3Orden ? { ...this._f3Orden } : null), groups, density: 'normal' };
    }
    setLayout(obj, opts = {})
    {
        if (!obj || typeof obj !== 'object') return false;
        const v = (obj.v == null ? 1 : Number(obj.v));
        if (!(v <= 1))
        {
            this._f3Disparar('LayoutRejected', { layout: obj, reason: 'version', v: obj.v });
            return false;
        }
        const antes = this._f3Silencio;
        this._f3Silencio = true;
        try { this._f3Aplicar(obj, { orden: true, visibilidad: true, fijacion: true, anchos: true, filas: true }); }
        finally { this._f3Silencio = antes; }
        if (!(opts && opts.silent))
        {
            const u = this._f3Usuario;
            this._f3Usuario = false;   // lo que llega por setLayout no se guarda
            try { this._f3Cambio('set'); } finally { this._f3Usuario = u; }
        }
        return true;
    }
    // Aplica un diseño. o: qué partes ({orden, visibilidad, fijacion, anchos, filas}).
    _f3Aplicar(layout, o)
    {
        const lista = (Array.isArray(layout.columns) ? layout.columns : []);
        const porCampo = new Map();
        lista.forEach((x, i) => { if (x && x.field != undefined && !porCampo.has(x.field) && this._f3Indice(x.field) >= 0) porCampo.set(x.field, { x, i }); });

        if (o.fijacion) porCampo.forEach(({ x }, f) => { if (typeof x.fixed === 'boolean') this._f1EstadoColumna(f).fija = x.fixed; });

        let orden = this.Columns.slice();
        if (o.orden)
        {
            const ord = (e) => ((typeof e.x.order === 'number' && isFinite(e.x.order)) ? e.x.order : e.i);
            const listados = [...porCampo.values()].sort((a, b) => ord(a) - ord(b)).map(e => this.Columns[this._f3Indice(e.x.field)]);
            orden = [...listados, ...this.Columns.filter(c => !listados.includes(c))];   // las nuevas, al final
        }
        this._f3Permutar(this._f3Normalizar(orden));

        if (o.visibilidad)
        {
            const objetivo = new Map();
            porCampo.forEach(({ x }, f) => { if (typeof x.hidden === 'boolean') objetivo.set(f, x.hidden); });
            const oculta = (c) => (c.field == undefined ? false : (objetivo.has(c.field) ? objetivo.get(c.field) : this._f1ColumnaOculta(c.field)));
            if (!this.Columns.some(c => c && !oculta(c)))
            {
                const p = this.Columns.find(c => c && c.field != undefined);
                if (p) objetivo.set(p.field, false);
            }
            objetivo.forEach((h, f) => { if (this._f1ColumnaOculta(f) !== h) this.hideColumn(f, h); });
            this._f3SacarFoco();
        }

        if (o.anchos) porCampo.forEach(({ x }, f) => {
            const w = x.width;
            if (w == null || w === '' || (typeof w === 'number' && !isFinite(w))) return;
            const css = (typeof w === 'number' ? w + 'px' : String(w));
            const th = this._f3ThDe(f);
            if (th) th.style.width = css;
            this._f1EstadoColumna(f).ancho = css;
        });

        if (o.filas)
        {
            const s = layout.sort;
            if (s && s.field != undefined && this._f3Indice(s.field) >= 0) this._f3AplicarOrden(s.field, String(s.dir ?? '').toUpperCase() === 'DESC');
            if (Array.isArray(layout.groups) && typeof this.GroupBy === 'function')
            {
                const g = layout.groups.filter(f => this._f3Indice(f) >= 0);
                let act = [];
                try { act = (this.getGroups?.() ?? []); } catch (e) { }
                if (JSON.stringify(g) !== JSON.stringify(act)) { if (g.length) this.GroupBy(g); else this.Ungroup?.(); }
            }
        }
        this._f3Posiciones();
        this._f3ActualizarMenu();
    }
    _f3AplicarOrden(field, desc)
    {
        const ths = this._table.querySelectorAll('thead th');
        ths.forEach(f => { f.classList.remove('ascendent'); f.classList.remove('descendent'); });
        const th = this._f3ThDe(field);
        // Mismas clases que el clic en el encabezado (invertidas, P36).
        if (th) { th.classList.toggle('ascendent', desc); th.classList.toggle('descendent', !desc); }
        if (this.ShowAsTree)
        {
            const op = this._getTreeOptions();
            this.GetTree(op);
            this.SortTree(this.DataArray, field, desc, op);
            this.SetTree(this.DataArray, op);
        }
        else this.Sort(this.DataArray, field, desc);
        this._printRows();
        this._f3Orden = { field, dir: (desc ? 'DESC' : 'ASC') };
    }
    ResetLayout()
    {
        if (!this._f3Declarado) return false;
        clearTimeout(this._f3Timer);
        this._f3Timer = 0;
        const antes = this._f3Silencio;
        this._f3Silencio = true;
        try
        {
            this._f3Declarado.forEach(d => {
                if (d.field == undefined || this._f3Indice(d.field) < 0) return;
                const st = this._f1EstadoColumna(d.field);
                st.fija = d.fixed;
                if (st.oculta) this.hideColumn(d.field, false);
                const th = this._f3ThDe(d.field);
                if (th) th.style.width = (d.width ?? '');
                st.ancho = (d.width ?? null);
            });
            this._f3Permutar(this._f3Normalizar(this._f3Declarado.map(d => d.col)));
            try { if (typeof this.Ungroup === 'function' && (this.getGroups?.() ?? []).length) this.Ungroup(); } catch (e) { }
            this._f3Orden = null;
            this._f3Posiciones();
            this._f3ActualizarMenu();
        }
        finally { this._f3Silencio = antes; }
        const u = this._f3Usuario;
        this._f3Usuario = false;
        try { this._f3Cambio('reset'); } finally { this._f3Usuario = u; }
        this.ForgetLayout();
        return true;
    }

    // ---------- §9.2 guardado automático en IndexedDB ----------
    // Llave: sha256(origin + pathname + '#' + id) o sha256(origin + DesignKey), en hexadecimal (P17).
    // Sin id estable no hay llave: sin id, el id de reserva o un id de V12 table_<hex> (P20).
    _f3Llave()
    {
        try
        {
            const origen = location.origin;
            if (this.DesignKey != null && String(this.DesignKey).trim() !== '') return EditTable._f3Sha256(origen + String(this.DesignKey));
            const id = (this.getAttribute('id') ?? '').trim();
            if (!id || id === 'f077fb41716141eeb7ecb1ed0a1ce292' || /^table_[0-9a-f]{6,}$/.test(id)) return null;
            return EditTable._f3Sha256(origen + location.pathname + '#' + id);
        }
        catch (e) { return null; }
    }
    _f3ProgramarGuardado(reason)
    {
        if (!this.DesignAutoSave || reason === 'reset' || reason === 'set') return;
        if ((reason === 'sort' || reason === 'group') && !this.DesignAutoSaveSort) return;
        if (!this._f3Llave()) return;
        clearTimeout(this._f3Timer);
        this._f3Timer = setTimeout(() => { this._f3Timer = 0; this._f3Guardar(); }, 500);
    }
    _f3Guardar()
    {
        try
        {
            const k = this._f3Llave();
            if (!k || !this.DesignAutoSave) return;
            const layout = this.getLayout();
            if (!this.DesignAutoSaveSort) { layout.sort = null; layout.groups = []; }
            const rec = { v: 1, huella: this._f3Huella, layout, fecha: new Date().toISOString() };
            EditTable._f3Op('readwrite', s => s.put(rec, k));
        }
        catch (e) { }
    }
    // Restaura sin eventos. Salvaguarda 3: solo lo que esta tabla deja cambiar al usuario.
    _f3Restaurar()
    {
        try
        {
            if (!this.DesignAutoSave) return false;   // F8a: devuelve true (en una promesa) si restauró algo
            const k = this._f3Llave();
            if (!k) return false;
            return EditTable._f3Op('readonly', s => s.get(k)).then(rec => {   // F8a: return
                try
                {
                    if (!rec || typeof rec !== 'object' || !rec.layout || !this.isConnected) return false;
                    if (rec.huella !== this._f3Huella) { EditTable._f3Op('readwrite', s => s.delete(k)); return false; }   // huella de columnas
                    if (Number(rec.layout.v ?? 1) > 1) return false;
                    const antes = this._f3Silencio;
                    this._f3Silencio = true;
                    try
                    {
                        this._f3Aplicar(rec.layout, {
                            orden: this._f3Reorder, visibilidad: this._f3Chooser, fijacion: this._f3Chooser,
                            anchos: true, filas: this.DesignAutoSaveSort
                        });
                    }
                    finally { this._f3Silencio = antes; }
                    return true;   // F8a
                }
                catch (e) { console.error('EditTable: no se pudo restaurar el diseño', e); return false; }
            });
        }
        catch (e) { return false; }
    }
    ForgetLayout()
    {
        clearTimeout(this._f3Timer);
        this._f3Timer = 0;
        const k = this._f3Llave();
        if (!k) return Promise.resolve(false);
        return EditTable._f3Op('readwrite', s => s.delete(k)).then(() => true);
    }
    static ForgetAllLayouts()
    {
        return EditTable._f3Op('readwrite', s => s.clear()).then(() => true);
    }

    static _f3Bd = undefined;
    static _f3AbrirBd()
    {
        if (EditTable._f3Bd !== undefined) return EditTable._f3Bd;
        EditTable._f3Bd = new Promise(res => {
            try
            {
                const req = indexedDB.open('induxsoft-edittable', 1);
                req.onupgradeneeded = () => { try { if (!req.result.objectStoreNames.contains('layouts')) req.result.createObjectStore('layouts'); } catch (e) { } };
                req.onsuccess = () => {
                    try
                    {
                        const db = req.result;
                        db.onversionchange = () => { try { db.close(); } catch (e) { } EditTable._f3Bd = undefined; };
                        res(db.objectStoreNames.contains('layouts') ? db : null);
                    }
                    catch (e) { res(null); }
                };
                req.onerror = () => res(null);
                req.onblocked = () => res(null);
            }
            catch (e) { res(null); }   // sin IndexedDB (modo privado, iframe restringido): se desactiva
        });
        return EditTable._f3Bd;
    }
    static _f3Op(modo, fn)
    {
        return EditTable._f3AbrirBd().then(db => new Promise(res => {
            if (!db) { res(null); return; }
            try
            {
                const tx = db.transaction('layouts', modo);
                const req = fn(tx.objectStore('layouts'));
                tx.oncomplete = () => res(req ? req.result : null);
                tx.onerror = () => res(null);
                tx.onabort = () => res(null);
            }
            catch (e) { res(null); }
        })).catch(() => null);
    }

    // sha256 en hexadecimal, síncrono y sin WebCrypto (crypto.subtle no existe fuera de https).
    static _f3K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    static _f3Sha256(texto)
    {
        const K = EditTable._f3K;
        const datos = new TextEncoder().encode(String(texto));
        const l = datos.length;
        const nb = ((l + 9 + 63) >> 6) << 6;
        const m = new Uint8Array(nb);
        m.set(datos);
        m[l] = 0x80;
        const dv = new DataView(m.buffer);
        const bits = l * 8;
        dv.setUint32(nb - 4, bits >>> 0);
        dv.setUint32(nb - 8, Math.floor(bits / 0x100000000));
        const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
        const w = new Int32Array(64);
        const rot = (x, n) => (x >>> n) | (x << (32 - n));
        for (let o = 0; o < nb; o += 64)
        {
            for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
            for (let i = 16; i < 64; i++)
            {
                const a = w[i - 15], b = w[i - 2];
                w[i] = (w[i - 16] + (rot(a, 7) ^ rot(a, 18) ^ (a >>> 3)) + w[i - 7] + (rot(b, 17) ^ rot(b, 19) ^ (b >>> 10))) | 0;
            }
            let [a, b, c, d, e, f, g, h] = H;
            for (let i = 0; i < 64; i++)
            {
                const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
                const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
                h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
            }
            H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
            H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
        }
        return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
    }
    // ===== F3: fin =====

    // ===== F2: totales en el pie (§2), máscaras y calc (§3), locale y valores numéricos (R7, R9, C12, C16)
    // Todo se activa por atributo: summary, summary-format, summary-label y summary-scope; mask,
    // mask-placeholder, mask-keep, calc, locale, value-type, datetime-seconds y date-display. Sin ellos,
    // los enganches de F2 devuelven lo mismo que recibieron.
    static { this.features.push('summary', 'mask', 'calc', 'locale'); }

    // ----- EditTable.Mask: inicio (motor puro sin DOM; tests/mascaras/fuente.cjs lo extrae de aquí)
    static Mask = (() => {
      const SL = { '9': c => c >= '0' && c <= '9', A: c => /\p{L}/u.test(c), X: c => /[\p{L}0-9]/u.test(c), '*': () => true };
      const cache = {};
      // Tokens: {s: prueba} ranura o {l: carácter} literal; t.p = posición de cada ranura, t.L = literales.
      const parse = p => cache[p] || (cache[p] = (() => {
        const t = [], a = [...p]; t.p = []; t.L = new Set();
        for (let i = 0; i < a.length; i++) {
          const c = a[i];
          if (c === '\\' && i + 1 < a.length) t.push({ l: a[++i] });
          else if (SL[c]) { t.p.push(t.length); t.push({ s: SL[c] }); }
          else t.push({ l: c });
          if (t[t.length - 1].l !== undefined) t.L.add(t[t.length - 1].l);
        }
        return t;
      })());
      // Acomoda chars en las ranuras desde el token i. lit: acepta los literales del patrón en el texto.
      const take = (t, chars, lit, ph, i = 0) => {
        const raw = []; let bad = 0;
        for (const c of chars) {
          if (lit && ph && c === ph) continue;
          while (i < t.length && !t[i].s && !(lit && c === t[i].l)) i++;
          if (i >= t.length) { bad++; continue; }
          if (!t[i].s) { i++; continue; }
          if (t[i].s(c)) { raw.push(c); i++; } else if (!(lit && t.L.has(c))) bad++;
        }
        return { raw, bad };
      };
      const render = (t, raw, ph) => {
        if (!raw.length) return '';
        let d = '', k = 0;
        for (const x of t) {
          if (x.s) { if (k < raw.length) d += raw[k++]; else if (ph) d += ph; else break; }
          else d += x.l;
        }
        return d;
      };
      const out = (t, raw, k, ph) => {
        const display = render(t, raw, ph), cp = [...display];
        const r = raw.join('');
        return { display, raw: r, canonical: r, complete: raw.length === t.p.length,
          caret: raw.length ? cp.slice(0, k < t.p.length ? t.p[k] : t.length).join('').length : 0 };
      };
      // Separadores (R7): opts.decimal/opts.thousands mandan; si no, Intl con opts.locale (por omisión es-MX).
      // Se usa 1234567.5 porque algunos locales (es-ES) no agrupan números de 4 cifras.
      const SEP = {};
      const sep = (o = {}) => {
        if (o.d) return o; // ya resuelto
        const l = o.locale || 'es-MX';
        if (!SEP[l]) {
          let d = '.', g;
          try { for (const x of new Intl.NumberFormat(l).formatToParts(1234567.5)) x.type === 'decimal' ? d = x.value : x.type === 'group' ? g = x.value : 0; } catch (e) { }
          SEP[l] = { d, g: g ?? (d === ',' ? '.' : ',') };
        }
        const d = o.decimal || SEP[l].d;
        return { d, g: o.thousands ?? (o.decimal ? (d === ',' ? '.' : ',') : SEP[l].g) };
      };
      const esc = c => c.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&');
      // Número escrito con los separadores S → Number (sin grupos: percent).
      const num = (v, S) => +v.replace(S.d, '.');
      // R9: cadena canónica a partir de signo, parte entera y decimales (cadenas de dígitos), sin pasar por Number.
      const canon = (sg, i, f) => {
        i = i.replace(/^0+(?=\d)/, '') || '0';
        return (sg === '-' && /[1-9]/.test(i + f) ? '-' : '') + i + (f ? '.' + f : '');
      };
      const preset = p => typeof p === 'object' ? p : Object.hasOwn(M.presets, p) ? M.presets[p] : null;
      const fp = P => P && !P.m, tk = (P, p) => parse(P ? P.m : p);
      // Filtro de un carácter: lo pasa a mayúsculas si up y lo acepta si cumple re.
      const F = (re, up) => c => (c = up ? U(c) : c, re.test(c) ? c : null);
      // Presets sin patrón fijo: inserta chars en d entre a y b, filtrando con P.c, P.max y P.ok.
      const fins = (P, d, a, b, s, S) => {
        let cur = d.slice(0, a), bad = 0, n = 0; const aft = d.slice(b);
        for (const ch of s) {
          const c = P.c(ch, S), v = cur + c + aft;
          if (c == null || v.length > (P.max || 1e4) || (P.ok && !P.ok(v, S))) bad++; else { cur += c; n++; }
        }
        return { d: cur + aft, k: cur.length, bad, n };
      };
      const fres = (P, d, k, S) => {
        const raw = P.r ? P.r(d, S) : d;
        return { display: d, raw, canonical: P.n ? M.canonicalFromText(d, S) ?? '' : raw, caret: k, complete: !!d && M.validate(P, d, S).reason !== 'incomplete' };
      };
      const dt = (s, Y) => {
        const m = +s.slice(2, 4), d = +s.slice(4, 6), x = new Date(Date.UTC(Y + +s.slice(0, 2), m - 1, d));
        return x.getUTCMonth() === m - 1 && x.getUTCDate() === d;
      };
      const dv = (s, D, n) => { let t = 0; for (let i = 0; i < n; i++) t += D.indexOf(s[i]) * (n + 1 - i); return t; };
      const ENT = 'AS BC BS CC CL CM CS CH DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TS TL VZ YN ZS NE'.split(' ');
      const U = c => c.toUpperCase();
    
      const M = {
        presets: {
          cp: { m: '99999' },
          tel: { m: '(999) 999-9999' },
          upper: { c: U },
          lower: { c: c => c.toLowerCase() },
          email: { c: F(/\S/), max: 254, v: v => /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(v) ? '' : 'invalid' },
          // percent: display con el decimal del locale; raw con punto ("10,50" → "10.5" en es-CO).
          percent: { n: 1, c: (c, S) => /[0-9]/.test(c) || c === S.d ? c : null, max: 6, strict: 1,
            ok: (v, S) => new RegExp(`^\\d{0,3}(${esc(S.d)}\\d{0,2})?$`).test(v) && !(num(v, S) > 100),
            v: (v, S) => !new RegExp(`^(\\d+[.${esc(S.d)}]?\\d*|[.${esc(S.d)}]\\d+)$`).test(v) ? 'invalid' : num(v.replace('.', S.d), S) > 100 || /[.,]\d{3}/.test(v) ? 'rango' : '',
            f: (v, S) => v !== '' && isFinite(num(v.replace('.', S.d), S)) ? num(v.replace('.', S.d), S).toFixed(2).replace('.', S.d) : v,
            r: (v, S) => v.replace(S.d, '.') },
          rfc: { c: F(/[A-Z0-9Ñ&]/, 1), max: 13, v: v => {
            v = U(v);
            if (v.length < 12) return 'incomplete';
            const m = /^[A-ZÑ&]{3,4}(\d{6})[A-Z0-9]{3}$/.exec(v);
            if (!m) return 'invalid';
            if (/^XEXX|^XAXX/.test(v) && v.slice(4) === '010101000') return '';
            if (!dt(m[1], 2000)) return 'fecha';
            const s = v.length === 12 ? ' ' + v : v, r = 11 - dv(s, '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ', 12) % 11;
            return s[12] === (r === 11 ? '0' : r === 10 ? 'A' : '' + r) ? '' : 'checksum';
          } },
          curp: { c: F(/[A-Z0-9]/, 1), max: 18, v: v => {
            v = U(v);
            if (v.length < 18) return 'incomplete';
            const m = /^[A-Z][AEIOUX][A-Z]{2}(\d{6})[HMX]([A-Z]{2})[B-DF-HJ-NP-TV-Z]{3}([A-Z0-9])\d$/.exec(v);
            if (!m) return 'invalid';
            if (!ENT.includes(m[2])) return 'entidad';
            if (!dt(m[1], /\d/.test(m[3]) ? 1900 : 2000)) return 'fecha';
            return +v[17] === (10 - dv(v, '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', 17) % 10) % 10 ? '' : 'checksum';
          } }
        },
        apply(p, text, o = {}) {
          const P = preset(p), s = String(text ?? ''), c = o.caret ?? s.length, S = sep(o);
          if (fp(P)) {
            const r = fins(P, s, 0, s.length, s, S), k = fins(P, s.slice(0, c), 0, c, s.slice(0, c), S).k;
            return Object.assign(fres(P, r.d, k, S), { rejected: r.bad });
          }
          const t = tk(P, p), ph = o.placeholder ?? '_', r = take(t, [...s], 1, ph);
          return Object.assign(out(t, r.raw, take(t, [...s.slice(0, c)], 1, ph).raw.length, ph), { rejected: r.bad });
        },
        validate(p, value, o) {
          const v = String(value ?? ''), P = preset(p);
          let reason = '';
          if (v) {
            if (fp(P)) reason = P.v ? P.v(v, sep(o)) : '';
            else { const a = M.apply(p, v, { placeholder: '' }); reason = a.rejected ? 'invalid' : a.complete ? '' : 'incomplete'; }
          }
          return { ok: !reason, reason };
        },
        format(p, raw, o) {
          const P = preset(p), s = String(raw ?? ''), S = sep(o);
          if (fp(P)) return P.f ? P.f(s, S) : fins(P, s, 0, s.length, s, S).d;
          const t = tk(P, p);
          return render(t, take(t, [...s], 0, '').raw, '');
        },
        // Devuelve {raw, canonical} (R9).
        unformat(p, display, o = {}) {
          const P = preset(p), s = String(display ?? ''), ph = typeof o === 'string' ? o : o.placeholder ?? '_';
          if (fp(P)) { const S = sep(o), raw = P.r ? P.r(s, S) : s; return { raw, canonical: P.n ? M.canonicalFromText(s, S) ?? '' : raw }; }
          const raw = take(tk(P, p), [...s], 1, ph).raw.join('');
          return { raw, canonical: raw };
        },
        // state {display, caret, end?}; action {type: insert|paste|backspace|delete, text}. Devuelve el estado nuevo.
        edit(p, st, a, o = {}) {
          const P = preset(p), d = String(st.display ?? ''), ph = o.placeholder ?? '_', ins = a.type === 'insert' || a.type === 'paste', S = sep(o);
          const cl = x => Math.max(0, Math.min(d.length, x ?? d.length));
          let c0 = cl(st.caret), c1 = cl(st.end ?? c0);
          if (c1 < c0) [c0, c1] = [c1, c0];
          const k0 = c0, no = () => Object.assign(M.apply(p, d, { ...o, caret: k0, placeholder: ph }), { accepted: false });
          if (fp(P)) {
            if (!ins && c0 === c1) a.type === 'backspace' ? c0 = Math.max(0, c0 - 1) : c1 = Math.min(d.length, c1 + 1);
            const r = fins(P, d, c0, c1, ins ? String(a.text ?? '') : '', S);
            if (ins ? !r.n || (P.strict && r.bad) : P.ok && !P.ok(r.d, S)) return no();
            return Object.assign(fres(P, r.d, r.k, S), { accepted: true });
          }
          const t = tk(P, p), N = t.p.length, raw = take(t, [...d], 1, ph).raw;
          let ra = take(t, [...d.slice(0, c0)], 1, ph).raw.length, rb = take(t, [...d.slice(0, c1)], 1, ph).raw.length, add = [];
          if (ins) {
            add = take(t, [...String(a.text ?? '')], 1, ph, ra ? t.p[ra - 1] + 1 : 0).raw;
            if (!add.length || (a.type === 'insert' && raw.length - (rb - ra) + add.length > N)) return no();
          } else if (ra === rb) { if (a.type === 'backspace') ra = Math.max(0, ra - 1); else rb = Math.min(raw.length, rb + 1); }
          const nr = take(t, [...raw.slice(0, ra), ...add, ...raw.slice(rb)], 0, '').raw;
          return Object.assign(out(t, nr, Math.min(nr.length, ra + add.length), ph), { accepted: true });
        },
        // =expr o expr: + - * / ( ) %, unario; decimal y miles según el locale (R7; es-MX: 1,234.5).
        calc(e, o) {
          let s = String(e ?? '').trim();
          if (s[0] === '=') s = s.slice(1).trim();
          const err = error => ({ ok: false, value: null, canonical: '', error });
          if (!s) return err('empty');
          if (s.length > 200) return err('length');
          const S = sep(o), D = esc(S.d), G = /\s/.test(S.g) ? '[ \\u00a0\\u202f]' : esc(S.g), T = [];
          const re = new RegExp(`\\s*(?:((?:\\d{1,3}(?:${G}\\d{3})+|\\d+)(?:${D}\\d*)?|${D}\\d+)|([-+*/()%]))`, 'y');
          while (re.lastIndex < s.length) {
            const m = re.exec(s);
            if (!m) return err('syntax');
            T.push(m[1] !== undefined ? +[...m[1]].map(c => c === S.d ? '.' : c >= '0' && c <= '9' ? c : '').join('') : m[2]);
          }
          let j = 0;
          const X = () => { throw 'syntax'; };
          const Pr = () => {
            let r;
            if (typeof T[j] === 'number') r = { v: T[j++] };
            else if (T[j] === '(') { j++; r = { v: E() }; T[j++] !== ')' && X(); }
            else X();
            while (T[j] === '%') { j++; r = { v: r.v / 100, p: 1 }; }
            return r;
          };
          const Un = () => T[j] === '-' || T[j] === '+' ? (T[j++] === '-' ? (r => ({ v: -r.v, p: r.p }))(Un()) : Un()) : Pr();
          const Tm = () => {
            let f = Un();
            while (T[j] === '*' || T[j] === '/') {
              const o = T[j++], r = Un();
              if (o === '/' && r.v === 0) throw 'div0';
              f = { v: o === '*' ? f.v * r.v : f.v / r.v };
            }
            return f;
          };
          const E = () => {
            let v = Tm().v;
            while (T[j] === '+' || T[j] === '-') {
              const o = T[j++], r = Tm(), b = r.p ? v * r.v : r.v;
              v = o === '+' ? v + b : v - b;
            }
            return v;
          };
          try {
            const v = E();
            if (j < T.length) X();
            return isFinite(v) ? { ok: true, value: +v.toFixed(10) || 0, canonical: M.toCanonical(v), error: '' } : err('overflow');
          } catch (x) { return err(x); }
        }
      };
      // R9: Number → cadena canónica sin exponente, redondeada a maxDecs y sin ceros finales. NaN/Infinity → ''.
      M.toCanonical = (n, maxDecs = 10) => {
        n = +n;
        if (!isFinite(n)) return '';
        // Redondea y toma la representación más corta de JS (String), expandiendo su exponente.
        const r = Math.abs(n) < 1e21 ? +n.toFixed(Math.max(0, Math.min(100, maxDecs))) : n;
        return M.canonicalFromText(String(r), { native: true });
      };
      // R9: texto tecleado (locale de opts, por omisión es-MX) o del control nativo (1e3, .5) → cadena canónica,
      // sin Number. Conserva los decimales tecleados. '' → ''; si no es un número, null.
      // opts.native: solo la sintaxis del <input type="number"> (punto decimal y exponente).
      M.canonicalFromText = (text, o = {}) => {
        const t = String(text ?? '').trim();
        if (!t) return '';
        const S = sep(o), G = /\s/.test(S.g) ? '[ \\u00a0\\u202f]' : esc(S.g);
        let m = !o.native && new RegExp(`^([+-]?)\\s*((?:\\d{1,3}(?:${G}\\d{3})+|\\d+)?)(?:${esc(S.d)}(\\d*))?$`).exec(t);
        if (m && /\d/.test(m[2] + (m[3] || ''))) return canon(m[1], m[2].replace(/\D/g, ''), m[3] || '');
        m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d{1,4}))?$/.exec(t);
        if (!m || !/\d/.test(m[2] + (m[3] || ''))) return null;
        let i = m[2], f = m[3] || '';
        const e = +(m[4] || 0), ds = i + f, pos = i.length + e;
        if (e) {
          if (pos <= 0) { i = '0'; f = '0'.repeat(-pos) + ds; }
          else if (pos >= ds.length) { i = ds + '0'.repeat(pos - ds.length); f = ''; }
          else { i = ds.slice(0, pos); f = ds.slice(pos); }
        }
        return canon(m[1], i, f);
      };
      return M;
    })();
    // ----- EditTable.Mask: fin

    // Propiedades públicas (R5): summary-scope ↔ SummaryScope.
    SummaryFunction = null;             // (field, rowsData) => valor, para summary="custom"
    SummaryScope = 'all';               // 'all' | 'selected' | 'visible'

    // Estado interno.
    _f2ScopeDeclarado = false;
    _f2Pie = null;                      // tfoot, solo si alguna columna declara summary
    _f2Sucio = false;
    _f2Programado = false;
    _f2Valores = {};                    // field → {valor, texto}
    _f2Confirmando = null;              // {row, field} de la celda con value-type="number" que se confirma
    _f2NumFormatInicial = this.NumFormat;   // para saber si el programador asignó NumFormat (C16)
    // R4: eventos nuevos en Const.Events (MaskInvalid ya lo agregó F1).
    _f2Eventos = Object.assign(this.EdiTable.Const.Events, { SummaryCalculated: 'summarycalculated', ValueTypeFallback: 'valuetypefallback' });
    // El valor de un editor de F2 (máscara, editor propio, segundos) es el que va a DataArray (R9).
    _f2GetInputValueOriginal = (() => {
        const original = this.EdiTable.GetInputValue;
        this.EdiTable.GetInputValue = (input, current, columnDef) => (input && input._f2Conv ? input._f2Conv() : original(input, current, columnDef));
        return original;
    })();

    // ---------- inicialización y atributos
    _f2Iniciar()
    {
        if (this.hasAttribute('summary-scope'))
        {
            this.SummaryScope = (this.getAttribute('summary-scope') ?? 'all').trim().toLowerCase() || 'all';
            this._f2ScopeDeclarado = true;
        }
        // C12: propiedad de columna valueType ↔ atributo value-type.
        this.Columns.forEach(col => { if (col && col['value-type'] != undefined) col.valueType = String(col['value-type']).trim().toLowerCase(); });
        if (this.Columns.some(col => this._f2TieneTotal(col))) this._f2CrearPie();
    }
    _f2AtributoCambiado(name, value)
    {
        if (name != 'summary-scope') return;
        this.SummaryScope = (value ?? 'all').trim().toLowerCase() || 'all';
        this._f2ScopeDeclarado = (value != null);
        if (this._f2Pie) this.RefreshSummaries();
    }

    // ---------- locale (R7, C16, P29)
    _f2TieneRegion(lang)
    {
        return /^[a-z]{2,3}(?:-[a-z]{4})?-(?:[a-z]{2}|\d{3})(?:-|$)/i.test(String(lang ?? '').trim());
    }
    // Locale explícito: el de la columna o el de la tabla (atributo locale / propiedad Locale). 'auto' = navegador.
    _f2LocaleExplicito(coldef)
    {
        let l = String(coldef?.locale ?? '').trim() || String(this.Locale ?? '').trim();
        if (!l) return null;
        if (l.toLowerCase() == 'auto') l = (navigator.language || 'es-MX');
        return l;
    }
    // R7: explícito; si no, el lang con región más cercano (elemento, ancestros, documento); si no, es-MX.
    _f2LocaleR7(coldef)
    {
        const e = this._f2LocaleExplicito(coldef);
        if (e) return e;
        for (let n = this; n; n = (n.parentElement ?? n.getRootNode?.()?.host ?? null))
        {
            const lang = (n.nodeType == 1 ? n.getAttribute('lang') : null);
            if (lang && this._f2TieneRegion(lang)) return lang.trim();
        }
        return 'es-MX';
    }
    static _f2Separadores = {};
    _f2Sep(locale)
    {
        const S = EditTable._f2Separadores;
        if (!S[locale])
        {
            let d = '.', g;
            try { for (const x of new Intl.NumberFormat(locale).formatToParts(1234567.5)) { if (x.type == 'decimal') d = x.value; else if (x.type == 'group') g = x.value; } }
            catch (e) { }
            S[locale] = { d, g: (g ?? (d == ',' ? '.' : ',')) };
        }
        return S[locale];
    }
    _f2NumFormatDelProgramador()
    {
        const nf = this.NumFormat;
        return (nf !== this._f2NumFormatInicial || nf?.thousands !== ',' || nf?.default_decimals !== '.');
    }
    _f2EsCanonico(s)
    {
        return /^-?\d+(?:\.\d+)?$/.test(s);
    }
    // Número de DataArray (número o cadena) → cadena canónica, o null si no es número.
    // Cadenas canónicas (R9) se leen como tales; las demás, con el locale R7 de la columna (P3).
    _f2Canonico(v, coldef)
    {
        if (typeof v == 'number') return (isFinite(v) ? EditTable.Mask.canonicalFromText(String(v), { native: true }) : null);
        if (typeof v == 'bigint') return v.toString();
        if (typeof v != 'string') return null;
        const t = v.trim();
        if (!t) return null;
        if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(t)) return EditTable.Mask.canonicalFromText(t, { native: true });
        return EditTable.Mask.canonicalFromText(t, { locale: this._f2LocaleR7(coldef) });
    }

    // ---------- columnas
    _f2Tipo(coldef) { return String(coldef?.type ?? '').toLowerCase(); }
    _f2Mask(coldef)
    {
        const m = coldef?.mask;
        return (m != undefined && String(m) !== '' ? String(m) : null);
    }
    _f2EsVerdadero(v) { return String(v ?? '').trim().toLowerCase() == 'true'; }
    _f2Calc(coldef) { return this._f2Tipo(coldef) == 'number' && this._f2EsVerdadero(coldef?.calc); }
    // Editor propio (input de texto): Number con mask, calc o locale explícito; Date con locale explícito.
    // Integración (coordinador, 2026-11-01): el atributo locale de la tabla ya existía para format="relative"
    // y no debe cambiar los editores de esas tablas (R8). Por eso el locale de la COLUMNA activa el editor
    // propio siempre, y el de la TABLA solo en las Number con format numérico (no "relative") y en las Date
    // con date-display="locale". La presentación (C16) y la lectura (R7) siguen usando el locale de la tabla.
    _f2EditorPropio(coldef)
    {
        const t = this._f2Tipo(coldef);
        if (t != 'number' && t != 'date') return false;
        if (t == 'number' && (this._f2Mask(coldef) || this._f2Calc(coldef))) return true;
        if (String(coldef?.locale ?? '').trim()) return true;
        if (!this._f2LocaleExplicito(coldef)) return false;
        if (t == 'number') { const f = String(coldef?.format ?? '').trim().toLowerCase(); return !!f && f != 'false' && f != 'relative'; }
        return !!this._f2DateDisplay(coldef);
    }
    _f2OpcMask(coldef)
    {
        return { placeholder: (coldef?.['mask-placeholder'] ?? '_'), locale: this._f2LocaleR7(coldef) };
    }
    _f2MaskEsPatron(mask)
    {
        const P = (Object.hasOwn(EditTable.Mask.presets, mask) ? EditTable.Mask.presets[mask] : null);
        return (!P || !!P.m);
    }
    _f2InputMode(coldef)
    {
        const mask = this._f2Mask(coldef);
        if (mask)
        {
            if (mask == 'tel') return 'tel';
            if (mask == 'email') return 'email';
            if (mask == 'percent') return 'decimal';
            if (mask == 'cp') return 'numeric';
            if (this._f2MaskEsPatron(mask) && !/[AX*]/.test(mask.replace(/\\./g, ''))) return 'numeric';
            return 'text';
        }
        const t = this._f2Tipo(coldef);
        if (t == 'number') return (this._f2Calc(coldef) ? 'text' : 'decimal');
        if (t == 'date') return 'numeric';
        return null;
    }

    // ---------- fechas (R9): editor propio de Date y date-display="locale"
    static _f2Ordenes = {};
    _f2OrdenFecha(locale)
    {
        const O = EditTable._f2Ordenes;
        if (!O[locale])
        {
            let orden = 'DMY', sep = '/';
            try
            {
                const partes = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date(2026, 10, 25));
                orden = partes.filter(p => ['day', 'month', 'year'].includes(p.type)).map(p => p.type[0].toUpperCase()).join('');
                sep = (partes.find(p => p.type == 'literal')?.value ?? '/');
            }
            catch (e) { }
            if (!/^(DMY|MDY|YMD)$/.test(orden)) orden = 'DMY';
            O[locale] = { orden, sep };
        }
        return O[locale];
    }
    // Texto → 'YYYY-MM-DD'; '' si está vacío; null si no es una fecha que exista.
    _f2LeerFecha(texto, locale)
    {
        const t = String(texto ?? '').trim();
        if (!t) return '';
        let a, m, d;
        let x = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(t);
        if (x) [a, m, d] = [+x[1], +x[2], +x[3]];
        else
        {
            const p = t.split(/[^0-9]+/).filter(s => s !== '');
            if (p.length != 3) return null;
            const { orden } = this._f2OrdenFecha(locale);
            const v = {};
            [...orden].forEach((k, i) => v[k] = p[i]);
            a = +v.Y; m = +v.M; d = +v.D;
            if (v.Y.length <= 2) a += 2000;
        }
        const f = new Date(Date.UTC(a, m - 1, d));
        if (!(a >= 1 && f.getUTCFullYear() == a && f.getUTCMonth() == m - 1 && f.getUTCDate() == d)) return null;
        return `${String(a).padStart(4, '0')}-${this._f1Dos(m)}-${this._f1Dos(d)}`;
    }
    _f2FechaATexto(iso, locale)
    {
        const x = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
        if (!x) return null;
        const { orden, sep } = this._f2OrdenFecha(locale), v = { Y: x[1], M: x[2], D: x[3] };
        return [...orden].map(k => v[k]).join(sep);
    }
    // date-display="locale": solo visual. Date 'YYYY-MM-DD…' y DateTime 'YYYY-MM-DDTHH:mm[:ss]'.
    _f2FechaVisible(coldef, value)
    {
        const s = String(value ?? '');
        const x = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s.trim());
        if (!x) return value;
        const loc = this._f2LocaleR7(coldef);
        try
        {
            if (this._f2Tipo(coldef) == 'datetime' && x[4] != undefined)
            {
                const f = new Date(+x[1], +x[2] - 1, +x[3], +x[4], +x[5], +(x[6] ?? 0));
                return f.toLocaleString(loc, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', ...(x[6] != undefined ? { second: '2-digit' } : {}) });
            }
            return new Date(+x[1], +x[2] - 1, +x[3]).toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        catch (e) { return value; }
    }
    _f2DateDisplay(coldef)
    {
        const t = this._f2Tipo(coldef);
        return (t == 'date' || t == 'datetime') && String(coldef?.['date-display'] ?? '').trim().toLowerCase() == 'locale';
    }

    // ---------- presentación (enganches de SetTdValue, _aplyFormat y GetTdValue)
    // SetTdValue: la máscara, el decimal del locale (Number sin format) y date-display. Solo visual.
    _f2Presentar(coldef, value)
    {
        if (value == undefined || !coldef || coldef.template) return value;
        // Camino rápido (R1): sin atributos de F2 en la columna ni Locale en la tabla, no hay nada que hacer.
        if (coldef.mask === undefined && coldef['date-display'] === undefined && coldef.locale === undefined && !this.Locale) return value;
        const mask = this._f2Mask(coldef), dd = this._f2DateDisplay(coldef);
        const loc = (mask || dd ? null : this._f2LocaleExplicito(coldef));
        if (!mask && !dd && !loc) return value;
        const s = String(value);
        if (s.includes('__table_') || s.includes('<')) return value;
        if (mask) return (s === '' ? s : EditTable.Mask.format(mask, s, { locale: this._f2LocaleR7(coldef) }));
        if (dd) return this._f2FechaVisible(coldef, s);
        if (this._f2Tipo(coldef) == 'number' && (coldef.format ?? '') != 'true' && this._f2EsCanonico(s))
        {
            const S = this._f2Sep(loc);
            return (S.d == '.' ? s : s.replace('.', S.d));
        }
        return value;
    }
    // _aplyFormat (C16): con locale explícito y sin NumFormat del programador, los separadores del locale.
    _f2FormatoLocale(coldef, value)
    {
        if (coldef?.locale === undefined && !this.Locale) return null;   // R1
        const loc = this._f2LocaleExplicito(coldef);
        if (!loc || this._f2NumFormatDelProgramador()) return null;
        const n = Number(value);
        if (!isFinite(n)) return null;
        const S = this._f2Sep(loc), decimales = Number(coldef.decs ?? 0), miles = ((coldef.thousandssep ?? 'false') == 'true');
        let [entero, fraccion] = n.toFixed(decimales).split('.');
        if (miles) entero = entero.replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${S.g}`);
        return `${(coldef.prefix ?? '')}${entero}${fraccion ? S.d + fraccion : ''}${(coldef.sufix ?? '')}`;
    }
    // GetTdValue: devuelve el valor sin presentación, o undefined si F2 no interviene.
    // Las máscaras solo se quitan al leer datos (valideEncode, UpdateData); el selector conserva los literales.
    _f2LeerCelda(coldef, value, leerDatos)
    {
        if (!coldef || coldef.template || value == undefined) return undefined;
        if (coldef.mask === undefined && coldef['date-display'] === undefined && coldef.locale === undefined && !this.Locale) return undefined;   // R1
        const s = String(value);
        if (s.includes('__table_')) return undefined;
        const mask = this._f2Mask(coldef);
        if (mask)
        {
            if (!leerDatos) return undefined;
            const u = EditTable.Mask.unformat(mask, s, this._f2OpcMask(coldef));
            if (String(coldef['mask-keep'] ?? '').trim().toLowerCase() == 'formatted' && this._f2MaskEsPatron(mask)) return EditTable.Mask.format(mask, u.raw);
            return u.canonical;
        }
        if (this._f2DateDisplay(coldef))
        {
            if (!leerDatos) return undefined;
            const t = this._f2Tipo(coldef), loc = this._f2LocaleR7(coldef);
            if (t == 'date') { const f = this._f2LeerFecha(s, loc); return (f == null ? undefined : f); }
            return undefined;
        }
        const loc = this._f2LocaleExplicito(coldef);
        if (!loc || this._f2Tipo(coldef) == 'date') return undefined;
        const t = this._f2Tipo(coldef);
        if (t != 'number' && t != 'noeditable') return undefined;
        if ((coldef.format ?? '') == 'true')
        {
            if (this._f2NumFormatDelProgramador()) return undefined;
            let x = s;
            if (coldef.prefix && x.startsWith(coldef.prefix)) x = x.slice(coldef.prefix.length);
            if (coldef.sufix && x.endsWith(coldef.sufix)) x = x.slice(0, -coldef.sufix.length);
            const c = EditTable.Mask.canonicalFromText(x.trim(), { locale: loc });
            return (c == null ? undefined : c);
        }
        if (t != 'number' || s.trim() === '') return undefined;
        const c = EditTable.Mask.canonicalFromText(s, { locale: loc });
        return (c == null ? undefined : c);
    }

    // ---------- editores (enganches de StartEdit y de ConfirmEdit)
    // StartEdit, antes del switch: crea el editor propio de Number o Date. true si lo creó.
    _f2CrearEditor(td, coldef)
    {
        if (!this._f2EditorPropio(coldef)) return false;
        const t = this._f2Tipo(coldef), I = this.EdiTable.Const.HTML.Inputs;
        const base = (t == 'number' ? I.Number : I.Date);
        const html = base.replace(/type\s*=\s*(["']?)(?:number|date)\1/i, 'type="text"');
        this.SetTdValue(td, (/type="text"/.test(html) ? html : I.Text), false);
        return true;
    }
    // StartEdit, después de SetInputVal: valor inicial, máscara al teclear, inputmode y datetime-seconds.
    _f2PrepararEditor(input, coldef, td, conValorActual)
    {
        if (!input || input.tagName != 'INPUT' || !coldef) return;
        const t = this._f2Tipo(coldef), tipoInput = (input.getAttribute('type') ?? 'text').toLowerCase();
        if (t == 'datetime' && tipoInput == 'datetime-local' && this._f2EsVerdadero(coldef['datetime-seconds']))
        {
            input.setAttribute('step', '1');
            input._f2Conv = () => (/T\d{2}:\d{2}$/.test(input.value) ? input.value + ':00' : input.value);
            return;
        }
        const mask = this._f2Mask(coldef), propio = (tipoInput == 'text' && this._f2EditorPropio(coldef));
        if (!mask && !propio && !this._f2DateDisplay(coldef)) return;   // R1: sin atributos de F2, nada
        const row = this.RowIndexOfTd(td), dato = this.DataArray[row]?.[coldef.field];
        if (!mask && !propio)
        {
            // date-display: el selector muestra la fecha con formato; el control nativo recibe la de DataArray.
            if (this._f2DateDisplay(coldef) && conValorActual && dato != undefined && (tipoInput == 'date' || tipoInput == 'datetime-local'))
                input.value = this._f1FechaParaEditor(String(dato), tipoInput);
            return;
        }
        if (mask && tipoInput != 'text' && tipoInput != 'search' && tipoInput != 'tel' && tipoInput != 'email') return;
        const loc = this._f2LocaleR7(coldef), modo = this._f2InputMode(coldef);
        if (modo) input.setAttribute('inputmode', modo);
        input.setAttribute('autocomplete', 'off');
        let texto = input.value;
        if (conValorActual && dato != undefined) texto = this._f2TextoParaEditor(coldef, dato, loc);
        if (mask)
        {
            const opc = this._f2OpcMask(coldef), r = EditTable.Mask.apply(mask, texto, opc);
            input.value = r.display;
            try { input.setSelectionRange(r.caret, r.caret); } catch (e) { }
            input.addEventListener('beforeinput', (e) => this._f2AlTeclear(e, input, mask, opc));
        }
        else input.value = texto;
        input._f2 = { coldef, loc, mask };
        input._f2Inicial = input.value;
        input._f2Conv = () => this._f2Convertir(input).valor;
    }
    _f2TextoParaEditor(coldef, dato, loc)
    {
        if (dato == null) return '';
        if (this._f2Mask(coldef)) return String(dato);
        const t = this._f2Tipo(coldef);
        if (t == 'number')
        {
            const c = (typeof dato == 'number' ? this._f2Canonico(dato, coldef) : (this._f2EsCanonico(String(dato).trim()) ? String(dato).trim() : null));
            if (c == null) return String(dato);
            const S = this._f2Sep(loc);
            return (S.d == '.' ? c : c.replace('.', S.d));
        }
        if (t == 'date') return (this._f2FechaATexto(dato, loc) ?? String(dato));
        return String(dato);
    }
    static _f2Acciones = { insertText: 'insert', insertFromPaste: 'paste', insertFromDrop: 'paste', insertReplacementText: 'paste',
        deleteContentBackward: 'backspace', deleteContentForward: 'delete', deleteWordBackward: 'backspace', deleteWordForward: 'delete', deleteByCut: 'delete' };
    // §3: mientras se teclea se insertan los literales y se rechaza lo que no corresponde.
    _f2AlTeclear(e, input, mask, opc)
    {
        if (e.isComposing) return;
        const tipo = EditTable._f2Acciones[e.inputType];
        e.preventDefault();
        if (!tipo) return;
        const text = (tipo == 'insert' || tipo == 'paste') ? (e.data ?? e.dataTransfer?.getData('text/plain') ?? '') : '';
        const r = EditTable.Mask.edit(mask, { display: input.value, caret: input.selectionStart, end: input.selectionEnd }, { type: tipo, text }, opc);
        if (!r.accepted) return;
        input.value = r.display;
        try { input.setSelectionRange(r.caret, r.caret); } catch (e) { }
    }
    // Lo tecleado → {ok, valor (lo que va a DataArray), reason, cancelar (valor por omisión de cancel)}.
    _f2Convertir(input)
    {
        const { coldef, loc, mask } = input._f2, texto = input.value;
        if (mask)
        {
            const opc = this._f2OpcMask(coldef), u = EditTable.Mask.unformat(mask, texto, opc);
            const patron = this._f2MaskEsPatron(mask);
            const v = EditTable.Mask.validate(mask, (patron ? u.raw : texto), opc);
            const conLiterales = (patron && String(coldef['mask-keep'] ?? '').trim().toLowerCase() == 'formatted');
            const valor = (u.raw === '' ? '' : (conLiterales ? EditTable.Mask.format(mask, u.raw, opc) : (this._f2Tipo(coldef) == 'number' ? (EditTable.Mask.canonicalFromText(u.canonical, { native: true }) ?? u.canonical) : u.canonical)));
            return { ok: v.ok, valor, reason: v.reason, cancelar: false };
        }
        const t = this._f2Tipo(coldef);
        if (t == 'date')
        {
            const f = this._f2LeerFecha(texto, loc);
            return (f == null ? { ok: false, valor: texto, reason: 'fecha', cancelar: true } : { ok: true, valor: f, reason: '' });
        }
        if (this._f2Calc(coldef) && texto.trim().startsWith('='))
        {
            const r = EditTable.Mask.calc(texto, { locale: loc });
            return (r.ok ? { ok: true, valor: r.canonical, reason: '' } : { ok: false, valor: texto, reason: 'calc', cancelar: true, error: r.error });
        }
        const c = EditTable.Mask.canonicalFromText(texto, { locale: loc });
        return (c == null ? { ok: false, valor: texto, reason: 'invalid', cancelar: true } : { ok: true, valor: c, reason: '' });
    }
    // Al principio de ConfirmEdit: valida el editor de F2 (MaskInvalid) y marca la celda con value-type.
    // false: no se confirma (la celda sigue en edición).
    _f2AntesDeConfirmar(td)
    {
        this._f2Confirmando = null;
        if (!this.Editing) return true;
        const input = this.EdiTable.GetInput(), coldef = this.GetColumnDef();
        if (!input || !coldef) return true;
        if (input._f2 && input.value !== input._f2Inicial)
        {
            const r = this._f2Convertir(input);
            if (!r.ok)
            {
                // Integración (A1 de la revisión de F1, que F2 no tenía): el aviso y el foco solo en un confirmar
                // del usuario. Desde el intervalo de auto-confirm, o con el foco fuera de la tabla, no se confirma,
                // no se avisa y no se toma el foco; el editor se queda como está.
                const delUsuario = (!this._f1AutoConfirmando && (this._f1ConfirmDesdeCelda || !!this._shadow?.activeElement));
                // Un mismo valor se avisa una vez: si se vuelve a confirmar sin cambiarlo, se repite la decisión.
                let cancel = input._f2Aviso?.value === input.value ? input._f2Aviso.cancel : undefined;
                if (cancel === undefined && !delUsuario) return false;
                if (cancel === undefined)
                {
                    const args = { sender: this._getCurren(), td, input, row: this.RowIndexOfTd(td), field: coldef.field,
                        value: input.value, reason: r.reason, cancel: !!r.cancelar };
                    this._fireEvent(this.EdiTable.Const.Events.MaskInvalid, args);
                    cancel = !!args.cancel;
                    input._f2Aviso = { value: input.value, cancel };
                }
                if (cancel)
                {
                    if (delUsuario && input.isConnected) input.focus();
                    return false;
                }
            }
        }
        if (String(coldef.valueType ?? coldef['value-type'] ?? '').trim().toLowerCase() == 'number')
            this._f2Confirmando = { row: this.RowIndexOfTd(td), field: coldef.field };
        return true;
    }
    // Al principio de UpdateDataMember: programa el recálculo de totales y aplica value-type="number" (C12).
    _f2AlActualizar(row, field, value)
    {
        this._f2Programar();
        const c = this._f2Confirmando;
        if (!c || c.row !== row || c.field !== field) return value;
        this._f2Confirmando = null;
        if (typeof value != 'string' || value.trim() === '') return value;
        const can = EditTable.Mask.canonicalFromText(value, { native: true });
        if (can != null)
        {
            const n = Number(can);
            if (isFinite(n) && EditTable.Mask.canonicalFromText(String(n), { native: true }) === can) return n;
        }
        this._fireEvent(this.EdiTable.Const.Events.ValueTypeFallback, { sender: this._getCurren(), row, field, text: value });
        return value;
    }

    // ---------- totales (§2)
    _f2TieneTotal(col)
    {
        const s = String(col?.summary ?? '').trim().toLowerCase();
        return ['sum', 'count', 'avg', 'min', 'max', 'custom'].includes(s);
    }
    _f2SysCols() { return (this._etSysCols?.() ?? 0); }   // F4: celdas del sistema al principio de cada fila
    _f2CrearPie()
    {
        if (this._f2Pie || !this._table) return;
        const estilo = document.createElement('style');
        estilo.setAttribute('data-f2', 'summary');
        // Antes del <style> principal, para que control-styles pueda sobrescribirlo.
        estilo.textContent = `
            table > tfoot { position: sticky; bottom: 0; z-index: 99; background-color: #F5F5F5; }
            tfoot td.et-summary { padding: 4px 8px; outline: 1px solid #DDD; font-weight: 600; white-space: nowrap; }
            table.et-cards > tfoot { display: none !important; }
            @media print { table > tfoot { position: static; } }
            @media screen and (max-width: 768px) { .table-cards > tfoot { display: none !important; } }`;
        this._shadow.prepend(estilo);
        this._f8bReescribirTodo?.();   // F8b: variables del tema en la hoja nueva
        this._f2Pie = document.createElement('tfoot');
        this._f2Pie.appendChild(document.createElement('tr')).className = 'et-summary-row';
        this._table.appendChild(this._f2Pie);
        this._f2CeldasPie();
        this._f2Sucio = true;
        this._f2Programar();
    }
    // Una celda por celda de datos (más las del sistema al principio), alineadas con Columns (R3).
    _f2CeldasPie()
    {
        const tr = this._f2Pie?.rows[0];
        if (!tr) return null;
        const sys = this._f2SysCols(), n = sys + this.Columns.length;
        if (tr.cells.length != n)
        {
            tr.innerHTML = '';
            for (let i = 0; i < n; i++)
            {
                const td = tr.insertCell();
                if (i < sys) { td.className = 'et-sel-col'; continue; }
                td.className = 'et-summary';
                const col = this.Columns[i - sys];
                if (col?.field != undefined && this._f1ColumnaOculta(col.field)) td.classList.add('hidde-col');
            }
        }
        return { tr, sys };
    }
    _f2OcultarCeldaPie(cellIndex, hide)
    {
        const td = this._f2Pie?.rows[0]?.cells[cellIndex];
        if (td) td.classList.toggle('hidde-col', !!hide);
    }
    _f2Programar()
    {
        if (!this._f2Pie) return;
        this._f2Sucio = true;
        if (this._f2Programado) return;
        this._f2Programado = true;
        queueMicrotask(() => { this._f2Programado = false; if (this._f2Sucio) this.RefreshSummaries(); });
    }
    _f2Alcance()
    {
        const s = String(this.SummaryScope ?? 'all').trim().toLowerCase();
        if (this._f2ScopeDeclarado || (s && s != 'all')) return s;
        return (((this.getGroups?.() ?? []).length || this._f8Fuera) ? 'visible' : 'all');   // P4: con agrupación (F6) o filtro (F8a), visible
    }
    _f2Filas(alcance)
    {
        const datos = (this.DataArray ?? []);
        if (alcance == 'selected')
            return (typeof this.getSelectedRows == 'function' ? this.getSelectedRows().map(i => datos[i]).filter(r => r != undefined) : []);
        if (alcance == 'visible' && this._f5Activo) return this._f5DatosVisibles();   // F5: «visible» por grupo, no «dibujada»
        if (alcance == 'visible')
        {
            const tbody = this._f1TBodyPrincipal(), filas = [];
            if (!tbody) return datos;
            for (const tr of tbody.rows)
            {
                if (tr.classList.contains('hidde-row') || tr.classList.contains('et-group-row') || tr.classList.contains('et-spacer')) continue;
                const i = this._getRowIndex(tr);
                if (i >= 0 && datos[i] != undefined) filas.push(datos[i]);
            }
            return filas;
        }
        return datos;
    }
    // Aritmética decimal exacta: cadena canónica ↔ {n: BigInt, s: escala}.
    _f2Dec(c)
    {
        const neg = c.startsWith('-'), [e, f = ''] = (neg ? c.slice(1) : c).split('.');
        const n = BigInt(e + f);
        return { n: (neg ? -n : n), s: f.length };
    }
    _f2Escalar(x, s) { return x.n * (10n ** BigInt(s - x.s)); }
    _f2DecATexto(n, s)
    {
        const neg = n < 0n, d = (neg ? -n : n).toString().padStart(s + 1, '0');
        const t = (s ? d.slice(0, -s) + '.' + d.slice(-s) : d);
        return EditTable.Mask.canonicalFromText((neg ? '-' : '') + t, { native: true });
    }
    _f2Quitar0(t) { return (t.includes('.') ? t.replace(/\.?0+$/, '') : t); }
    // {valor (número o null), texto (cadena canónica exacta, o null)} de una columna.
    _f2CalcularColumna(col, filas, alcance)
    {
        const tipo = String(col.summary).trim().toLowerCase(), field = col.field;
        if (tipo == 'custom')
        {
            const v = (typeof this.SummaryFunction == 'function' ? this.SummaryFunction(field, filas) : null);
            return { valor: (v === undefined ? null : v), texto: (typeof v == 'number' && isFinite(v) ? EditTable.Mask.toCanonical(v) : (v == null ? null : String(v))) };
        }
        if (tipo == 'count')
        {
            const n = filas.filter(r => { const v = r?.[field]; return v != null && String(v).trim() !== ''; }).length;
            return { valor: n, texto: String(n) };
        }
        const nums = [];
        filas.forEach(r => { const c = this._f2Canonico(r?.[field], col); if (c != null) nums.push(this._f2Dec(c)); });
        if (!nums.length) return (tipo == 'sum' ? { valor: 0, texto: '0' } : { valor: null, texto: null });
        const S = Math.max(...nums.map(x => x.s));
        let texto;
        if (tipo == 'sum' || tipo == 'avg')
        {
            let suma = 0n;
            nums.forEach(x => suma += this._f2Escalar(x, S));
            if (tipo == 'sum') texto = this._f2DecATexto(suma, S);
            else
            {
                // Promedio con 10 decimales más, redondeado a la mitad hacia afuera.
                const k = BigInt(nums.length), escala = suma * (10n ** 10n), neg = escala < 0n, a = (neg ? -escala : escala);
                const q = (a * 2n + k) / (2n * k);
                texto = this._f2Quitar0(this._f2DecATexto(neg ? -q : q, S + 10));
            }
        }
        else
        {
            let mejor = nums[0];
            nums.forEach(x => { const a = this._f2Escalar(x, S), b = this._f2Escalar(mejor, S); if (tipo == 'min' ? a < b : a > b) mejor = x; });
            texto = this._f2DecATexto(mejor.n, mejor.s);
        }
        return { valor: Number(texto), texto };
    }
    _f2TextoPie(col, r)
    {
        if (r.valor == null && r.texto == null) return '';
        const tipo = String(col.summary).trim().toLowerCase(), sf = String(col['summary-format'] ?? 'inherit').trim();
        let fmt = null;
        if (sf && sf.toLowerCase() != 'inherit')
        {
            try
            {
                const j = JSON.parse(sf);
                fmt = { type: 'Number', format: 'true', field: col.field, locale: col.locale };
                Object.keys(j ?? {}).forEach(k => fmt[k] = String(j[k]));
            }
            catch (e) { fmt = null; }
        }
        else if (tipo != 'count' && (col.format ?? '') == 'true') fmt = { ...col, type: 'Number' };   // custom numérico también hereda
        let texto = r.texto ?? String(r.valor);
        if (fmt && (fmt.format ?? '') == 'true' && r.texto != null && isFinite(Number(r.texto))) texto = this._aplyFormat(fmt, r.texto);
        else if (r.texto != null && this._f2EsCanonico(texto)) texto = this._f2Presentar({ type: 'Number', locale: col.locale }, texto);
        const etiqueta = col['summary-label'];
        if (etiqueta == undefined || etiqueta === '') return texto;
        return (etiqueta.includes('{value}') ? etiqueta.split('{value}').join(texto) : etiqueta + ' ' + texto);
    }
    /** Recalcula todos los totales, actualiza el pie (sin volver a dibujar las filas) y dispara SummaryCalculated. */
    RefreshSummaries = () =>
    {
        this._f2Sucio = false;
        const alcance = this._f2Alcance(), filas = this._f2Filas(alcance), valores = {};
        this.Columns.forEach(col => { if (this._f2TieneTotal(col) && col.field != undefined && !(col.field in valores)) valores[col.field] = this._f2CalcularColumna(col, filas, alcance); });
        this._f2Valores = valores;
        const pie = this._f2CeldasPie();
        if (pie)
        {
            this.Columns.forEach((col, i) => {
                const td = pie.tr.cells[pie.sys + i];
                if (!td) return;
                if (this._f2TieneTotal(col) && valores[col.field])
                {
                    td.setAttribute('data-summary', String(col.summary).trim().toLowerCase());
                    td.textContent = this._f2TextoPie(col, valores[col.field]);
                    if (col.textalign) td.style.textAlign = col.textalign;
                }
                else { td.removeAttribute('data-summary'); td.textContent = ''; }
            });
        }
        Object.keys(valores).forEach(field => this._fireEvent(this.EdiTable.Const.Events.SummaryCalculated,
            { sender: this._getCurren(), field, value: valores[field].valor, scope: alcance }));
    }
    _f2Actualizados()
    {
        if (this._f2Sucio || !Object.keys(this._f2Valores).length) this.RefreshSummaries();
        return this._f2Valores;
    }
    /** Total de la columna (número), o null si no tiene total. */
    getSummary = (field) =>
    {
        const col = this.Columns.find(c => c?.field == field);
        if (!col || !this._f2TieneTotal(col)) return null;
        return (this._f2Actualizados()[field]?.valor ?? null);
    }
    /** {field: valor} de las columnas con total. */
    getSummaries = () =>
    {
        const v = this._f2Actualizados(), r = {};
        Object.keys(v).forEach(k => r[k] = v[k].valor);
        return r;
    }
    // ===== F2: fin

    // ===== F6: agrupación por columna arrastrando, con subtotales (spec §11, P24-P26)
    //
    // Sin group-panel ni GroupBy() no se agrega nada al DOM ni al CSS (R1): todos los enganches revisan
    // this._f6Grupos.length y salen si está vacío.
    // Modelo: las filas de datos (tr) se conservan; agrupar solo las reacomoda en el tbody y agrega
    // tr.et-group-row (sin índice de datos, R2). El índice de cada tr de datos vive en un mapa propio
    // (_f6Idx: tr → índice de DataArray, _f6Trs: índice → tr) que reemplaza al de F1 mientras hay grupos.
    // DataArray no se reordena por agrupar (I3). Las filas de datos de un grupo colapsado llevan hidde-row
    // (y et-group-hidden), así que NavUp/NavDown y F2 (summary-scope="visible") ya las saltan.
    // La lista de filas lógicas sale de una función pura, EditTable.groupRows, para que F5 la dibuje virtual.
    static { this.features.push('group'); }

    _f6Grupos = [];            // fields de agrupación, en orden de nivel
    _f6Colapsados = new Set(); // pathKey (JSON del arreglo de llaves) de los grupos colapsados
    _f6Idx = new WeakMap();    // tr de datos → índice de DataArray
    _f6Trs = [];               // índice de DataArray → tr
    _f6Pend = new Set();       // filas nuevas (AddRow/InsertRow) que todavía no se colocan en su grupo
    _f6PendApi = new Set();    // filas nuevas que recibieron datos por código (UpdateDataMember sin edición)
    _f6PendV = new Map();      // F5+F6: en virtual, objeto de DataArray nuevo → {ancla, tocado, api}
    _f6PosGrupo = new Map();   // F5+F6: en virtual, pathKey → posición en la lista de F5
    _f6Cache = null;           // F5+F6: lista ya calculada para el siguiente _f5Filas()
    _f6Confirmando = false;    // ConfirmEdit está por llamar a UpdateDataMember (edición del usuario)
    _f6Programado = false;
    _f6Panel = null;
    _f6EstiloEl = null;
    _f6Arrastre = null;        // field del th que se arrastra
    _f6Chip = null;            // field de la chip que se arrastra
    _f6Col = 0;                // última columna visible de datos (para volver de una fila de grupo)
    _f6UI = false;
    GroupPanel = false;        // group-panel ↔ GroupPanel
    _f6Resumen = 'cell';       // group-summary: 'cell' (una celda) | 'inline' (una celda por columna)
    _f6Eventos = Object.assign(this.EdiTable.Const.Events, { BeforeGroup: 'beforegroup', GroupChanged: 'groupchanged', GroupToggled: 'grouptoggled' });

    get GroupSummary() { return this._f6Resumen; }
    set GroupSummary(v)
    {
        this._f6Resumen = (String(v ?? '').trim().toLowerCase() === 'inline' ? 'inline' : 'cell');
        if (this._f6Grupos.length) this._f6Dibujar();
    }

    // ---------- función pura: filas lógicas (para F5) ----------
    /**
     * Lista de filas lógicas de una tabla agrupada, sin DOM.
     * data: DataArray. fields: campos de agrupación. opts:
     *  - indices: índices de data a incluir, en su orden actual (por omisión 0..n-1);
     *  - collapsed: Set o arreglo de pathKey (JSON.stringify del arreglo de llaves) colapsados;
     *  - desc: {field: true} para invertir el orden de los grupos de ese nivel.
     * Devuelve [{type:'group', level, field, key, value, path, pathKey, count, indices, expanded, visible}
     *          | {type:'data', index, level, visible}]. Los grupos van ordenados por llave (vacío primero,
     * números como números) y dentro de cada grupo las filas conservan el orden de `indices`.
     */
    static groupRows(data, fields, opts = {})
    {
        data = (Array.isArray(data) ? data : []);
        fields = (Array.isArray(fields) ? fields : []);
        const col = (opts.collapsed instanceof Set ? opts.collapsed : new Set(opts.collapsed ?? []));
        const desc = (opts.desc ?? {});
        const base = (Array.isArray(opts.indices) ? opts.indices : data.map((_, i) => i));
        const llave = (v) => (v == null ? '' : String(v));
        const num = (v) => (typeof v === 'number' ? v : (typeof v === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v) : NaN));
        const coll = (typeof Intl !== 'undefined' ? new Intl.Collator('es', { numeric: true }) : null);
        const comparar = (a, b) => {
            if (a.k === b.k) return 0;
            if (a.k === '') return -1;
            if (b.k === '') return 1;
            const na = num(a.v), nb = num(b.v);
            if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
            const r = (coll ? coll.compare(a.k, b.k) : (a.k < b.k ? -1 : 1));
            return (r !== 0 ? r : (a.k < b.k ? -1 : 1));
        };
        const out = [];
        const nivel = (indices, level, path, visible) => {
            if (level >= fields.length)
            {
                indices.forEach(index => out.push({ type: 'data', index, level, visible }));
                return;
            }
            const field = fields[level];
            const cubetas = new Map();
            indices.forEach(i => {
                const v = data[i]?.[field];
                const k = llave(v);
                let c = cubetas.get(k);
                if (!c) { c = { k, v, indices: [] }; cubetas.set(k, c); }
                c.indices.push(i);
            });
            const lista = [...cubetas.values()].sort(comparar);
            if (desc[field]) lista.reverse();
            lista.forEach(c => {
                const p = [...path, c.k];
                const pathKey = JSON.stringify(p);
                const expanded = !col.has(pathKey);
                out.push({ type: 'group', level, field, key: c.k, value: c.v, path: p, pathKey, count: c.indices.length, indices: c.indices, expanded, visible });
                nivel(c.indices, level + 1, p, visible && expanded);
            });
        };
        nivel(base, 0, [], true);
        return out;
    }

    // ---------- inicialización y atributos ----------
    _f6Iniciar()
    {
        try
        {
            if (this.hasAttribute('group-summary')) this._f6Resumen = (String(this.getAttribute('group-summary')).trim().toLowerCase() === 'inline' ? 'inline' : 'cell');
            if (this.hasAttribute('group-panel')) this.GroupPanel = this._f3Bool ? this._f3Bool(this.getAttribute('group-panel')) : (this.getAttribute('group-panel') == 'true');
            if (this.GroupPanel) this._f6AplicarPanel();
        }
        catch (e) { console.error('EditTable F6: error al inicializar', e); }
    }
    _f6AtributoCambiado(name, v)
    {
        if (name !== 'group-panel') return;
        this.GroupPanel = (v !== null && !this._f1EsFalso(v));
        this._f6AplicarPanel();
    }
    _f6Disparar(nombre, args)
    {
        const k = this.EdiTable.Const.Events[nombre];
        const ev = this._getCurren().Events;
        const fn = (ev && ev[k]) ?? this.Events?.[k];
        if (typeof fn !== 'function') return args;
        args.sender = this._getCurren();
        try { fn(args); } catch (e) { console.error('EditTable: error en el manejador de ' + nombre, e); }
        return args;
    }
    _f6Estilo()
    {
        if (this._f6EstiloEl || !this._shadow) return;
        const st = document.createElement('style');
        st.setAttribute('data-et', 'f6');
        st.textContent = `
            .et-group-panel{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; min-height:2rem; padding:4px 6px; margin-bottom:4px; border:1px dashed #CCC; border-radius:4px; background:#FAFAFA; color:#555; font-size:.9rem; box-sizing:border-box; }
            .et-group-panel:empty::before{ content: attr(data-placeholder); color:#888; }
            .et-group-panel.et-drop-over{ border-color:#3D75DD; background:#F0F4FB; }
            .et-group-chip{ display:inline-flex; align-items:center; gap:2px; padding:2px 2px 2px 10px; border:1px solid #BBB; border-radius:12px; background:#FFF; color:#212529; cursor:grab; user-select:none; outline:none; }
            .et-group-chip:focus{ border-color:#3D75DD; }
            .et-group-chip.et-dragging{ opacity:.5; }
            .et-chip-remove{ border:0; background:none; cursor:pointer; padding:0 6px; font-size:1rem; line-height:1; color:#666; }
            .et-chip-remove:hover{ color:#000; }
            tbody tr.et-group-row > td{ padding:4px 6px; outline:1px solid #DDD; background-color:var(--et-group-bg, #EEF2F7); font-weight:600; cursor:default; }
            tbody tr.et-group-row:hover > td{ background-color:var(--et-group-hover-bg, #E5EBF3); }
            tbody tr.et-group-row:focus-within > td{ box-shadow: inset 0 2px 0 #3D75DD, inset 0 -2px 0 #3D75DD; }
            .et-group-label{ display:inline-flex; align-items:center; gap:6px; position:sticky; left:0; white-space:nowrap; outline:none; }
            .et-group-toggle{ display:inline-block; width:1rem; text-align:center; cursor:pointer; }
            tr.et-group-row[aria-expanded="false"] .et-group-toggle{ transform: rotate(-90deg); }
            .et-group-count, .et-group-sums, td.et-group-sum{ font-weight:normal; }
            .et-group-count{ color:#666; }
            table.et-has-fixed tbody tr.et-group-row > td.et-fixed{ background-color:var(--et-group-bg, #EEF2F7); }
            .table-cards tr.et-group-row td::before, table.et-cards tr.et-group-row td::before{ content:none !important; }
            @media print{ .et-group-panel{ display:none !important; } .et-group-toggle{ display:none; } }`;
        this._shadow.appendChild(st);
        this._f6EstiloEl = st;
        this._f8bReescribirTodo?.();   // F8b: variables del tema en la hoja nueva
    }
    // Panel hermano del contenedor de la tabla (antes de él), nunca lo envuelve: div:has(table#id) de V12 no lo alcanza.
    _f6AplicarPanel()
    {
        if (!this._table || !this._shadow) return;
        if (!this.GroupPanel)
        {
            if (this._f6Panel) { this._f6Panel.remove(); }
            this._f6Draggables(false);
            return;
        }
        this._f6Estilo();
        if (!this._f6Panel)
        {
            const p = document.createElement('div');
            p.className = 'et-group-panel';
            p.setAttribute('data-placeholder', 'Arrastre aquí el encabezado de una columna para agrupar');
            this._f6Panel = p;
            this._f6EventosPanel(p);
        }
        const cont = this._table.parentElement;
        if (!this._f6Panel.isConnected && cont && cont.parentNode) cont.parentNode.insertBefore(this._f6Panel, cont);
        this._f6EventosEncabezado();
        this._f6Draggables(true);
        this._f6PintarPanel();
    }
    _f6Agrupable(field)
    {
        const c = this.Columns.find(x => x && x.field === field);
        return !!(c && field != undefined && field !== '' && !this._f1EsFalso(c.groupable ?? ''));
    }
    // Los th agrupables se pueden arrastrar (aunque no haya column-reorder).
    _f6Draggables(on)
    {
        const enc = this._f3FilaEnc ? this._f3FilaEnc() : this._table?.tHead?.rows[0];
        if (!enc) return;
        Array.from(enc.cells).forEach(th => {
            const f = th.getAttribute('field');
            if (th.classList.contains('et-sel-col') || f == null) return;
            if (on && this._f6Agrupable(f)) { if (th.getAttribute('draggable') !== 'true') { th.setAttribute('draggable', 'true'); th._f6Drag = true; } }
            else if (th._f6Drag && !(this._f3Reorder && !this._f1EsFalso(this.Columns.find(c => c?.field === f)?.reorder ?? ''))) { th.removeAttribute('draggable'); th._f6Drag = false; }
        });
    }
    _f6EventosEncabezado()
    {
        const thead = this._table?.tHead;
        if (!thead || thead._f6UI) return;
        thead._f6UI = true;
        thead.addEventListener('dragstart', (e) => {
            if (!this.GroupPanel) return;
            let el = e.target; if (el && el.nodeType !== 1) el = el.parentElement;
            const th = el?.closest?.('th');
            const f = th?.getAttribute('field');
            this._f6Arrastre = (f != null && this._f6Agrupable(f) && !this._f6Grupos.includes(f)) ? f : null;
            if (this._f6Arrastre != null) { try { if (!e.dataTransfer.getData('text/plain')) e.dataTransfer.setData('text/plain', f); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } }
        });
        thead.addEventListener('dragend', () => { this._f6Arrastre = null; this._f6Panel?.classList.remove('et-drop-over'); });
    }
    _f6EventosPanel(p)
    {
        const sobre = (e) => {
            if (this._f6Arrastre == null && this._f6Chip == null) return;
            e.preventDefault();
            try { e.dataTransfer.dropEffect = 'move'; } catch (x) { }
            p.classList.add('et-drop-over');
            this._f3OcultarIndicador?.();
        };
        p.addEventListener('dragenter', sobre);
        p.addEventListener('dragover', sobre);
        p.addEventListener('dragleave', (e) => { if (!p.contains(e.relatedTarget)) p.classList.remove('et-drop-over'); });
        p.addEventListener('drop', (e) => {
            p.classList.remove('et-drop-over');
            const th = this._f6Arrastre, chip = this._f6Chip;
            if (th == null && chip == null) return;
            e.preventDefault(); e.stopPropagation();
            this._f6Arrastre = null; this._f6Chip = null;
            this._f3FinArrastre?.();
            // Posición: antes de la chip bajo el puntero si cae en su mitad izquierda; si no, después; al final por omisión.
            const chips = Array.from(p.children);
            let pos = this._f6Grupos.length;
            for (let k = 0; k < chips.length; k++)
            {
                const r = chips[k].getBoundingClientRect();
                if (e.clientX < r.left + r.width / 2 && (e.clientY <= r.bottom || k === chips.length - 1)) { pos = k; break; }
            }
            const g = this._f6Grupos.slice();
            if (chip != null)
            {
                const from = g.indexOf(chip);
                if (from < 0) return;
                g.splice(from, 1);
                if (pos > from) pos--;
                g.splice(pos, 0, chip);
            }
            else
            {
                if (!this._f6Agrupable(th) || g.includes(th)) return;
                g.splice(pos, 0, th);
            }
            this._f6ComoUsuario(() => this.GroupBy(g));
        });
    }
    _f6ComoUsuario(fn) { return (typeof this._f3ComoUsuario === 'function') ? this._f3ComoUsuario(fn) : fn(); }
    _f6Titulo(field)
    {
        const c = this.Columns.find(x => x && x.field === field);
        return String(c?.title ?? field ?? '').trim();
    }
    _f6PintarPanel()
    {
        const p = this._f6Panel;
        if (!p) return;
        p.innerHTML = '';
        this._f6Grupos.forEach(f => {
            const chip = document.createElement('div');
            chip.className = 'et-group-chip';
            chip.setAttribute('data-field', f);
            chip.setAttribute('draggable', 'true');
            chip.setAttribute('tabindex', '0');
            const s = document.createElement('span');
            s.className = 'et-chip-label';
            s.textContent = this._f6Titulo(f);
            const x = document.createElement('button');
            x.type = 'button';
            x.className = 'et-chip-remove';
            x.setAttribute('data-remove', '');
            x.setAttribute('tabindex', '-1');
            x.setAttribute('aria-label', 'Quitar agrupación por ' + this._f6Titulo(f));
            x.textContent = '×';
            chip.append(s, x);
            x.addEventListener('click', (e) => { e.stopPropagation(); this._f6ComoUsuario(() => this.GroupBy(this._f6Grupos.filter(g => g !== f))); });
            chip.addEventListener('dragstart', (e) => {
                this._f6Chip = f;
                chip.classList.add('et-dragging');
                try { e.dataTransfer.setData('text/plain', f); e.dataTransfer.effectAllowed = 'move'; } catch (z) { }
            });
            chip.addEventListener('dragend', () => { this._f6Chip = null; chip.classList.remove('et-dragging'); });
            chip.addEventListener('keydown', (e) => {
                const g = this._f6Grupos.slice(), i = g.indexOf(f);
                if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this._f6ComoUsuario(() => this.GroupBy(g.filter(x => x !== f))); }
                else if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))
                {
                    const j = i + (e.key === 'ArrowLeft' ? -1 : 1);
                    if (j < 0 || j >= g.length) return;
                    e.preventDefault();
                    g.splice(i, 1); g.splice(j, 0, f);
                    this._f6ComoUsuario(() => this.GroupBy(g));
                    this._f6Panel?.querySelector(`.et-group-chip[data-field="${CSS.escape(f)}"]`)?.focus();
                }
            });
            p.appendChild(chip);
        });
    }

    // ---------- API (§11) ----------
    getGroups() { return this._f6Grupos.slice(); }
    GroupBy(fields)
    {
        let g = (Array.isArray(fields) ? fields : (fields == null || fields === '' ? [] : [fields]));
        g = g.map(f => String(f)).filter((f, k, a) => a.indexOf(f) === k && this._f6Agrupable(f));
        if (g.length && this.ShowAsTree)
        {
            console.warn('EditTable: la agrupación no funciona junto con show-tree; se conserva el árbol.');
            return false;
        }
        if (JSON.stringify(g) === JSON.stringify(this._f6Grupos)) return false;
        const args = this._f6Disparar('BeforeGroup', { groups: g.slice(), cancel: false });
        if (args.cancel) return false;
        if (Array.isArray(args.groups)) g = args.groups.map(f => String(f)).filter((f, k, a) => a.indexOf(f) === k && this._f6Agrupable(f));
        this._f6Aplicar(g);
        this._f6PintarPanel();
        this._f6Disparar('GroupChanged', { groups: g.slice() });
        this._f3Cambio?.('group');
        this._f2Programar?.();
        return true;
    }
    Ungroup() { return this.GroupBy([]); }
    ExpandAllGroups() { return this._f6Todos(true); }
    CollapseAllGroups() { return this._f6Todos(false); }
    ExpandGroup(path) { return this._f6Alternar(path, true); }
    CollapseGroup(path) { return this._f6Alternar(path, false); }

    _f6Aplicar(g)
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) { this._f6Grupos = g; return; }
        if (this._f5Activo) { this._f6Grupos = g; this._f6Colapsados = new Set(); this._f6PendV.clear(); if (g.length) this._f6Estilo(); this._f6RearmarV(); return; }   // F5+F6: la lista virtual incluye los grupos
        const antes = this._f6Grupos.length > 0;
        if (!antes && g.length)
        {
            // Antes de agrupar, la posición del tr es el índice (mapa de F1).
            this._f6Trs = [];
            this._f6Idx = new WeakMap();
            this._f6Pend.clear(); this._f6PendApi.clear();
            let i = 0;
            Array.from(tbody.rows).forEach(tr => {
                if (tr.classList.contains('et-group-row') || tr.classList.contains('et-spacer')) return;
                this._f6Trs[i] = tr; this._f6Idx.set(tr, i);
                if (i >= this.DataArray.length) this._f6Pend.add(tr);
                i++;
            });
        }
        this._f6Grupos = g;
        this._f6Colapsados = new Set();
        if (g.length) { this._f6Estilo(); this._f6Dibujar(); }
        else if (antes) this._f6Desagrupar(tbody);
    }
    // Vuelve a la lista normal: filas de datos en el orden de DataArray (las nuevas sin datos, en su índice).
    _f6Desagrupar(tbody)
    {
        const act = this._shadow?.activeElement;
        const enGrupo = !!act?.closest?.('tr.et-group-row');
        tbody.querySelectorAll(':scope > tr.et-group-row').forEach(r => r.remove());
        const frag = document.createDocumentFragment();
        this._f6Trs.forEach(tr => { if (tr) { tr.classList.remove('hidde-row', 'et-group-hidden'); frag.appendChild(tr); } });
        tbody.appendChild(frag);
        this._f6Trs = []; this._f6Idx = new WeakMap(); this._f6Pend.clear(); this._f6PendApi.clear();
        this._f8Reocultar?.();   // F8a: las filas filtradas siguen ocultas
        this._f6Restaurar(act, null);
        if (enGrupo) this.EdiTable.focusedTable = null;
        this._f3TrasDibujar?.();
        this._f2Programar?.();
    }
    _f6Todos(expandir)
    {
        if (!this._f6Grupos.length) return false;
        const antes = this._f6Colapsados.size;
        if (expandir) this._f6Colapsados.clear();
        else this._f6Modelo().forEach(e => { if (e.type === 'group') this._f6Colapsados.add(e.pathKey); });
        if (antes === this._f6Colapsados.size && (expandir || antes === 0)) { if (expandir) return false; }
        this._f6Visibilidad();
        this._f6Disparar('GroupToggled', { path: null, expanded: !!expandir, all: true });
        return true;
    }
    _f6Alternar(path, expandir)
    {
        if (!this._f6Grupos.length || !Array.isArray(path)) return false;
        const k = JSON.stringify(path.map(x => (x == null ? '' : String(x))));
        if (this._f5Activo) return this._f6AlternarV(k, expandir);   // F5+F6
        const tr = this._f6FilaDeGrupo(k);
        if (!tr) return false;
        if (expandir === undefined) expandir = this._f6Colapsados.has(k);
        if (this._f6Colapsados.has(k) === !expandir) return false;
        if (expandir) this._f6Colapsados.delete(k); else this._f6Colapsados.add(k);
        this._f6Visibilidad();
        // Si el foco quedó dentro de lo que se colapsó, pasa a la fila del grupo.
        const cur = this.CurrentTd()?.closest('tr');
        const act = this._shadow?.activeElement?.closest?.('tr');
        if (!expandir && ((cur && cur.classList.contains('hidde-row')) || (act && act !== tr && act.classList.contains('hidde-row')))) this._f6EnfocarGrupo(this._f6FilaDeGrupo(k));
        this._f6Disparar('GroupToggled', { path: JSON.parse(k), expanded: !!expandir });
        return true;
    }
    _f6FilaDeGrupo(pathKey)
    {
        if (this._f5Activo) { const p = this._f6PosGrupo.get(pathKey); return (p == null ? null : (this._f5Trs.get(p) ?? null)); }   // F5+F6: solo si está dibujada
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return null;
        for (const tr of tbody.rows) if (tr._f6Grupo && tr._f6Grupo.pathKey === pathKey) return tr;
        return null;
    }

    // ---------- modelo y dibujo ----------
    // Orden de los grupos de un nivel invertido si la tabla está ordenada DESC por ese campo
    // (th.ascendent marca DESC: clases invertidas, P36).
    _f6Desc()
    {
        const d = {};
        this._f6Grupos.forEach(f => { const th = (this._f3ThDe ? this._f3ThDe(f) : null); if (th && th.classList.contains('ascendent')) d[f] = true; });
        return d;
    }
    _f6Modelo(pend)
    {
        let idx = [];   // F8a: let (el filtro la reemplaza)
        if (this._f5Activo)   // F5+F6: todas las filas del modelo, menos las nuevas pendientes
        {
            if (pend === undefined) pend = this._f6PendIdx();
            for (let i = 0; i < this.DataArray.length; i++) if (!pend || !pend.has(i)) idx.push(i);
        }
        else
        for (let i = 0; i < this.DataArray.length; i++) { const tr = this._f6Trs[i]; if (tr && !this._f6Pend.has(tr)) idx.push(i); }
        if (this._f8Fuera) idx = this._f8FiltrarIdx(idx);   // F8a: se agrupan solo las filas que pasan el filtro
        return EditTable.groupRows(this.DataArray, this._f6Grupos, { indices: idx, collapsed: this._f6Colapsados, desc: this._f6Desc() });
    }
    _f6Subtotales(indices)
    {
        const out = [];
        if (typeof this._f2TieneTotal !== 'function') return out;
        const filas = indices.map(i => this.DataArray[i]).filter(r => r != undefined);
        this.Columns.forEach((col, i) => {
            if (!this._f2TieneTotal(col) || col.field == undefined) return;
            let texto = '';
            try { texto = this._f2TextoPie(col, this._f2CalcularColumna(col, filas, 'group')); } catch (e) { texto = ''; }
            out.push({ i, col, texto });
        });
        return out;
    }
    _f6TextoLlave(e)
    {
        const col = this.Columns.find(c => c && c.field === e.field);
        let t = e.key;
        try { if (col && e.indices.length && typeof this._f4Texto === 'function') t = this._f4Texto(col, this.DataArray[e.indices[0]], false); } catch (x) { }
        t = String(t ?? '');
        return (t.trim() === '' ? '(vacío)' : t);
    }
    // Construye un tr.et-group-row (sin índice de datos).
    _f6FilaGrupo(e)
    {
        const tr = document.createElement('tr');
        tr.className = 'et-group-row';
        tr.setAttribute('data-level', String(e.level));
        tr.setAttribute('data-key', e.key);
        tr.setAttribute('aria-level', String(e.level + 1));
        tr.setAttribute('aria-expanded', String(e.expanded));
        if (!e.visible) tr.classList.add('hidde-row', 'et-group-hidden');
        tr._f6Grupo = e;
        const sys = (this._etSysCols?.() ?? 0);
        for (let s = 0; s < sys; s++) { const td = document.createElement('td'); td.className = 'et-sel-col'; tr.appendChild(td); }

        const etiqueta = document.createElement('div');
        etiqueta.className = 'et-group-label';
        etiqueta.setAttribute('tabindex', '-1');
        etiqueta.style.paddingLeft = (e.level * 1.25) + 'rem';
        const tg = document.createElement('span'); tg.className = 'et-group-toggle'; tg.textContent = '▾';
        const ti = document.createElement('span'); ti.className = 'et-group-title'; ti.textContent = this._f6Titulo(e.field) + ':';
        const ll = document.createElement('span'); ll.className = 'et-group-key'; ll.textContent = this._f6TextoLlave(e);
        const ct = document.createElement('span'); ct.className = 'et-group-count'; ct.textContent = '(' + e.count + ')';
        etiqueta.append(tg, ti, ll, ct);

        const subt = this._f6Subtotales(e.indices);
        const oculta = (c) => (c?.field != undefined && this._f1ColumnaOculta(c.field));
        if (this._f6Resumen === 'inline')
        {
            const primera = this.Columns.findIndex(c => c && !oculta(c));
            this.Columns.forEach((c, i) => {
                const td = document.createElement('td');
                td.className = 'et-group-cell';
                if (oculta(c)) td.classList.add('hidde-col');
                if (i === primera) td.appendChild(etiqueta);
                const s = subt.find(x => x.i === i);
                if (s && s.texto !== '')
                {
                    td.classList.add('et-group-sum');
                    td.setAttribute('data-summary', String(c.summary).trim().toLowerCase());
                    if (i === primera) td.append(' ', s.texto); else td.textContent = s.texto;
                    if (c.textalign) td.style.textAlign = c.textalign;
                }
                tr.appendChild(td);
            });
        }
        else
        {
            const td = document.createElement('td');
            td.className = 'et-group-cell';
            td.colSpan = Math.max(1, this.Columns.filter(c => c && !oculta(c)).length);
            const partes = subt.filter(s => s.texto !== '').map(s => String(s.col.title ?? s.col.field).trim() + ': ' + s.texto);
            if (partes.length)
            {
                const su = document.createElement('span');
                su.className = 'et-group-sums';
                su.textContent = '· ' + partes.join(' · ');
                etiqueta.appendChild(su);
            }
            td.appendChild(etiqueta);
            tr.appendChild(td);
        }
        tr._f6Firma = e.count + '|' + subt.map(s => s.texto).join('|') + '|' + ll.textContent;
        tr.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (ev.target.closest('.et-group-toggle')) this._f6Alternar(tr._f6Grupo.path);
            this._f6EnfocarGrupo(this._f6FilaDeGrupo(tr._f6Grupo.pathKey) ?? tr);
        });
        tr.addEventListener('dblclick', (ev) => { if (!ev.target.closest('.et-group-toggle')) this._f6Alternar(tr._f6Grupo.path); });
        etiqueta.addEventListener('keydown', (ev) => this._f6TeclaGrupo(ev, tr));
        return tr;
    }
    // Reacomoda el tbody: filas de grupo nuevas + filas de datos existentes (no se vuelven a pintar).
    // Las filas nuevas pendientes se quedan junto a la fila que tenían antes.
    _f6Dibujar()
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody || !this._f6Grupos.length) return;
        if (this._f5Activo) { this._f6RearmarV({ expandirActual: true }); return; }   // F5+F6
        const act = this._shadow?.activeElement;
        const grupoFoco = act?.closest?.('tr.et-group-row')?._f6Grupo?.pathKey ?? null;
        const anclas = [];
        Array.from(tbody.rows).forEach(tr => {
            if (!this._f6Pend.has(tr)) return;
            let a = tr.previousElementSibling;
            while (a && this._f6Pend.has(a)) a = a.previousElementSibling;
            anclas.push([tr, a ? (a._f6Grupo ? 'g' + a._f6Grupo.pathKey : a) : null]);
        });
        tbody.querySelectorAll(':scope > tr.et-group-row').forEach(r => r.remove());
        const seq = [];
        let ent = this._f6Modelo();
        // Si la fila con el foco quedó dentro de un grupo colapsado (por ejemplo, al editar su llave), se expande.
        const ci = this._f6IndiceDeTr(this.CurrentTd()?.closest('tr'));
        if (ci >= 0 && ent.some(e => e.type === 'data' && e.index === ci && !e.visible))
        {
            ent.forEach(e => { if (e.type === 'group' && e.indices.includes(ci)) this._f6Colapsados.delete(e.pathKey); });
            ent = this._f6Modelo();
        }
        ent.forEach(e => {
            if (e.type === 'group') { seq.push(this._f6FilaGrupo(e)); return; }
            const tr = this._f6Trs[e.index];
            tr.classList.toggle('hidde-row', !e.visible);
            tr.classList.toggle('et-group-hidden', !e.visible);
            seq.push(tr);
        });
        anclas.forEach(([tr, a]) => {
            tr.classList.remove('hidde-row', 'et-group-hidden');
            let k = -1;
            if (a === null) k = -1;
            else k = seq.findIndex(x => (typeof a === 'string' ? (x._f6Grupo && 'g' + x._f6Grupo.pathKey === a) : x === a));
            if (a !== null && k < 0) k = seq.length - 1;
            seq.splice(k + 1, 0, tr);
        });
        const frag = document.createDocumentFragment();
        seq.forEach(tr => frag.appendChild(tr));
        tbody.appendChild(frag);
        this._f6Restaurar(act, grupoFoco);
        this._f3TrasDibujar?.();
        this._f2Programar?.();
    }
    _f6Restaurar(act, grupoFoco)
    {
        try
        {
            if (grupoFoco != null) { const g = this._f6FilaDeGrupo(grupoFoco); if (g) { g.querySelector('.et-group-label')?.focus({ preventScroll: true }); return; } }
            if (act && act.isConnected && this._shadow.activeElement !== act && typeof act.focus === 'function') act.focus({ preventScroll: true });
        }
        catch (e) { }
    }
    // Solo cambia la visibilidad (expandir o colapsar), sin mover filas.
    _f6Visibilidad()
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return;
        if (this._f5Activo) { this._f6RearmarV(); return; }   // F5+F6
        const pila = [];   // pila[nivel] = ese nivel y sus ancestros visibles y expandidos
        for (const tr of tbody.rows)
        {
            const g = tr._f6Grupo;
            if (g)
            {
                const vis = (g.level === 0 ? true : !!pila[g.level - 1]);
                const exp = !this._f6Colapsados.has(g.pathKey);
                g.expanded = exp; g.visible = vis;
                tr.setAttribute('aria-expanded', String(exp));
                tr.classList.toggle('hidde-row', !vis);
                tr.classList.toggle('et-group-hidden', !vis);
                pila[g.level] = vis && exp;
                pila.length = g.level + 1;
                continue;
            }
            if (tr.classList.contains('et-filter-hidden')) continue;   // F8a: la fila filtrada sigue oculta
            const vis = (this._f6Pend.has(tr) || !pila.length || !!pila[this._f6Grupos.length - 1]);
            tr.classList.toggle('hidde-row', !vis);
            tr.classList.toggle('et-group-hidden', !vis);
        }
        this._f2Programar?.();
    }
    _f6Programar()
    {
        if (!this._f6Grupos.length || this._f6Programado) return;
        this._f6Programado = true;
        queueMicrotask(() => this._f6Sincronizar());
    }
    // Coloca las filas nuevas que ya se confirmaron y, si el orden lógico cambió, vuelve a acomodar;
    // si no, solo actualiza conteos y subtotales de las filas de grupo.
    _f6Sincronizar()
    {
        this._f6Programado = false;
        const tbody = this._f1TBodyPrincipal();
        if (!tbody || !this._f6Grupos.length) return;
        if (this._f5Activo) return this._f6SincronizarV();   // F5+F6
        const cur = this.CurrentTd()?.closest('tr') ?? null;
        const colocadas = [];
        this._f6Pend.forEach(tr => {
            const i = this._f6Idx.get(tr);
            if (!tr.isConnected || i == undefined) { this._f6Pend.delete(tr); this._f6PendApi.delete(tr); return; }
            if (this.DataArray[i] == undefined) return;
            if (tr === cur && !this._f6PendApi.has(tr)) return;   // el usuario la sigue capturando
            this._f6Pend.delete(tr);
            if (this._f6PendApi.has(tr)) { this._f6PendApi.delete(tr); colocadas.push(i); }
        });
        // Las que recibieron datos por código se vuelven a pintar con ellos.
        colocadas.forEach(i => {
            const tr = this._f6Trs[i];
            const sel = this.EdiTable.GetSelector();
            const td = (sel && tr.contains(sel)) ? sel.closest('td') : null;
            this.UpdateRow(i);
            if (td && !td.contains(this.EdiTable.GetSelector())) this.CellFocus(td);
        });
        const ent = this._f6Modelo();
        const actual = [];
        for (const tr of tbody.rows) { if (!this._f6Pend.has(tr) && !tr.classList.contains('et-filter-hidden')) actual.push(tr._f6Grupo ? 'g' + tr._f6Grupo.pathKey : tr); }   // F8a: sin las filtradas
        const nuevo = ent.map(e => (e.type === 'group' ? 'g' + e.pathKey : this._f6Trs[e.index]));
        const igual = (actual.length === nuevo.length && actual.every((x, k) => x === nuevo[k]));
        if (!igual) { this._f6Dibujar(); return; }
        const porClave = new Map(ent.filter(e => e.type === 'group').map(e => [e.pathKey, e]));
        Array.from(tbody.rows).forEach(tr => {
            if (!tr._f6Grupo) return;
            const e = porClave.get(tr._f6Grupo.pathKey);
            if (!e) return;
            const nueva = this._f6FilaGrupo(e);
            if (nueva._f6Firma === tr._f6Firma) { tr._f6Grupo = e; return; }
            const foco = tr.contains(this._shadow.activeElement);
            tr.replaceWith(nueva);
            if (foco) nueva.querySelector('.et-group-label')?.focus({ preventScroll: true });
        });
        this._f3TrasDibujar?.();
    }
    // Vuelve a construir las filas de grupo (cambió el orden, la visibilidad de columnas o la celda del sistema).
    _f6TrasColumnas()
    {
        if (!this._f6Grupos.length) { if (this.GroupPanel) this._f6Draggables(true); return; }
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return;
        if (this._f5Activo)   // F5+F6: solo las filas de grupo dibujadas
        {
            Array.from(this._f5Trs).forEach(([p, tr]) => { if (tr._f6Grupo) this._f6Reemplazar(tr, this._f6FilaGrupo(this._f5Lista[p]?.g ?? tr._f6Grupo)); });
            this._f3TrasDibujar?.();
            if (this.GroupPanel) { this._f6Draggables(true); this._f6PintarPanel(); }
            return;
        }
        const porClave = new Map(this._f6Modelo().filter(e => e.type === 'group').map(e => [e.pathKey, e]));
        Array.from(tbody.rows).forEach(tr => {
            if (!tr._f6Grupo) return;
            const e = porClave.get(tr._f6Grupo.pathKey) ?? tr._f6Grupo;
            const foco = tr.contains(this._shadow.activeElement);
            const nueva = this._f6FilaGrupo(e);
            tr.replaceWith(nueva);
            if (foco) nueva.querySelector('.et-group-label')?.focus({ preventScroll: true });
        });
        if (this.GroupPanel) { this._f6Draggables(true); this._f6PintarPanel(); }
    }

    // ---------- enganches en el código existente ----------
    _f6IndiceDeTr(tr) { const i = (this._f5Activo ? this._f5Idx.get(tr) : this._f6Idx.get(tr)); return (i == undefined ? -1 : i); }   // F5+F6
    _f6TrDeIndice(row) { return this._f6Trs[row]; }
    _f6NumFilas()
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return 0;
        let n = 0;
        for (const tr of tbody.rows) if (!tr._f6Grupo) n++;
        return n;
    }
    _f6EsGrupo(td) { return !!(this._f6Grupos.length && td && td.closest && td.closest('tr')?._f6Grupo); }
    // _printRows volvió a dibujar las filas en el orden de DataArray: se rehace el mapa y se agrupa.
    _f6TrasDibujar()
    {
        if (!this._f6Grupos.length) return;
        if (this.ShowAsTree)
        {
            console.warn('EditTable: la agrupación no funciona junto con show-tree; se conserva el árbol.');
            this._f6Grupos = []; this._f6Trs = []; this._f6Idx = new WeakMap(); this._f6Pend.clear(); this._f6PendApi.clear();
            this._f6PintarPanel();
            return;
        }
        const tbody = this._f1TBodyPrincipal();
        this._f6Trs = []; this._f6Idx = new WeakMap(); this._f6Pend.clear(); this._f6PendApi.clear();
        this._f6PendV.clear(); this._f6PosGrupo = new Map();   // F5+F6: salió del modo virtual
        Array.from(tbody.rows).forEach((tr, i) => { this._f6Trs[i] = tr; this._f6Idx.set(tr, i); });
        this._f6Dibujar();
    }
    _f6FilaBorrada(row)
    {
        if (!this._f6Grupos.length) return;
        if (this._f5Activo) return;   // F5+F6: _f5TrasBorrar ya rehízo la lista (con conteos y subtotales)
        const [tr] = this._f6Trs.splice(row, 1);
        if (tr) { this._f6Pend.delete(tr); this._f6PendApi.delete(tr); }
        this._f6Reindexar(row);
        this._f6Programar();
    }
    _f6Reindexar(desde)
    {
        for (let i = desde; i < this._f6Trs.length; i++) { const tr = this._f6Trs[i]; if (tr) this._f6Idx.set(tr, i); }
    }
    // InsertRow con grupos: AddRow va al final de los datos; InsertRow(rw) en el índice rw, junto a la fila
    // que tenía ese índice. La fila queda pendiente hasta que se confirma (§11, AutoAddRow).
    _f6InsertarTr(tbody, rw)
    {
        if (!this._f6Grupos.length) return null;
        const tr = document.createElement('tr');
        let idx;
        if (rw != undefined)
        {
            idx = Math.max(0, Math.min(Math.trunc(Number(rw)) || 0, this._f6Trs.length));
            const ref = this._f6Trs[idx];
            this._f6Trs.splice(idx, 0, tr);
            this._f6Reindexar(idx);
            if (ref && ref.parentElement === tbody) tbody.insertBefore(tr, ref); else tbody.appendChild(tr);
        }
        else
        {
            idx = Math.max(this.DataArray.length, this._f6Trs.length);
            this._f6Trs[idx] = tr;
            this._f6Idx.set(tr, idx);
            tbody.appendChild(tr);
        }
        this._f6Pend.add(tr);
        return tr;
    }
    _f6AlActualizar(row, field, stopfire)
    {
        const usuario = this._f6Confirmando;
        this._f6Confirmando = false;
        if (!this._f6Grupos.length) return;
        if (this._f5Activo)   // F5+F6: fila nueva pendiente (por objeto)
        {
            const info = (this.DataArray[row] != null ? this._f6PendV.get(this.DataArray[row]) : undefined);
            if (info) { info.tocado = true; if (!usuario && !stopfire) info.api = true; }
            this._f6Programar();
            return;
        }
        const tr = this._f6Trs[row];
        if (tr && this._f6Pend.has(tr) && !usuario && !stopfire) this._f6PendApi.add(tr);
        this._f6Programar();
    }
    // Al pasar el foco a otra fila, las filas nuevas que se dejaron se colocan en su grupo.
    _f6TrasFoco(td)
    {
        if (this._f5Activo && this._f6Grupos.length && this._f6PendV.size)   // F5+F6
        {
            const i = this._f5Idx.get(td?.closest?.('tr')), o = (i === undefined ? undefined : this.DataArray[i]);
            for (const x of this._f6PendV.keys()) if (x !== o) { this._f6Programar(); return; }
            return;
        }
        if (!this._f6Grupos.length || !this._f6Pend.size) return;
        const tr = td?.closest?.('tr');
        for (const p of this._f6Pend) if (p !== tr) { this._f6Programar(); return; }
    }
    _f6CadaFila(fn)
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return;
        Array.from(tbody.rows).forEach(tr => {
            if (tr._f6Grupo) return;
            const i = this._f6IndiceDeTr(tr);
            fn(tr, i, (tr._etData ?? this.DataArray[i] ?? {}));
        });
    }
    // Índices de datos entre dos filas, en el orden en que se ven (Mayús+clic de F4).
    _f6IndicesEntre(a, b)
    {
        if (this._f5Activo)   // F5+F6: por posiciones de la lista virtual (las filas de grupos colapsados no están)
        {
            let pa = this._f5Pos[a] ?? -1, pb = this._f5Pos[b] ?? -1;
            if (pa < 0 || pb < 0) return [...new Set([a, b])].filter(k => k >= 0 && k < this.DataArray.length);
            if (pa > pb) [pa, pb] = [pb, pa];
            const out = [];
            for (let p = pa; p <= pb; p++) { const e = this._f5Lista[p]; if (e && e.tipo === 'datos') out.push(e.indice); }
            return out;
        }
        const ta = this._f6Trs[a], tb = this._f6Trs[b];
        const tbody = this._f1TBodyPrincipal();
        if (!ta || !tb || !tbody) return [];
        const filas = Array.from(tbody.rows).filter(tr => !tr._f6Grupo);
        let i = filas.indexOf(ta), j = filas.indexOf(tb);
        if (i > j) [i, j] = [j, i];
        return filas.slice(i, j + 1).filter(tr => !tr.classList.contains('hidde-row') || tr === ta || tr === tb).map(tr => this._f6IndiceDeTr(tr)).filter(k => k >= 0);
    }

    // ---------- foco y teclado ----------
    _f6Visibles()
    {
        const tbody = this._f1TBodyPrincipal();
        return tbody ? Array.from(tbody.rows).filter(tr => !tr.classList.contains('hidde-row')) : [];
    }
    // Foco en una fila de grupo (P24): un elemento enfocable dentro de su celda; CurrentRowIndex() = -1.
    _f6EnfocarGrupo(tr)
    {
        if (!tr || !tr._f6Grupo) return false;
        if (this._f8SalirDeFila?.(null) === false) return false;   // F8a: BeforeRowLeave hacia una fila de grupo
        const pk = tr._f6Grupo.pathKey, tenia = !!this.EdiTable.GetInput();
        if (!this._f6Soltar()) return false;   // F5+F6: separado para usarlo antes de colapsar en virtual
        if (tenia && !tr.isConnected) tr = this._f6FilaDeGrupo(pk);
        if (!tr) return false;
        this._fireBlur = false;
        if (this.CSS.RowSelected) tr.parentElement?.querySelectorAll('tr.' + this.CSS.RowSelected).forEach(r => r.classList.remove(this.CSS.RowSelected));
        this.EdiTable.focusedTable = this._getCurren(true);
        tr.querySelector('.et-group-label')?.focus();
        this._trackSelection(tr);
        this._f6TrasFoco(tr.cells[0]);
        return true;
    }
    // Confirma el editor y quita el selector (lo que hace _f6EnfocarGrupo antes de enfocar). false si no se pudo confirmar.
    _f6Soltar()
    {
        const input = this.EdiTable.GetInput();
        if (input)
        {
            const t = (this.EdiTable.focusedTable ?? this);
            this._f1ConfirmDesdeCelda = true;
            let ok;
            try { ok = t.ConfirmEdit(input.closest('td')); } finally { this._f1ConfirmDesdeCelda = false; }
            if (!ok) return false;
        }
        const sel = this.EdiTable.GetSelector();
        if (sel)
        {
            const td = sel.closest('td');
            const c = this._getVisibleColumnIndex(td);
            if (c >= 0) this._f6Col = c;
            this.SetTdValue(td, sel.innerHTML, true);
            if (this.EdiTable.focusedTable != null) this.LeaveCell(td);
            sel.remove();
        }
        return true;
    }
    // Mueve el foco a la fila visible anterior o siguiente (de datos o de grupo).
    _f6Mover(desde, paso, col)
    {
        if (this._f5Activo)   // F5+F6: por posiciones de la lista virtual (desplaza y dibuja)
        {
            const k = this._f6PosDe(desde);
            if (k < 0) return false;
            const q = k + paso;
            if (q < 0) return true;
            if (q >= this._f5Lista.length) { if (paso > 0 && this.AutoAddRow && !desde._f6Grupo) this.AddRow(); return true; }
            this._f6IrA(this._f5IrA(q), col);
            return true;
        }
        const vis = this._f6Visibles();
        let k = vis.indexOf(desde);
        if (k < 0) return false;
        let destino = vis[k + paso];
        if (!destino)
        {
            if (paso > 0 && this.AutoAddRow && !desde._f6Grupo) this.AddRow();
            return true;
        }
        if (Math.abs(paso) > 1 && !destino) destino = vis[paso > 0 ? vis.length - 1 : 0];
        this._f6IrA(destino, col);
        return true;
    }
    _f6IrA(tr, col)
    {
        if (!tr) return;
        if (tr._f6Grupo) { this._f6EnfocarGrupo(tr); return; }
        const tds = Array.from(tr.querySelectorAll('td:not(.hidde-col):not(.et-sel-col)'));
        const td = tds[Math.min(Math.max(0, col ?? this._f6Col), tds.length - 1)];
        if (td) this.CellFocus(td);
    }
    // NavUp/NavDown con grupos (en el selector o en el editor).
    _f6Nav(td, paso)
    {
        if (!this._f6Grupos.length || !td) return false;
        const c = this._getVisibleColumnIndex(td);
        if (c >= 0) this._f6Col = c;
        return this._f6Mover(td.closest('tr'), paso, this._f6Col);
    }
    _f6NavTo(row, col)
    {
        if (!this._f6Grupos.length) return false;
        const tr = this.GetTrByIndex(row);
        if (!tr) return true;
        if (tr.classList.contains('hidde-row'))
        {
            this._f6Modelo().forEach(e => { if (e.type === 'group' && e.indices.includes(row)) this._f6Colapsados.delete(e.pathKey); });
            this._f6Visibilidad();
        }
        const td = tr.querySelectorAll('td:not(.hidde-col):not(.et-sel-col)')[col];
        if (td) this.CellFocus(td);
        return true;
    }
    // Teclas del selector de datos que con grupos se resuelven en el orden en que se ven.
    _f6Tecla(e, selector)
    {
        if (!this._f6Grupos.length) return false;
        const td = selector?.closest?.('td');
        const tr = td?.closest('tr');
        if (!tr) return false;
        if (this._f5Activo) return this._f6TeclaV(e, td, tr);   // F5+F6
        const vis = this._f6Visibles();
        const col = Math.max(0, this._getVisibleColumnIndex(td));
        let destino = null;
        if (e.ctrlKey && e.key === 'Home') destino = vis[0];
        else if (e.ctrlKey && e.key === 'End') destino = vis[vis.length - 1];
        else if (!e.ctrlKey && (e.key === 'PageUp' || e.key === 'PageDown'))
        {
            const k = vis.indexOf(tr), p = (e.key === 'PageUp' ? -1 : 1) * (Number(this.PagOffSet) || 10);
            destino = vis[Math.max(0, Math.min(vis.length - 1, k + p))];
        }
        else if (e.ctrlKey && e.key === 'Delete' && this.AutoDelRow)
        {
            e.preventDefault(); e.stopPropagation();
            const k = vis.indexOf(tr);
            const sig = vis.slice(k + 1).find(x => !x._f6Grupo) ?? vis.slice(0, k).reverse().find(x => !x._f6Grupo);
            if (this.DeleteRow(this.CurrentRowIndex()) && sig) this._f6IrA(sig, col);
            return true;
        }
        else return false;
        e.preventDefault(); e.stopPropagation();
        this._f6Col = col;
        this._f6IrA(destino, col);
        return true;
    }
    // Teclado en una fila de grupo: flechas recorren, Enter o Espacio expanden o colapsan (§11).
    _f6TeclaGrupo(e, tr)
    {
        tr = (tr.isConnected ? tr : this._f6FilaDeGrupo(tr._f6Grupo.pathKey)) ?? tr;
        const g = tr._f6Grupo;
        const ctrl = (e.ctrlKey || e.metaKey);
        let hecho = true;
        switch (e.key)
        {
            case 'Enter': case ' ': case 'Spacebar':
                this._f6Alternar(g.path); break;
            case 'ArrowLeft':
                if (g.expanded) this._f6Alternar(g.path, false); break;
            case 'ArrowRight':
                if (!g.expanded) this._f6Alternar(g.path, true); break;
            case 'ArrowUp':
                this._f6Mover(tr, -1, this._f6Col); break;
            case 'ArrowDown': case 'Tab':
                this._f6Mover(tr, 1, this._f6Col); break;
            case 'Home': case 'End':
            {
                if (this._f5Activo) { if (ctrl) this._f6IrA(this._f5IrA(e.key === 'Home' ? 0 : this._f5Lista.length - 1), this._f6Col); break; }   // F5+F6
                const vis = this._f6Visibles();
                if (ctrl) this._f6IrA(e.key === 'Home' ? vis[0] : vis[vis.length - 1], this._f6Col);
                break;
            }
            case 'PageUp': case 'PageDown':
            {
                if (this._f5Activo) { const k = this._f6PosDe(tr), d = (e.key === 'PageUp' ? -1 : 1) * (Number(this.PagOffSet) || 10); if (k >= 0) this._f6IrA(this._f5IrA(Math.max(0, Math.min(this._f5Lista.length - 1, k + d))), this._f6Col); break; }   // F5+F6
                const vis = this._f6Visibles(), k = vis.indexOf(tr), p = (e.key === 'PageUp' ? -1 : 1) * (Number(this.PagOffSet) || 10);
                this._f6IrA(vis[Math.max(0, Math.min(vis.length - 1, k + p))], this._f6Col);
                break;
            }
            default:
                hecho = false;
                if (ctrl && (e.key ?? '').toLowerCase() === 'c' && this._f4Tecla?.(e)) return;
        }
        if (hecho) e.preventDefault();
        e.stopPropagation();
    }
    // ---------- F5+F6: agrupación con virtual-rows (integración) ----------
    // Con virtual-rows, F6 no reacomoda el tbody ni usa _f6Idx/_f6Trs: la lista de filas lógicas de F5
    // (_f5Filas) sale de groupRows y trae solo las entradas visibles ({tipo:'grupo', g} y {tipo:'datos', indice});
    // las de los grupos colapsados no están. El índice de las filas de datos es el de F5 (_f5Idx, de DataArray);
    // las filas de grupo dan -1. Las filas nuevas (InsertRow/AddRow) quedan pendientes por objeto (_f6PendV)
    // fuera de groupRows: al final o antes de la fila que tenía su índice, hasta que se confirman (§11).
    _f6FilasV()
    {
        const c = this._f6Cache;
        if (c) { this._f6Cache = null; return c; }
        if (!this._f5Activo || !this._f6Grupos.length) return null;
        const pend = this._f6PendIdx();
        const out = [];
        for (const e of this._f6Modelo(pend)) if (e.visible) out.push(e.type === 'group' ? { tipo: 'grupo', g: e } : { tipo: 'datos', indice: e.index });
        if (pend) Array.from(pend).sort((a, b) => a[0] - b[0]).forEach(([i, info]) => {
            const ai = (info.ancla != null ? pend.porObj.get(info.ancla) : undefined);
            const k = (ai !== undefined ? out.findIndex(x => x.tipo === 'datos' && x.indice === ai) : -1);
            const x = { tipo: 'datos', indice: i };
            if (k < 0) out.push(x); else out.splice(k, 0, x);
        });
        return out;
    }
    // Pendientes por índice actual (quita las que ya no están en DataArray). null si no hay.
    _f6PendIdx()
    {
        if (!this._f6PendV.size) return null;
        const porObj = new Map();
        this.DataArray.forEach((o, i) => { if (o != null && typeof o == 'object' && !porObj.has(o)) porObj.set(o, i); });
        const m = new Map();
        Array.from(this._f6PendV).forEach(([o, info]) => { const i = porObj.get(o); if (i === undefined) this._f6PendV.delete(o); else m.set(i, info); });
        m.porObj = porObj;
        return (m.size ? m : null);
    }
    _f6InsertadaV(obj, ancla)
    {
        if (!this._f6Grupos.length) return;
        this._f6PendV.set(obj, { ancla: (ancla ?? null), tocado: false, api: false });
    }
    _f6AlRedibujarV()
    {
        this._f6Trs = []; this._f6Idx = new WeakMap(); this._f6Pend.clear(); this._f6PendApi.clear();
        this._f6PendV.clear();
    }
    _f6TrasArmar()
    {
        if (!this._f6Grupos.length) { if (this._f6PosGrupo.size) this._f6PosGrupo = new Map(); return; }
        const m = new Map();
        this._f5Lista.forEach((e, p) => { if (e && e.tipo === 'grupo') m.set(e.g.pathKey, p); });
        this._f6PosGrupo = m;
    }
    // F5 llama aquí para dibujar una entrada que no es de datos: la fila de grupo (sin índice de datos).
    _f5DibujarEntrada(e, p)
    {
        if (!e || e.tipo !== 'grupo' || !e.g) return null;
        const tr = this._f6FilaGrupo(e.g);
        // Mismo paso que las filas de datos (los rellenos suponen un alto uniforme).
        if (this._f5Paso > 0 && !this._table.classList.contains('et-vfija')) tr.style.height = Math.max(0, this._f5Paso - this._f5Espacio()) + 'px';
        return tr;
    }
    // Después de _f5Rearmar: las filas de grupo dibujadas toman los datos nuevos de su grupo y el DOM queda en el
    // orden de la lista (F5 no mueve los tr que conserva; con grupos el orden relativo puede cambiar).
    _f6TrasRearmar()
    {
        const tbody = this._table?.tBodies[0];
        if (!this._f5Activo || !tbody) return;
        let cambio = false;
        if (this._f6Grupos.length) Array.from(this._f5Trs).forEach(([p, tr]) => {
            if (!tr._f6Grupo) return;
            const e = this._f5Lista[p]?.g;
            if (!e) return;
            const nueva = this._f6FilaGrupo(e);
            if (nueva._f6Firma === tr._f6Firma && nueva.cells.length === tr.cells.length && nueva.getAttribute('aria-expanded') === tr.getAttribute('aria-expanded')) { tr._f6Grupo = e; return; }
            this._f6Reemplazar(tr, nueva);
            cambio = true;
        });
        const pos = (tr) => { const p = this._f5PosTr.get(tr); return ((p !== undefined && this._f5Trs.get(p) === tr) ? p : undefined); };
        const filas = Array.from(tbody.rows).filter(tr => !tr.classList.contains('et-spacer') && pos(tr) !== undefined);
        let ordenado = true;
        for (let j = 1; j < filas.length && ordenado; j++) if (pos(filas[j]) <= pos(filas[j - 1])) ordenado = false;
        if (!ordenado)
        {
            // Se conserva la fila con el selector, el editor o el foco; las que quedan fuera de orden se quitan
            // (se vuelven a dibujar en su lugar con el siguiente _f5Pintar).
            const el = (this._shadow?.getElementById(this.EdiTable.Const.InputId) ?? this._shadow?.getElementById(this.EdiTable.Const.SelectorId) ?? this._shadow?.activeElement);
            const fija = el?.closest?.('tr');
            const fp = (fija ? pos(fija) : undefined);
            let antes = true, ultimo = -1;
            for (const tr of filas)
            {
                const p = pos(tr);
                if (tr === fija) { antes = false; ultimo = p; continue; }
                if ((fp !== undefined && (antes ? p > fp : p < fp)) || p <= ultimo) { this._f5Trs.delete(p); tr.remove(); continue; }
                ultimo = p;
            }
            this._f5Sucio = true;
        }
        if (cambio) this._f3TrasDibujar?.();
    }
    _f6Reemplazar(tr, nueva)
    {
        const foco = tr.contains(this._shadow.activeElement);
        if (tr.style.height && !nueva.style.height) nueva.style.height = tr.style.height;
        tr.replaceWith(nueva);
        if (this._f5Activo) { const p = this._f5PosTr.get(tr); if (p !== undefined && this._f5Trs.get(p) === tr) { this._f5Trs.set(p, nueva); this._f5PosTr.set(nueva, p); } }
        if (foco) nueva.querySelector('.et-group-label')?.focus({ preventScroll: true });
    }
    // La fila de datos con el selector o el editor (en virtual), o null.
    _f6TrActualV()
    {
        const el = this._shadow?.getElementById(this.EdiTable.Const.InputId) ?? this._shadow?.getElementById(this.EdiTable.Const.SelectorId);
        const tr = el?.closest('tr');
        return ((tr && this._f5Idx.has(tr)) ? tr : null);
    }
    _f6PosDe(tr)
    {
        const p = this._f5PosTr.get(tr);
        return ((p !== undefined && this._f5Trs.get(p) === tr) ? p : -1);
    }
    _f6ExisteGrupo(k) { return this._f6PosGrupo.has(k) || this._f6Modelo().some(e => e.type === 'group' && e.pathKey === k); }
    // Vuelve a armar la lista virtual con los grupos actuales. Si la fila actual queda dentro de un grupo colapsado:
    // con expandirActual se expanden sus grupos (como _f6Dibujar); si no, el foco pasa al grupo visible que la contiene.
    _f6RearmarV(o = {})
    {
        if (!this._f5Activo) return false;
        const cur = this._f6TrActualV();
        const ci = (cur ? (this._f5Idx.get(cur) ?? -1) : -1);
        let lista = (this._f6Grupos.length ? this._f6FilasV() : null);
        let destino = null;
        if (lista && ci >= 0 && !lista.some(e => e.tipo === 'datos' && e.indice === ci))
        {
            if (o.expandirActual)
            {
                this._f6Modelo().forEach(e => { if (e.type === 'group' && e.indices.includes(ci)) this._f6Colapsados.delete(e.pathKey); });
                lista = this._f6FilasV();
            }
            else
            {
                lista.forEach(e => { if (e.tipo === 'grupo' && e.g.indices.includes(ci)) destino = e.g.pathKey; });
                if (!this._f6Soltar()) return false;
            }
        }
        this._f6Cache = lista;
        try { this._f5Rearmar(); } finally { this._f6Cache = null; }
        this._f5Pintar();
        if (destino != null) { const p = this._f6PosGrupo.get(destino); const tr = (p == null ? null : this._f5IrA(p)); if (tr) this._f6EnfocarGrupo(tr); }
        this._f3TrasDibujar?.();
        this._f2Programar?.();
        return true;
    }
    _f6AlternarV(k, expandir)
    {
        if (!this._f6ExisteGrupo(k)) return false;
        if (expandir === undefined) expandir = this._f6Colapsados.has(k);
        if (this._f6Colapsados.has(k) === !expandir) return false;
        const actG = this._shadow?.activeElement?.closest?.('tr.et-group-row');
        if (expandir) this._f6Colapsados.delete(k); else this._f6Colapsados.add(k);
        this._f6RearmarV();
        // Si el foco estaba en un subgrupo que quedó oculto, pasa a la fila del grupo.
        if (!expandir && actG && !actG.isConnected) { const p = this._f6PosGrupo.get(k); const tr = (p == null ? null : this._f5IrA(p)); if (tr) this._f6EnfocarGrupo(tr); }
        this._f6Disparar('GroupToggled', { path: JSON.parse(k), expanded: !!expandir });
        return true;
    }
    // GetTrByIndex/NavTo hacia una fila de un grupo colapsado: se expanden sus grupos (sin GroupToggled). Su posición.
    _f6MostrarFilaV(row)
    {
        if (!this._f5Activo || !this._f6Grupos.length) return -1;
        let cambio = false;
        this._f6Modelo().forEach(e => { if (e.type === 'group' && this._f6Colapsados.has(e.pathKey) && e.indices.includes(row)) { this._f6Colapsados.delete(e.pathKey); cambio = true; } });
        if (cambio) this._f6RearmarV();
        return (this._f5Pos[row] ?? -1);
    }
    _f6SincronizarV()
    {
        const cur = this._f6TrActualV();
        const curObj = (cur ? this.DataArray[this._f5Idx.get(cur)] : undefined);
        const repintar = [];
        Array.from(this._f6PendV).forEach(([o, info]) => {
            if (!info.tocado) return;
            if (o === curObj && !info.api) return;   // el usuario la sigue capturando
            this._f6PendV.delete(o);
            if (info.api) repintar.push(o);
        });
        this._f6RearmarV({ expandirActual: true });
        repintar.forEach(o => {
            const i = this.DataArray.indexOf(o), tr = (i >= 0 ? this._f5TrDibujado(i) : undefined);
            if (!tr) return;
            const sel = this.EdiTable.GetSelector();
            const td = (sel && tr.contains(sel)) ? sel.closest('td') : null;
            this.UpdateRow(i);
            if (td && !td.contains(this.EdiTable.GetSelector())) this.CellFocus(td);
        });
    }
    // Teclas del selector con grupos en virtual (Ctrl+Inicio/Fin, RePág/AvPág, Ctrl+Supr), por posiciones.
    _f6TeclaV(e, td, tr)
    {
        const n = this._f5Lista.length, k = this._f6PosDe(tr);
        if (k < 0) return false;
        const col = Math.max(0, this._getVisibleColumnIndex(td));
        let q = null;
        if (e.ctrlKey && e.key === 'Home') q = 0;
        else if (e.ctrlKey && e.key === 'End') q = n - 1;
        else if (!e.ctrlKey && (e.key === 'PageUp' || e.key === 'PageDown')) q = Math.max(0, Math.min(n - 1, k + (e.key === 'PageUp' ? -1 : 1) * (Number(this.PagOffSet) || 10)));
        else if (e.ctrlKey && e.key === 'Delete' && this.AutoDelRow)
        {
            e.preventDefault(); e.stopPropagation();
            let s = -1;
            for (let j = k + 1; j < n && s < 0; j++) if (this._f5Lista[j]?.tipo === 'datos') s = j;
            for (let j = k - 1; j >= 0 && s < 0; j--) if (this._f5Lista[j]?.tipo === 'datos') s = j;
            const obj = (s >= 0 ? this.DataArray[this._f5Lista[s].indice] : undefined);
            if (this.DeleteRow(this.CurrentRowIndex()) && obj !== undefined) { const i = this.DataArray.indexOf(obj); if (i >= 0) this._f6IrA(this.GetTrByIndex(i), col); }
            return true;
        }
        else return false;
        e.preventDefault(); e.stopPropagation();
        this._f6Col = col;
        this._f6IrA(this._f5IrA(q), col);
        return true;
    }
    // ===== F6: fin

    // ===== F8a: búsqueda y filtro, validar la fila al salir, getChanges, secuencia de captura y formato condicional
    //
    // Spec: /home/claude/mapa/edittable-spec-f8-funcional.md. Todo opt-in (R1/R8): sin search-bar, Search/Filter,
    // BeforeRowLeave, SetCellError, getChanges, enter-mode/skip-readonly/tab-order/tab-skip ni rules/row-rules, los
    // enganches del código existente (marcados «// F8a») salen sin tocar el DOM, el CSS, los eventos ni DataArray.
    // - Filtro: nunca toca DataArray ni los índices (R2). _f8Fuera es el conjunto de objetos de DataArray que no pasan;
    //   sin virtual-rows sus tr llevan et-filter-hidden + hidde-row (la navegación de hoy ya salta hidde-row); con
    //   virtual-rows no entran a la lista lógica de F5 (_f5Filas); con grupos, F6 agrupa solo las que pasan (_f6Modelo).
    //   Se evalúa al llamar Search/Filter/RefreshFilter y cuando DataArray es otro arreglo; una fila editada o nueva
    //   no desaparece mientras se captura.
    // - Resaltado: CSS Custom Highlight API con StaticRange (no cambia el DOM); si no existe, clase et-search-hit en el td.
    // - getChanges: base perezosa (Set de objetos) tomada en el primer enganche después de inicializar; originales por
    //   objeto al primer cambio de UpdateDataMember. No toca IsDirty ni el respaldo.
    static { this.features.push('search', 'rowvalidate', 'changes', 'capture', 'rules'); }
    static _f8Num = 0;

    _f8Eventos = Object.assign(this.EdiTable.Const.Events, { SearchChanged: 'searchchanged', FilterChanged: 'filterchanged', BeforeRowLeave: 'beforerowleave' });
    _f8EstiloEl = null;
    _f8SearchBar = false;
    _f8Barra = null;
    _f8Temporizador = 0;
    SearchFilter = true;        // search-filter: la barra filtra (true) o solo salta (false)
    SearchColumns = null;       // search-columns: "a,b" o arreglo de fields
    SearchDebounce = 150;       // search-debounce (ms)
    _f8EnterMode = 'current';
    SkipReadonly = false;       // skip-readonly
    RowRules = null;            // row-rules
    _f8AttrFilaLeido = false;
    _f8Busq = null;             // {text, terms, opts}
    _f8Filtro = null;           // {fn, src}
    _f8Fuera = null;            // Set de objetos de DataArray ocultos por el filtro (null: sin filtro)
    _f8Arr = null;              // DataArray con el que se calculó _f8Fuera
    _f8Cache = new WeakMap();   // objeto de DataArray → Map(clave de columna → texto plegado)
    _f8Hl = null; _f8HlCur = null; _f8HlNombre = '';
    _f8Rangos = new Map();      // tr → [rangos del resaltado]
    _f8Actual = null;           // {obj, field}: coincidencia actual
    _f8TrUlt = null;
    _f8SinSalida = false;
    _f8Errores = new Map();     // objeto de DataArray (o tr sin datos) → Map(field → {message, src})
    _f8Base = null;             // getChanges: Set de objetos de la base
    _f8BaseArr = null;
    _f8Orig = new Map();        // objeto → copia superficial antes del primer cambio
    _f8ReglasCache = new WeakMap();
    _f8UsoReglas = false;

    get SearchBar() { return this._f8SearchBar; }
    set SearchBar(v) { this._f8SearchBar = this._f5Bool(v); if (this._f1Inicializada) this._f8AplicarBarra(); }
    get EnterMode() { return this._f8EnterMode; }
    set EnterMode(v) { const s = String(v ?? '').trim().toLowerCase(); this._f8EnterMode = (['next-cell', 'next-row', 'down'].includes(s) ? s : 'current'); }

    _f8Iniciar()
    {
        try
        {
            if (this.hasAttribute('search-filter')) this.SearchFilter = this._f5Bool(this.getAttribute('search-filter'));
            if (this.hasAttribute('search-columns')) this.SearchColumns = this.getAttribute('search-columns');
            if (this.hasAttribute('search-debounce')) { const n = Number(this.getAttribute('search-debounce')); if (Number.isFinite(n) && n >= 0) this.SearchDebounce = n; }
            if (this.hasAttribute('enter-mode')) this.EnterMode = this.getAttribute('enter-mode');
            if (this.hasAttribute('skip-readonly')) this.SkipReadonly = this._f5Bool(this.getAttribute('skip-readonly'));
            this._f8ReglasFilaDef();
            if (this.hasAttribute('search-bar')) { this._f8SearchBar = this._f5Bool(this.getAttribute('search-bar')); this._f8AplicarBarra(); }
        }
        catch (e) { console.error('EditTable F8a: error al inicializar', e); }
    }
    _f8Manejador(nombre)
    {
        const k = this.EdiTable.Const.Events[nombre];
        const fn = this._getCurren().Events?.[k] ?? this.Events?.[k];
        return (typeof fn === 'function' ? fn : null);
    }
    _f8Disparar(nombre, args)
    {
        const fn = this._f8Manejador(nombre);
        if (!fn) return args;
        args.sender = this._getCurren();
        try { fn(args); } catch (e) { console.error('EditTable: error en el manejador de ' + nombre, e); }
        return args;
    }
    _f8Estilo()
    {
        if (this._f8EstiloEl || !this._shadow) return;
        const api = (typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight === 'function');
        const n = ++EditTable._f8Num;
        this._f8HlNombre = 'et-search-' + n;
        if (api)
        {
            try
            {
                this._f8Hl = new Highlight(); this._f8HlCur = new Highlight();
                this._f8HlCur.priority = 1;
                CSS.highlights.set(this._f8HlNombre, this._f8Hl);
                CSS.highlights.set(this._f8HlNombre + '-cur', this._f8HlCur);
            }
            catch (e) { this._f8Hl = null; this._f8HlCur = null; }
        }
        const st = document.createElement('style');
        st.setAttribute('data-et', 'f8');
        st.textContent = `
            .et-search-bar{ display:flex; align-items:center; gap:4px; margin-bottom:4px; padding:2px 0; box-sizing:border-box; font-family:var(--et-font, var(--et-t-font, inherit)); font-size:var(--et-font-size, var(--et-t-font-size, .9rem)); color:var(--et-fg, var(--et-t-fg, inherit)); background:var(--et-bg, var(--et-t-bg, transparent)); }
            .et-search-input{ flex:1 1 auto; min-width:8rem; box-sizing:border-box; padding:var(--et-cell-pad-y, var(--et-t-cell-pad-y, 4px)) var(--et-cell-pad-x, var(--et-t-cell-pad-x, 8px)); border:1px solid var(--et-input-border, var(--et-t-input-border, #ced4da)); border-radius:var(--et-radius, var(--et-t-radius, 3px)); background:var(--et-input-bg, var(--et-t-input-bg, #fff)); color:var(--et-input-fg, var(--et-t-input-fg, #212529)); font:inherit; outline:none; }
            .et-search-input:focus{ border-color:var(--et-accent, var(--et-t-accent, #3D75DD)); box-shadow:0 0 0 2px var(--et-focus-ring, var(--et-t-focus-ring, rgba(61,117,221,.35))); }
            .et-search-count{ min-width:4.5em; text-align:center; white-space:nowrap; color:var(--et-muted-fg, var(--et-t-muted-fg, #666)); }
            .et-search-btn{ padding:2px 8px; border:1px solid var(--et-border, var(--et-t-border, #DDD)); border-radius:var(--et-radius, var(--et-t-radius, 3px)); background:var(--et-header-bg, var(--et-t-header-bg, #F5F5F5)); color:var(--et-header-fg, var(--et-t-header-fg, inherit)); font:inherit; cursor:pointer; }
            ::highlight(${this._f8HlNombre}){ background-color:var(--et-mark-bg, var(--et-t-mark-bg, #FFE58F)); color:var(--et-mark-fg, var(--et-t-mark-fg, #000)); }
            ::highlight(${this._f8HlNombre}-cur){ background-color:var(--et-accent, var(--et-t-accent, #3D75DD)); color:var(--et-sel-fg, var(--et-t-sel-fg, #FFF)); }
            td.et-search-hit{ background-color:var(--et-mark-bg, var(--et-t-mark-bg, #FFF4C2)); }
            td.et-search-current{ box-shadow:inset 0 0 0 2px var(--et-accent, var(--et-t-accent, #3D75DD)); }
            tbody > tr.et-filter-hidden{ display:none !important; }
            td.et-cell-error{ box-shadow:inset 0 0 0 2px var(--et-error, var(--et-t-error, #D93025)); background-color:var(--et-error-bg, var(--et-t-error-bg, #FDECEA)); color:var(--et-error, var(--et-t-error, #B3261E)); }
            .et-neg, .et-neg > td{ color:var(--et-neg-fg, var(--et-t-neg-fg, #C62828)); }
            .et-strike, .et-strike > td{ text-decoration:line-through; }
            .et-muted, .et-muted > td{ color:var(--et-muted-fg, var(--et-t-muted-fg, #888)); }
            .et-bold, .et-bold > td{ font-weight:600; }
            .et-ok, .et-ok > td{ color:var(--et-ok, var(--et-t-ok, #2E7D32)); }
            .et-warn, .et-warn > td{ color:var(--et-warn, var(--et-t-warn, #B26A00)); }
            .et-err, .et-err > td{ color:var(--et-error, var(--et-t-error, #C62828)); }
            tr.EdiTable-Row-Selected > td.et-ok, tr.EdiTable-Row-Selected > td.et-warn, tr.EdiTable-Row-Selected > td.et-err, tr.EdiTable-Row-Selected > td.et-muted,
            tr.EdiTable-Row-Selected.et-ok > td, tr.EdiTable-Row-Selected.et-warn > td, tr.EdiTable-Row-Selected.et-err > td, tr.EdiTable-Row-Selected.et-muted > td{ color:var(--et-sel-fg, var(--et-t-sel-fg, inherit)); }
            td[data-et-icon] .cell-content::before, tr[data-et-icon] > td:nth-child(1 of :not(.et-sel-col):not(.hidde-col)) .cell-content::before{ content:var(--et-rule-icon); margin-inline-end:.35em; }
            @media print{ .et-search-bar{ display:none !important; } }`;
        this._shadow.appendChild(st);
        this._f8EstiloEl = st;
        this._f8bReescribirTodo?.();   // F8b (temas): vuelve a escribir las variables del tema con la hoja nueva
    }

    // ---------- búsqueda y filtro: API ----------
    /** Busca texto en las columnas. opts: {columns, filter=true, highlight=true, accentInsensitive=true}. Devuelve cuántas filas coinciden. */
    Search = (texto, opts = {}) =>
    {
        opts = opts ?? {};
        const text = String(texto ?? '');
        const cols = (opts.columns ?? this.SearchColumns ?? null);
        const o = {
            columns: (cols == null ? null : (Array.isArray(cols) ? cols : String(cols).split(',')).map(s => String(s).trim()).filter(Boolean)),
            filter: (opts.filter === undefined ? true : !!opts.filter),
            highlight: opts.highlight !== false,
            accentInsensitive: opts.accentInsensitive !== false,
        };
        const terms = this._f8Plegar(text.trim(), o.accentInsensitive).split(/\s+/).filter(Boolean);
        this._f8Busq = (terms.length ? { text, terms, opts: o } : null);
        { const inp = this._f8Barra?.querySelector('input'); if (inp && inp.value !== text) inp.value = text; } // la barra refleja Search/ClearSearch hechos por código
        this._f8Actual = null;
        this._f8Estilo();
        this._f8Aplicar();
        this._f8Resaltar();
        const rows = this._f8ContarBusq();
        if (this._f8Busq && !o.filter && opts._salto !== false) this._f8Saltar(1, true);
        this._f8PintarContador();
        this._f8Disparar('SearchChanged', { text, options: { ...o }, rows });
        return rows;
    }
    ClearSearch = () => { if (!this._f8Busq) { const inp = this._f8Barra?.querySelector('input'); if (inp) inp.value = ''; this._f8PintarContador(); return 0; } return this.Search(''); }
    SearchNext = () => this._f8Saltar(1, false);
    SearchPrev = () => this._f8Saltar(-1, false);
    /** Filtro: predicado (data, index) => bool, objeto {campo: valor | {op, value, value2}} o arreglo de condiciones {field, op, value}. */
    Filter = (f) =>
    {
        let fn = null;
        if (typeof f === 'function') fn = (o, i) => { try { return !!f(o, i); } catch (e) { return false; } };
        else if (Array.isArray(f) || (f && typeof f === 'object'))
        {
            const conds = (Array.isArray(f) ? f.filter(x => x && typeof x === 'object')
                : Object.entries(f).map(([k, v]) => ((v && typeof v === 'object' && !Array.isArray(v) && 'op' in v) ? { ...v, field: k }
                    : (Array.isArray(v) ? { field: k, op: 'in', value: v } : { field: k, op: 'eq', value: v }))));
            fn = (o) => conds.every(c => this._f8Cumple(c, o, this._f8ColDe(c.field)));
        }
        if (!fn) return this.ClearFilter();
        this._f8Filtro = { fn, src: f };
        this._f8Estilo();
        this._f8Aplicar();
        this._f8Resaltar();
        const rows = this.getFilteredIndices().length;
        this._f8PintarContador();
        this._f8Disparar('FilterChanged', { filter: (typeof f === 'function' ? 'function' : f), rows });
        return rows;
    }
    ClearFilter = () =>
    {
        if (!this._f8Filtro) return this.getFilteredIndices().length;
        this._f8Filtro = null;
        this._f8Aplicar();
        this._f8Resaltar();
        const rows = this.getFilteredIndices().length;
        this._f8PintarContador();
        this._f8Disparar('FilterChanged', { filter: null, rows });
        return rows;
    }
    /** Vuelve a evaluar la búsqueda y el filtro (por ejemplo, después de editar). */
    RefreshFilter = () =>
    {
        this._f8Cache = new WeakMap();
        this._f8Aplicar();
        this._f8Resaltar();
        this._f8PintarContador();
        return this.getFilteredIndices().length;
    }
    /** Índices de DataArray que pasan el filtro (todos si no hay filtro), en orden. */
    getFilteredIndices = () =>
    {
        const d = (this.DataArray ?? []);
        if (!this._f8Activo()) return d.map((_, i) => i);
        this._f8Sync();
        const out = [];
        d.forEach((o, i) => { if (o && typeof o === 'object' && !this._f8Fuera.has(o)) out.push(i); });
        return out;
    }

    // ---------- búsqueda y filtro: modelo ----------
    _f8Activo() { return !!(this._f8Filtro || (this._f8Busq && this._f8Busq.opts.filter)); }
    _f8Plegar(s, ai = true)
    {
        s = String(s ?? '').toLowerCase();
        if (ai && /[^\x00-\x7f]/.test(s)) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return s;
    }
    _f8ColDe(field) { return this.Columns.find(c => c && c.field === field) ?? null; }
    // Columnas en las que se busca: [{i, col}] (las indicadas, o las visibles con field o plantilla).
    _f8ColumnasBusq()
    {
        const b = this._f8Busq, out = [];
        this.Columns.forEach((col, i) => {
            if (!col || this._isBadgesCol(col)) return;
            if (b?.opts.columns) { if (b.opts.columns.includes(col.field)) out.push({ i, col }); return; }
            if (col.field == undefined && !col.template) return;
            if (col.field != undefined && this._f1ColumnaOculta(col.field)) return;
            out.push({ i, col });
        });
        return out;
    }
    _f8Texto(o, col, i, ai)
    {
        let e = this._f8Cache.get(o);
        if (!e) { e = new Map(); this._f8Cache.set(o, e); }
        const k = (ai ? '1' : '0') + (col.field ?? ('#' + i));
        let t = e.get(k);
        if (t === undefined) { t = this._f8Plegar(this._f4Texto(col, o, false), ai); e.set(k, t); }
        return t;
    }
    _f8PasaBusq(i, cols)
    {
        const b = this._f8Busq;
        if (!b) return true;
        const o = this.DataArray[i];
        if (!o || typeof o !== 'object') return false;
        cols = cols ?? this._f8ColumnasBusq();
        const ai = b.opts.accentInsensitive;
        return b.terms.every(t => cols.some(c => this._f8Texto(o, c.col, c.i, ai).includes(t)));
    }
    _f8PasaFiltro(i) { const o = this.DataArray[i]; return !this._f8Filtro || (!!o && this._f8Filtro.fn(o, i)); }
    _f8ContarBusq()
    {
        const d = (this.DataArray ?? []);
        if (!this._f8Busq) return this.getFilteredIndices().length;
        const cols = this._f8ColumnasBusq();
        let n = 0;
        for (let i = 0; i < d.length; i++) if (this._f8PasaFiltro(i) && this._f8PasaBusq(i, cols)) n++;
        return n;
    }
    _f8Recalcular()
    {
        if (!this._f8Activo()) { this._f8Fuera = null; this._f8Arr = null; return; }
        const d = (this.DataArray ?? []), fuera = new Set(), dentro = [];
        const conBusq = !!(this._f8Busq && this._f8Busq.opts.filter), cols = (conBusq ? this._f8ColumnasBusq() : null);
        for (let i = 0; i < d.length; i++)
        {
            const o = d[i];
            if (!o || typeof o !== 'object') continue;
            if (this._f8PasaFiltro(i) && (!conBusq || this._f8PasaBusq(i, cols))) dentro.push(o); else fuera.add(o);
        }
        // En árbol se ven también los ancestros de las filas que pasan.
        if (this.ShowAsTree && fuera.size && dentro.length)
        {
            const op = this._getTreeOptions(), porLlave = new Map();
            d.forEach(x => { if (x && typeof x === 'object' && !porLlave.has(x[op.key])) porLlave.set(x[op.key], x); });
            const vistos = new Set();
            dentro.forEach(x => {
                let p = porLlave.get(x[op.parentkey]);
                while (p && !vistos.has(p)) { vistos.add(p); fuera.delete(p); p = porLlave.get(p[op.parentkey]); }
            });
        }
        this._f8Fuera = fuera;
        this._f8Arr = d;
    }
    _f8Sync() { if (this._f8Fuera && (this.DataArray ?? []) !== this._f8Arr) this._f8Recalcular(); }
    _f8EsFuera(i)
    {
        if (!this._f8Fuera) return false;
        this._f8Sync();
        const o = this.DataArray[i];
        return !!(o && this._f8Fuera && this._f8Fuera.has(o));
    }
    _f8FiltrarIdx(idx) { return (this._f8Fuera ? idx.filter(i => !this._f8EsFuera(i)) : idx); }
    // Objetos que se ven por el filtro (null si no hay filtro). Para SelectAll y la casilla de "todas" (F4).
    _f8Visibles() { if (!this._f8Fuera) return null; this._f8Sync(); return this.DataArray.filter(o => o && typeof o === 'object' && !this._f8Fuera.has(o)); }
    // F5: lista lógica sin las filas filtradas (sin grupos; con grupos la arma F6 desde _f6Modelo).
    _f8FilasV()
    {
        if (!this._f8Fuera) return null;
        this._f8Sync();
        const d = (this.DataArray ?? []), out = [];
        for (let i = 0; i < d.length; i++) if (!(d[i] && this._f8Fuera.has(d[i]))) out.push({ tipo: 'datos', indice: i });
        return out;
    }
    // Aplica el estado de la búsqueda y del filtro al DOM (o a la lista virtual).
    _f8Aplicar()
    {
        const antes = !!this._f8Fuera;
        this._f8Recalcular();
        if (!antes && !this._f8Fuera) return;
        this._f8SoltarSiOculta();
        if (this._f5Activo)
        {
            if (this._f6Grupos.length) this._f6RearmarV();
            else { this._f5Rearmar(); this._f5Pintar(); this._f3TrasDibujar?.(); }
        }
        else this._f8AplicarDom();
        this._f2Programar?.();
        this._f4Encabezado?.();
    }
    _f8AplicarDom()
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return;
        const grupos = this._f6Grupos.length > 0;
        for (const tr of tbody.rows)
        {
            if (tr._f6Grupo || tr.classList.contains('et-spacer')) continue;
            const i = this._getRowIndex(tr);
            if (i >= 0 && this._f8EsFuera(i)) tr.classList.add('et-filter-hidden', 'hidde-row');
            else if (tr.classList.contains('et-filter-hidden')) { tr.classList.remove('et-filter-hidden'); if (!grupos) tr.classList.remove('hidde-row'); }
            else if (this.ShowAsTree && this._f8Fuera && !grupos) tr.classList.remove('hidde-row');   // con filtro, el árbol muestra lo que pasa
        }
        if (grupos) this._f6Dibujar();
        else if (this.ShowAsTree && !this._f8Fuera) this._f8VisibilidadArbol(tbody);
    }
    // Sin filtro, en árbol: oculta las filas con un ancestro colapsado (estado de los botones de expandir).
    _f8VisibilidadArbol(tbody)
    {
        const porId = new Map(), oculta = new Map();
        for (const tr of tbody.rows)
        {
            const id = tr.getAttribute('id');
            const p = porId.get(tr.getAttribute('parent'));
            const h = !!(p && (oculta.get(p) || p.querySelector('span.collapse-btn')?.getAttribute('expanded') === 'false'));
            oculta.set(tr, h);
            if (id != null && id !== '' && !porId.has(id)) porId.set(id, tr);
            tr.classList.toggle('hidde-row', h);
        }
    }
    // Las filas filtradas vuelven a llevar hidde-row (después de ExpandRow o de desagrupar).
    _f8Reocultar(filas)
    {
        if (!this._f8Fuera || this._f5Activo) return;
        const lista = filas ?? this._f1TBodyPrincipal()?.querySelectorAll(':scope > tr.et-filter-hidden') ?? [];
        Array.from(lista).forEach(tr => { if (tr.classList.contains('et-filter-hidden')) tr.classList.add('hidde-row'); });
    }
    // Si la fila actual queda filtrada, se confirma el editor y se suelta el selector (CurrentRowIndex() = -1).
    _f8SoltarSiOculta()
    {
        if (!this._f8Fuera) return;
        const el = this.EdiTable.GetInput() ?? this.EdiTable.GetSelector();
        const td = el?.closest?.('td');
        if (!td) return;
        const i = this._getRowIndex(td.closest('tr'));
        if (i < 0 || !this._f8EsFuera(i)) return;
        if (this._f6Soltar() === false) return;
        this.EdiTable.focusedTable = null;
        this._f8TrUlt = null;
    }
    // _printRows: en árbol, con filtro, se vuelven a mostrar las filas que pasan aunque su nodo esté colapsado.
    _f8TrasDibujar() { if (this._f8Fuera && this.ShowAsTree && !this._f6Grupos.length) this._f8AplicarDom(); }

    // ---------- búsqueda: resaltado ----------
    _f8Resaltar()
    {
        this._f8Rangos.forEach((l, tr) => this._f8QuitarRangos(tr));
        this._f8Rangos.clear();
        const tbody = this._f1TBodyPrincipal();
        if (tbody && (!this._f8Hl || !this._f8Busq)) tbody.querySelectorAll('td.et-search-hit, td.et-search-current').forEach(td => td.classList.remove('et-search-hit', 'et-search-current'));
        if (!this._f8Busq || !this._f8Busq.opts.highlight || !tbody) return;
        for (const tr of tbody.rows) if (!tr._f6Grupo && !tr.classList.contains('et-spacer') && !tr.classList.contains('et-filter-hidden')) this._f8ResaltarFila(tr);
    }
    _f8QuitarRangos(tr)
    {
        const l = this._f8Rangos.get(tr);
        if (l) { l.forEach(r => { this._f8Hl?.delete(r); this._f8HlCur?.delete(r); }); this._f8Rangos.delete(tr); }
    }
    _f8ResaltarFila(tr, idx)
    {
        if (!tr || tr._f6Grupo) return;
        this._f8QuitarRangos(tr);
        const b = this._f8Busq;
        if (!this._f8Hl) tr.querySelectorAll('td.et-search-hit, td.et-search-current').forEach(td => td.classList.remove('et-search-hit', 'et-search-current'));
        if (!b || !b.opts.highlight) return;
        const i = (idx ?? this._getRowIndex(tr));
        if (!(i >= 0)) return;
        const cols = this._f8ColumnasBusq();
        if (!this._f8PasaBusq(i, cols)) return;
        const o = this.DataArray[i], ai = b.opts.accentInsensitive, tds = this._f4CeldasDatos(tr), lista = [];
        cols.forEach(({ i: k, col }) => {
            const td = tds[k];
            if (!td) return;
            const cur = !!(this._f8Actual && this._f8Actual.obj === o && this._f8Actual.field === col.field);
            const raiz = (td.querySelector('.cell-content') ?? td);
            if (!this._f8Hl)
            {
                const t = this._f8Plegar(raiz.textContent, ai);
                if (b.terms.some(x => t.includes(x))) { td.classList.add('et-search-hit'); td.classList.toggle('et-search-current', cur); }
                return;
            }
            const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
            for (let n = w.nextNode(); n; n = w.nextNode())
            {
                if (n.parentElement?.closest('button, input, select, textarea, .et-badges')) continue;
                const s = n.nodeValue;
                if (!s) continue;
                // Texto plegado con el mapa de cada posición al carácter original.
                let f = '', mapa = [];
                for (let j = 0; j < s.length; j++) { const p = this._f8Plegar(s[j], ai); for (let q = 0; q < p.length; q++) mapa.push(j); f += p; }
                mapa.push(s.length);
                b.terms.forEach(x => {
                    let p = f.indexOf(x);
                    while (p >= 0)
                    {
                        const ini = mapa[p], fin = (mapa[p + x.length - 1] ?? (s.length - 1)) + 1;
                        let r;
                        try { r = new StaticRange({ startContainer: n, startOffset: ini, endContainer: n, endOffset: fin }); }
                        catch (e) { r = document.createRange(); r.setStart(n, ini); r.setEnd(n, fin); }
                        (cur ? this._f8HlCur : this._f8Hl).add(r);
                        lista.push(r);
                        p = f.indexOf(x, p + Math.max(1, x.length));
                    }
                });
            }
        });
        if (lista.length) this._f8Rangos.set(tr, lista);
        if (this._f8Rangos.size > 400) this._f8Rangos.forEach((l, x) => { if (!x.isConnected) this._f8QuitarRangos(x); });
    }

    // ---------- búsqueda: navegación entre coincidencias ----------
    // Índices de datos en el orden en que se ven (sin las filtradas; con grupos, también las de grupos colapsados).
    _f8OrdenVisual()
    {
        if (this._f6Grupos.length) return this._f6Modelo().filter(e => e.type === 'data').map(e => e.index);
        if (this._f5Activo) return this._f5Lista.filter(e => e && e.tipo === 'datos').map(e => e.indice);
        const tbody = this._f1TBodyPrincipal(), out = [];
        if (tbody) for (const tr of tbody.rows) { if (tr._f6Grupo || tr.classList.contains('et-spacer') || tr.classList.contains('et-filter-hidden')) continue; const i = this._getRowIndex(tr); if (i >= 0) out.push(i); }
        return out;
    }
    _f8Coincidencias()
    {
        const b = this._f8Busq;
        if (!b) return [];
        const cols = this._f8ColumnasBusq().filter(c => !(c.col.field != undefined && this._f1ColumnaOculta(c.col.field)));
        const ai = b.opts.accentInsensitive, out = [];
        this._f8OrdenVisual().forEach((i, p) => {
            if (!this._f8PasaBusq(i, cols)) return;
            const o = this.DataArray[i];
            cols.forEach(c => { const t = this._f8Texto(o, c.col, c.i, ai); if (b.terms.some(x => t.includes(x))) out.push({ i, p, k: c.i, field: c.col.field }); });
        });
        return out;
    }
    // dir 1/-1; inclusivo: la celda actual cuenta (para el salto al teclear). Devuelve {index, field} o null.
    _f8Saltar(dir, inclusivo)
    {
        const lista = this._f8Coincidencias();
        if (!lista.length) { this._f8PintarContador(); return null; }
        const td = this.CurrentTd();
        let destino = null;
        if (td)
        {
            const ci = this._getRowIndex(td.closest('tr')), ck = this.ColIndexOfTd(td);
            const cp = (lista.find(x => x.i === ci)?.p ?? this._f8OrdenVisual().indexOf(ci));
            const cmp = (x) => (x.p - cp) || (x.k - ck);
            if (dir > 0) destino = lista.find(x => (inclusivo ? cmp(x) >= 0 : cmp(x) > 0)) ?? lista[0];
            else destino = [...lista].reverse().find(x => cmp(x) < 0) ?? lista[lista.length - 1];
        }
        else destino = (dir > 0 ? lista[0] : lista[lista.length - 1]);
        this._f8IrA(destino);
        this._f8PintarContador(lista, destino);
        return { index: destino.i, field: destino.field };
    }
    _f8IrA(m)
    {
        const o = this.DataArray[m.i];
        const viejo = this._f8Actual;
        this._f8Actual = { obj: o, field: m.field };
        const col = this.Columns.slice(0, m.k).filter(c => !(c?.field != undefined && this._f1ColumnaOculta(c.field))).length;
        const enBarra = (this._f8Barra && this._shadow?.activeElement === this._f8Barra.querySelector('input'));
        this.NavTo(m.i, col);
        if (viejo && viejo.obj !== o)
        {
            const i = this.DataArray.indexOf(viejo.obj);
            const tr = (i >= 0 ? (this._f5Activo ? this._f5TrDibujado(i) : this.GetTrByIndex(i)) : null);
            if (tr) this._f8ResaltarFila(tr, i);
        }
        const tr = this.CurrentTd()?.closest('tr');
        if (tr) this._f8ResaltarFila(tr);
        if (enBarra) this._f8Barra.querySelector('input').focus({ preventScroll: true });
    }
    _f8PintarContador(lista, actual)
    {
        const c = this._f8Barra?.querySelector('.et-search-count');
        if (!c) return;
        if (!this._f8Busq) { c.textContent = ''; return; }
        lista = lista ?? this._f8Coincidencias();
        const k = (actual ? lista.indexOf(actual) + 1 : 0);
        c.textContent = (k > 0 ? k + ' / ' + lista.length : String(lista.length));
    }

    // ---------- búsqueda: barra ----------
    _f8AplicarBarra()
    {
        if (!this._table || !this._shadow) return;
        if (!this._f8SearchBar) { if (this._f8Barra) this._f8Barra.remove(); return; }
        this._f8Estilo();
        if (!this._f8Barra)
        {
            const b = document.createElement('div');
            b.className = 'et-search-bar';
            b.setAttribute('role', 'search');
            const i = document.createElement('input');
            i.type = 'search';
            i.className = 'et-search-input';
            i.setAttribute('placeholder', this.getAttribute('search-placeholder') ?? 'Buscar…');
            i.setAttribute('aria-label', 'Buscar en la tabla');
            const n = document.createElement('span');
            n.className = 'et-search-count';
            n.setAttribute('aria-live', 'polite');
            const boton = (cls, txt, etq, dir) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'et-search-btn ' + cls; x.textContent = txt; x.setAttribute('aria-label', etq); x.setAttribute('tabindex', '-1'); x.addEventListener('click', (e) => { e.stopPropagation(); this._f8DesdeBarra(dir); }); return x; };
            b.append(i, n, boton('et-search-prev', '↑', 'Coincidencia anterior', -1), boton('et-search-next', '↓', 'Coincidencia siguiente', 1));
            i.addEventListener('input', () => this._f8Programar());
            i.addEventListener('keydown', (e) => this._f8TeclaBarra(e, i));
            this._f8Barra = b;
        }
        const cont = this._table.parentElement;
        if (!this._f8Barra.isConnected && cont && cont.parentNode)
            cont.parentNode.insertBefore(this._f8Barra, (this._f6Panel && this._f6Panel.parentNode === cont.parentNode) ? this._f6Panel : cont);
    }
    _f8Programar()
    {
        clearTimeout(this._f8Temporizador);
        const ms = Math.max(0, Number(this.SearchDebounce) || 0);
        this._f8Temporizador = setTimeout(() => this._f8BuscarBarra(), ms);
    }
    _f8BuscarBarra()
    {
        clearTimeout(this._f8Temporizador);
        this._f8Temporizador = 0;
        const i = this._f8Barra?.querySelector('input');
        if (!i) return;
        const texto = i.value;
        if (texto === (this._f8Busq?.text ?? '') && (this._f8Busq ? this._f8Busq.opts.filter === !!this.SearchFilter : true)) return;
        const enBarra = (this._shadow?.activeElement === i);
        this.Search(texto, { filter: !!this.SearchFilter });
        if (enBarra && this._shadow?.activeElement !== i) i.focus({ preventScroll: true });
    }
    _f8DesdeBarra(dir)
    {
        if (this._f8Temporizador) this._f8BuscarBarra();
        const i = this._f8Barra?.querySelector('input');
        this._f8Saltar(dir, false);
        if (i && this._shadow?.activeElement !== i) i.focus({ preventScroll: true });
    }
    _f8TeclaBarra(e, i)
    {
        const k = e.key;
        if (k === 'Enter' || k === 'F3') { e.preventDefault(); e.stopPropagation(); this._f8DesdeBarra(e.shiftKey ? -1 : 1); return; }
        if (k === 'Escape')
        {
            e.preventDefault(); e.stopPropagation();
            if (i.value !== '') { i.value = ''; this._f8BuscarBarra(); }
            else this._f8VolverATabla();
            return;
        }
        if (k === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); if (this._f8Temporizador) this._f8BuscarBarra(); this._f8VolverATabla(); return; }
        e.stopPropagation();
    }
    _f8VolverATabla()
    {
        const td = this.CurrentTd() ?? this.EdiTable.GetSelector()?.closest('td');
        if (td && td.isConnected && !td.closest('tr')?.classList.contains('et-filter-hidden')) { this.CellFocus(td); return; }
        const orden = this._f8OrdenVisual();
        if (orden.length) this.NavTo(orden[0], 0);
    }

    // ---------- validar la fila al salir (BeforeRowLeave) y errores por celda ----------
    // Confirma el editor abierto (como lo haría CellFocus). false si no se pudo confirmar.
    _f8Confirmar()
    {
        const input = this.EdiTable.GetInput();
        if (!input) return true;
        const t = (this.EdiTable.focusedTable ?? this);
        this._f1ConfirmDesdeCelda = true;
        let ok;
        try { ok = t.ConfirmEdit(input.closest('td')); } finally { this._f1ConfirmDesdeCelda = false; }
        return ok !== false;
    }
    // Desde CellFocus (td destino), _f6EnfocarGrupo (td null) e InsertRow (nueva). false: se canceló, no moverse.
    _f8SalirDeFila(td, toIndex, nueva = false)
    {
        if (this._f8SinSalida) return true;
        if (!this._f8Manejador('BeforeRowLeave')) return true;
        const cur = this.CurrentTd();
        if (!cur) return true;
        const trA = cur.closest('tr');
        const trB = (td && td.closest ? td.closest('tr') : null);
        if (!nueva && trB === trA) return true;
        const index = this._getRowIndex(trA);
        if (index < 0) return true;
        if (!this._f8Confirmar()) return false;
        const args = { index, data: this.DataArray[index], toIndex: (toIndex !== undefined ? toIndex : (trB ? this._getRowIndex(trB) : -1)), cancel: false };
        this._f8Disparar('BeforeRowLeave', args);
        if (args.errors && typeof args.errors === 'object')
        {
            let n = 0;
            Object.entries(args.errors).forEach(([f, msg]) => { if (msg != null && msg !== '') { this.SetCellError(index, f, String(msg)); n++; } });
            if (n) args.cancel = true;
        }
        if (args.cancel)
        {
            if (!this.EdiTable.GetSelector() && !this.EdiTable.GetInput() && cur.isConnected)
            {
                this._f8SinSalida = true;
                try { this.CellFocus(cur); } finally { this._f8SinSalida = false; }
            }
            return false;
        }
        if (nueva) { this._f8SinSalida = true; queueMicrotask(() => { this._f8SinSalida = false; }); }
        return true;
    }
    // InsertRow (enganche): base de getChanges antes de insertar y BeforeRowLeave hacia la fila nueva.
    _f8AlInsertar(rw, nofocus)
    {
        this._f8Asegurar();
        if (nofocus) return true;
        return this._f8SalirDeFila(null, (rw != undefined ? Number(rw) : (this._f5Activo ? this.DataArray.length : this.TRCount())), true);
    }
    // ConfirmEdit (enganche, después de BeforeUpdateCell): e.error marca la celda y sigue editando.
    _f8TrasBeforeUpdate(args, td, coldef)
    {
        if (args.error == null && !this._f8Errores.size) return;
        const i = this.RowIndexOfTd(td), f = coldef?.field;
        if (f == undefined || i < 0) return;
        if (args.error != null && args.error !== '' && args.error !== false)
        {
            args.cancel = true;
            this._f8PonerError(i, f, String(args.error), 'edit');
            return;
        }
        if (!args.cancel) { const k = this._f8Llave(i); const e = (k ? this._f8Errores.get(k)?.get(f) : null); if (e && e.src === 'edit') this.ClearCellError(i, f); }
    }
    _f8Llave(i)
    {
        const o = this.DataArray[i];
        if (o && typeof o === 'object') return o;
        if (this._f5Activo) return null;
        return this.GetTrByIndex(i) ?? null;
    }
    _f8PonerError(i, field, message, src)
    {
        const k = this._f8Llave(i);
        if (!k || field == undefined) return false;
        let m = this._f8Errores.get(k);
        if (!m) { m = new Map(); this._f8Errores.set(k, m); }
        m.set(String(field), { message: String(message), src });
        this._f8Estilo();
        this._f8PintarErroresFila(i);
        return true;
    }
    /** Marca la celda con error: clase et-cell-error, aria-invalid y el mensaje en title. Mensaje vacío: quita el error. */
    SetCellError = (i, field, message) =>
    {
        i = Number(i);
        if (message == null || message === '') return this.ClearCellError(i, field);
        return this._f8PonerError(i, field, message, 'api');
    }
    /** Sin argumentos: todos; con índice: los de la fila; con índice y campo: el de la celda. */
    ClearCellError = (i, field) =>
    {
        if (i === undefined || i === null)
        {
            const filas = new Set();
            this._shadow?.querySelectorAll('td.et-cell-error').forEach(td => filas.add(td.closest('tr')));
            this._f8Errores.clear();
            filas.forEach(tr => { if (tr) this._f8PintarErroresTr(tr, this._getRowIndex(tr)); });
            return true;
        }
        i = Number(i);
        const k = this._f8Llave(i);
        const m = (k ? this._f8Errores.get(k) : null);
        if (!m) return false;
        if (field === undefined || field === null) this._f8Errores.delete(k);
        else { m.delete(String(field)); if (!m.size) this._f8Errores.delete(k); }
        this._f8PintarErroresFila(i);
        return true;
    }
    /** [{index, field, message}] ordenados por fila y por columna. */
    getErrors = () =>
    {
        const out = [];
        if (!this._f8Errores.size) return out;
        const orden = (f) => { const k = this.Columns.findIndex(c => c?.field === f); return (k < 0 ? 1e9 : k); };
        this._f8Errores.forEach((m, k) => {
            let i = -1;
            if (k && k.nodeType === 1) i = (k.isConnected ? this._getRowIndex(k) : -1);
            else i = this.DataArray.indexOf(k);
            if (i < 0) return;
            [...m.entries()].sort((a, b) => orden(a[0]) - orden(b[0])).forEach(([field, e]) => out.push({ index: i, field, message: e.message }));
        });
        return out.sort((a, b) => (a.index - b.index) || (orden(a.field) - orden(b.field)));
    }
    _f8PintarErroresFila(i)
    {
        const tr = (this._f5Activo ? this._f5TrDibujado(i) : this.GetTrByIndex(i));
        if (tr) this._f8PintarErroresTr(tr, i);
    }
    _f8PintarErroresTr(tr, idx)
    {
        if (!tr || tr._f6Grupo) return;
        const o = this.DataArray[idx];
        const m = this._f8Errores.get((o && typeof o === 'object') ? o : tr);
        this._f4CeldasDatos(tr).forEach((td, k) => {
            const e = (m ? m.get(String(this.Columns[k]?.field)) : null);
            if (e)
            {
                if (!td.classList.contains('et-cell-error')) td._f8Title = td.getAttribute('title');
                td.classList.add('et-cell-error');
                td.setAttribute('aria-invalid', 'true');
                td.setAttribute('title', e.message);
            }
            else if (td.classList.contains('et-cell-error'))
            {
                td.classList.remove('et-cell-error');
                td.removeAttribute('aria-invalid');
                if (td._f8Title != null) td.setAttribute('title', td._f8Title); else td.removeAttribute('title');
                td._f8Title = null;
            }
        });
    }

    // ---------- getChanges ----------
    // Base perezosa: el primer enganche después de inicializar la toma. Un DataArray que no comparte ningún objeto
    // con la base (datos nuevos, restore) la reinicia; uno que sí comparte (filtrado, árbol) la conserva.
    _f8Asegurar()
    {
        if (!this._f1Inicializada) return false;
        const d = (this.DataArray ?? []);
        if (this._f8Base && d === this._f8BaseArr) return true;
        if (this._f8Base)
        {
            let comparte = false;
            for (const o of d) if (o && this._f8Base.has(o)) { comparte = true; break; }
            this._f8BaseArr = d;
            if (comparte) return true;
        }
        this._f8Base = new Set(d.filter(o => o && typeof o === 'object'));
        this._f8BaseArr = d;
        this._f8Orig = new Map();
        return true;
    }
    _f8AntesDeActualizar(row, field, value)
    {
        if (!this._f8Asegurar()) return;
        const o = this.DataArray[row];
        if (!o || typeof o !== 'object' || field == undefined || value == undefined || this._f8Orig.has(o) || !this._f8Base.has(o)) return;
        if (o[field] !== value) this._f8Orig.set(o, Object.assign({}, o));
    }
    _f8AlBorrar(row)
    {
        this._f8Asegurar();
        const o = this.DataArray[row];
        if (this._f8Errores.size) { this._f8Errores.delete(o); const tr = (this._f5Activo ? null : this.GetTrByIndex(row)); if (tr) this._f8Errores.delete(tr); }
    }
    // restoreRow: la copia restaurada ocupa el lugar del objeto anterior en la base.
    _f8Reemplazar(viejo, nuevo)
    {
        if (!this._f8Base || !viejo || !nuevo || viejo === nuevo) return;
        if (this._f8Base.has(viejo)) { this._f8Base.delete(viejo); this._f8Base.add(nuevo); }
        if (this._f8Orig.has(viejo)) { this._f8Orig.set(nuevo, this._f8Orig.get(viejo)); this._f8Orig.delete(viejo); }
        const e = this._f8Errores.get(viejo);
        if (e) { this._f8Errores.delete(viejo); this._f8Errores.set(nuevo, e); }
    }
    /** {added:[{index,data}], modified:[{index,data,original}], deleted:[{data}]}. */
    getChanges = () =>
    {
        this._f8Asegurar();
        const d = (this.DataArray ?? []), base = (this._f8Base ?? new Set()), vivos = new Set();
        const added = [], modified = [], deleted = [];
        const txt = (v) => (v == null ? '' : String(v));
        d.forEach((o, index) => {
            if (!o || typeof o !== 'object') return;
            vivos.add(o);
            if (!base.has(o)) { if (Object.keys(o).length) added.push({ index, data: o }); return; }
            const orig = this._f8Orig.get(o);
            if (!orig) return;
            const claves = new Set([...Object.keys(orig), ...Object.keys(o)]);
            for (const k of claves) if (txt(orig[k]) !== txt(o[k])) { modified.push({ index, data: o, original: orig }); return; }
        });
        base.forEach(o => { if (!vivos.has(o)) deleted.push({ data: o }); });
        return { added, modified, deleted };
    }
    /** true si la fila no estaba en la base (alta), o si no tiene datos todavía. */
    isNew = (i) =>
    {
        i = Number(i);
        if (!(i >= 0)) return false;
        const o = this.DataArray[i];
        if (!o) return (i < this.TRCount());
        this._f8Asegurar();
        return !!(this._f8Base && !this._f8Base.has(o));
    }
    /** La base pasa a ser lo que hay ahora: getChanges() queda vacío. No cambia IsDirty. */
    AcceptChanges = () =>
    {
        const d = (this.DataArray ?? []);
        this._f8Base = new Set(d.filter(o => o && typeof o === 'object'));
        this._f8BaseArr = d;
        this._f8Orig = new Map();
    }

    // ---------- enganches comunes ----------
    // _decorateRow (antes de onRowPaint): reglas, errores, clase del filtro y resaltado de la fila.
    _f8Decorar(tr, idx, data)
    {
        if (!tr || tr._f6Grupo) return;
        const o = this.DataArray[idx];
        if (o && this._f8Busq) this._f8Cache.delete(o);
        if (this._f8UsoReglas || this.RowRules != null || !this._f8AttrFilaLeido) this._f8ReglasTr(tr, data, true);
        if (this._f8Errores.size) this._f8PintarErroresTr(tr, idx);
        if (this._f8Fuera && !this._f5Activo && idx >= 0 && this._f8EsFuera(idx)) tr.classList.add('et-filter-hidden', 'hidde-row');
        if (this._f8Busq && this._f8Busq.opts.highlight) this._f8ResaltarFila(tr, idx);
    }
    // UpdateDataMember (enganche, después de escribir): reglas de esa fila, caché de búsqueda y resaltado.
    _f8TrasActualizar(row, field, stopfire)
    {
        const o = this.DataArray[row];
        if (o) this._f8Cache.delete(o);
        if (stopfire) return;
        const reglas = (this._f8UsoReglas || this.RowRules != null);
        if (!reglas && !this._f8Errores.size && !this._f8Busq) return;
        // Un error puesto sobre una fila sin datos pasa al objeto que se acaba de crear.
        if (this._f8Errores.size && o && !this._f5Activo) { const tr0 = this.GetTrByIndex(row), e = (tr0 ? this._f8Errores.get(tr0) : null); if (e) { this._f8Errores.delete(tr0); this._f8Errores.set(o, e); } }
        const tr = (this._f5Activo ? this._f5TrDibujado(row) : this.GetTrByIndex(row));
        if (!tr) return;
        if (reglas) this._f8ReglasTr(tr, o ?? {}, false);
        if (this._f8Errores.size) this._f8PintarErroresTr(tr, row);
        if (this._f8Busq && this._f8Busq.opts.highlight) this._f8ResaltarFila(tr, row);
    }
    // CellFocus (enganche, al final): el texto de la celda se movió al selector; se vuelve a resaltar.
    _f8TrasFoco(td)
    {
        const tr = td?.closest?.('tr');
        if (this._f8Busq && this._f8Busq.opts.highlight)
        {
            if (this._f8TrUlt && this._f8TrUlt !== tr && this._f8TrUlt.isConnected) this._f8ResaltarFila(this._f8TrUlt);
            if (tr) this._f8ResaltarFila(tr);
        }
        this._f8TrUlt = tr ?? null;
        this._f8VerCelda(td);   // (4) columnas fijas
    }

    // ---------- secuencia de captura ----------
    _f8CapturaActiva()
    {
        if (this._f8EnterMode !== 'current' || this.SkipReadonly === true) return true;
        return this.Columns.some(c => c && ((c['tab-order'] ?? c.tabOrder) != null || (c['tab-skip'] ?? c.tabSkip) != null));
    }
    _f8Orden(col)
    {
        const v = (col?.['tab-order'] ?? col?.tabOrder);
        if (v == null || String(v).trim() === '') return Infinity;
        const n = Number(v);
        return (Number.isFinite(n) ? n : Infinity);
    }
    _f8Capturable(col)
    {
        if (!col) return false;
        const skip = (col['tab-skip'] ?? col.tabSkip);
        if (skip != null && this._f5Bool(skip === '' ? true : skip)) return false;
        if (this.SkipReadonly === true)
        {
            if (col.readonly != null && !this._f1EsFalso(col.readonly)) return false;
            const ty = String(col.type ?? this.ColumnsDefaultType);
            if (ty === 'NoEditable' || this._isBadgesCol(col)) return false;
        }
        return true;
    }
    /** Fields en el orden de captura (visibles y capturables). */
    getCaptureOrder = () =>
    {
        const l = [];
        this.Columns.forEach((c, i) => { if (c && !(c.field != undefined && this._f1ColumnaOculta(c.field)) && this._f8Capturable(c)) l.push({ c, i, k: this._f8Orden(c) }); });
        l.sort((a, b) => (a.k - b.k) || (a.i - b.i));
        return l.map(x => x.c.field);
    }
    // Celdas capturables de la fila, en el orden de captura.
    _f8Secuencia(tr)
    {
        if (!tr || tr._f6Grupo) return [];
        const l = [];
        this._f4CeldasDatos(tr).forEach((td, i) => {
            if (td.classList.contains('hidde-col')) return;
            const c = this.Columns[i];
            if (this._f8Capturable(c)) l.push({ td, i, k: this._f8Orden(c) });
        });
        l.sort((a, b) => (a.k - b.k) || (a.i - b.i));
        return l.map(x => x.td);
    }
    _f8Clave(td) { const i = this.ColIndexOfTd(td); const k = this._f8Orden(this.Columns[i]); return (k === Infinity ? 1e12 : k * 1e6) + i; }
    // La fila de datos visible vecina (salta grupos, ocultas, filtradas y relleno); en virtual la dibuja.
    _f8FilaVecina(tr, dir)
    {
        if (this._f5Activo)
        {
            const p = this._f5PosTr.get(tr);
            if (p === undefined) return null;
            for (let q = p + dir; q >= 0 && q < this._f5Lista.length; q += dir) if (this._f5Lista[q]?.tipo === 'datos') return (this._f5IrA(q) ?? null);
            return null;
        }
        let x = tr;
        do { x = (dir > 0 ? x.nextElementSibling : x.previousElementSibling); }
        while (x && (x.tagName !== 'TR' || x._f6Grupo || x.classList.contains('hidde-row') || x.classList.contains('et-spacer')));
        return x ?? null;
    }
    _f8Tab(td, dir)
    {
        const tr = td.closest('tr');
        const seq = this._f8Secuencia(tr);
        if (!seq.length) { if (dir > 0) this.NavRight(td); else this.NavLeft(td); return true; }
        const k = seq.indexOf(td);
        let destino;
        if (k >= 0) destino = seq[k + dir];
        else { const c = this._f8Clave(td); destino = (dir > 0 ? seq.find(x => this._f8Clave(x) > c) : [...seq].reverse().find(x => this._f8Clave(x) < c)); }
        if (destino) { this.CellFocus(destino); return true; }
        return this._f8OtraFila(td, dir, (dir > 0 ? 'primera' : 'ultima'));
    }
    _f8OtraFila(td, dir, cual)
    {
        const tr = td.closest('tr');
        const sig = this._f8FilaVecina(tr, dir);
        if (sig)
        {
            const seq = this._f8Secuencia(sig);
            const destino = (cual === 'primera' ? seq[0] : seq[seq.length - 1]) ?? sig.querySelector('td:not(.hidde-col):not(.et-sel-col)');
            if (destino) this.CellFocus(destino);
            return true;
        }
        if (dir < 0 || !this.AutoAddRow) return true;
        // Última fila: se agrega otra solo si la actual ya tiene datos (como eQGridXBar con <Nueva Fila>).
        const i = this._getRowIndex(tr);
        const habia = !!this.EdiTable.GetInput();
        if (!this._f8Confirmar()) return true;
        if (habia && !this.EdiTable.GetSelector() && td.isConnected) { this._f8SinSalida = true; try { this.CellFocus(td); } finally { this._f8SinSalida = false; } }
        const o = this.DataArray[i];
        if (!o || !Object.keys(o).some(k => o[k] != null && o[k] !== '')) return true;
        const n0 = this.TRCount();
        this.AddRow();
        if (this.TRCount() === n0) return true;
        const cur = this.CurrentTd();
        const seq = (cur ? this._f8Secuencia(cur.closest('tr')) : []);
        if (seq[0] && seq[0] !== cur) this.CellFocus(seq[0]);
        return true;
    }
    _f8Enter(td, atras)
    {
        switch (this._f8EnterMode)
        {
            case 'next-cell': return this._f8Tab(td, atras ? -1 : 1);
            case 'next-row': return this._f8OtraFila(td, atras ? -1 : 1, 'primera');
            case 'down': if (atras) this.NavUp(td); else this.NavDown(td); return true;
        }
        return false;
    }
    // Teclado del selector (enganche): F3 de la búsqueda, Ctrl+F a la barra, Tab y Enter de la secuencia.
    _f8Tecla(e, selector)
    {
        if (this._f8Pend) return false;   // tecleo rápido: la tecla se repite en el editor (_f8Tecleo)
        const k = e.key;
        if (k === 'F3' && this._f8Busq && !e.ctrlKey && !e.altKey) { e.preventDefault(); e.stopPropagation(); this._f8Saltar(e.shiftKey ? -1 : 1, false); return true; }
        if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (k === 'f' || k === 'F') && this._f8Barra?.isConnected)
        {
            e.preventDefault(); e.stopPropagation();
            const i = this._f8Barra.querySelector('input');
            i.focus(); i.select();
            return true;
        }
        if (k !== 'Tab' && k !== 'Enter') return false;
        if (!this._f8CapturaActiva()) return false;
        const td = selector.closest('td');
        if (!td) return false;
        if (k === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); e.stopPropagation(); this._f8Tab(td, e.shiftKey ? -1 : 1); return true; }
        if (k === 'Enter' && this._f8EnterMode !== 'current' && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); e.stopPropagation(); this._f8Enter(td, e.shiftKey); return true; }
        return false;
    }
    // StartEdit (enganche): en captura, Tab y Enter del editor siguen la secuencia (antes que el manejador de hoy).
    _f8PrepararEditor(input)
    {
        if (!input || !this._f8CapturaActiva()) return;
        const tag = input.tagName;
        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const td = input.closest('td');
            if (!td) return;
            if (e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); this._f8Tab(td, e.shiftKey ? -1 : 1); return; }
            if (e.key === 'Enter' && tag === 'INPUT' && this._f8EnterMode !== 'current') { e.preventDefault(); e.stopImmediatePropagation(); this._f8Enter(td, e.shiftKey); }
        }, true);
    }

    // ---------- formato condicional (rules, row-rules) ----------
    _f8ParseReglas(src, donde)
    {
        if (src == null || src === '') return null;
        let r = src;
        if (typeof src === 'string')
        {
            try { r = JSON.parse(src); }
            catch (e) { console.warn('EditTable: rules inválido en ' + donde + ': ' + e.message); r = []; }
        }
        if (!Array.isArray(r)) r = (r && typeof r === 'object' ? [r] : []);
        return r.filter(x => x && typeof x === 'object');
    }
    _f8ReglasDe(col)
    {
        if (!col || col.rules == null) return null;
        const c = this._f8ReglasCache.get(col);
        if (c && c.src === col.rules) return c.r;
        const r = this._f8ParseReglas(col.rules, 'la columna ' + (col.field ?? ''));
        this._f8ReglasCache.set(col, { src: col.rules, r });
        return r;
    }
    _f8ReglasFilaDef()
    {
        if (!this._f8AttrFilaLeido)
        {
            this._f8AttrFilaLeido = true;
            const a = this.getAttribute('row-rules');
            if (a != null && a !== '' && this.RowRules == null) this.RowRules = this._f8ParseReglas(a, 'row-rules');
        }
        if (this.RowRules == null) return null;
        if (this._f8FilaSrc !== this.RowRules) { this._f8FilaSrc = this.RowRules; this._f8FilaReglas = this._f8ParseReglas(this.RowRules, 'RowRules'); }
        return this._f8FilaReglas;
    }
    // Número canónico (R9) o null.
    _f8Num(v)
    {
        if (typeof v === 'number') return (Number.isFinite(v) ? EditTable.Mask.canonicalFromText(String(v), { native: true }) : null);
        if (typeof v !== 'string' || v.trim() === '') return null;
        return EditTable.Mask.canonicalFromText(v.trim(), { native: true });
    }
    _f8CmpNum(a, b)
    {
        const A = this._f2Dec(a), B = this._f2Dec(b), s = Math.max(A.s, B.s);
        const x = this._f2Escalar(A, s), y = this._f2Escalar(B, s);
        return (x < y ? -1 : (x > y ? 1 : 0));
    }
    // Compara un valor con el de la regla: número (canónico), fecha ISO o texto. null si no son comparables.
    _f8Cmp(v, w, col)
    {
        const numerico = (typeof w === 'number' || typeof v === 'number' || /^(number)$/i.test(String(col?.type ?? '')));
        if (numerico)
        {
            const a = this._f8Num(v), b = this._f8Num(w);
            if (a != null && b != null) return this._f8CmpNum(a, b);
            if (typeof w === 'number' || a == null) return null;
        }
        const iso = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/;
        const sv = (v == null ? '' : String(v).trim()), sw = (w == null ? '' : String(w).trim());
        if (iso.test(sv) && iso.test(sw)) { const a = sv.replace(' ', 'T'), b = sw.replace(' ', 'T'); return (a < b ? -1 : (a > b ? 1 : 0)); }
        if (sv === sw) return 0;
        if (!this._f8Coll) this._f8Coll = (typeof Intl !== 'undefined' ? new Intl.Collator('es', { numeric: true }) : null);
        return (this._f8Coll ? Math.sign(this._f8Coll.compare(sv, sw)) || (sv < sw ? -1 : 1) : (sv < sw ? -1 : 1));
    }
    _f8Cumple(r, data, col)
    {
        if (!r || !data) return false;
        const v = data[r.field];
        const op = String(r.op ?? 'eq').trim().toLowerCase();
        const vacio = (v == null || String(v).trim() === '');
        switch (op)
        {
            case 'empty': return vacio;
            case 'notempty': return !vacio;
            case 'contains': return !vacio && this._f8Plegar(v).includes(this._f8Plegar(r.value));
            case 'in': return Array.isArray(r.value) && r.value.some(x => this._f8Cmp(v, x, col) === 0);
            case 'between': { if (vacio) return false; const a = this._f8Cmp(v, r.value, col), b = this._f8Cmp(v, r.value2, col); return a != null && b != null && a >= 0 && b <= 0; }
            case 'eq': case 'ne': { const c = (vacio && (r.value == null || r.value === '') ? 0 : (vacio ? null : this._f8Cmp(v, r.value, col))); return (op === 'eq' ? c === 0 : c !== 0); }
            case 'lt': case 'le': case 'gt': case 'ge':
            {
                if (vacio) return false;
                const c = this._f8Cmp(v, r.value, col);
                if (c == null) return false;
                return (op === 'lt' ? c < 0 : (op === 'le' ? c <= 0 : (op === 'gt' ? c > 0 : c >= 0)));
            }
        }
        if (!this._f8OpAvisado) { this._f8OpAvisado = true; console.warn('EditTable: operador de regla desconocido: ' + op); }
        return false;
    }
    _f8Estilos(s)
    {
        const out = {};
        if (!s) return out;
        if (typeof s === 'string') s.split(';').forEach(p => { const k = p.indexOf(':'); if (k > 0) out[p.slice(0, k).trim()] = p.slice(k + 1).trim(); });
        else if (typeof s === 'object') Object.entries(s).forEach(([k, v]) => { if (v != null) out[k.startsWith('--') ? k : k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())] = String(v); });
        return out;
    }
    _f8Evaluar(reglas, data, col)
    {
        const res = { cls: [], sty: {}, icon: null };
        if (!reglas || !reglas.length) return res;
        reglas.forEach(r => {
            const field = (r.field ?? col?.field);
            if (field == undefined) return;
            const c = (r.field != null && r.field !== col?.field ? this._f8ColDe(field) : col);
            if (!this._f8Cumple({ ...r, field }, data, c)) return;
            if (r.class) String(r.class).split(/\s+/).filter(Boolean).forEach(x => res.cls.push(x));
            if (r.style) Object.assign(res.sty, this._f8Estilos(r.style));
            if (r.icon != null && r.icon !== '') res.icon = String(r.icon);
        });
        return res;
    }
    _f8Poner(el, res)
    {
        const tenia = ((el._f8Cls?.length ?? 0) + (el._f8Sty?.length ?? 0) > 0) || !!el._f8Ico;
        if (!tenia && !res.cls.length && !Object.keys(res.sty).length && res.icon == null) return;
        this._f8Estilo();
        (el._f8Cls ?? []).forEach(c => el.classList.remove(c));
        (el._f8Sty ?? []).forEach(p => el.style.removeProperty(p));
        if (el._f8Ico) { el.removeAttribute('data-et-icon'); el.style.removeProperty('--et-rule-icon'); }
        el._f8Cls = res.cls;
        res.cls.forEach(c => el.classList.add(c));
        el._f8Sty = Object.keys(res.sty);
        el._f8Sty.forEach(p => el.style.setProperty(p, res.sty[p]));
        el._f8Ico = (res.icon != null);
        if (el._f8Ico)
        {
            el.setAttribute('data-et-icon', res.icon);
            el.style.setProperty('--et-rule-icon', '"' + res.icon.replace(/[\\"]/g, '\\$&').replace(/[\r\n\f]/g, ' ') + '"');
        }
        if (!el.getAttribute('style')) el.removeAttribute('style');
    }
    // _f1PintarCelda (enganche, antes de onTdPaint).
    _f8ReglasCelda(td, col, data)
    {
        const r = this._f8ReglasDe(col);
        if (r && r.length) this._f8UsoReglas = true;
        this._f8Poner(td, this._f8Evaluar(r, data, col));
        td._f8Listo = true;
    }
    // Reglas de las celdas y de la fila. pintada: true si viene de _decorateRow (las celdas recién pintadas ya las tienen).
    _f8ReglasTr(tr, data, pintada)
    {
        const tds = this._f4CeldasDatos(tr);
        tds.forEach((td, i) => {
            if (pintada && td._f8Listo) { td._f8Listo = false; return; }
            const col = this.Columns[i];
            if (col?.rules != null || td._f8Cls || td._f8Sty || td._f8Ico) this._f8ReglasCelda(td, col, data);
            td._f8Listo = false;
        });
        const rr = this._f8ReglasFilaDef();
        if (rr && rr.length) this._f8UsoReglas = true;
        if (rr || tr._f8Cls || tr._f8Sty || tr._f8Ico) this._f8Poner(tr, this._f8Evaluar(rr, data, null));
    }
    /** Vuelve a aplicar las reglas a las filas dibujadas (después de cambiar Columns[i].rules o RowRules por código). */
    RefreshRules = () =>
    {
        const tbody = this._f1TBodyPrincipal();
        if (!tbody) return;
        this._f8UsoReglas = true;
        for (const tr of tbody.rows)
        {
            if (tr._f6Grupo || tr.classList.contains('et-spacer')) continue;
            const i = this._getRowIndex(tr);
            this._f8ReglasTr(tr, (tr._etData ?? this.DataArray[i] ?? {}), false);
        }
    }
    // ---------- encargos de la integración (2026-11-01) ----------
    // (1) Tecleo rápido en el selector (lector de códigos): hoy cada tecla programa su propio StartEdit en un
    // setTimeout de 1 ms; las que llegan antes de que exista el editor se pierden o lanzan TypeError. Ahora la
    // primera programa el StartEdit con el mismo retraso y las siguientes se acumulan: los caracteres se agregan
    // al texto inicial y las demás teclas (Enter, Tab, flechas) se repiten en el editor ya creado, en orden.
    _f8Pend = null;
    _f8Tecleo(e, selector, cur)
    {
        const k = e.key ?? '';
        const imprimible = (k.trim().length == 1 && !((e.ctrlKey || e.metaKey) && !e.altKey));
        if (!this._f8Pend)
        {
            if (!imprimible) return false;
            const p = { td: selector.closest('td'), texto: k, teclas: [] };
            this._f8Pend = p;
            setTimeout(() => {
                this._f8Pend = null;
                const td = (p.td && p.td.isConnected ? p.td : selector.closest('td'));
                if (!td) return;
                (cur ?? this).StartEdit(td, p.texto);
                const input = this.EdiTable.GetInput();
                if (!input) return;
                for (const t of p.teclas)
                {
                    const i = this.EdiTable.GetInput();
                    if (!i) break;
                    i.dispatchEvent(new KeyboardEvent('keydown', { key: t.key, code: t.code, shiftKey: t.shiftKey, ctrlKey: t.ctrlKey, altKey: t.altKey, metaKey: t.metaKey, bubbles: true, cancelable: true, composed: true }));
                }
            }, 1);
            e.preventDefault(); e.stopPropagation();
            return true;
        }
        if (imprimible && !this._f8Pend.teclas.length) this._f8Pend.texto += k;
        else if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph'].includes(k)) this._f8Pend.teclas.push({ key: k, code: e.code, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey });
        e.preventDefault(); e.stopPropagation();
        return true;
    }
    // (2) CellFocus con una edición abierta: si al confirmar alguien vuelve a dibujar (por ejemplo _printRows en
    // FieldUpdated), la celda destino queda desconectada; se busca la equivalente (misma fila de datos y columna).
    _f8RefTd(td)
    {
        const tr = td?.closest?.('tr');
        if (!tr) return null;
        return { fila: this._getRowIndex(tr), col: this.ColIndexOfTd(td) };
    }
    _f8TdVigente(ref)
    {
        if (!ref || ref.fila < 0 || ref.col < 0) return null;
        const tr = (this._f5Activo ? this._f5Asegurar(ref.fila) : this.GetTrByIndex(ref.fila));
        return (tr ? (this._f4CeldasDatos(tr)[ref.col] ?? null) : null);
    }
    // (4) Con columnas fijas, la celda enfocada queda a la vista y no debajo de la banda fija (normal y virtual).
    _f8VerCelda(td)
    {
        if (!td || !td.isConnected || !this._table?.classList.contains('et-has-fixed') || td.classList.contains('et-fixed')) return;
        let el = this._table, cont = null;
        while ((el = this._composedParent(el)))
        {
            if (el === document.body || el === document.documentElement) break;
            const ox = getComputedStyle(el).overflowX;
            if ((ox == 'auto' || ox == 'scroll' || ox == 'overlay') && el.scrollWidth > el.clientWidth + 1) { cont = el; break; }
        }
        const tr = td.closest('tr');
        const r = td.getBoundingClientRect();
        let izq = (cont ? cont.getBoundingClientRect().left + cont.clientLeft : 0);
        const der = (cont ? cont.getBoundingClientRect().left + cont.clientLeft + cont.clientWidth : window.innerWidth);
        Array.from(tr.cells).forEach(x => { if ((x.classList.contains('et-fixed') || x.classList.contains('et-sel-col')) && !x.classList.contains('hidde-col') && getComputedStyle(x).position === 'sticky') izq = Math.max(izq, x.getBoundingClientRect().right); });
        let d = 0;
        if (r.left < izq - 0.5) d = r.left - izq;
        else if (r.right > der + 0.5) d = Math.min(r.right - der, r.left - izq);
        if (Math.abs(d) < 1) return;
        if (cont) cont.scrollLeft += d; else window.scrollBy(d, 0);
    }
    // (5) Restauración del diseño guardado: LayoutChanged {reason:'restore'} si se aplicó algo, y la promesa
    // LayoutReady / whenLayoutReady(), que se resuelve (true si se restauró, false si no había nada) al terminar.
    _f8LayoutRes = null;
    _f8LayoutPromesa = new Promise(r => { this._f8LayoutRes = r; });
    get LayoutReady() { return this._f8LayoutPromesa; }
    whenLayoutReady() { return this._f8LayoutPromesa; }
    _f8Restaurar()
    {
        let p;
        try { p = Promise.resolve(this._f3Restaurar?.()); } catch (e) { p = Promise.resolve(false); }
        p.then(ok => {
            if (ok === true) { try { this._f3Disparar?.('LayoutChanged', () => ({ layout: this.getLayout(), reason: 'restore' })); } catch (e) { } }
            this._f8LayoutRes?.(ok === true);
        }, () => this._f8LayoutRes?.(false));
    }
    // ===== F8a: fin

    // ===== F8b: temas (theme, palette, striped, density) y variables CSS --et-* =====
    // Sin theme, palette, striped ni density el DOM y el CSS calculado son los de hoy (R1, R8): el texto de los
    // <style> no cambia (lo comparan el banco y los consumidores); las variables se enganchan en el CSSOM
    // (_f8bReescribir), con el valor actual como respaldo. Precedencia: respaldo < tema < --et-* externas < palette.
    static { this.features.push('theme'); EditTable._f1Observados.push('theme', 'palette', 'striped', 'density'); }

    // Variables derivadas: si no se definen, toman la de su padre (externa, palette o del tema).
    static _f8bPadres = {
        'header-border': 'border', 'header-pad-y': 'cell-pad-y', 'footer-bg': 'header-bg', 'footer-fg': 'header-fg',
        'menu-bg': 'bg', 'menu-fg': 'fg', 'menu-border': 'border', 'menu-hover-bg': 'hover-bg',
        'panel-bg': 'header-bg', 'panel-border': 'border', 'chip-bg': 'bg', 'chip-border': 'input-border',
        'card-border': 'border', 'group-bg': 'header-bg', 'group-hover-bg': 'hover-bg',
        'fixed-bg': 'bg', 'fixed-head-bg': 'header-bg', 'fixed-hover-bg': 'hover-bg', 'badge-bg': 'muted-fg',
        'checked-bg': 'sel-bg-soft'
    };
    // Valor de una propiedad: --et-<n>, si no --et-<padre>, si no el del tema (--et-t-<n>), si no el respaldo.
    static _f8bV(n, fb)
    {
        const t = `var(--et-t-${n}${fb != null ? ', ' + fb : ''})`;
        const p = EditTable._f8bPadres[n];
        return p ? `var(--et-${n}, var(--et-${p}, ${t}))` : `var(--et-${n}, ${t})`;
    }
    // Mapa de reescritura: selectorText (como lo normaliza el navegador) → [propiedad, variable, respaldo actual].
    // Solo se reescriben las propiedades que la regla ya declara; el respaldo es el valor de hoy.
    static _f8bMapa()
    {
        if (EditTable._f8bMapaCache) return EditTable._f8bMapaCache;
        const V = EditTable._f8bV;
        const flecha = (c) => `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='${c}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`;
        const ed = (pad) => [['outline-color', V('input-border', '#ced4da')], ['padding', pad], ['font-size', V('font-size', '1rem')],
            ['color', V('input-fg', '#212529')], ['background-color', V('input-bg', '#fff')]];
        const py = V('input-pad-y', '0.375rem'), px = V('input-pad-x', '0.75rem');
        const inputs = '.Editable-Input-Number, .Editable-Input-Text, .Editable-Input-Memo, .Editable-Input-Date, .Editable-Input-DateTime, .Editable-Input-Select';
        const foco = V('focus-ring', '#3D75DD');
        const m = {
            // ---- base (shadow principal y _getExtraCss)
            '.EdiTable-Selector': [['background-color', V('active-bg', 'rgba(255,255,255,.7)')], ['border-color', V('active-border', '#FFF')], ['border-radius', V('radius', '3px')], ['color', V('active-fg', '#000')]],
            '.EdiTable-Cell': [['height', V('row-height', '1.4rem')], ['outline-color', V('border', '#EDEDED')], ['padding', `${V('cell-pad-y', '4px')} ${V('cell-pad-x', '4px')}`]],
            '.EdiTable-Row-Selected': [['background-color', V('sel-bg', '#3D75DD')], ['color', V('sel-fg', '#FFF')]],
            'table': [['font-size', V('font-size', '1rem')]],
            'tbody tr:hover': [['background-color', V('hover-bg', '#F5F5F5')]],
            'thead': [['background-color', V('header-bg', '#F5F5F5')]],
            'thead tr th': [['padding', `${V('header-pad-y', '4px')} ${V('header-pad-x', '8px')}`], ['outline-color', V('header-border', '#DDD')], ['font-weight', V('header-weight', 'normal')]],
            [inputs]: ed(`${py} ${px}`),
            '.Editable-Input-Select': [...ed(`${py} 2.25rem ${py} ${px}`), ['background-image', V('select-arrow', flecha('%23343a40'))]],
            '.EdiTable-Button': [['color', V('accent', '#3D75DD')]],
            '.tr-border-bottom td': [['border-bottom-color', V('muted-fg', '#888')]],
            '.icon-child div::before': [['background-color', V('header-bg', '#F5F5F5')]],
            '.bg-child': [['background-color', V('hover-bg', '#F5F5F5')], ['color', V('fg', '#000')]],
            '.dragging': [['background-color', V('hover-bg', '#EDEDED')], ['color', V('fg', '#000')]],
            '.induxsoft-form-control': ed(null),
            '.induxsoft-form-control:disabled, .induxsoft-form-control[readonly]': [['background-color', V('input-disabled-bg', '#e9ecef')]],
            '.induxsoft-buttons': ed(null),
            '.induxsoft-buttons:hover': [['color', V('input-fg', '#212529')], ['background-color', V('hover-bg', '#F5F5F5')]],
            '.induxsoft-form-select': [...ed(null), ['background-image', V('select-arrow', flecha('%23343a40'))]],
            '.et-badge': [['background', V('badge-bg', '#8696A0')], ['color', V('badge-color', '#FFF')], ['border-radius', V('badge-radius', '999px')]],
            '.et-badge:focus-visible': [['outline-color', foco]],
            '.et-tooltip': [['background', V('tooltip-bg', '#1F2328')], ['color', V('tooltip-fg', '#FFF')], ['border-radius', V('radius', '4px')]],
            'table.et-cards tbody tr': [['outline-color', V('card-border', '#DDD')]],
            '& tbody tr': [['outline-color', V('card-border', '#DDD')]],
            // ---- F2: pie de totales
            'table > tfoot': [['background-color', V('footer-bg', '#F5F5F5')]],
            'tfoot td.et-summary': [['outline-color', V('header-border', '#DDD')]],
            // ---- F3: columnas fijas, selector de columnas y reordenar
            'table.et-has-fixed th.et-fixed, table.et-has-fixed td.et-fixed': [['background-color', V('fixed-bg', '#FFF')]],
            'table.et-has-fixed thead > tr > th.et-fixed': [['background-color', V('fixed-head-bg', '#F5F5F5')]],
            'table.et-has-fixed tbody tr:hover > td.et-fixed': [['background-color', V('fixed-hover-bg', '#F5F5F5')]],
            '.et-chooser-btn': [['border-color', V('menu-border', '#CCC')], ['border-radius', V('radius', '3px')], ['background', V('menu-bg', '#FFF')], ['color', V('muted-fg', '#555')]],
            '.et-chooser-btn:hover': [['background', V('menu-hover-bg', '#F0F4FB')]],
            '.et-chooser': [['background', V('menu-bg', '#FFF')], ['color', V('menu-fg', '#212529')], ['border-color', V('menu-border', '#CCC')], ['border-radius', V('radius', '4px')]],
            '.et-chooser > button:disabled': [['color', V('muted-fg', '#999')]],
            '.et-chooser > button:not(:disabled):hover, .et-chooser > label:hover': [['background', V('menu-hover-bg', '#F0F4FB')]],
            '.et-chooser > hr': [['border-top-color', V('menu-border', '#EEE')]],
            '.et-drop-indicator': [['background', V('accent', '#3D75DD')]],
            // ---- F4: filas marcadas con casilla
            'tbody tr.et-row-checked': [['background-color', V('checked-bg', '#DCE8FB')]],
            // ---- F6: panel y filas de grupo
            '.et-group-panel': [['border-color', V('panel-border', '#CCC')], ['border-radius', V('radius', '4px')], ['background', V('panel-bg', '#FAFAFA')], ['color', V('muted-fg', '#555')]],
            '.et-group-panel:empty::before': [['color', V('muted-fg', '#888')]],
            '.et-group-panel.et-drop-over': [['border-color', V('accent', '#3D75DD')], ['background', V('menu-hover-bg', '#F0F4FB')]],
            '.et-group-chip': [['border-color', V('chip-border', '#BBB')], ['border-radius', V('chip-radius', '12px')], ['background', V('chip-bg', '#FFF')], ['color', V('fg', '#212529')]],
            '.et-group-chip:focus': [['border-color', foco]],
            '.et-chip-remove': [['color', V('muted-fg', '#666')]],
            '.et-chip-remove:hover': [['color', V('fg', '#000')]],
            'tbody tr.et-group-row > td': [['outline-color', V('header-border', '#DDD')], ['background-color', V('group-bg', '#EEF2F7')]],
            'tbody tr.et-group-row:hover > td': [['background-color', V('group-hover-bg', '#E5EBF3')]],
            'tbody tr.et-group-row:focus-within > td': [['box-shadow', `inset 0 2px 0 ${foco}, inset 0 -2px 0 ${foco}`]],
            '.et-group-count': [['color', V('muted-fg', '#666')]],
            'table.et-has-fixed tbody tr.et-group-row > td.et-fixed': [['background-color', V('group-bg', '#EEF2F7')]],
        };
        // ed(null): las clases induxsoft-* usan el relleno con !important de hoy; no se toca
        for (const k of ['.induxsoft-form-control', '.induxsoft-buttons', '.induxsoft-form-select']) m[k] = m[k].filter(x => x[1] != null);
        // Reglas nuevas, de especificidad 0 y al principio de la hoja: cualquier regla del sitio les gana, y sin
        // variables valen 'revert' (lo mismo que no declarar nada).
        const nuevas = [
            `:where(table) { background-color: ${V('bg', 'revert')}; color: ${V('fg', 'revert')}; }`,
            `:where(thead tr th) { color: ${V('header-fg', 'revert')}; text-transform: ${V('header-transform', 'revert')}; letter-spacing: ${V('header-spacing', 'revert')}; font-size: ${V('header-font-size', 'revert')}; }`,
            `:where(table > tfoot) { color: ${V('footer-fg', 'revert')}; }`,
        ];
        return (EditTable._f8bMapaCache = { m, nuevas });
    }

    // ---- Temas predeterminados y registro: viven en el módulo común InduxsoftTheme (induxsoft.theme.js, incrustado
    // al principio de este archivo). EditTable.themes y EditTable.defineTheme son alias de ese registro.
    static _f8bDensidades = {
        compacta: { 'cell-pad-y': '1px', 'cell-pad-x': '4px', 'header-pad-y': '2px', 'header-pad-x': '6px', 'row-height': '1.15rem', 'input-pad-y': '0', 'input-pad-x': '0.35rem' },
        normal: {},
        comoda: { 'cell-pad-y': '8px', 'cell-pad-x': '10px', 'header-pad-y': '8px', 'header-pad-x': '12px', 'row-height': '2.2rem', 'input-pad-y': '0.45rem', 'input-pad-x': '0.75rem' }
    };
    static _f8bDensidadAlias = { 'cómoda': 'comoda', compact: 'compacta', comfortable: 'comoda', compacto: 'compacta', comodo: 'comoda' };
    static _f8bEspaciado = new Set(['cell-pad-x', 'cell-pad-y', 'header-pad-x', 'header-pad-y', 'row-height', 'input-pad-x', 'input-pad-y']);
    static _f8bVivas = new Set();

    // TP: el registro es el de InduxsoftTheme (mismos temas, valores y derivadas que tenía F8b).
    static _f8bTema(nombre) { return InduxsoftTheme._interno(nombre); }
    static _f8bNombre(v) { return InduxsoftTheme.normalize(v); }
    /** EditTable.themes: { nombre: paleta resuelta } (copias). Alias de InduxsoftTheme.themes. */
    static get themes() { return InduxsoftTheme.themes; }
    /**
     * Registra (o reemplaza) un tema; alias de InduxsoftTheme.define (el registro es común a todos los componentes).
     * paleta: { 'header-bg': '#…', … } (con o sin '--et-'). opciones.base: tema del que toma lo que falta (por omisión
     * 'claro'; null para ninguno). Las tablas que ya lo usan se actualizan.
     */
    static defineTheme(nombre, paleta, opciones = {})
    {
        const n = EditTable._f8bNombre(nombre);
        if (!n || n === 'auto' || !/^[a-z0-9][a-z0-9_-]*$/.test(n)) throw new Error('EditTable.defineTheme: nombre de tema inválido: ' + nombre);
        const r = InduxsoftTheme.define(n, EditTable._f8bLimpiar(paleta, 'defineTheme'), opciones);
        for (const w of EditTable._f8bVivas) { const t = w.deref(); if (!t) EditTable._f8bVivas.delete(w); else if (t._f8bTemaNombre() === n || t._f8bTemaNombre() === 'auto') t._f8bAplicar(); }
        return r;
    }
    // Valida una paleta: objeto o JSON; claves [a-z0-9-] (sin '--et-'); valores de texto o número sin ; { } < >.
    static _f8bLimpiar(p, donde)
    {
        if (typeof p === 'string') { try { p = p.trim() ? JSON.parse(p) : {}; } catch (e) { console.warn(`EditTable: ${donde}: JSON inválido; se ignora.`); return {}; } }
        if (!p || typeof p !== 'object' || Array.isArray(p)) { if (p != null) console.warn(`EditTable: ${donde}: se esperaba un objeto; se ignora.`); return {}; }
        const r = {};
        for (let [k, v] of Object.entries(p))
        {
            k = String(k).trim().replace(/^--et-/, '').replace(/[A-Z]/g, c => '-' + c.toLowerCase());
            if (!/^[a-z0-9][a-z0-9-]*$/.test(k) || (typeof v !== 'string' && typeof v !== 'number') || /[;{}<>]/.test(String(v)) || String(v).trim() === '')
            { console.warn(`EditTable: ${donde}: se ignora ${JSON.stringify(k)}.`); continue; }
            r[k] = String(v).trim();
        }
        return r;
    }

    // ---- Estado de la instancia
    _f8bTemaProp = undefined;     // Theme asignado por propiedad (gana al atributo)
    _f8bPaleta = null;            // palette (objeto limpio) o null
    _f8bRayas = null;             // striped: true, false o null (por omisión: sí con tema)
    _f8bDens = '';                // density
    _f8bEstilo = null;            // <style data-et="f8b">, solo si hay algo activo
    _f8bHojas = new WeakSet();    // hojas ya reescritas
    _f8bMarcas = false;           // et-num / et-neg en las celdas (solo con tema)

    // Impresión (2026-11-02): el contenedor interno tiene overflow:auto en línea y los anchos fijos de las columnas
    // pueden sumar más que la hoja; al imprimir se veía la barra de scroll y la tabla recortada a la derecha.
    // Se agrega con insertRule para no cambiar el texto de los <style> (el banco los compara por sha256).
    static _impCss = `@media print {
        div:has(> table) { overflow: visible !important; max-height: none !important; }
        table { width: 100% !important; max-width: 100% !important; }
        table > thead > tr > th, table > tbody > tr > td, table > tfoot > tr > td { width: auto !important; min-width: 0 !important; max-width: none !important; white-space: normal !important; overflow-wrap: normal; }
        table .cell-content { width: auto !important; min-width: 0 !important; overflow: visible; }
    }`;
    _impIniciar()
    {
        try
        {
            const st = this._shadow?.querySelector('style');
            const sh = st?.sheet;
            if (!sh || this._impPuesta) return;
            sh.insertRule(EditTable._impCss, sh.cssRules.length);
            this._impPuesta = true;
        }
        catch (e) { }
    }
    _f8bIniciar()
    {
        EditTable._f8bVivas.add(new WeakRef(this));
        this._tpgIniciar();   // TP: tema de la página (InduxsoftTheme.resolve) y suscripción a sus cambios
        this._f8bReescribirTodo();
        if (this._f8bPaleta === null && this.hasAttribute('palette')) this._f8bPaleta = EditTable._f8bLimpiar(this.getAttribute('palette'), 'palette');
        if (this._f8bRayas === null && this.hasAttribute('striped')) this._f8bRayas = this._f8bBool(this.getAttribute('striped'));
        if (!this._f8bDens && this.hasAttribute('density')) this._f8bDens = this._f8bDensidad(this.getAttribute('density'));
        this._f8bAplicar();
    }
    _f8bBool(v) { const s = String(v ?? '').trim().toLowerCase(); return s === '' ? null : !(s === 'false' || s === '0' || s === 'no'); }
    _f8bDensidad(v)
    {
        const s = String(v ?? '').trim().toLowerCase();
        const d = EditTable._f8bDensidadAlias[s] ?? s;
        if (s && !EditTable._f8bDensidades[d]) console.warn('EditTable: density desconocida: ' + v);
        return EditTable._f8bDensidades[d] ? d : '';
    }
    _f8bTemaNombre()
    {
        const propio = this._f8bTemaProp !== undefined ? this._f8bTemaProp : this.getAttribute('theme');
        const n = EditTable._f8bNombre(propio ?? this._tpg?.theme);   // TP: sin theme propio, el de la página
        if (n && n !== 'auto' && !EditTable._f8bTema(n)) { if (this._f8bAvisado !== n) { this._f8bAvisado = n; console.warn('EditTable: tema desconocido: ' + n); } return ''; }
        return n;
    }

    get Theme() { return this._f8bTemaNombre(); }
    // Theme = undefined devuelve el control al atributo theme; null o '' quitan el tema.
    set Theme(v) { this._f8bTemaProp = (v === undefined ? undefined : v == null ? '' : String(v)); if (this._f1Inicializada) this._f8bAplicar(); }
    get Palette() { return this._f8bPaleta ? { ...this._f8bPaleta } : null; }
    set Palette(v) { this._f8bPaleta = (v == null ? null : EditTable._f8bLimpiar(v, 'Palette')); if (this._f1Inicializada) this._f8bAplicar(); }
    /** SetPalette(obj, {merge}) : reemplaza la paleta (merge:false, por omisión) o la combina con la actual. null la quita. */
    SetPalette(obj, opciones = {})
    {
        const nueva = (obj == null ? null : EditTable._f8bLimpiar(obj, 'SetPalette'));
        this._f8bPaleta = (opciones?.merge && nueva) ? { ...(this._f8bPaleta ?? {}), ...nueva } : nueva;
        if (this._f1Inicializada) this._f8bAplicar();
        return this.Palette;
    }
    get Striped() { return this._f8bRayasEfectivo(); }
    set Striped(v) { this._f8bRayas = (v == null || v === '' ? null : this._f8bBool(v)); if (this._f1Inicializada) this._f8bAplicar(); }
    get Density() { return this._f8bDens || this._tpgDensidad() || 'normal'; }   // TP: sin density propia, la de la página
    set Density(v) { this._f8bDens = this._f8bDensidad(v); if (this._f1Inicializada) this._f8bAplicar(); }
    _f8bRayasEfectivo() { return this._f8bRayas ?? !!this._f8bTemaNombre(); }

    _f8bAtributoCambiado(name, v)
    {
        switch (name)
        {
            case 'theme': if (this._f8bTemaProp === undefined) this._f8bAplicar(); break;
            case 'palette': this._f8bPaleta = (v == null ? null : EditTable._f8bLimpiar(v, 'palette')); this._f8bAplicar(); break;
            case 'striped': this._f8bRayas = (v == null ? null : this._f8bBool(v)); this._f8bAplicar(); break;
            case 'density': this._f8bDens = this._f8bDensidad(v); this._f8bAplicar(); break;
        }
    }

    // ---- Variables en el CSSOM. Se reescriben las hojas del shadow una sola vez cada una (las de F2-F6 al crearse).
    _f8bReescribirTodo()
    {
        if (!this._shadow || EditTable._f8bSinVariables) return;
        const cs = this.getAttribute('control-styles') ?? '';
        this._shadow.querySelectorAll('style').forEach(st =>
        {
            const sh = st.sheet;
            if (!sh || this._f8bHojas.has(sh) || st === this._f8bEstilo) return;
            this._f8bHojas.add(sh);
            try { this._f8bReescribir(st, sh, cs); } catch (e) { console.warn('EditTable: no se pudieron enganchar las variables del tema', e); }
        });
    }
    _f8bReescribir(st, sh, cs)
    {
        const { m, nuevas } = EditTable._f8bMapa();
        const reglas = sh.cssRules;
        // En la hoja principal se respeta control-styles: solo se tocan las reglas de antes y de después de él.
        let desde = 0, hasta = reglas.length, ini = reglas.length, esBase = false;
        const txt = st.textContent;
        if (txt.includes('.EdiTable-Selector{'))
        {
            esBase = true;
            const i = cs ? txt.lastIndexOf(cs) : -1;
            if (i >= 0)
            {
                const cuenta = (t) => { const h = new CSSStyleSheet(); h.replaceSync(t); return h.cssRules.length; };
                ini = cuenta(txt.slice(0, i));
                const fin = cuenta(txt.slice(i + cs.length));
                hasta = reglas.length - fin;
                if (ini > hasta) { ini = 0; hasta = reglas.length; }   // no se pudo ubicar: solo las de después
            }
            else { ini = reglas.length; hasta = reglas.length; }
        }
        const recorrer = (lista, raiz) =>
        {
            for (let k = 0; k < lista.length; k++)
            {
                if (raiz && esBase && k >= ini && k < hasta) continue;   // control-styles
                const r = lista[k];
                if (r.style && r.selectorText != null)
                {
                    const cambios = m[r.selectorText];
                    if (cambios) for (const [p, v] of cambios)
                        if (r.style.getPropertyValue(p) !== '') r.style.setProperty(p, v, r.style.getPropertyPriority(p));
                }
                if (r.cssRules?.length) recorrer(r.cssRules, false);
            }
        };
        recorrer(reglas, true);
        if (esBase) for (let k = nuevas.length - 1; k >= 0; k--) sh.insertRule(nuevas[k], 0);
    }

    // ---- Aplicar tema, paleta, rayas y densidad (en caliente: solo el <style data-et="f8b"> y clases).
    _f8bAplicar()
    {
        if (!this._shadow) return;
        const nombre = this._f8bTemaNombre();
        const rayas = this._f8bRayasEfectivo();
        const pp = this._f8bPaleta ?? this._tpg?.palette ?? null;   // TP: sin palette propia, la de la página
        const pal = pp && Object.keys(pp).length ? pp : null;
        const dens = EditTable._f8bDensidades[this._f8bDens || this._tpgDensidad()] ?? {};   // TP: idem density
        const nada = !nombre && !pal && !rayas && !Object.keys(dens).length;
        this._f8bMarcasActivas(!!nombre);
        if (nada)
        {
            if (this._f8bEstilo) { this._f8bEstilo.remove(); this._f8bEstilo = null; }
            return;
        }
        const css = this._f8bCss(nombre, pal, rayas, dens);
        if (!this._f8bEstilo)
        {
            this._f8bEstilo = document.createElement('style');
            this._f8bEstilo.setAttribute('data-et', 'f8b');
            this._shadow.prepend(this._f8bEstilo);   // antes de la hoja principal: control-styles le gana en empates
        }
        if (this._f8bEstilo.textContent !== css) this._f8bEstilo.textContent = css;
    }
    _f8bCss(nombre, pal, rayas, dens)
    {
        const vars = (o, filtro) => Object.entries(o).filter(([k]) => k !== 'color-scheme' && (!filtro || filtro(k))).map(([k, v]) => `--et-t-${k}: ${v};`).join(' ');
        const esquema = (o) => o['color-scheme'] ? ` color-scheme: ${o['color-scheme']};` : '';
        const color = (k) => !EditTable._f8bEspaciado.has(k);
        let s = '';
        if (nombre === 'auto')
        {
            const c = EditTable._f8bTema('claro'), o = EditTable._f8bTema('oscuro');
            s += `:host { ${vars(c)}${esquema(c)} }\n@media (prefers-color-scheme: dark) { :host { ${vars(o)}${esquema(o)} } }\n`;
        }
        else if (nombre) { const t = EditTable._f8bTema(nombre); s += `:host { ${vars(t)}${esquema(t)} }\n`; }
        if (Object.keys(dens).length) s += `:host { ${vars(dens)} }\n`;
        if (nombre)
        {
            const t = nombre === 'auto' ? EditTable._f8bTema('oscuro') : EditTable._f8bTema(nombre);
            // Impresión: un tema oscuro (o auto) se imprime con los colores del claro.
            if (t['color-scheme'] === 'dark') { const c = EditTable._f8bTema('claro'); s += `@media print { :host { ${vars(c, color)} color-scheme: light; } }\n`; }
            s += this._f8bCssTema();
        }
        if (rayas) s += this._f8bCssRayas();
        if (pal) s += `:host { ${Object.entries(pal).map(([k, v]) => `--et-${k}: ${v} !important;`).join(' ')} }\n`;
        return s;
    }
    // Reglas que solo existen con tema. Van antes de la hoja principal; su especificidad está calculada para ganarle
    // solo a la regla base que corresponde (comentado en cada una).
    _f8bCssTema()
    {
        const V = EditTable._f8bV, sel = this.CSS?.RowSelected || 'EdiTable-Row-Selected';
        return `
            table, .et-chooser, .et-group-panel, .et-tooltip, input, select, textarea, button { font-family: ${V('font')}; }
            /* (0,1,1) > .EdiTable-Cell: contorno de la celda activa, distinto del relleno de la fila */
            td.EdiTable-Cell:where(:has(#__table_selector, #__table_input)) { outline: 2px solid ${V('active-cell')}; outline-offset: -2px; }
            td.et-num, th.et-num, tfoot td.et-summary { font-variant-numeric: tabular-nums; }
            tfoot td.et-summary { text-align: right; font-family: ${V('num-font', 'inherit')}; }
            td.et-num { font-family: ${V('num-font', 'inherit')}; }
            td.et-num .cell-content { justify-content: flex-end; text-align: right; }
            th.et-num { text-align: right; }
            tr:not(.${sel}) > td.et-neg { color: ${V('neg-fg')}; }
            :where(button, input, select, textarea, th, [tabindex]):focus-visible:where(:not(#__table_input)) { outline: 2px solid ${V('focus-ring')}; outline-offset: 1px; }
            input[type=checkbox], input[type=radio] { accent-color: ${V('accent')}; }
            .et-chooser { box-shadow: 0 6px 18px rgba(0,0,0,.22); }
            /* (0,2,3) > celda fija (0,2,2): en el pie, las fijas y la del sistema llevan el fondo del pie */
            table.et-has-fixed tfoot td.et-fixed, tfoot > tr > td.et-sel-col { background-color: ${V('footer-bg')}; }
        `;
    }
    _f8bCssRayas()
    {
        const alt = EditTable._f8bV('row-alt-bg', '#F7F7F7');
        const par = ':where(:nth-child(even of tr:not(.et-spacer, .hidde-row, .et-group-row)))';
        return `
            /* (0,0,2): pierde con tbody tr:hover (0,1,2), la fila seleccionada (!important) y la marcada (0,1,2) */
            tbody > tr${par} { background-color: ${alt}; }
            /* (0,2,4): gana a la celda fija (0,2,2) y pierde con su hover (0,3,3) */
            table.et-has-fixed tbody > tr${par} > td.et-fixed { background-color: ${alt}; }
        `;
    }

    // ---- Celdas numéricas y negativas (solo con tema): clases et-num y et-neg.
    _f8bEsNum(c)
    {
        const t = String(c?.type ?? '').toLowerCase();
        return t === 'number' || (t === 'noeditable' && (c?.format ?? '') == 'true');
    }
    _f8bEsNeg(v)
    {
        if (typeof v === 'number') return v < 0;
        return /^\s*[-−]\s*(\d|\.\d)/.test(String(v ?? '')) || /^\s*\(\s*[$\d]/.test(String(v ?? ''));
    }
    // Enganche de SetTdValue: value es el valor sin formato (o el HTML de un editor, que no cambia las clases).
    _f8bTd(td, value, coldef)
    {
        if (!td?.classList) return;
        const s = typeof value === 'string' ? value : '';
        if (s.includes('__table_selector') || s.includes('__table_input')) return;
        const c = coldef ?? this.GetColumnDefOfTd(td), num = this._f8bEsNum(c);
        let neg = false;
        if (num && !c?.template)
        {
            // Valor crudo (número o cadena canónica): se usa tal cual. Texto con formato o HTML (al dejar la celda
            // se repinta con el innerHTML del selector, p. ej. "$-2,242.16"): se toma de DataArray.
            if (typeof value === 'number' || /^\s*[-\u2212]?\s*(\d|\.\d)[\d.,\s]*$/.test(s)) neg = this._f8bEsNeg(value);
            else { const i = this._getRowIndex(td.parentElement); neg = i >= 0 && this._f8bEsNeg(this.DataArray?.[i]?.[c.field]); }
        }
        td.classList.toggle('et-num', num);
        td.classList.toggle('et-neg', neg || !!td._f8Cls?.includes('et-neg'));   // F8a: conserva et-neg puesta por una regla
    }
    _f8bMarcasActivas(on)
    {
        if (!this._table || on === this._f8bMarcas) return;   // solo al encender o apagar el tema
        this._f8bMarcas = on;
        const head = this._table.tHead?.rows?.[0];
        if (head) for (const th of head.cells)
        {
            const f = th.getAttribute('field');
            const c = f != null ? this.Columns.find(x => x.field === f) : null;
            th.classList.toggle('et-num', on && this._f8bEsNum(c));
            if (!th.classList.length) th.removeAttribute('class');
        }
        const tb = this._f1TBodyPrincipal?.() ?? this._table.tBodies?.[0];
        if (!tb) return;
        for (const tr of tb.rows)
        {
            if (tr.classList.contains('et-group-row') || tr.classList.contains('et-spacer')) continue;
            const idx = on ? this._getRowIndex(tr) : -1, d = idx >= 0 ? this.DataArray?.[idx] : null;
            for (const td of tr.cells)
            {
                if (!td.classList.contains(this.CSS.Cell)) continue;
                if (!on) { td.classList.remove('et-num'); if (!td._f8Cls?.includes('et-neg')) td.classList.remove('et-neg'); continue; }   // F8a: regla
                const c = this.GetColumnDefOfTd(td), num = this._f8bEsNum(c);
                td.classList.toggle('et-num', num);
                td.classList.toggle('et-neg', !!(num && d && !c?.template && this._f8bEsNeg(d[c.field])) || !!td._f8Cls?.includes('et-neg'));   // F8a: regla
            }
        }
    }
    // ===== F8b: fin

    // ===== TP: tema de la página (módulo común InduxsoftTheme) =====
    // Sin theme, palette o density propios, la tabla toma los del ancestro más cercano con data-et-theme,
    // data-et-palette o data-et-density (cruzando shadow DOM e iframes del mismo origen), o lo recordado con
    // InduxsoftTheme.set(…, {remember:true}). Cada atributo por separado: el propio gana al de la página. Encima siguen
    // las capas de F8b: respaldo < tema < --et-* externas < palette. Sin nada de eso, _tpg queda vacío y todo es igual.
    static { this.features.push('page-theme'); }
    _tpg = null;            // última resolución: { theme, palette, density, … }
    _tpgBaja = null;        // función para desuscribirse

    _tpgIniciar()
    {
        this._tpg = InduxsoftTheme.resolve(this);
        if (!this._tpgBaja) this._tpgBaja = InduxsoftTheme.subscribe(this, (r) => this._tpgCambio(r));
    }
    _tpgCambio(r)
    {
        this._tpg = r;
        if (this._f1Inicializada) this._f8bAplicar();   // en caliente: solo el <style data-et="f8b"> y clases
    }
    _tpgDensidad()
    {
        const d = this._tpg?.density;
        return d && EditTable._f8bDensidades[d] ? d : '';
    }
    _tpgLiberar()
    {
        if (this._tpgBaja) { this._tpgBaja(); this._tpgBaja = null; }
    }
    _tpgReconectar()
    {
        if (!this._shadow) return;
        this._tpgIniciar();
        this._f8bAplicar();
    }
    // ===== TP: fin
}

customElements.define('edit-table', EditTable);