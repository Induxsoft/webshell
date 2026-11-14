/*
    Script común de las vistas V12 (lo carga webshell/_lib/head.dk en todas las páginas del sitio).
    1. Doble clic / Enter en una lista: el evento rowopen de <edit-table> (lista de solo lectura dentro de
       #list_table_container) activa el botón de la barra de la vista (uie.printV12FormBar) equivalente a
       Detalles/Abrir/Editar. Se usa el mismo botón para respetar permisos y el mismo contexto (fila actual).
       Si no hay ese botón, no hace nada.
    2. Alto de la lista en pantalla ancha (>= 992 px): el contenedor que uie.dbeditable marca con
       data-v12-fit="list" llega hasta abajo de la vista, sin scroll de la página (la tabla tiene su scroll).
*/
(function () {
    'use strict';

    var ANCHO = '(min-width: 992px)';
    var RX_ABRIR = /\b(detalles?|abrir|editar|ver|consultar|modificar)\b/i;
    var RX_NO = /\b(crear|nuev[oa]|agregar|alta|eliminar|borrar|cancelar)\b/i;

    // ---- 1. rowopen → botón Detalles/Abrir/Editar
    function visible(el) {
        if (!el || el.disabled) return false;
        if (el.style && el.style.pointerEvents === 'none') return false;
        if (el.closest('[hidden], .d-none')) return false;
        return true;
    }
    function botonAbrir() {
        var cands = Array.prototype.slice.call(document.querySelectorAll('#v12FormBar_content a.list-action[id^="v12_"], #v12FormBar_content button.list-action[id^="v12_"]'));
        var mejor = null, mejorPeso = -1;
        cands.forEach(function (b) {
            if (!visible(b)) return;
            var texto = ((b.textContent || '') + ' ' + (b.getAttribute('title') || '')).trim();
            var corto = (b.textContent || '').trim();
            if (RX_NO.test(corto)) return;
            if (!RX_ABRIR.test(texto)) return;
            var peso = 1;
            if (/v12-context-act-(1|true)\b/i.test(b.className)) peso += 2;   // requiere la fila seleccionada
            if (RX_ABRIR.test(corto)) peso += 1;
            if (peso > mejorPeso) { mejor = b; mejorPeso = peso; }
        });
        return mejor;
    }
    document.addEventListener('rowopen', function (e) {
        var t = e.target;
        if (!t || !t.closest || !t.closest('#list_table_container')) return;
        var b = botonAbrir();
        if (!b) return;
        b.click();
    });

    // ---- 2. Alto de la lista
    var ajustando = false;
    function ajustar() {
        if (ajustando) return;
        var cont = document.querySelectorAll('[data-v12-fit="list"]');
        if (cont.length !== 1) return;
        var c = cont[0];
        if (!window.matchMedia(ANCHO).matches) {
            if (c.dataset.v12FitOn) { c.style.maxHeight = c.dataset.v12FitOrig || ''; delete c.dataset.v12FitOn; }
            return;
        }
        ajustando = true;
        try {
            if (!c.dataset.v12FitOn) { c.dataset.v12FitOrig = c.style.maxHeight || ''; c.dataset.v12FitOn = '1'; }
            var se = document.scrollingElement || document.documentElement;
            var top = c.getBoundingClientRect().top + se.scrollTop;
            var alto = Math.max(160, Math.floor(window.innerHeight - top - 4));
            c.style.maxHeight = alto + 'px';
            c.style.height = '';
            // Lo que haya debajo (leyenda, pie de impresión, márgenes): se descuenta para que la página no tenga scroll
            var sobra = se.scrollHeight - window.innerHeight;
            if (sobra > 0) {
                alto = Math.max(160, alto - sobra);
                c.style.maxHeight = alto + 'px';
            }
        } finally { ajustando = false; }
    }
    var pendiente = 0;
    function programar() {
        if (pendiente) return;
        pendiente = requestAnimationFrame(function () { pendiente = 0; ajustar(); });
    }
    function iniciarAlto() {
        if (!document.querySelector('[data-v12-fit="list"]')) return;
        ajustar();
        window.addEventListener('resize', programar);
        // La barra y los filtros cambian de alto (plegar filtros, componentes que terminan de pintarse)
        try {
            var ro = new ResizeObserver(programar);
            var top = document.getElementById('top_area');
            if (top) ro.observe(top);
            ro.observe(document.body);
        } catch (e) { }
        setTimeout(ajustar, 300);
        setTimeout(ajustar, 1200);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarAlto);
    else iniciarAlto();
    window.addEventListener('load', ajustar);
})();
