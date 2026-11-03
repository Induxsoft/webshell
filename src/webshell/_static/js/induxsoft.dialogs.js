/*!
 * induxsoft.dialogs.js: diálogos y avisos de Induxsoft, sin Bootstrap ni otras dependencias.
 *
 * Induxsoft.dialog (alias window.InduxsoftDialog):
 * - alert(msg, opts) -> Promise<void>; confirm(msg, opts) -> Promise<boolean>; prompt(msg, opts) -> Promise<string|null>.
 * - open({title, content | text | element, buttons, size, closable, context}) -> manejador { element, result, close(valor),
 *   on(evento, fn), off(evento, fn) }. Eventos: 'show', 'shown', 'hide' (cancelable) y 'hidden'.
 * - toast(msg, {type, timeout, closable}) -> { element, close() }.
 * - bootstrapCompat(): si window.bootstrap no existe, hace funcionar sin bootstrap.bundle.js el marcado y la API de
 *   Bootstrap 5 más usados en V12: Modal, Tab, Dropdown, Collapse, Alert y Toast, y el puente de jQuery .modal()/.tab().
 *
 * Los diálogos usan <dialog> nativo con showModal() (capa superior, fondo, el resto inerte), foco atrapado, Esc (si
 * closable) y ARIA. Se pueden apilar. Toman el tema heredado (data-et-theme / data-et-palette, módulo InduxsoftTheme si
 * está cargado) con las mismas variables --et-*; sin tema, una apariencia neutra. El texto se pone como texto (sin HTML)
 * salvo que se pida html: true o se use content (HTML del programador).
 */
