/*
    webshell.escritorio.js — V12 «escritorio» (propuesta, maqueta del 2026-11-13)
    Lo carga webshell/_lib/head.dk en todas las vistas. No requiere nada de los paquetes salvo las marcas que se indican.

    1. Filtros adicionales en un menú.
       Marca en el paquete: el div que agrupa los filtros secundarios lleva la clase  v12-filtros-mas.
       El script lo oculta, lo mete en un menú desplegable «Filtros» con la cuenta de filtros activos y coloca el
       botón al inicio del renglón del buscador (<filter-text>) del mismo formulario; si no hay buscador, el botón
       queda donde estaba el div. Los controles no salen del <form>, así que el envío no cambia.
       Filtro activo: un <select> con un valor que no sea negativo ni vacío (las opciones especiales de uie.dbSelect
       son negativas; data-neutro lo cambia) y un campo con nombre cuyo valor no es '', '-1' ni '0'.

    2. Agrupación inicial de listas (provisional, hasta que EdiTable lo traiga como atributo propio).
       Marca en el paquete: <edit-table group-by="campo1,campo2">  (uie.dbeditable lo escribe con @"group-by").
       Al cargar, en pantalla ancha y si el usuario no tiene grupos guardados en su diseño, la tabla se agrupa por esos
       campos (en vertical la tabla se ve en tarjetas y los grupos estorban).

    3. Constantes de catálogo en los <select>: se muestran traducidas (cFactura → Factura); el valor no cambia.
    4. Acción principal de la barra (Crear / Agregar / Nuevo, o data-principal) resaltada.
*/
(function () {
    'use strict';

    var ICONO_FILTRO = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2z"/></svg>';
    var ICONO_FLECHA = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg>';
    var NEUTROS = ['', '-1', '0', 'null'];

    // ---- 1. Menú de filtros
    // Etiqueta corta a partir del title que ya traen los filtros: «Filtrar por vendedor» → «Vendedor»
    function etiqueta(el) {
        var t = (el.getAttribute('title') || el.getAttribute('box-title-text') || '').replace(/\s*\(.*\)\s*$/, '');
        t = t.replace(/^\s*filtrar\s+(por\s+)?/i, '').trim();
        return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
    }
    // Valor sin filtro: el de data-neutro si lo trae; si no, en V12 las opciones especiales de uie.dbSelect tienen valor
    // negativo («(Vendedores)» -1, «Vigentes» -2: el predeterminado del paquete), o la primera opción
    function esNeutro(s, neutro) {
        if (s.hasAttribute('data-neutro')) return s.value === neutro;
        var v = String(s.value).trim();
        if (v === '' || (!isNaN(Number(v)) && Number(v) < 0)) return true;
        return v === neutro;
    }
    function activos(panel) {
        var lista = [];
        panel.querySelectorAll('select').forEach(function (s) {
            if (!s.options.length) return;
            var neutro = s.hasAttribute('data-neutro') ? s.getAttribute('data-neutro') : s.options[0].value;
            if (esNeutro(s, neutro)) return;
            lista.push({ etq: etiqueta(s), val: (s.options[s.selectedIndex] || {}).text || s.value,
                quitar: function () { s.value = neutro; s.dispatchEvent(new Event('change', { bubbles: true })); } });
        });
        panel.querySelectorAll('input[name]').forEach(function (i) {
            if (i.type === 'checkbox' || i.type === 'radio') {
                if (i.checked) lista.push({ etq: etiqueta(i), val: 'sí', quitar: function () { i.checked = false; i.dispatchEvent(new Event('change', { bubbles: true })); } });
                return;
            }
            if (i.name === 'null' || NEUTROS.indexOf(String(i.value).trim()) >= 0) return;
            var ik = i.parentElement && i.parentElement.querySelector('input-key');
            var val = ik && ik.getAttribute('data-value');
            try { var o = JSON.parse(val || '{}'); val = o.nombre || o.text || o.codigo || ''; } catch (e) { val = ''; }
            lista.push({ etq: etiqueta(ik || i), val: val || i.value,
                quitar: function () { i.value = '-1'; var f = i.form; if (f) f.submit(); } });
        });
        return lista;
    }

    function menuFiltros(panel) {
        if (panel.dataset.v12Menu) return;
        panel.dataset.v12Menu = '1';
        var form = panel.closest('form') || document;

        var menu = document.createElement('div');
        menu.className = 'v12-filtros-menu';
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn btn-sm btn-outline-secondary v12-filtros-btn';
        boton.setAttribute('aria-haspopup', 'true');
        boton.setAttribute('aria-expanded', 'false');
        boton.innerHTML = ICONO_FILTRO + '<span class="v12-filtros-txt">Filtros</span><span class="v12-filtros-n" hidden></span>' + ICONO_FLECHA;
        menu.appendChild(boton);

        // Dónde va el botón: al inicio del renglón del buscador del mismo formulario
        var buscador = form.querySelector('filter-text');
        var renglonBuscador = buscador ? buscador.closest('.flex-grow-1') || buscador : null;
        var renglonPanel = panel.parentElement;
        if (renglonBuscador && renglonBuscador.parentElement) renglonBuscador.parentElement.insertBefore(menu, renglonBuscador);
        else panel.parentElement.insertBefore(menu, panel);
        menu.appendChild(panel);
        panel.classList.add('v12-filtros-panel');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Filtros adicionales');
        // El renglón que solo tenía los filtros (y el botón móvil de antes) se queda vacío: se oculta
        if (renglonPanel && renglonPanel !== menu.parentElement && !renglonPanel.querySelector('select, input-key, filter-text, input:not([type=hidden])'))
            renglonPanel.classList.add('v12-vacio');

        // Cada filtro del panel con su etiqueta arriba
        Array.prototype.forEach.call(panel.children, function (celda) {
            var c = celda.querySelector('select, input-key, input:not([type=hidden])');
            if (!c || celda.querySelector('.v12-etq')) return;
            var t = etiqueta(c);
            if (!t) return;
            // Sin etiqueta si repite el texto de la primera opción («Todos los tipos» sobre «Todos los tipos»)
            if (c.tagName === 'SELECT' && c.options.length && c.options[0].text.trim().toLowerCase() === t.toLowerCase()) return;
            var l = document.createElement('span');
            l.className = 'v12-etq'; l.textContent = t;
            celda.insertBefore(l, celda.firstChild);
        });

        // Chips de los filtros activos, junto al botón (en ancho)
        var chips = document.createElement('div');
        chips.className = 'v12-filtros-chips';
        menu.parentElement.insertBefore(chips, menu.nextSibling);

        function pintarCuenta() {
            var a = activos(panel);
            var n = boton.querySelector('.v12-filtros-n');
            n.textContent = a.length;
            n.hidden = a.length === 0;
            boton.classList.toggle('v12-con-filtros', a.length > 0);
            boton.title = a.length ? 'Filtros activos:\n' + a.map(function (x) { return x.etq + ': ' + x.val; }).join('\n') : 'Filtros adicionales';
            chips.textContent = '';
            a.forEach(function (x) {
                var c = document.createElement('span');
                c.className = 'v12-chip';
                c.title = x.etq + ': ' + x.val;
                var b = document.createElement('b'); b.textContent = x.val; c.appendChild(b);
                var q = document.createElement('button');
                q.type = 'button'; q.textContent = '\u00D7'; q.title = 'Quitar el filtro ' + x.etq.toLowerCase(); q.setAttribute('aria-label', q.title);
                q.addEventListener('click', function (e) { e.stopPropagation(); x.quitar(); });
                c.appendChild(q);
                chips.appendChild(c);
            });
        }
        function abrir(si) {
            menu.classList.toggle('abierto', si);
            boton.setAttribute('aria-expanded', si ? 'true' : 'false');
            if (si) {
                // Que el panel no se salga por la derecha
                panel.style.left = '0'; panel.style.right = 'auto';
                var r = panel.getBoundingClientRect();
                if (r.right > window.innerWidth - 8) { panel.style.left = 'auto'; panel.style.right = '0'; }
                var primero = panel.querySelector('select, input:not([type=hidden]), input-key, button');
                if (primero && primero.focus) primero.focus();
            }
        }
        boton.addEventListener('click', function (e) { e.stopPropagation(); abrir(!menu.classList.contains('abierto')); });
        document.addEventListener('click', function (e) {
            if (!menu.classList.contains('abierto')) return;
            if (menu.contains(e.target)) return;
            // Las ventanas de búsqueda de input-key se abren fuera del panel: no cerrar mientras estén abiertas
            if (e.target.closest && e.target.closest('.modal, dialog, [role=dialog]:not(.v12-filtros-panel)')) return;
            abrir(false);
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('abierto')) { abrir(false); boton.focus(); } });
        panel.addEventListener('change', pintarCuenta);
        pintarCuenta();
        setTimeout(pintarCuenta, 500);   // input-key termina de pintarse después
    }

    // ---- 2. Agrupación inicial
    function agruparInicial(t) {
        var campos = (t.getAttribute('group-by') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!campos.length || typeof t.GroupBy !== 'function') return;
        if (!window.matchMedia('(min-width: 992px)').matches) return;   // en vertical la tabla va en tarjetas: sin grupos
        if (typeof t.getGroups === 'function' && t.getGroups().length) return;   // el usuario ya tiene su agrupación
        t.GroupBy(campos);
    }

    // ---- 3. Constantes de catálogo en las listas de opciones: cVentas_de_escritorio → «Ventas de escritorio»
    //      (solo el texto que se ve; el valor que se envía no cambia)
    var RX_CONST = /^c[A-ZÁÉÍÓÚÑ][A-Za-z0-9_ÁÉÍÓÚÑáéíóúñÜü]*$/;
    function constTexto(t) {
        if (!RX_CONST.test(t)) return t;
        var r = t.slice(1).replace(/_/g, ' ');
        return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
    }
    function traducirOpciones(raiz) {
        (raiz || document).querySelectorAll('select option').forEach(function (o) {
            var t = (o.textContent || '').trim();
            if (RX_CONST.test(t)) o.textContent = constTexto(t);
        });
    }

    // ---- 4. Acción principal: el botón Crear / Agregar / Nuevo de la barra de la vista (uie.printV12FormBar), o el que
    //      el paquete marque con data-principal; se resalta con .v12-accion-principal (webshell.escritorio.css)
    var RX_PRINCIPAL = /^\s*(crear|agregar|nuev[oa]|alta|registrar)\b/i;
    function accionPrincipal() {
        var barra = document.getElementById('v12FormBar_content') || document.getElementById('top_area');
        if (!barra) return;
        var b = barra.querySelector('.btn-main-action[data-principal]');
        if (!b) b = Array.prototype.filter.call(barra.querySelectorAll('a.btn-main-action, button.btn-main-action'), function (x) {
            return RX_PRINCIPAL.test(x.textContent || '');
        })[0];
        if (b) b.classList.add('v12-accion-principal');
    }

    function iniciar() {
        traducirOpciones(document);
        accionPrincipal();
        document.querySelectorAll('.v12-filtros-mas').forEach(menuFiltros);
        var tablas = document.querySelectorAll('edit-table[group-by]');
        if (tablas.length && window.customElements) {
            customElements.whenDefined('edit-table').then(function () {
                requestAnimationFrame(function () { tablas.forEach(agruparInicial); });
            });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();
