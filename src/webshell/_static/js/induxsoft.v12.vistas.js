/*
    webshell: utilerías de vistas de V12 para los paquetes (D79, D80). Antes había dos copias:
    VdVistas (vendesk, vd.vistas.js) e IrqVistas (irq, irq.js); ahora las dos usan esta.
    Se carga con <script src="/$/webshell/js/induxsoft.v12.vistas.js?v=…"> y deja window.V12Vistas.

    - V12Vistas.esc(v): escapa un texto para HTML.
    - V12Vistas.abrirEnModal(url, alCerrar, opciones): abre una ficha en el modal del shell de V12 con
      paneles laterales; al cerrar llama alCerrar (refrescar la tarjeta o la fila). Sin shell, navega a
      la ficha y devuelve false. opciones: { panels: [{lado:'izq'|'der', titulo}], showClose }.
    - V12Vistas.modo(clave) / ponModo(clave, modo) / selector(contenedor, clave, alCambiar, opciones):
      vista en 'tarjetas' (por omisión) o 'tabla', recordada en localStorage con la clave que da el
      paquete (p. ej. 'vendesk.vista.casos.<usuario>'). opciones del selector: { clase, claseBoton }.
    - V12Vistas.tabla(contenedor, id, columnas, datos, opciones): EdiTable de solo lectura con
      agrupación, totales, selector de columnas y diseño guardado. EdiTable pinta las celdas como HTML:
      los textos de los datos se escapan aquí, y alFila recibe la fila original (sin escapar).
      columnas: [{field, caption, align, money, decs, summary ('sum'|'count'|'avg'), fixed, minwidth}].
      opciones: { designKey, groups: [campos], alFila(fila, tr), clase, contador (muestra «N registro(s)») }.
*/
(function (global) {
    'use strict';

    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function shell() {
        try { return (global.top && global.top.WebShell) ? global.top.WebShell : null; }
        catch (e) { return null; }
    }

    var ICONO_TARJETAS = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z"/></svg>';
    var ICONO_TABLA = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-5 0v-3H1v2a1 1 0 0 0 1 1zm-4-4h4V8H1zm0-4h4V4H1zm5-3v3h4V4zm4 4H6v3h4z"/></svg>';

    var V12Vistas = {
        esc: esc,

        abrirEnModal: function (url, alCerrar, opciones) {
            if (!url) return false;
            opciones = opciones || {};
            var ws = shell();
            var cierre = 'url=' + tools.url_encode('javascript:top.WebShell.closeModal();');
            var destino = url + (url.indexOf('?') >= 0 ? '&' : '?') + cierre;
            if (!ws || typeof ws.browseAsModal !== 'function') {
                global.location.href = url;
                return false;
            }
            var P = (ws.Panels && ws.Panels.Const) ? ws.Panels.Const : {};
            var paneles = (opciones.panels || [
                { lado: 'izq', titulo: 'Relacionados' },
                { lado: 'der', titulo: 'Notas' }
            ]).map(function (p) {
                return { panel: p.lado === 'der' ? P.Right : P.Left, title: p.titulo };
            });
            ws.browseAsModal(destino, paneles, typeof alCerrar === 'function' ? alCerrar : function () { },
                { showClose: opciones.showClose === true });
            return true;
        },

        // 'tarjetas' (por omisión) o 'tabla'
        modo: function (clave) {
            try { return localStorage.getItem(clave) === 'tabla' ? 'tabla' : 'tarjetas'; }
            catch (e) { return 'tarjetas'; }
        },
        ponModo: function (clave, modo) {
            try { localStorage.setItem(clave, modo === 'tabla' ? 'tabla' : 'tarjetas'); } catch (e) { }
        },

        // Botones «Tarjetas | Tabla» del mismo alto; alCambiar(modo)
        selector: function (contenedor, clave, alCambiar, opciones) {
            var c = typeof contenedor === 'string' ? document.querySelector(contenedor) : contenedor;
            if (!c) return;
            opciones = opciones || {};
            var self = this;
            var clase = 'v12-selector-vista' + (opciones.clase ? ' ' + opciones.clase : '');
            var claseBoton = 'btn btn-outline-secondary' + (opciones.claseBoton ? ' ' + opciones.claseBoton : '');
            c.innerHTML =
                '<div class="btn-group btn-group-sm ' + clase + '" role="group" aria-label="Ver como">' +
                '<button type="button" class="' + claseBoton + '" data-modo="tarjetas" title="Ver como tarjetas">' +
                ICONO_TARJETAS + '<span class="d-none d-md-inline ms-1">Tarjetas</span></button>' +
                '<button type="button" class="' + claseBoton + '" data-modo="tabla" title="Ver como tabla">' +
                ICONO_TABLA + '<span class="d-none d-md-inline ms-1">Tabla</span></button>' +
                '</div>';
            var marcar = function (m) {
                c.querySelectorAll('button[data-modo]').forEach(function (b) {
                    var on = b.getAttribute('data-modo') === m;
                    b.classList.toggle('active', on);
                    b.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
            };
            marcar(this.modo(clave));
            c.querySelectorAll('button[data-modo]').forEach(function (b) {
                b.addEventListener('click', function () {
                    var m = b.getAttribute('data-modo');
                    self.ponModo(clave, m);
                    marcar(m);
                    if (typeof alCambiar === 'function') alCambiar(m);
                });
            });
        },

        tabla: function (contenedor, id, columnas, datos, opciones) {
            var c = typeof contenedor === 'string' ? document.querySelector(contenedor) : contenedor;
            if (!c) return null;
            opciones = opciones || {};
            var ths = columnas.map(function (col) {
                var a = ' type="NoEditable" field="' + esc(col.field) + '"';
                if (col.align) a += ' textalign="' + esc(col.align) + '"';
                if (col.money || col.decs != null) {
                    a += ' format="true" thousandssep="true" decs="' + esc(col.decs != null ? col.decs : 2) + '"';
                    if (col.money) a += ' prefix="$"';
                }
                if (col.summary) a += ' summary="' + esc(col.summary) + '"';
                if (col.fixed) a += ' fixed="' + esc(col.fixed) + '"';
                if (col.minwidth) a += ' minwidth="' + esc(col.minwidth) + '"';
                return '<edit-th' + a + '>' + esc(col.caption) + '</edit-th>';
            }).join('');
            var filas = datos || [];
            var attrs = ' id="' + esc(id) + '" style="width:100%;" hidde-selector="true" cards-mode="never"' +
                ' group-panel="true" column-chooser="true"' +
                (opciones.designKey ? ' design-key="' + esc(opciones.designKey) + '"' : '');
            c.innerHTML = '<div class="v12-tabla' + (opciones.clase ? ' ' + esc(opciones.clase) : '') + '"><edit-table' + attrs +
                '><edit-thead><edit-tr>' + ths + '</edit-tr></edit-thead></edit-table>' +
                (opciones.contador ? '<small class="text-secondary d-block mt-1">' + filas.length + ' registro(s)</small>' : '') +
                '</div>';
            var t = c.querySelector('edit-table');
            var intentos = 0;
            // El componente arma su tabla interna al conectarse; se reintenta hasta que esté lista
            var pintar = function () {
                try {
                    if (typeof opciones.alFila === 'function') {
                        // onTdPaint se llama por celda al dibujar la tabla (EdiTable); el clic abre la ficha
                        t.onTdPaint = function (td, idx) {
                            if (!td || td.__v12Fila) return;
                            td.__v12Fila = true;
                            td.style.cursor = 'pointer';
                            td.addEventListener('click', function () {
                                var fila = (t.DataArray || [])[idx];
                                if (fila) opciones.alFila(fila.__orig || fila, td.closest ? td.closest('tr') : null);
                            });
                        };
                    }
                    t.DataArray = filas.map(function (r) {
                        var o = {};
                        Object.keys(r).forEach(function (k) { o[k] = typeof r[k] === 'string' ? esc(r[k]) : r[k]; });
                        o.__orig = r;
                        return o;
                    });
                    if (typeof t._printRows === 'function') t._printRows();
                } catch (e) {
                    if (++intentos < 40) { setTimeout(pintar, 50); return; }
                    throw e;
                }
                if (opciones.groups && opciones.groups.length && typeof t.GroupBy === 'function') {
                    setTimeout(function () {
                        if (!(t.getGroups && t.getGroups().length)) t.GroupBy(opciones.groups);
                    }, 50);
                }
            };
            if (global.customElements && global.customElements.whenDefined) {
                global.customElements.whenDefined('edit-table').then(function () { setTimeout(pintar, 0); });
            } else {
                setTimeout(pintar, 0);
            }
            return t;
        }
    };

    global.V12Vistas = V12Vistas;
})(window);
