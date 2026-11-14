/*
    Barra de estado del shell (top_screen.dk, #ws_statusbar; solo se ve en pantalla ancha, >= 992 px).
    Decorativa: no consulta al servidor.
    - «N elementos»: filas de la tabla principal de la vista activa (edit-table dentro de #list_table_container,
      la que genera uie.dbeditable). Usa RowCount y el evento datachange de EdiTable si existen; si no, cuenta
      DataArray. Sin esa tabla no muestra cuenta.
    - MAYÚS y BLOQ NUM: getModifierState en teclado y ratón, también dentro del iframe de la vista (mismo origen;
      se engancha en cada carga). Neutros hasta la primera interacción.
    - Idioma y vista actual: copia de #language_info y #c_view_info del pie (que sigue en móvil).
*/
(function () {
    'use strict';

    var sb, elCount, elCaps, elNum, elLang, elView;
    var tablaActual = null, alCambiar = null, intervalo = null;

    function fmtNum(n) {
        try { return new Intl.NumberFormat().format(n); } catch (e) { return String(n); }
    }

    // ---- MAYÚS / BLOQ NUM
    function leerModificadores(e) {
        if (!e || typeof e.getModifierState !== 'function') return;
        poner(elCaps, e.getModifierState('CapsLock'));
        poner(elNum, e.getModifierState('NumLock'));
    }
    function poner(el, on) {
        if (!el) return;
        var st = on ? 'on' : 'off';
        if (el.getAttribute('data-state') === st) return;
        el.setAttribute('data-state', st);
        var nombre = el === elCaps ? 'Bloq Mayús' : 'Bloq Num';
        el.title = nombre + (on ? ': activado' : ': desactivado');
    }
    function engancharTeclas(doc) {
        if (!doc || doc.__wsStatusbar) return;
        doc.__wsStatusbar = true;
        ['keydown', 'keyup', 'mousedown', 'mousemove'].forEach(function (t) {
            doc.addEventListener(t, leerModificadores, { capture: true, passive: true });
        });
    }

    // ---- Cuenta de elementos de la lista
    function contarFilas(t) {
        if (!t) return null;
        try {
            if (typeof t.RowCount === 'number') return t.RowCount;
            if (typeof t.RowCount === 'function') { var r = t.RowCount(); if (typeof r === 'number') return r; }
            if (Array.isArray(t.DataArray)) return t.DataArray.length;
        } catch (e) { }
        return null;
    }
    function tablaPrincipal(doc) {
        if (!doc) return null;
        return doc.querySelector('#list_table_container edit-table');
    }
    function pintarCuenta() {
        if (!elCount) return;
        var n = contarFilas(tablaActual);
        if (n === null || n === undefined || !tablaActual || !tablaActual.isConnected) {
            elCount.hidden = true;
            elCount.textContent = '';
            return;
        }
        elCount.textContent = fmtNum(n) + (n === 1 ? ' elemento' : ' elementos');
        elCount.hidden = false;
    }
    function soltarTabla() {
        if (tablaActual && alCambiar) {
            try { tablaActual.removeEventListener('datachange', alCambiar); } catch (e) { }
        }
        tablaActual = null;
        if (intervalo) { clearInterval(intervalo); intervalo = null; }
    }
    function vigilarTabla(doc) {
        soltarTabla();
        var t = tablaPrincipal(doc);
        if (!t) { pintarCuenta(); return; }
        tablaActual = t;
        alCambiar = function () { pintarCuenta(); };
        t.addEventListener('datachange', alCambiar);
        pintarCuenta();
        // Respaldo sin la API nueva (y para agrupar/filtrar en el componente): relee cada segundo y medio
        intervalo = setInterval(function () {
            if (!tablaActual || !tablaActual.isConnected) { soltarTabla(); pintarCuenta(); return; }
            pintarCuenta();
        }, 1500);
    }

    // ---- Iframe de la vista
    function alCargarVista(iframe) {
        var doc = null;
        try { doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document); } catch (e) { doc = null; }
        soltarTabla();
        pintarCuenta();
        if (!doc) return;
        engancharTeclas(doc);
        // La tabla se crea al cargar la vista; por si el componente tarda, se busca otra vez un poco después
        vigilarTabla(doc);
        if (!tablaActual) setTimeout(function () { try { vigilarTabla(iframe.contentDocument); } catch (e) { } }, 600);
    }

    // ---- Copias del pie (idioma y vista)
    function copiar(origen, destino) {
        if (!origen || !destino) return;
        var f = function () {
            var t = (origen.textContent || '').trim();
            destino.textContent = t;
            destino.hidden = (t === '');
        };
        f();
        try { new MutationObserver(f).observe(origen, { childList: true, characterData: true, subtree: true }); } catch (e) { }
    }

    function init() {
        sb = document.getElementById('ws_statusbar');
        if (!sb) return;
        elCount = document.getElementById('ws_sb_count');
        elCaps = document.getElementById('ws_sb_caps');
        elNum = document.getElementById('ws_sb_num');
        elLang = document.getElementById('ws_sb_lang');
        elView = document.getElementById('ws_sb_view');

        if (elLang) {
            try { elLang.textContent = (new Intl.NumberFormat()).resolvedOptions().locale; } catch (e) { }
        }
        copiar(document.getElementById('c_view_info'), elView);

        engancharTeclas(document);
        ['left-frame', 'right-frame'].forEach(function (id) {
            var f = document.getElementById(id);
            if (f) f.addEventListener('load', function () { try { engancharTeclas(f.contentDocument); } catch (e) { } });
        });

        var iframe = document.getElementById('_main_view');
        if (iframe) {
            iframe.addEventListener('load', function () { alCargarVista(iframe); });
            // Si la vista ya terminó de cargar antes de este script
            try { if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') alCargarVista(iframe); } catch (e) { }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
