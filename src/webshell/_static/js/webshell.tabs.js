/*
    Pestañas del entorno (webshell), solo en pantalla ancha (>= 992 px, el mismo corte de la barra de estado).
    En móvil y en pantallas angostas no se activa nada: el shell trabaja como siempre, con un solo iframe.

    Cada pestaña es un iframe en #main-sec, con sus propios paneles (izquierdo/derecho) y su propio historial.
    - Inicio (casa del nav, logotipo): trae al frente la pestaña de inicio o la vuelve a abrir.
    - Rayo (acciones), notificaciones, «Mi usuario», /?go= e inlink: abren pestaña.
    - Dentro de una pestaña se navega como siempre (lista -> formulario -> lista).
    - «Salir» de las páginas (href="/" target="_top") se oculta: la pestaña se cierra con su X.
      Escape (window.open("/","_top")) y salir de ventas (top.location) también cierran la pestaña.
    - history.back() de una página regresa dentro de su pestaña (el historial del navegador es uno solo).
    - Al cerrar se pregunta si la página tiene cambios sin guardar (beforeunload).
    - Las pestañas abiertas se recuerdan en sessionStorage y se reabren (sin cargar hasta activarse).
    - Alt+1..9 cambia de pestaña; clic medio en la pestaña la cierra.

    API: WebShellTabs.enabled, open(url, {title, reuse}), home(), close(id), activeFrame(), navigateActive(url)
*/
(function (global) {
    'use strict';

    var WS = global.WebShell;
    var MAX_TABS = 12;
    var KEY = 'ws.tabs.' + location.host;

    var enabled = false;
    try {
        enabled = !!WS && global.matchMedia('(min-width: 992px)').matches &&
            !/\/!\/webshell\/print-view\//.test(location.search + location.pathname);
    } catch (e) { enabled = false; }

    var Tabs = {
        enabled: enabled,
        list: [],
        active: null,
        seq: 0,
        bar: null,
        host: null,
        allowTopNav: false,
        probing: false
    };
    global.WebShellTabs = Tabs;
    if (!enabled) return;

    // ---------------------------------------------------------------- utilidades
    function abs(u) { try { return new URL(u, location.href); } catch (e) { return null; } }
    // Parámetros técnicos que no distinguen una página de otra (de dónde se vino, recarga)
    var TECH = ['_from_url_e', '---from_url', 'url', '_', 'v'];
    function key(u) {
        var x = abs(u);
        if (!x) return String(u || '');
        TECH.forEach(function (p) { x.searchParams.delete(p); });
        x.searchParams.sort();
        var q = x.searchParams.toString();
        return x.pathname + (q ? '?' + q : '');
    }
    // Rutas CRUD-L: /!/paquete/programa/ (lista), /!/paquete/programa/_new/, /!/paquete/programa/<id>/[accion/]
    function crud(u) {
        var x = abs(u);
        if (!x || x.origin !== location.origin) return null;
        var m = x.pathname.match(/^\/!\/([^/]+)\/([^/]+)\/(?:([^/]+)\/)?(?:([^/]+)\/)?/);
        if (!m) return null;
        return { prog: m[1] + '/' + m[2], list: !m[3], isNew: m[3] === '_new', path: '/!/' + m[1] + '/' + m[2] + '/', view: x.searchParams.get('_view') || '' };
    }
    // Pestaña abierta con esa página (las listas se comparan por ruta, sin filtros). "_new" nunca se reutiliza.
    function findTab(u, except) {
        var c = crud(u);
        if (c && c.isNew) return null;
        for (var i = 0; i < Tabs.list.length; i++) {
            var t = Tabs.list[i];
            if (t === except) continue;
            if (c && c.list) { var tc = crud(t.url); if (tc && tc.list && tc.prog === c.prog && tc.view === c.view) return t; }
            else if (key(t.url) === key(u)) return t;
        }
        return null;
    }
    function isHomeUrl(u) { return !!Tabs.homeUrl && key(u) === key(Tabs.homeUrl); }
    function isRoot(u) { var x = abs(u); return !!x && x.origin === location.origin && (x.pathname === '/' || x.pathname === '') && !x.searchParams.get('go'); }
    function goParam(u) { var x = abs(u); return (x && x.origin === location.origin && (x.pathname === '/' || x.pathname === '')) ? x.searchParams.get('go') : null; }
    function byId(id) { for (var i = 0; i < Tabs.list.length; i++) if (Tabs.list[i].id === id) return Tabs.list[i]; return null; }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    var ICON_HOME = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5"/></svg>';

    // ---------------------------------------------------------------- estilos
    function injectStyles() {
        var css =
            /* La barra nunca ensancha la página: las pestañas se encogen (como en Chrome) y, si aun así no caben, se desplazan dentro de la barra */
            'body.ws-tabs{grid-template-columns:minmax(0,1fr)}' +
            'body.ws-tabs #webshell-grid-container,body.ws-tabs #webshell-main-content{min-width:0;min-height:0;overflow:hidden}' +
            '#ws_tabbar{position:relative;display:flex;align-items:flex-end;gap:2px;height:30px;min-height:30px;width:100%;min-width:0;max-width:100%;box-sizing:border-box;padding:3px 6px 0;background:var(--ixt-surface-2,#E9E9E9);border-bottom:1px solid var(--ixt-border,#C8C8C8);overflow-x:auto;overflow-y:hidden;scrollbar-width:none;user-select:none;flex:0 0 30px}' +
            '#ws_tabbar::-webkit-scrollbar{display:none}' +
            '#ws_tabbar .ws-tab{display:inline-flex;align-items:center;gap:4px;height:27px;flex:0 1 auto;max-width:220px;min-width:64px;overflow:hidden;padding:0 4px 0 10px;border:1px solid transparent;border-bottom:0;border-radius:0;background:transparent;color:inherit;font:inherit;font-size:.8125rem;cursor:default;white-space:nowrap}' +
            '#ws_tabbar .ws-tab:hover{background:color-mix(in srgb,currentColor 8%,transparent)}' +
            '#ws_tabbar .ws-tab.ws-active{background:var(--ixt-surface,#FFF);border-color:var(--ixt-border,#C8C8C8);position:relative;top:1px;font-weight:600}' +
            '#ws_tabbar .ws-tab:focus-visible{outline:2px solid var(--ixt-accent,#0266C8);outline-offset:-2px}' +
            '#ws_tabbar .ws-tab-ttl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1 1 auto;min-width:0;text-align:left}' +
            '#ws_tabbar .ws-tab svg,#ws_tabbar .ws-tab-x{flex:0 0 auto}' +
            '#ws_tabbar .ws-tab.ws-active{flex-shrink:0}' +
            '#ws_tabbar .ws-tab-x{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:0;background:transparent;color:inherit;font-size:14px;line-height:1;opacity:.55;cursor:pointer;border-radius:0}' +
            '#ws_tabbar .ws-tab-x:hover{opacity:1;background:#C42B1C;color:#FFF}' +
            '#ws_tabbar .ws-tab.ws-loading .ws-tab-ttl{opacity:.6}' +
            'body.ws-tabs #main-sec{position:relative;min-height:0}' +
            'body.ws-tabs #main-sec > iframe.ws-tab-frame{position:absolute;inset:0;width:100%;height:100%;border:0;visibility:hidden;pointer-events:none}' +
            'body.ws-tabs #main-sec > iframe.ws-tab-frame.ws-active{visibility:visible;pointer-events:auto}' +
            'body.ws-tabs #webshell-left-panel-area,body.ws-tabs #webshell-right-panel-area{position:relative}' +
            'body.ws-tabs iframe.ws-pnl-frame{display:none}' +
            'body.ws-tabs iframe.ws-pnl-frame.ws-active{display:block}' +
            'body.ws-tabs #left-frame,body.ws-tabs #right-frame{display:none !important}';
        var st = document.createElement('style');
        st.id = 'ws-tabs-styles';
        st.textContent = css;
        document.head.appendChild(st);
    }

    // Estilo que se inyecta en cada página de pestaña: oculta el botón «Salir» que va al inicio
    var PAGE_CSS = 'a[href="/"][target="_top"]{display:none !important}';

    // ---------------------------------------------------------------- persistencia
    function save() {
        try {
            sessionStorage.setItem(KEY, JSON.stringify({
                active: Tabs.list.indexOf(Tabs.active),
                tabs: Tabs.list.map(function (t) { return { url: t.url, title: t.title, home: t.home }; })
            }));
        } catch (e) { }
    }
    function load() {
        try { var d = JSON.parse(sessionStorage.getItem(KEY) || 'null'); return (d && d.tabs && d.tabs.length) ? d : null; }
        catch (e) { return null; }
    }

    // ---------------------------------------------------------------- pestañas
    function makeTab(o) {
        var t = {
            id: 't' + (++Tabs.seq),
            url: o.url,
            title: o.title || (o.home ? 'Inicio' : 'Cargando…'),
            home: !!o.home,
            frame: null,
            stack: [],
            back: false,
            loadedAt: 0,
            loading: false,
            panels: {}
        };
        var b = document.createElement('div');
        b.className = 'ws-tab';
        b.setAttribute('role', 'tab');
        b.tabIndex = 0;
        b.innerHTML = (t.home ? ICON_HOME : '') + '<span class="ws-tab-ttl"></span><button type="button" class="ws-tab-x" title="Cerrar" aria-label="Cerrar">×</button>';
        b.addEventListener('mousedown', function (e) { if (e.button === 1) e.preventDefault(); });
        b.addEventListener('auxclick', function (e) { if (e.button === 1) { e.preventDefault(); close(t.id); } });
        b.addEventListener('click', function (e) {
            if (e.target.closest('.ws-tab-x')) { e.stopPropagation(); close(t.id); return; }
            activate(t.id);
        });
        b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(t.id); } });
        t.btn = b;
        setTitle(t, t.title);
        return t;
    }

    function setTitle(t, title) {
        t.title = (title || '').trim() || t.title;
        var s = t.btn.querySelector('.ws-tab-ttl');
        s.textContent = t.title;
        t.btn.title = t.title;
        fitTab(t);
    }

    // Ancho mínimo según el título: una pestaña corta («Ventas») no se recorta; las largas se encogen hasta 120 px
    // (la activa, hasta 200 px). El ancho natural es el del texto (scrollWidth), como máximo 220 px por el CSS.
    function fitTab(t) {
        var go = function () {
            try {
                var b = t.btn;
                b.style.minWidth = '';
                var ttl = b.querySelector('.ws-tab-ttl');
                var nat = b.offsetWidth - ttl.clientWidth + ttl.scrollWidth + 2;
                if (!nat) return;
                b.style.minWidth = Math.min(nat, Tabs.active === t ? 200 : 120) + 'px';
            } catch (e) { }
        };
        if (global.requestAnimationFrame) global.requestAnimationFrame(go); else go();
    }

    function ensureFrame(t, existing) {
        if (t.frame) return t.frame;
        var f = existing || document.createElement('iframe');
        f.classList.add('ws-tab-frame');
        f.dataset.tab = t.id;
        f.addEventListener('load', function () { onFrameLoad(t); });
        if (!existing) {
            f.id = 'ws_tab_' + t.id;
            Tabs.host.appendChild(f);
            t.loading = true;
            t.btn.classList.add('ws-loading');
            f.src = t.url;
        } else {
            t.loading = true;
            t.btn.classList.add('ws-loading');
            // Si ya terminó de cargar antes de engancharse
            try { if (f.contentDocument && f.contentDocument.readyState === 'complete' && f.contentWindow.location.href !== 'about:blank') onFrameLoad(t); } catch (e) { }
        }
        t.frame = f;
        return f;
    }

    function open(url, o) {
        o = o || {};
        if (!url) return null;
        var u = abs(url);
        if (!u) return null;
        var ex = findTab(u.href);
        if (ex) { activate(ex.id); return ex; }
        if (Tabs.list.length >= MAX_TABS) {
            alert('Hay ' + MAX_TABS + ' ventanas abiertas. Cierre alguna para abrir otra.');
            return null;
        }
        var t = makeTab({ url: u.pathname + u.search + u.hash, title: o.title, home: o.home || isHomeUrl(u.href) });
        t.opener = o.opener || null;
        t.openTitle = o.title || '';
        // Junto a la pestaña que la abrió (como un documento que sale de su lista)
        var oi = o.opener ? Tabs.list.indexOf(o.opener) : -1;
        if (oi >= 0) {
            var after = oi + 1;
            while (after < Tabs.list.length && Tabs.list[after].opener === o.opener) after++;
            Tabs.list.splice(after, 0, t);
            Tabs.bar.insertBefore(t.btn, Tabs.list[after + 1] ? Tabs.list[after + 1].btn : null);
        } else {
            Tabs.list.push(t);
            Tabs.bar.appendChild(t.btn);
        }
        activate(t.id);
        return t;
    }

    function activate(id) {
        var t = byId(id);
        if (!t) return;
        if (WS.showingModal) return;
        // Una lista marcada como vieja (se guardó un documento suyo) se recarga al traerla al frente
        if (t.stale && t.frame && !t.loading) { t.stale = false; try { t.frame.contentWindow.location.reload(); } catch (e) { } }
        ensureFrame(t);
        Tabs.list.forEach(function (x) {
            var on = x === t;
            x.btn.classList.toggle('ws-active', on);
            x.btn.setAttribute('aria-selected', on ? 'true' : 'false');
            if (x.frame) {
                x.frame.classList.toggle('ws-active', on);
                // El iframe activo es #_main_view (lo leen notiman, la barra de estado y otros)
                x.frame.id = on ? '_main_view' : 'ws_tab_' + x.id;
            }
        });
        var prev = Tabs.active;
        Tabs.active = t;
        if (prev && prev !== t) fitTab(prev);
        fitTab(t);
        try {
            var bl = t.btn.offsetLeft, br = bl + t.btn.offsetWidth, bar = Tabs.bar;
            if (bl < bar.scrollLeft) bar.scrollLeft = bl - 6;
            else if (br > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = br - bar.clientWidth + 6;
        } catch (e) { }
        renderPanels();
        loadingLine(t.loading);
        statusbar(t);
        try { t.frame.contentWindow.focus(); } catch (e) { }
        save();
    }

    // ¿La página tiene cambios sin guardar? Simula beforeunload sin descargarla.
    function isDirty(t) {
        if (!t.frame) return false;
        var w;
        try { w = t.frame.contentWindow; if (!w || !w.document) return false; } catch (e) { return false; }
        var dirty = false;
        Tabs.probing = true;
        try {
            var h = w.onbeforeunload;
            w.onbeforeunload = null;
            var ev = new w.Event('beforeunload', { cancelable: true });
            try { w.dispatchEvent(ev); } catch (e) { }
            w.onbeforeunload = h;
            if (ev.defaultPrevented) dirty = true;
            if (!dirty && typeof h === 'function') {
                var r;
                try { r = h.call(w, ev); } catch (e) { r = undefined; }
                if ((typeof r === 'string' && r !== '') || r === false || ev.defaultPrevented) dirty = true;
            }
        } catch (e) { dirty = false; }
        Tabs.probing = false;
        return dirty;
    }

    function close(id, force) {
        var t = byId(id);
        if (!t) return;
        if (WS.showingModal) return;
        if (!force && isDirty(t) && !confirm('«' + t.title + '» tiene cambios sin guardar. ¿Cerrar la ventana de todos modos?')) return;
        disposePanels(t);
        var tc = crud(t.url);
        if (tc && !tc.list) markStale(tc.prog);
        var i = Tabs.list.indexOf(t);
        Tabs.list.splice(i, 1);
        t.btn.remove();
        if (t.frame) {
            try { t.frame.contentWindow.onbeforeunload = null; } catch (e) { }
            try { t.frame.src = 'about:blank'; } catch (e) { }
            t.frame.remove();
        }
        if (Tabs.active === t) {
            Tabs.active = null;
            var next = (t.opener && Tabs.list.indexOf(t.opener) >= 0) ? t.opener : (Tabs.list[i] || Tabs.list[i - 1]);
            if (next) activate(next.id);
            else { renderPanels(); loadingLine(false); home(); }
        }
        save();
    }

    function home() {
        for (var i = 0; i < Tabs.list.length; i++) {
            var h = Tabs.list[i];
            if (!h.home) continue;
            activate(h.id);
            if (h.frame && h.homeKey && key(h.url) !== h.homeKey) navigateActive(h.homeKey);
            return;
        }
        var t = open(Tabs.homeUrl || '/', { home: true, reuse: false });
        if (t && t.btn.parentNode !== Tabs.bar.firstChild) Tabs.bar.insertBefore(t.btn, Tabs.bar.firstChild);
        if (t) { Tabs.list.splice(Tabs.list.indexOf(t), 1); Tabs.list.unshift(t); save(); }
    }

    function navigateActive(url) {
        var t = Tabs.active;
        if (!t) { open(url); return; }
        ensureFrame(t);
        try { t.frame.contentWindow.location.href = url; } catch (e) { t.frame.src = url; }
    }

    // Reglas de navegación hacia _top que vienen de una página: "/" cierra; /?go= abre pestaña; otra va en la misma
    function routeTop(t, url) {
        if (isRoot(url)) { close(t.id); return; }
        var g = goParam(url);
        if (g) { open(g); return; }
        try { t.frame.contentWindow.location.href = url; } catch (e) { open(url); }
    }

    // ---------------------------------------------------------------- reglas de navegación dentro de una pestaña
    // Devuelve true si la navegación se atendió aquí (abrir/traer otra pestaña) y la página no debe navegar.
    function markStale(prog, except) {
        Tabs.list.forEach(function (x) { var c = crud(x.url); if (x !== except && c && c.list && c.prog === prog) x.stale = true; });
    }
    function route(t, dest) {
        if (!dest || key(dest) === key(t.url)) return false;
        var du = abs(dest);
        if (!du || du.origin !== location.origin) return false;
        // El shell completo nunca se carga dentro de una pestaña: "/" la cierra y "/?go=" abre la página en su pestaña
        if (isRoot(dest)) { close(t.id); return true; }
        if (goParam(dest)) { open(goParam(dest), { opener: t }); return true; }
        var cur = crud(t.url), dst = crud(dest);
        // documento que regresa a su lista, o a la pestaña que lo abrió (p. ej. el kárdex que vuelve a inventario)
        var opener = (t.opener && Tabs.list.indexOf(t.opener) >= 0) ? t.opener : null;
        var back = !!(cur && !cur.list && dst && dst.list && (dst.prog === cur.prog || (opener && key(opener.url).split('?')[0] === key(dest).split('?')[0])));
        // Si ya hay una pestaña con esa página: traerla al frente
        var other = findTab(dest, t);
        if (other) {
            if (back) { markStale(dst.prog); close(t.id, true); }
            activate(other.id);
            return true;
        }
        if (back) { markStale(dst.prog, t); return false; }                 // la lista no está abierta: se queda en esta
        if (t.home) { open(dest, { opener: t }); return true; }              // escritorio: cada acceso en su ventana
        if (cur && cur.list && !(dst && dst.list && dst.prog === cur.prog)) { open(dest, { opener: t }); return true; }   // de una lista a un documento u otra página
        if (cur && !cur.list && dst && dst.prog !== cur.prog) { open(dest, { opener: t }); return true; }                 // de un documento a otro programa
        if (cur && !cur.list && dst && !dst.list && dst.prog === cur.prog) markStale(cur.prog);                           // guardó o procesó: su lista se recarga al volver
        return false;
    }

    // Título de la pestaña: en registros, código y nombre/descripción; si no, el título de la vista
    var CODES = ['codigo', 'clave', 'referencia', 'folio', 'cdocumento', 'code'];
    var NAMES = ['descripcion', 'nombre', 'razonsocial', 'razon_social', 'name', 'description'];
    function fieldVal(d, n) {
        try {
            var el = d.querySelector('[name="' + n + '"]') || d.getElementById(n);
            if (!el) return '';
            var v = (el.value != null && el.value !== undefined) ? el.value : el.textContent;
            if (el.tagName === 'SELECT' && el.selectedIndex >= 0) v = el.options[el.selectedIndex].text;
            return String(v == null ? '' : v).trim();
        } catch (e) { return ''; }
    }
    function first(d, names) { for (var i = 0; i < names.length; i++) { var v = fieldVal(d, names[i]); if (v) return v; } return ''; }
    function trunc(v, n) { return v.length > n ? v.slice(0, n - 1) + '…' : v; }
    function pageTitle(t, d) {
        var fb = d.getElementById('v12FormBar_title') || d.querySelector('h5.tex-no-break') || d.querySelector('h1,h2,h3,h4,h5');
        var view = ((fb && fb.textContent) || d.title || t.openTitle || '').trim();
        if (t.home) return view || 'Inicio';
        var c = crud(t.url);
        if (!c || c.list) return view || key(t.url);
        var code = first(d, CODES), name = first(d, NAMES);
        if (c.isNew && !code && !name) return 'Nuevo' + (view ? ' · ' + view : '');
        if (code && name && code !== name) return code + ' ' + trunc(name, 28);
        if (name) return trunc(name, 40);
        if (code && view && view.indexOf(code) >= 0) return view;     // la vista ya trae el folio (p. ej. «C00000051»)
        if (code) return code + (view ? ' · ' + view : '');
        return view || key(t.url);
    }

    // ---------------------------------------------------------------- carga de una página en su pestaña
    function onFrameLoad(t) {
        var f = t.frame, w, d;
        try { w = f.contentWindow; d = f.contentDocument; } catch (e) { return; }
        if (!w || !d) return;
        var href = '';
        try { href = w.location.href; } catch (e) { }
        if (!href || href === 'about:blank') return;

        t.loading = false;
        t.loadedAt = Date.now();
        t.btn.classList.remove('ws-loading');
        if (Tabs.active === t) loadingLine(false);

        // Historial propio
        var k = key(href);
        if (t.back) t.back = false;
        else if (!t.stack.length || t.stack[t.stack.length - 1] !== k) t.stack.push(k);
        if (t.stack.length > 50) t.stack.shift();
        var u = abs(href);
        var prevUrl = t.url;
        t.url = u ? (u.pathname + u.search + u.hash) : href;
        // Un documento que el servidor regresó a su lista (redirección tras guardar): si esa lista ya está abierta,
        // se cierra esta pestaña y la lista pasa al frente en la URL nueva (conserva _select)
        var pc = crud(prevUrl), nc = crud(href);
        if (pc && !pc.list && nc && nc.list && !t.home) {
            var op = (t.opener && Tabs.list.indexOf(t.opener) >= 0) ? t.opener : null;
            var same = nc.prog === pc.prog || (op && key(op.url).split('?')[0] === key(href).split('?')[0]);
            var other = same ? findTab(href, t) : null;
            if (other) {
                var dest = t.url;
                setTimeout(function () {
                    close(t.id, true);
                    activate(other.id);
                    other.stale = false;
                    try { other.frame.contentWindow.location.href = dest; } catch (e) { }
                }, 0);
                return;
            }
        }
        if (t.home && !t.homeKey) t.homeKey = k;   // la URL real del inicio (puede diferir de homeUrl por redirecciones)

        var lost = (d.title || '') === 'Lost session';

        // Título
        t.internal = false;
        var readTitle = function () {
            try { if (t.frame.contentDocument !== d) return; setTitle(t, pageTitle(t, d)); save(); } catch (e) { }
        };
        readTitle();
        setTimeout(readTitle, 800);
        setTimeout(readTitle, 2500);
        try {
            var tmr = 0;
            d.addEventListener('change', function () { clearTimeout(tmr); tmr = setTimeout(readTitle, 300); }, true);
        } catch (e) { }
        try {
            var tt = d.querySelector('title');
            if (tt) new w.MutationObserver(readTitle).observe(tt, { childList: true, characterData: true, subtree: true });
        } catch (e) { }

        if (lost) { Tabs.allowTopNav = true; save(); statusbar(t); return; }

        // Estilo de la página dentro de pestaña
        try {
            var st = d.createElement('style');
            st.setAttribute('data-ws-tabs', '');
            st.textContent = PAGE_CSS;
            (d.head || d.documentElement).appendChild(st);
        } catch (e) { }

        // Navegaciones de la página (vínculos y window.location = …): reglas de pestaña
        var hasNav = false;
        try {
            if (w.navigation && w.navigation.addEventListener) {
                hasNav = true;
                w.navigation.addEventListener('navigate', function (e) {
                    if (t.internal || !e.cancelable || e.hashChange || e.downloadRequest || e.formData) return;
                    if (e.navigationType !== 'push' && e.navigationType !== 'replace') return;
                    var dest = e.destination && e.destination.url;
                    if (route(t, dest)) e.preventDefault();
                });
            }
        } catch (e) { hasNav = false; }

        // Clics: _top/_parent y /?go=
        try {
            d.addEventListener('click', function (e) {
                if (e.defaultPrevented || e.button !== 0) return;
                var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
                if (!a) return;
                var h = a.getAttribute('href') || '';
                if (/^javascript:/i.test(h) || h.charAt(0) === '#') return;
                var tg = (a.getAttribute('target') || '').toLowerCase();
                if (tg === '_top' || tg === '_parent') { e.preventDefault(); routeTop(t, a.href); return; }
                if ((tg === '' || tg === '_self') && goParam(a.href)) { e.preventDefault(); open(goParam(a.href)); return; }
                // Sin Navigation API: las reglas de pestaña solo alcanzan a los vínculos
                if (!hasNav && (tg === '' || tg === '_self') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !a.hasAttribute('download')) {
                    if (route(t, a.href)) e.preventDefault();
                }
            }, false);
        } catch (e) { }

        // window.open(url, "_top"|"_parent"|nombre de la ventana) se queda en el shell; _blank sigue igual
        try {
            var nativeOpen = w.open;
            w.open = function (url, target, features) {
                var tg = String(target || '').toLowerCase();
                if (url && (tg === '_top' || tg === '_parent')) { routeTop(t, abs(url) ? abs(url).href : url); return null; }
                return nativeOpen.apply(w, arguments);
            };
        } catch (e) { }

        // history.back() regresa dentro de la pestaña
        try {
            w.history.back = function () {
                if (t.stack.length > 1) {
                    t.stack.pop();
                    t.back = true;
                    t.internal = true;
                    w.location.replace(t.stack[t.stack.length - 1]);
                } else close(t.id);
            };
        } catch (e) { }

        // window.close() cierra la pestaña
        try { w.close = function () { close(t.id); }; } catch (e) { }

        // Al salir de la página: línea de carga y sus paneles se descartan
        try {
            w.addEventListener('beforeunload', function () {
                if (Tabs.probing) return;
                t.loading = true;
                t.btn.classList.add('ws-loading');
                if (Tabs.active === t) loadingLine(true);
            });
            w.addEventListener('pagehide', function () { disposePanels(t); });
        } catch (e) { }

        keys(d);
        if (Tabs.active === t) statusbar(t);
        save();
    }

    function loadingLine(on) {
        var l = document.getElementById('loading_line');
        if (l) l.classList.toggle('loading', !!on);
    }

    function statusbar(t) {
        if (Tabs.active !== t || !t.frame) return;
        try { if (global.WsStatusbar && global.WsStatusbar.alCargarVista) global.WsStatusbar.alCargarVista(t.frame); } catch (e) { }
    }

    // Alt+1..9
    function keys(doc) {
        try {
            doc.addEventListener('keydown', function (e) {
                if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
                // Solo la fila superior: Alt + teclado numérico son los códigos Alt (Alt+164 = ñ)
                if (!/^Digit[1-9]$/.test(e.code || '')) return;
                var n = parseInt(e.code.slice(5), 10);
                if (n >= 1 && n <= 9 && Tabs.list[n - 1]) { e.preventDefault(); activate(Tabs.list[n - 1].id); }
            });
        } catch (e) { }
    }

    // ---------------------------------------------------------------- paneles por pestaña
    var P = WS.Panels;
    var orig = { Show: P.Show, Hide: P.Hide, Dispose: P.Dispose };
    var DIRS = ['left', 'right'];

    function dirsOf(p) {
        var out = [];
        try {
            document.querySelectorAll('section' + p).forEach(function (s) {
                var d = s.getAttribute('direction');
                if (DIRS.indexOf(d) >= 0) out.push(d);
            });
        } catch (e) { }
        return out;
    }

    // Pestaña a la que pertenece una llamada de panel: la que está cargando (o acaba de cargar), si es una sola; si no, la activa
    function owner() {
        var now = Date.now(), c = Tabs.list.filter(function (t) { return t.frame && (t.loading || now - t.loadedAt < 4000); });
        if (c.length === 1) return c[0];
        return Tabs.active;
    }

    function panelFrame(t, dir) {
        var s = t.panels[dir];
        if (s && s.frame) return s;
        var area = document.getElementById('webshell-' + dir + '-panel-area');
        var f = document.createElement('iframe');
        f.className = 'ws-pnl-frame';
        f.dataset.tab = t.id;
        f.style.cssText = 'width:100%;flex:1;border:0';
        area.appendChild(f);
        s = t.panels[dir] = { frame: f, title: '', open: false, avail: false };
        return s;
    }

    function renderPanels() {
        var t = Tabs.active;
        DIRS.forEach(function (dir) {
            var sec = document.getElementById('webshell-' + dir + '-panel');
            var openBtn = document.getElementById('webshell-open-' + dir + '-panel');
            var ttlTab = document.getElementById('webshell-' + dir + '-tab-content');
            var ttlHdr = document.getElementById('webshell-' + dir + '-panel-header-title');
            var s = t && t.panels[dir];
            Tabs.list.forEach(function (x) {
                var ps = x.panels[dir];
                if (ps && ps.frame) ps.frame.classList.toggle('ws-active', x === t);
            });
            if (!sec) return;
            if (s && s.avail) {
                if (ttlTab) ttlTab.textContent = s.title || 'Abrir panel';
                if (ttlHdr) ttlHdr.textContent = s.title || '';
                sec.style.display = s.open ? 'flex' : 'none';
                if (openBtn) openBtn.hidden = !!s.open;
            } else {
                sec.style.display = 'none';
                if (openBtn) openBtn.hidden = true;
                if (ttlTab) ttlTab.textContent = 'Abrir panel';
                if (ttlHdr) ttlHdr.textContent = '';
            }
        });
        // Mantener la lista de abiertos de WebShell.Panels coherente con la pestaña activa
        P.Open = []; P.Available = [];
        if (t) DIRS.forEach(function (dir) {
            var s = t.panels[dir], sel = '#webshell-' + dir + '-panel';
            if (s && s.avail) { P.Available.push(sel); if (s.open) P.Open.push(sel); }
        });
    }

    function disposePanels(t) {
        DIRS.forEach(function (dir) {
            var s = t.panels[dir];
            if (!s) return;
            if (s.frame) { try { s.frame.src = 'about:blank'; } catch (e) { } s.frame.remove(); }
            delete t.panels[dir];
        });
        if (Tabs.active === t) renderPanels();
    }

    P.Show = function (p, u, title) {
        if (WS.showingModal) return orig.Show.apply(P, arguments);
        var t = owner();
        if (!t) return;
        dirsOf(p).forEach(function (dir) {
            try { WS.setAdjustPanelEvent('adjust-' + dir + '-panel', dir); } catch (e) { }
            var s = panelFrame(t, dir);
            if (u) {
                s.avail = true;
                s.open = true;
                s.title = title || s.title;
                s.frame.onload = function () {
                    try {
                        if (!s.frame.contentWindow || s.frame.contentWindow.location.href === 'about:blank') return;
                        if (!title) s.title = (s.frame.contentDocument && s.frame.contentDocument.title) || s.title;
                    } catch (e) { }
                    if (Tabs.active === t) renderPanels();
                };
                s.frame.src = u;
            } else if (s.avail) s.open = true;
        });
        if (Tabs.active === t) renderPanels();
    };
    P.Hide = function (p) {
        var t = Tabs.active;
        if (!t) return;
        dirsOf(p).forEach(function (dir) { var s = t.panels[dir]; if (s) s.open = false; });
        renderPanels();
    };
    P.Dispose = function (p) {
        var t = owner();
        if (!t) return;
        dirsOf(p).forEach(function (dir) {
            var s = t.panels[dir];
            if (!s) return;
            if (s.frame) { try { s.frame.src = 'about:blank'; } catch (e) { } s.frame.remove(); }
            delete t.panels[dir];
        });
        if (Tabs.active === t) renderPanels();
    };

    // ---------------------------------------------------------------- arranque
    function init() {
        var main = document.getElementById('main-sec');
        var grid = document.getElementById('webshell-grid-container');
        var first = document.getElementById('_main_view');
        if (!main || !grid || !first) { Tabs.enabled = false; return; }

        document.body.classList.add('ws-tabs');
        injectStyles();
        Tabs.host = main;
        Tabs.homeUrl = WS.homeUrl || '/';

        var bar = document.createElement('div');
        bar.id = 'ws_tabbar';
        bar.setAttribute('role', 'tablist');
        bar.setAttribute('aria-label', 'Ventanas abiertas');
        grid.insertBefore(bar, grid.firstChild);
        Tabs.bar = bar;
        bar.addEventListener('wheel', function (e) {
            if (bar.scrollWidth <= bar.clientWidth) return;
            bar.scrollLeft += (e.deltaY || e.deltaX);
            e.preventDefault();
        }, { passive: false });

        // Botones de los paneles (una sola vez; trabajan sobre la pestaña activa)
        DIRS.forEach(function (dir) {
            var sel = '#webshell-' + dir + '-panel';
            var o = document.getElementById('webshell-open-' + dir + '-panel');
            var c = document.getElementById('webshell-close-' + dir + '-panel');
            if (o) o.onclick = function () { P.Show(sel); };
            if (c) c.onclick = function () { P.Hide(sel); };
        });

        // Pestañas: las recordadas + la de la URL inicial (que usa el iframe que ya está cargando)
        var firstUrl = first.getAttribute('src') || Tabs.homeUrl;
        try { var fl = first.contentWindow.location.href; if (fl && fl !== 'about:blank') firstUrl = fl; } catch (e) { }
        var deepLink = !!WS.urlGo;
        var stored = load();
        var firstTab = null, storedActive = null;

        if (stored) {
            stored.tabs.slice(0, MAX_TABS).forEach(function (s) {
                var t = makeTab({ url: s.url, title: s.title, home: s.home });
                Tabs.list.push(t);
                bar.appendChild(t.btn);
                if (!firstTab && key(s.url) === key(firstUrl)) firstTab = t;
            });
        }
        if (stored) storedActive = Tabs.list[stored.active] || null;
        // Sin ?go=, el iframe inicial trae el inicio: se une a la pestaña de inicio recordada aunque su URL difiera
        if (!firstTab && !deepLink) for (var hi = 0; hi < Tabs.list.length; hi++) if (Tabs.list[hi].home) { firstTab = Tabs.list[hi]; firstTab.url = key(firstUrl); break; }
        if (!firstTab) {
            firstTab = makeTab({ url: key(firstUrl), home: isHomeUrl(firstUrl) || !deepLink });
            if (firstTab.home) { Tabs.list.unshift(firstTab); bar.insertBefore(firstTab.btn, bar.firstChild); }
            else { Tabs.list.push(firstTab); bar.appendChild(firstTab.btn); }
            if (Tabs.list.length > MAX_TABS) { var extra = Tabs.list.splice(firstTab.home ? MAX_TABS : 0, 1)[0]; if (extra && extra !== firstTab) extra.btn.remove(); }
        }
        ensureFrame(firstTab, first);

        var act = firstTab;
        if (!deepLink && storedActive && Tabs.list.indexOf(storedActive) >= 0) act = storedActive;
        activate(act.id);

        keys(document);

        // Casa y logotipo del nav: traer al frente el inicio o reabrirlo
        document.querySelectorAll('#nav_main a[href="/"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
                e.preventDefault();
                home();
            });
        });

        // Salir de la sesión: olvidar las pestañas
        document.querySelectorAll('#nav_main a[href*="logout="]').forEach(function (a) {
            a.addEventListener('click', function () { try { sessionStorage.removeItem(KEY); } catch (e) { } Tabs.allowTopNav = true; });
        });

        // Navegaciones del shell completo que vienen de una página (p. ej. window.top.location = "/"): se quedan en pestañas
        try {
            if (global.navigation && global.navigation.addEventListener) {
                global.navigation.addEventListener('navigate', function (e) {
                    if (Tabs.allowTopNav || !e.cancelable || e.hashChange || e.downloadRequest) return;
                    if (e.navigationType !== 'push' && e.navigationType !== 'replace') return;
                    var dest = e.destination && e.destination.url;
                    var u = abs(dest);
                    if (!u || u.origin !== location.origin) return;
                    if (u.searchParams.get('logout')) { try { sessionStorage.removeItem(KEY); } catch (x) { } return; }
                    var t = Tabs.active;
                    if (!t) return;
                    e.preventDefault();
                    routeTop(t, u.href);
                });
            }
        } catch (e) { }

        global.addEventListener('beforeunload', function () { save(); });
    }

    Tabs.open = open;
    Tabs.home = home;
    Tabs.close = close;
    Tabs.activate = activate;
    Tabs.navigateActive = navigateActive;
    Tabs.activeFrame = function () { return Tabs.active ? Tabs.active.frame : null; };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})(window);