(function ()
{
    'use strict';
    var VERSION = '1.0.0';
    if (typeof window === 'undefined' || !window.document) return;
    var w = window, d = w.document;
    var NS = w.Induxsoft = w.Induxsoft || {};
    if (NS.dialog && NS.dialog.version && NS.dialog.version >= VERSION) return;

    var TXT = { ok: 'Aceptar', cancel: 'Cancelar', close: 'Cerrar', alert: 'Aviso', confirm: 'Confirmación', prompt: 'Captura' };
    var uid = 0;
    function id(p) { return 'idlg-' + p + '-' + (++uid); }

    // ---------------------------------------------------------------- estilos (una vez)
    var CSS = [
        '.idlg{box-sizing:border-box;padding:0;border:1px solid var(--et-border,#dee2e6);border-radius:var(--et-radius,6px);',
        'background:var(--et-bg,#fff);color:var(--et-fg,#212529);font-family:var(--et-font,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif);',
        'font-size:var(--et-font-size,0.9375rem);width:500px;max-width:calc(100vw - 2rem);max-height:calc(100vh - 2rem);box-shadow:0 .5rem 1.5rem rgba(0,0,0,.25);overflow:hidden}',
        '.idlg[open]{display:flex;flex-direction:column}',
        '.idlg::backdrop{background:rgba(0,0,0,.45)}',
        '.idlg-sm{width:320px}.idlg-lg{width:800px}.idlg-xl{width:1140px}.idlg-full{width:calc(100vw - 2rem);height:calc(100vh - 2rem)}',
        '.idlg *{box-sizing:border-box}',
        '.idlg-head{display:flex;align-items:center;gap:.5rem;padding:.65rem 1rem;background:var(--et-header-bg,#f8f9fa);color:var(--et-header-fg,inherit);border-bottom:1px solid var(--et-header-border,var(--et-border,#dee2e6))}',
        '.idlg-title{flex:1;margin:0;font-size:1.05em;font-weight:var(--et-header-weight,600);line-height:1.3}',
        '.idlg-x{flex:none;border:0;background:transparent;color:inherit;font-size:1.25rem;line-height:1;width:2rem;height:2rem;border-radius:var(--et-radius,4px);cursor:pointer;opacity:.7}',
        '.idlg-x:hover{opacity:1;background:var(--et-hover-bg,rgba(0,0,0,.06))}',
        '.idlg-body{padding:1rem;overflow:auto;flex:1 1 auto}',
        '.idlg-msg{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}',
        '.idlg-input{display:block;width:100%;margin-top:.75rem;padding:var(--et-input-pad-y,.375rem) var(--et-input-pad-x,.75rem);font:inherit;',
        'background:var(--et-input-bg,#fff);color:var(--et-input-fg,inherit);border:1px solid var(--et-input-border,#ced4da);border-radius:var(--et-radius,4px)}',
        '.idlg-err{margin:.4rem 0 0;color:var(--et-error,#b02a37);font-size:.9em}',
        '.idlg-foot{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.5rem;padding:.65rem 1rem;border-top:1px solid var(--et-border,#dee2e6)}',
        '.idlg-btn{font:inherit;padding:.375rem .9rem;min-width:5.5rem;border-radius:var(--et-radius,4px);cursor:pointer;',
        'border:1px solid var(--et-input-border,#adb5bd);background:var(--et-bg,#fff);color:var(--et-fg,#212529)}',
        '.idlg-btn:hover{background:var(--et-hover-bg,#e9ecef)}',
        '.idlg-btn-primary{background:var(--et-sel-bg,#0d6efd);border-color:var(--et-sel-bg,#0d6efd);color:var(--et-sel-fg,#fff)}',
        '.idlg-btn-primary:hover{background:var(--et-sel-bg,#0b5ed7);filter:brightness(.92)}',
        '.idlg-btn-danger{background:var(--et-error,#bb2d3b);border-color:var(--et-error,#bb2d3b);color:#fff}',
        '.idlg-btn-danger:hover{filter:brightness(.92);background:var(--et-error,#bb2d3b)}',
        '.idlg :focus-visible{outline:2px solid var(--et-focus-ring,#0d6efd);outline-offset:2px}',
        '.idlg-toasts{position:fixed;inset:auto 1rem 1rem auto;margin:0;padding:0;border:0;background:transparent;overflow:visible;',
        'display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;z-index:2147483000;max-width:min(420px,calc(100vw - 2rem));pointer-events:none}',
        '.idlg-toasts:empty{display:none}',
        '.idlg-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:.5rem;padding:.6rem .75rem;border-radius:var(--et-radius,6px);',
        'background:var(--et-tooltip-bg,#212529);color:var(--et-tooltip-fg,#fff);box-shadow:0 .25rem .75rem rgba(0,0,0,.25);',
        'font-family:var(--et-font,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif);font-size:var(--et-font-size,0.875rem);border-left:4px solid var(--idlg-t,#6c757d)}',
        '.idlg-toast-success{--idlg-t:var(--et-ok,#198754)}.idlg-toast-warning{--idlg-t:var(--et-warn,#ffc107)}.idlg-toast-error{--idlg-t:var(--et-error,#dc3545)}.idlg-toast-info{--idlg-t:var(--et-accent,#0d6efd)}',
        '.idlg-toast-msg{flex:1;white-space:pre-wrap;overflow-wrap:anywhere}',
        '.idlg-toast .idlg-x{width:1.5rem;height:1.5rem;font-size:1rem}'
    ].join('\n');
    function estilos()
    {
        if (d.getElementById('induxsoft-dialogs-css')) return;
        var s = d.createElement('style');
        s.id = 'induxsoft-dialogs-css';
        s.textContent = CSS;
        (d.head || d.documentElement).appendChild(s);
    }

    // ---------------------------------------------------------------- tema heredado
    // Pone en el elemento las variables --et-* del tema que resuelve InduxsoftTheme para el contexto (tema + paleta).
    // Sin módulo de tema, sin tema o con «ninguno», no pone nada: queda la apariencia neutra (o lo que herede por CSS).
    var VARS_PUESTAS = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    function aplicarTema(el, ctx)
    {
        var T = w.InduxsoftTheme, previas = VARS_PUESTAS && VARS_PUESTAS.get(el);
        if (previas) previas.forEach(function (k) { el.style.removeProperty(k); });
        el.style.removeProperty('color-scheme');
        el.removeAttribute('data-idlg-theme');
        if (!T || typeof T.resolve !== 'function') return;
        var r; try { r = T.resolve(ctx || d.documentElement); } catch (e) { return; }
        var pal = {}, k, hay = false;
        var t = r.effective ? T.theme(r.effective) : null;
        if (t) { for (k in t) pal[k] = t[k]; hay = true; }
        if (r.palette) { for (k in r.palette) pal[k] = r.palette[k]; hay = true; }
        if (!hay) return;
        var puestas = [];
        for (k in pal)
        {
            if (k === 'color-scheme') { el.style.setProperty('color-scheme', pal[k]); continue; }
            el.style.setProperty('--et-' + k, pal[k]); puestas.push('--et-' + k);
        }
        if (VARS_PUESTAS) VARS_PUESTAS.set(el, puestas);
        el.setAttribute('data-idlg-theme', r.effective || 'palette');
    }

    // ---------------------------------------------------------------- foco
    var ENFOCABLES = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"]),[contenteditable="true"],edit-table,input-key';
    function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && w.getComputedStyle(el).visibility !== 'hidden'; }
    function enfocables(raiz) { return Array.prototype.filter.call(raiz.querySelectorAll(ENFOCABLES), function (x) { return !x.closest('[inert]') && visible(x); }); }
    // Tab y Mayús+Tab dan la vuelta dentro de raiz.
    function atrapar(ev, raiz)
    {
        if (ev.key !== 'Tab') return;
        var l = enfocables(raiz);
        if (!l.length) { ev.preventDefault(); try { raiz.focus(); } catch (e) { } return; }
        var a = d.activeElement, i = l.indexOf(a);
        if (ev.shiftKey && (i <= 0 || a === raiz)) { ev.preventDefault(); l[l.length - 1].focus(); }
        else if (!ev.shiftKey && (i === l.length - 1 || i < 0 && !raiz.contains(a))) { ev.preventDefault(); l[0].focus(); }
    }

    // ---------------------------------------------------------------- diálogos
    var abiertos = [];   // pila de manejadores abiertos (el último es el de arriba)
    function texto(el, s) { el.textContent = s == null ? '' : String(s); return el; }
    function crear(tag, cls, attrs) { var e = d.createElement(tag); if (cls) e.className = cls; if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function evento(el, nombre, detalle, cancelable)
    {
        var e = new CustomEvent('idlg:' + nombre, { bubbles: true, cancelable: !!cancelable, detail: detalle || {} });
        el.dispatchEvent(e);
        return e;
    }

    /**
     * open(opts) -> manejador. opts:
     *   title (texto), content (HTML del programador) | text (texto) | element (nodo; se mueve al diálogo y vuelve a
     *   su lugar al cerrar), buttons [{text, value, variant: 'primary'|'secondary'|'danger', onClick(h, ev) -> false
     *   para no cerrar, close: false para no cerrar}], size 'sm'|'md'|'lg'|'xl'|'full', closable (true: Esc y la X),
     *   role ('dialog'|'alertdialog'), context (elemento del que se toma el tema; por omisión el foco actual),
     *   className, focus (elemento o selector que recibe el foco).
     * manejador: element, result (Promise con el valor de close), close(valor), on/off('show'|'shown'|'hide'|'hidden', fn).
     * 'hide' se puede cancelar con ev.preventDefault() (salvo close(valor, {force:true})).
     */
    function open(o)
    {
        o = o || {};
        estilos();
        var closable = o.closable !== false;
        var previo = d.activeElement;
        var dlg = crear('dialog', 'idlg idlg-' + (o.size || 'md') + (o.className ? ' ' + o.className : ''), { role: o.role || 'dialog', 'aria-modal': 'true' });
        var cuerpoId = id('body');
        if (o.title != null && o.title !== '' || closable)
        {
            var head = crear('div', 'idlg-head');
            if (o.title != null && o.title !== '')
            {
                var ht = texto(crear("h2", "idlg-title", { id: id("title") }), o.title);
                head.appendChild(ht);
                dlg.setAttribute("aria-labelledby", ht.id);
            }
            else { head.appendChild(crear('span', 'idlg-title')); if (o.label) dlg.setAttribute('aria-label', o.label); }
            if (closable)
            {
                var x = crear('button', 'idlg-x', { type: 'button', 'aria-label': o.closeText || TXT.close, 'data-idlg-close': '' });
                x.innerHTML = '&times;';
                head.appendChild(x);
            }
            dlg.appendChild(head);
        }
        else if (o.label) dlg.setAttribute('aria-label', o.label);
        var body = crear('div', 'idlg-body', { id: cuerpoId });
        var lugar = null;
        if (o.element)
        {
            var el = o.element;
            if (el.parentNode) { lugar = { padre: el.parentNode, sig: el.nextSibling, hidden: el.hidden, display: el.style.display }; }
            el.hidden = false; if (el.style.display === 'none') el.style.display = '';
            body.appendChild(el);
        }
        else if (o.content != null) body.innerHTML = String(o.content);
        else if (o.text != null) body.appendChild(texto(crear('p', 'idlg-msg'), o.text));
        dlg.appendChild(body);
        dlg.setAttribute('aria-describedby', cuerpoId);
        var botones = o.buttons || [];
        if (botones.length)
        {
            var foot = crear('div', 'idlg-foot');
            botones.forEach(function (b, i)
            {
                var bt = texto(crear('button', 'idlg-btn idlg-btn-' + (b.variant || (b.primary ? 'primary' : 'secondary')), { type: 'button', 'data-idlg-btn': String(i) }), b.text);
                if (b.id) bt.id = b.id;
                foot.appendChild(bt);
            });
            dlg.appendChild(foot);
        }

        var resolver, cerrado = false;
        var h = {
            element: dlg,
            body: body,
            result: new Promise(function (r) { resolver = r; }),
            close: function (valor, op) { return cerrar(valor, op); },
            on: function (n, fn) { dlg.addEventListener('idlg:' + n, fn); return h; },
            off: function (n, fn) { dlg.removeEventListener('idlg:' + n, fn); return h; },
            get open() { return !cerrado; }
        };
        if (o.on) for (var n in o.on) h.on(n, o.on[n]);

        function cerrar(valor, op)
        {
            if (cerrado) return false;
            if (!(op && op.force) && evento(dlg, 'hide', { value: valor }, true).defaultPrevented) return false;
            cerrado = true;
            if (desuscribir) try { desuscribir(); } catch (e) { }
            try { dlg.close(); } catch (e) { }
            var i = abiertos.indexOf(h); if (i >= 0) abiertos.splice(i, 1);
            alFrente();   // los avisos salen del diálogo antes de quitarlo
            if (lugar)
            {
                var el = o.element;
                el.hidden = lugar.hidden; el.style.display = lugar.display;
                try { lugar.padre.insertBefore(el, lugar.sig && lugar.sig.parentNode === lugar.padre ? lugar.sig : null); } catch (e) { }
            }
            dlg.remove();
            if (previo && previo.isConnected && typeof previo.focus === 'function') { try { previo.focus({ preventScroll: true }); } catch (e) { } }
            evento(dlg, 'hidden', { value: valor });
            resolver(valor);
            return true;
        }
        dlg.addEventListener('click', function (ev)
        {
            var t = ev.target.closest ? ev.target.closest('[data-idlg-close],[data-idlg-btn]') : null;
            if (!t || !dlg.contains(t)) return;
            if (t.hasAttribute('data-idlg-close')) { cerrar(o.cancelValue); return; }
            var b = botones[+t.getAttribute('data-idlg-btn')];
            if (!b) return;
            if (typeof b.onClick === 'function' && b.onClick(h, ev) === false) return;
            if (b.close === false) return;
            cerrar(b.value);
        });
        // Esc: lo manejamos en keydown (así no lo ven los de la página) y el 'cancel' nativo siempre se cancela.
        dlg.addEventListener('keydown', function (ev)
        {
            if (ev.key === 'Escape')
            {
                ev.preventDefault(); ev.stopPropagation();
                if (closable && abiertos[abiertos.length - 1] === h) cerrar(o.cancelValue);
                return;
            }
            atrapar(ev, dlg);
        });
        // 'cancel' nativo (Esc con el foco fuera de los controles del diálogo, p. ej. en <body>): mismo criterio.
        dlg.addEventListener('cancel', function (ev) { ev.preventDefault(); if (closable && abiertos[abiertos.length - 1] === h) cerrar(o.cancelValue); });
        dlg.addEventListener('close', function () { if (!cerrado) { try { dlg.showModal(); } catch (e) { } } });

        var ctx = o.context || (previo && previo !== d.body ? previo : d.documentElement);
        aplicarTema(dlg, ctx);
        var desuscribir = null;
        if (w.InduxsoftTheme && typeof w.InduxsoftTheme.subscribe === 'function')
            try { desuscribir = w.InduxsoftTheme.subscribe(ctx && ctx.isConnected ? ctx : d.documentElement, function () { aplicarTema(dlg, ctx && ctx.isConnected ? ctx : d.documentElement); }); } catch (e) { }

        if (evento(dlg, 'show', {}, true).defaultPrevented) { cerrado = true; resolver(o.cancelValue); return h; }
        d.body.appendChild(dlg);
        abiertos.push(h);
        dlg.showModal();
        alFrente();
        // Foco inicial: opts.focus, [autofocus], el primer enfocable del cuerpo, el botón principal o el diálogo.
        var f = o.focus ? (typeof o.focus === 'string' ? dlg.querySelector(o.focus) : o.focus) : null;
        if (!f) f = body.querySelector('[autofocus]') || enfocables(body)[0] || dlg.querySelector('.idlg-btn-primary,.idlg-btn-danger') || dlg.querySelector('.idlg-btn');
        if (f) { try { f.focus(); if (f.select && f.tagName === 'INPUT') f.select(); } catch (e) { } }
        else { dlg.tabIndex = -1; dlg.focus(); }
        setTimeout(function () { if (!cerrado) evento(dlg, 'shown', {}); }, 0);
        return h;
    }

    function mensaje(msg, o)
    {
        var p = crear('p', 'idlg-msg');
        if (o && o.html) p.innerHTML = String(msg == null ? '' : msg); else texto(p, msg);
        return p;
    }
    /** alert(msg, {title, okText, html, size, context}) -> Promise<void>. */
    function alert(msg, o)
    {
        o = o || {};
        var h = open(asignar({}, o, {
            text: undefined, content: undefined, element: mensaje(msg, o), role: 'alertdialog', label: o.title ? null : TXT.alert,
            closable: o.closable !== false, cancelValue: undefined,
            buttons: [{ text: o.okText || TXT.ok, value: undefined, variant: 'primary' }]
        }));
        return h.result.then(function () { });
    }
    /** confirm(msg, {title, okText, cancelText, danger, focus: 'cancel', html}) -> Promise<boolean>. Esc da false. */
    function confirm(msg, o)
    {
        o = o || {};
        var h = open(asignar({}, o, {
            text: undefined, content: undefined, element: mensaje(msg, o), role: 'alertdialog', label: o.title ? null : TXT.confirm,
            closable: o.closable !== false, cancelValue: false, focus: o.focus === 'cancel' ? '[data-idlg-btn="0"]' : undefined,
            buttons: [{ text: o.cancelText || TXT.cancel, value: false }, { text: o.okText || TXT.ok, value: true, variant: o.danger ? 'danger' : 'primary' }]
        }));
        return h.result.then(function (v) { return v === true; });
    }
    /**
     * prompt(msg, {title, value, placeholder, type, required, validate(v) -> true | 'mensaje', okText, cancelText})
     * -> Promise<string|null>. Enter acepta; Esc o Cancelar dan null.
     */
    function prompt(msg, o)
    {
        o = o || {};
        var caja = crear('div');
        caja.appendChild(mensaje(msg, o));
        var inp = crear('input', 'idlg-input', { type: o.type || 'text', 'aria-label': String(msg == null ? '' : msg).slice(0, 120) });
        if (o.placeholder) inp.placeholder = o.placeholder;
        inp.value = o.value == null ? '' : String(o.value);
        if (o.required) inp.required = true;
        var err = crear('p', 'idlg-err', { role: 'alert' }); err.hidden = true;
        caja.appendChild(inp); caja.appendChild(err);
        var valida = function ()
        {
            var v = inp.value, r = true;
            if (o.required && !v.trim()) r = o.requiredText || 'Este dato es obligatorio.';
            else if (typeof o.validate === 'function') r = o.validate(v);
            if (r === true || r == null || r === '') { err.hidden = true; inp.removeAttribute('aria-invalid'); return true; }
            texto(err, r === false ? 'Valor no válido.' : r); err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus();
            return false;
        };
        var h = open(asignar({}, o, {
            text: undefined, content: undefined, element: caja, role: 'dialog', label: o.title ? null : TXT.prompt,
            closable: o.closable !== false, cancelValue: null, focus: inp,
            buttons: [
                { text: o.cancelText || TXT.cancel, value: null },
                { text: o.okText || TXT.ok, variant: 'primary', onClick: function (hh) { if (valida()) hh.close(inp.value); return false; } }
            ]
        }));
        inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.isComposing) { ev.preventDefault(); if (valida()) h.close(inp.value); } });
        return h.result.then(function (v) { return v == null ? null : String(v); });
    }

    // ---------------------------------------------------------------- avisos (toast)
    var contToasts = null;
    function contenedor()
    {
        estilos();
        if (contToasts) return contToasts;
        contToasts = crear('div', 'idlg-toasts', { 'aria-live': 'polite', 'aria-relevant': 'additions' });
        // popover="manual": entra en la capa superior, encima de los <dialog> modales (si el navegador lo admite).
        if (typeof contToasts.showPopover === 'function') contToasts.setAttribute('popover', 'manual');
        (abiertos.length ? abiertos[abiertos.length - 1].element : d.body).appendChild(contToasts);
        return contToasts;
    }
    // Lleva los avisos encima del último diálogo abierto. Con un modal abierto, lo que está fuera de él queda inerte
    // (sin clics), así que el contenedor se mueve dentro del <dialog> de arriba y, como popover, se vuelve a mostrar
    // para quedar al final de la capa superior. Al cerrar ese diálogo vuelve al de abajo o al <body>.
    function alFrente()
    {
        if (!contToasts) return;
        var top = abiertos.length ? abiertos[abiertos.length - 1].element : d.body;
        if (contToasts.parentNode !== top) top.appendChild(contToasts);
        if (!contToasts.children.length || typeof contToasts.showPopover !== 'function') return;
        try { if (contToasts.matches(':popover-open')) contToasts.hidePopover(); contToasts.showPopover(); } catch (e) { }
    }
    /** toast(msg, {type: 'info'|'success'|'warning'|'error', timeout (ms; 0 = hasta cerrarlo), closable, html}) -> {element, close()}. */
    function toast(msg, o)
    {
        o = o || {};
        var tipo = /^(info|success|warning|error)$/.test(o.type) ? o.type : 'info';
        var c = contenedor();
        var t = crear('div', 'idlg-toast idlg-toast-' + tipo, { role: tipo === 'error' || tipo === 'warning' ? 'alert' : 'status' });
        var m = crear('div', 'idlg-toast-msg');
        if (o.html) m.innerHTML = String(msg == null ? '' : msg); else texto(m, msg);
        t.appendChild(m);
        var hecho = false, timer = null;
        var cerrar = function () { if (hecho) return; hecho = true; if (timer) clearTimeout(timer); t.remove(); if (!c.children.length) { try { if (c.hidePopover && c.matches(':popover-open')) c.hidePopover(); } catch (e) { } } };
        if (o.closable !== false)
        {
            var x = crear('button', 'idlg-x', { type: 'button', 'aria-label': TXT.close });
            x.innerHTML = '&times;';
            x.addEventListener('click', cerrar);
            t.appendChild(x);
        }
        aplicarTema(t, o.context || d.documentElement);
        c.appendChild(t);
        alFrente();
        var ms = o.timeout == null ? (tipo === 'error' ? 8000 : 4000) : +o.timeout;
        if (ms > 0) timer = setTimeout(cerrar, ms);
        return { element: t, close: cerrar };
    }

    function asignar(dst) { for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) dst[k] = s[k]; } return dst; }

    // ================================================================ compatibilidad con Bootstrap 5 (sin su JS)
    // Solo si window.bootstrap no existe. Usa el marcado y el CSS de Bootstrap tal cual (.modal, .fade, .show,
    // .modal-backdrop, .nav-link.active, .tab-pane.active, .dropdown-menu.show, .collapse.show). Si después se carga
    // el Bootstrap real, los manejadores de aquí se hacen a un lado.
    var BS = null;
    function compatActiva() { return !!(BS && w.bootstrap === BS); }
    function elDe(x) { return typeof x === 'string' ? d.querySelector(x) : (x && x.jquery ? x[0] : x); }
    function selectorDe(t)
    {
        var s = t.getAttribute('data-bs-target');
        if (!s || s === '#')
        {
            var href = t.getAttribute('href');
            if (!href || (!href.includes('#') && !href.startsWith('.'))) return null;
            if (href.includes('#') && !href.startsWith('#')) href = '#' + href.split('#')[1];
            s = href && href !== '#' ? href.trim() : null;
        }
        return s;
    }
    function destinoDe(t) { var s = selectorDe(t); if (!s) return null; try { return d.querySelector(s); } catch (e) { return null; } }
    function destinosDe(t) { var s = selectorDe(t); if (!s) return []; try { return Array.prototype.slice.call(d.querySelectorAll(s)); } catch (e) { return []; } }
    // Como el EventHandler.trigger de Bootstrap 5: con jQuery cargado, primero el evento de jQuery (así funcionan
    // $(el).on('shown.bs.modal', …), que jQuery registra como 'shown' con espacio de nombres) y después el nativo.
    function bsEvento(el, nombre, rel, cancelable)
    {
        var $ = w.jQuery, jq = null;
        if ($ && typeof $.Event === 'function' && typeof $.fn.trigger === 'function')
        {
            try { jq = $.Event(nombre, rel !== undefined ? { relatedTarget: rel } : {}); $(el).trigger(jq); } catch (x) { jq = null; }
        }
        var e = new CustomEvent(nombre, { bubbles: !(jq && jq.isPropagationStopped()), cancelable: cancelable !== false });
        if (rel !== undefined) { try { Object.defineProperty(e, 'relatedTarget', { value: rel, enumerable: true }); } catch (x) { e.relatedTarget = rel; } }
        if (jq && jq.isDefaultPrevented()) e.preventDefault();
        if (!(jq && jq.isImmediatePropagationStopped())) el.dispatchEvent(e);
        return e;
    }
    function reflow(el) { return el.offsetHeight; }
    // Duración de la transición (ms) del elemento y de su .modal-dialog, como Bootstrap.
    function duracion(el)
    {
        var max = 0;
        [el, el.querySelector && el.querySelector('.modal-dialog')].forEach(function (x)
        {
            if (!x) return;
            var cs = w.getComputedStyle(x);
            var dur = (cs.transitionDuration || '0s').split(',').map(parseFloat), del = (cs.transitionDelay || '0s').split(',').map(parseFloat);
            for (var i = 0; i < dur.length; i++) max = Math.max(max, ((dur[i] || 0) + (del[i] || del[0] || 0)) * 1000);
        });
        return max;
    }
    function despues(el, fn) { var ms = el.classList.contains('fade') ? duracion(el) : 0; if (ms > 0) setTimeout(fn, ms + 5); else fn(); }
    function instanciasDe(clase) { return clase._mapa || (clase._mapa = new WeakMap()); }
    function datosBool(v, def) { if (v == null) return def; if (v === 'false' || v === false) return false; if (v === 'true' || v === '' || v === true) return true; return v; }
    function estatico(clase)
    {
        clase.getInstance = function (el) { el = elDe(el); return el ? instanciasDe(clase).get(el) || null : null; };
        clase.getOrCreateInstance = function (el, cfg) { el = elDe(el); return clase.getInstance(el) || new clase(el, typeof cfg === 'object' ? cfg : {}); };
        clase.VERSION = '5.0.1-induxsoft';
        return clase;
    }

    // ---------------------------------------------------------------- Modal
    var modalesAbiertos = [];
    function Modal(el, cfg)
    {
        el = elDe(el);
        if (!el) throw new TypeError('bootstrap.Modal: elemento no encontrado');
        var ya = instanciasDe(Modal).get(el);
        if (ya) { if (cfg && typeof cfg === 'object') asignar(ya._config, cfg); return ya; }
        this._element = el;
        this._config = asignar({
            backdrop: datosBool(el.getAttribute('data-bs-backdrop'), true),
            keyboard: datosBool(el.getAttribute('data-bs-keyboard'), true),
            focus: datosBool(el.getAttribute('data-bs-focus'), true)
        }, cfg && typeof cfg === 'object' ? cfg : {});
        this._isShown = false; this._transitioning = false; this._backdrop = null; this._previo = null;
        instanciasDe(Modal).set(el, this);
        var self = this;
        el.addEventListener('click', function (ev)
        {
            if (!compatActiva() || !self._isShown || ev.target !== el) return;
            if (self._config.backdrop === 'static') { self._estatico(); return; }
            if (self._config.backdrop) self.hide();
        });
        el.addEventListener('keydown', function (ev)
        {
            if (!compatActiva() || !self._isShown || modalesAbiertos[modalesAbiertos.length - 1] !== self) return;
            if (ev.key === 'Escape') { if (self._config.keyboard) { ev.preventDefault(); self.hide(); } else if (self._config.backdrop === 'static') self._estatico(); }
            else if (self._config.focus) atrapar(ev, el);
        });
    }
    Modal.prototype.toggle = function (rel) { return this._isShown ? this.hide() : this.show(rel); };
    Modal.prototype.show = function (rel)
    {
        var el = this._element, self = this;
        if (this._isShown || this._transitioning) return;
        if (bsEvento(el, 'show.bs.modal', rel || null).defaultPrevented) return;
        this._isShown = true;
        if (el.classList.contains('fade')) this._transitioning = true;
        this._previo = d.activeElement;
        var nivel = modalesAbiertos.length;
        modalesAbiertos.push(this);
        d.body.classList.add('modal-open');
        if (this._config.backdrop)
        {
            var b = crear('div', 'modal-backdrop' + (el.classList.contains('fade') ? ' fade' : ''));
            if (nivel) b.style.zIndex = String(1050 + nivel * 20);
            d.body.appendChild(b);
            reflow(b);
            b.classList.add('show');
            this._backdrop = b;
        }
        if (nivel) el.style.zIndex = String(1055 + nivel * 20);
        if (!el.parentNode || el.parentNode.nodeType !== 1) d.body.appendChild(el);
        el.style.display = 'block';
        el.removeAttribute('aria-hidden');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('role', 'dialog');
        el.scrollTop = 0;
        reflow(el);
        el.classList.add('show');
        despues(el, function ()
        {
            if (self._config.focus) self._enfocar();
            self._transitioning = false;
            bsEvento(el, 'shown.bs.modal', rel || null, false);
        });
    };
    Modal.prototype._enfocar = function ()
    {
        var el = this._element;
        if (el.contains(d.activeElement)) return;
        var f = el.querySelector('[autofocus]');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        try { (f || el).focus({ preventScroll: true }); } catch (e) { }
    };
    Modal.prototype._estatico = function ()
    {
        var el = this._element;
        if (bsEvento(el, 'hidePrevented.bs.modal', undefined).defaultPrevented) return;
        el.classList.add('modal-static');
        setTimeout(function () { el.classList.remove('modal-static'); }, 300);
    };
    Modal.prototype.hide = function ()
    {
        var el = this._element, self = this;
        if (!this._isShown || this._transitioning) return;
        if (bsEvento(el, 'hide.bs.modal', undefined).defaultPrevented) return;
        this._isShown = false;
        var fade = el.classList.contains('fade');
        if (fade) this._transitioning = true;
        el.classList.remove('show');
        if (this._backdrop) this._backdrop.classList.remove('show');
        despues(el, function ()
        {
            el.style.display = 'none';
            el.style.zIndex = '';
            el.setAttribute('aria-hidden', 'true');
            el.removeAttribute('aria-modal');
            el.removeAttribute('role');
            if (self._backdrop) { self._backdrop.remove(); self._backdrop = null; }
            var i = modalesAbiertos.indexOf(self); if (i >= 0) modalesAbiertos.splice(i, 1);
            if (!modalesAbiertos.length) d.body.classList.remove('modal-open');
            self._transitioning = false;
            var p = self._previo; self._previo = null;
            if (p && p.isConnected && typeof p.focus === 'function' && (el.contains(d.activeElement) || d.activeElement === d.body)) { try { p.focus({ preventScroll: true }); } catch (e) { } }
            bsEvento(el, 'hidden.bs.modal', undefined, false);
        });
    };
    Modal.prototype.handleUpdate = function () { };
    Modal.prototype.dispose = function ()
    {
        if (this._backdrop) this._backdrop.remove();
        var i = modalesAbiertos.indexOf(this); if (i >= 0) modalesAbiertos.splice(i, 1);
        instanciasDe(Modal).delete(this._element);
    };
    estatico(Modal);
    // El foco no sale del modal de arriba (como el _enforceFocus de Bootstrap 5.0), salvo hacia un <dialog> propio,
    // los avisos o un modal de más arriba.
    function alEnfocar(ev)
    {
        if (!compatActiva() || !modalesAbiertos.length) return;
        var m = modalesAbiertos[modalesAbiertos.length - 1];
        if (!m._config.focus || m._transitioning) return;
        var t = ev.target, el = m._element;
        if (t === d || t === el || el.contains(t)) return;
        if (t.closest && t.closest('dialog[open],.idlg-toasts')) return;
        m._enfocar();
    }

    // ---------------------------------------------------------------- Tab
    function listaDe(el) { return el.closest('.nav, .list-group'); }
    function activoEn(lista, el)
    {
        if (!lista) return null;
        var c = Array.prototype.filter.call(lista.querySelectorAll('.active'), function (x)
        {
            return x !== el && listaDe(x) === lista && (x.matches('[data-bs-toggle="tab"],[data-bs-toggle="pill"],[data-bs-toggle="list"],.nav-link,.list-group-item'));
        });
        return c.length ? c[c.length - 1] : null;
    }
    function Tab(el)
    {
        el = elDe(el);
        if (!el) throw new TypeError('bootstrap.Tab: elemento no encontrado');
        var ya = instanciasDe(Tab).get(el);
        if (ya) return ya;
        this._element = el;
        instanciasDe(Tab).set(el, this);
    }
    Tab.prototype.show = function ()
    {
        var el = this._element;
        if (el.classList.contains('active') || el.classList.contains('disabled') || el.disabled) return;
        var lista = listaDe(el), previo = activoEn(lista, el);
        var hideEv = previo ? bsEvento(previo, 'hide.bs.tab', el) : null;
        var showEv = bsEvento(el, 'show.bs.tab', previo);
        if (showEv.defaultPrevented || (hideEv && hideEv.defaultPrevented)) return;
        if (previo)
        {
            previo.classList.remove('active');
            if (previo.hasAttribute('aria-selected') || previo.getAttribute('role') === 'tab') previo.setAttribute('aria-selected', 'false');
            var li = previo.parentNode; if (li && li.nodeName === 'LI') li.classList.remove('active');
        }
        el.classList.add('active');
        if (el.hasAttribute('aria-selected') || el.getAttribute('role') === 'tab') el.setAttribute('aria-selected', 'true');
        // Dentro de un dropdown del nav: el toggle del dropdown también queda activo (como Bootstrap).
        var dd = el.closest('.dropdown-menu');
        if (dd && dd.parentNode) { var tg = dd.parentNode.querySelector('.dropdown-toggle'); if (tg) tg.classList.add('active'); }
        var panel = destinoDe(el);
        var fin = function () { if (previo) bsEvento(previo, 'hidden.bs.tab', el, false); bsEvento(el, 'shown.bs.tab', previo, false); };
        if (!panel) { fin(); return; }
        var cont = panel.parentNode;
        var activos = cont ? Array.prototype.filter.call(cont.children, function (x) { return x !== panel && x.classList.contains('active'); }) : [];
        var pprev = previo && destinoDe(previo);
        if (pprev && pprev !== panel && activos.indexOf(pprev) < 0 && pprev.classList.contains('active')) activos.push(pprev);
        activos.forEach(function (x) { x.classList.remove('active'); if (x.classList.contains('fade')) x.classList.remove('show'); });
        panel.classList.add('active');
        if (panel.classList.contains('fade')) { reflow(panel); panel.classList.add('show'); }
        var hayFade = activos.some(function (x) { return x.classList.contains('fade'); });
        if (hayFade) { var ms = duracion(activos[0]); if (ms > 0) { setTimeout(fin, ms + 5); return; } }
        fin();
    };
    Tab.prototype.dispose = function () { instanciasDe(Tab).delete(this._element); };
    estatico(Tab);

    // ---------------------------------------------------------------- Dropdown
    var dropAbiertos = [];
    function menuDe(t)
    {
        var s = t.nextElementSibling;
        while (s) { if (s.classList.contains('dropdown-menu')) return s; s = s.nextElementSibling; }
        return t.parentNode ? t.parentNode.querySelector('.dropdown-menu') : null;
    }
    function Dropdown(el, cfg)
    {
        el = elDe(el);
        if (!el) throw new TypeError('bootstrap.Dropdown: elemento no encontrado');
        var ya = instanciasDe(Dropdown).get(el);
        if (ya) return ya;
        this._element = el;
        this._menu = menuDe(el);
        var ac = el.getAttribute('data-bs-auto-close');
        this._config = asignar({ autoClose: ac == null ? true : (ac === 'true' ? true : ac === 'false' ? false : ac) }, cfg || {});
        instanciasDe(Dropdown).set(el, this);
    }
    Dropdown.prototype._shown = function () { return !!(this._menu && this._menu.classList.contains('show')); };
    Dropdown.prototype.toggle = function () { return this._shown() ? this.hide() : this.show(); };
    Dropdown.prototype.show = function ()
    {
        var el = this._element, m = this._menu;
        if (!m || this._shown() || el.disabled || el.classList.contains('disabled')) return;
        if (bsEvento(el, 'show.bs.dropdown', el).defaultPrevented) return;
        dropAbiertos.slice().forEach(function (x) { if (x !== this && !x._menu.contains(el)) x.hide(); }, this);
        if (!m.closest('.navbar') && !m.hasAttribute('data-bs-popper')) { m.setAttribute('data-bs-popper', ''); this._popper = true; }
        m.classList.add('show'); el.classList.add('show');
        el.setAttribute('aria-expanded', 'true');
        dropAbiertos.push(this);
        bsEvento(el, 'shown.bs.dropdown', el, false);
    };
    Dropdown.prototype.hide = function ()
    {
        var el = this._element, m = this._menu;
        if (!this._shown()) return;
        if (bsEvento(el, 'hide.bs.dropdown', el).defaultPrevented) return;
        m.classList.remove('show'); el.classList.remove('show');
        if (this._popper) { m.removeAttribute('data-bs-popper'); this._popper = false; }
        el.setAttribute('aria-expanded', 'false');
        var i = dropAbiertos.indexOf(this); if (i >= 0) dropAbiertos.splice(i, 1);
        bsEvento(el, 'hidden.bs.dropdown', el, false);
    };
    Dropdown.prototype.update = function () { };
    Dropdown.prototype.dispose = function () { instanciasDe(Dropdown).delete(this._element); };
    estatico(Dropdown);

    // ---------------------------------------------------------------- Collapse
    function Collapse(el, cfg)
    {
        el = elDe(el);
        if (!el) throw new TypeError('bootstrap.Collapse: elemento no encontrado');
        var ya = instanciasDe(Collapse).get(el);
        if (ya) return ya;
        this._element = el;
        this._config = asignar({ toggle: true, parent: el.getAttribute('data-bs-parent') }, cfg || {});
        instanciasDe(Collapse).set(el, this);
        if (cfg && cfg.toggle) this.toggle();
    }
    function disparadoresDe(el)
    {
        return Array.prototype.filter.call(d.querySelectorAll('[data-bs-toggle="collapse"]'), function (t) { return destinosDe(t).indexOf(el) >= 0; });
    }
    Collapse.prototype.toggle = function () { return this._element.classList.contains('show') ? this.hide() : this.show(); };
    Collapse.prototype.show = function ()
    {
        var el = this._element;
        if (el.classList.contains('show')) return;
        var padre = this._config.parent ? elDe(this._config.parent) : null;
        if (bsEvento(el, 'show.bs.collapse', undefined).defaultPrevented) return;
        if (padre)
            Array.prototype.forEach.call(padre.querySelectorAll('.collapse.show'), function (x)
            {
                if (x !== el && x.getAttribute('data-bs-parent') && elDe(x.getAttribute('data-bs-parent')) === padre) Collapse.getOrCreateInstance(x, { toggle: false }).hide();
            });
        el.classList.add('show');
        disparadoresDe(el).forEach(function (t) { t.classList.remove('collapsed'); t.setAttribute('aria-expanded', 'true'); });
        bsEvento(el, 'shown.bs.collapse', undefined, false);
    };
    Collapse.prototype.hide = function ()
    {
        var el = this._element;
        if (!el.classList.contains('show')) return;
        if (bsEvento(el, 'hide.bs.collapse', undefined).defaultPrevented) return;
        el.classList.remove('show');
        disparadoresDe(el).forEach(function (t) { t.classList.add('collapsed'); t.setAttribute('aria-expanded', 'false'); });
        bsEvento(el, 'hidden.bs.collapse', undefined, false);
    };
    Collapse.prototype.dispose = function () { instanciasDe(Collapse).delete(this._element); };
    estatico(Collapse);

    // ---------------------------------------------------------------- Alert y Toast (lo mínimo)
    function Alert(el)
    {
        el = elDe(el);
        if (!el) throw new TypeError('bootstrap.Alert: elemento no encontrado');
        var ya = instanciasDe(Alert).get(el);
        if (ya) return ya;
        this._element = el;
        instanciasDe(Alert).set(el, this);
    }
    Alert.prototype.close = function ()
    {
        var el = this._element;
        if (this._cerrando || bsEvento(el, 'close.bs.alert', undefined).defaultPrevented) return;
        this._cerrando = true;
        el.classList.remove('show');
        // Con .fade espera la transición de opacidad; closed.bs.alert se dispara ya fuera del DOM, como Bootstrap.
        var self = this;
        despues(el, function () { el.remove(); instanciasDe(Alert).delete(el); bsEvento(el, 'closed.bs.alert', undefined, false); self._cerrando = false; });
    };
    Alert.prototype.dispose = function () { instanciasDe(Alert).delete(this._element); };
    estatico(Alert);
    function BsToast(el, cfg)
    {
        el = elDe(el);
        var ya = instanciasDe(BsToast).get(el); if (ya) return ya;
        this._element = el;
        this._config = asignar({ autohide: datosBool(el.getAttribute('data-bs-autohide'), true), delay: +(el.getAttribute('data-bs-delay') || 5000) }, cfg || {});
        instanciasDe(BsToast).set(el, this);
    }
    BsToast.prototype.show = function ()
    {
        var el = this._element, self = this;
        if (bsEvento(el, 'show.bs.toast', undefined).defaultPrevented) return;
        el.classList.remove('hide'); el.classList.add('show');
        bsEvento(el, 'shown.bs.toast', undefined, false);
        clearTimeout(this._t);
        if (this._config.autohide) this._t = setTimeout(function () { self.hide(); }, this._config.delay);
    };
    BsToast.prototype.hide = function ()
    {
        var el = this._element;
        if (!el.classList.contains('show')) return;
        if (bsEvento(el, 'hide.bs.toast', undefined).defaultPrevented) return;
        clearTimeout(this._t);
        el.classList.remove('show'); el.classList.add('hide');
        bsEvento(el, 'hidden.bs.toast', undefined, false);
    };
    BsToast.prototype.isShown = function () { return this._element.classList.contains('show'); };
    BsToast.prototype.dispose = function () { clearTimeout(this._t); instanciasDe(BsToast).delete(this._element); };
    estatico(BsToast);

    // Lo que no se cubre (Popover, Tooltip, Offcanvas, ScrollSpy, Carousel, Button): no truena, avisa una vez.
    function inerte(nombre)
    {
        var avisado = false;
        function C(el) { this._element = elDe(el); if (!avisado) { avisado = true; console.warn('Induxsoft.dialog.bootstrapCompat: bootstrap.' + nombre + ' no está cubierto; no hace nada.'); } instanciasDe(C).set(this._element || {}, this); }
        ['show', 'hide', 'toggle', 'dispose', 'enable', 'disable', 'update', 'setContent', 'next', 'prev', 'cycle', 'pause', 'to', 'refresh'].forEach(function (m) { C.prototype[m] = function () { }; });
        return estatico(C);
    }

    // ---------------------------------------------------------------- delegación de data-bs-*
    function alClic(ev)
    {
        if (!compatActiva()) return;
        var t = ev.target && ev.target.closest ? ev.target : null;
        if (!t) return;
        var tg = t.closest('[data-bs-toggle],[data-bs-dismiss]');
        // Dropdown: cerrar los abiertos al hacer clic fuera (o en un elemento del menú, según autoClose).
        dropAbiertos.slice().forEach(function (x)
        {
            if (tg === x._element) return;
            var dentro = x._menu.contains(t), ac = x._config.autoClose;
            if (ac === false) return;
            if (dentro && (ac === 'outside' || t.closest('form') || !t.closest('.dropdown-item,a,button'))) return;
            if (!dentro && ac === 'inside') return;
            x.hide();
        });
        if (!tg) return;
        var tog = tg.getAttribute('data-bs-toggle'), dis = tg.getAttribute('data-bs-dismiss');
        if (tog === 'modal')
        {
            var m = destinoDe(tg);
            if (!m) return;
            if (tg.tagName === 'A' || tg.tagName === 'AREA') ev.preventDefault();
            Modal.getOrCreateInstance(m).toggle(tg);
        }
        else if (tog === 'tab' || tog === 'pill' || tog === 'list')
        {
            ev.preventDefault();
            Tab.getOrCreateInstance(tg).show();
        }
        else if (tog === 'dropdown')
        {
            ev.preventDefault();
            Dropdown.getOrCreateInstance(tg).toggle();
        }
        else if (tog === 'collapse')
        {
            if (tg.tagName === 'A' || (ev.target.tagName === 'A' && tg.contains(ev.target))) ev.preventDefault();
            destinosDe(tg).forEach(function (x) { Collapse.getOrCreateInstance(x, { toggle: false }).toggle(); });
        }
        else if (dis === 'modal')
        {
            var mm = destinoDe(tg) || tg.closest('.modal');
            var inst = mm && Modal.getInstance(mm);
            if (inst) { if (tg.tagName === 'A') ev.preventDefault(); inst.hide(); }
        }
        else if (dis === 'alert')
        {
            var a = tg.closest('.alert');
            if (a) Alert.getOrCreateInstance(a).close();
        }
        else if (dis === 'toast')
        {
            var to = tg.closest('.toast');
            if (to) BsToast.getOrCreateInstance(to).hide();
        }
    }
    function alTeclaDoc(ev)
    {
        if (!compatActiva() || ev.key !== 'Escape' || !dropAbiertos.length) return;
        var x = dropAbiertos[dropAbiertos.length - 1];
        x.hide(); try { x._element.focus(); } catch (e) { }
    }

    // ---------------------------------------------------------------- puente de jQuery
    function puenteJQuery()
    {
        var $ = w.jQuery;
        if (!$ || !$.fn || !compatActiva()) return false;
        var hecho = false;
        if (!$.fn.modal)
        {
            $.fn.modal = function (accion, rel)
            {
                return this.each(function ()
                {
                    var m = Modal.getOrCreateInstance(this, typeof accion === 'object' ? accion : {});
                    if (typeof accion === 'string') { if (typeof m[accion] !== 'function' || accion.charAt(0) === '_') throw new TypeError('No method named "' + accion + '"'); m[accion](rel); }
                    else if (!accion || accion.show !== false) m.show(rel);
                });
            };
            $.fn.modal.Constructor = Modal;
            hecho = true;
        }
        if (!$.fn.tab)
        {
            $.fn.tab = function (accion) { return this.each(function () { var t = Tab.getOrCreateInstance(this); if (typeof accion === 'string' && typeof t[accion] === 'function') t[accion](); }); };
            $.fn.tab.Constructor = Tab;
            hecho = true;
        }
        return hecho;
    }

    /**
     * bootstrapCompat(): si window.bootstrap no existe, instala window.bootstrap = {Modal, Tab, Dropdown, Collapse,
     * Alert, Toast, …} y la delegación de data-bs-toggle / data-bs-dismiss en document, y el puente de jQuery
     * (.modal/.tab) si jQuery está cargado y no los tiene. Devuelve true si la instaló (o ya estaba), false si
     * Bootstrap ya está cargado (entonces no toca nada).
     */
    function bootstrapCompat()
    {
        if (BS && w.bootstrap === BS) { puenteJQuery(); return true; }
        if (w.bootstrap) return false;
        BS = {
            Modal: Modal, Tab: Tab, Dropdown: Dropdown, Collapse: Collapse, Alert: Alert, Toast: BsToast,
            Popover: inerte('Popover'), Tooltip: inerte('Tooltip'), Offcanvas: inerte('Offcanvas'), ScrollSpy: inerte('ScrollSpy'),
            Carousel: inerte('Carousel'), Button: inerte('Button'),
            _induxsoftCompat: VERSION
        };
        w.bootstrap = BS;
        d.addEventListener('click', alClic, true);
        d.addEventListener('keydown', alTeclaDoc);
        d.addEventListener('focusin', alEnfocar);
        puenteJQuery();
        // jQuery puede cargarse después.
        if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', puenteJQuery);
        w.addEventListener('load', puenteJQuery);
        return true;
    }

    var api = {
        version: VERSION,
        alert: alert,
        confirm: confirm,
        prompt: prompt,
        open: open,
        toast: toast,
        bootstrapCompat: bootstrapCompat,
        get stack() { return abiertos.slice(); },
        texts: TXT
    };
    NS.dialog = api;
    w.InduxsoftDialog = api;
})();
