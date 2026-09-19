var WebShell =
{
    mainsec: document.getElementById("main-sec"),

    Notif:
    {
        Send(){ notiman.showDialog() }
    },

    Panels:
    {
        Const:{
            Top:"#webshell-top-panel",
            Left:"#webshell-left-panel",
            Right:"#webshell-right-panel",
            Bottom:"#webshell-bottom-panel",
            All:"[id^='webshell-'][id$='-panel']"
        },
        Available:[],
        Open:[],

        IsOpen(p){ return this.Open.includes(p); },
        IsAvailable(p){ return this.Available.includes(p); },
        Hide(p)
        {
            const ElPanels = document.querySelectorAll("section"+p);
            if (ElPanels.length == 0) return;
            
            ElPanels.forEach((panel) => {
                let selector = "#"+panel.id;
                let direction = panel.getAttribute("direction");

                if (this.IsOpen(selector)) {
                    const OpenTab = document.getElementById(`webshell-open-${direction}-panel`);
                    
                    this.Open.splice(this.Open.indexOf(selector),1);
                    panel.style.display = "none";
                    OpenTab.hidden = false;
                }
            });
        },
        Show(p,u,t="")
        {
            // SI la navegación como modal esta activo.
            if (WebShell.showingModal)
            {
                // Navegar a la url como pestaña en el iframe recuperado.
                const frame = WebShell.tabsAsPanels[p];
                if (!frame) return;
                frame.src = u;
                return;
            }

            const ElPanels = document.querySelectorAll("section"+p);
            if (ElPanels.length == 0) return;

            ElPanels.forEach((panel) => {
                const frame = panel.querySelector("iframe");
                let selector = "#"+panel.id;
                let direction = panel.getAttribute("direction");

                const OpenTab = document.getElementById(`webshell-open-${direction}-panel`);

                if (!this.IsAvailable(selector))
                {
                    this.Available.push(selector);

                    const CloseTab = document.getElementById(`webshell-close-${direction}-panel`);
                    const TabTitle = document.getElementById(`webshell-${direction}-tab-content`);
                    const HeaderTitle = document.getElementById(`webshell-${direction}-panel-header-title`);
                   
                    frame.src = u;
                    
                    frame.onload = () => 
                    {
                        if (!frame.src || frame.src == "about:blank") return;
                        let title = frame.contentDocument?.title??"";
                        if (t) title = t;

                        TabTitle.textContent = title;
                        HeaderTitle.textContent = title;

                        OpenTab.addEventListener("click", () => this.Show(selector));
                        CloseTab.addEventListener("click", () => this.Hide(selector));
                        
                        WebShell.setAdjustPanelEvent(`adjust-${direction}-panel`,direction);
                        if (WebShell.IsMobile()) OpenTab.hidden = false;
                        else {
                            this.Open.push(selector);
                            OpenTab.hidden = true;
                            panel.style.display = "flex";
                        }
                    }
                }
                else
                {
                    this.Open.push(selector);
                    if(OpenTab)OpenTab.hidden = true;
                    panel.style.display = "flex";
                }
            });
        },
        Dispose(p)
        {
            const ElPanels = document.querySelectorAll("section"+p);
            if (ElPanels.length == 0) return;
            
            ElPanels.forEach((panel) => {
                const frame = panel.querySelector("iframe");
                let selector = "#"+panel.id;
                let direction = panel.getAttribute("direction");

                const OpenTab = document.getElementById(`webshell-open-${direction}-panel`);
                // const CloseTab = document.getElementById(`webshell-close-${direction}-panel`);
                const TabTitle = document.getElementById(`webshell-${direction}-tab-content`);
                const HeaderTitle = document.getElementById(`webshell-${direction}-panel-header-title`);
                
                if (this.IsOpen(selector)) this.Open.splice(this.Open.indexOf(selector),1);
                if (this.IsAvailable(selector)) this.Available.splice(this.Available.indexOf(selector),1);
                
                if (TabTitle) TabTitle.textContent = "Abrir panel";
                if (HeaderTitle) HeaderTitle.textContent = "";
                if (OpenTab) OpenTab.hidden = true;
                if (frame) frame.src = "about:blank";
                panel.style.display = "none";
            });
        }
    },

    setAdjustPanelEvent(lineId, direction) 
    {
        if (!lineId || !direction) return;
        const line = document.getElementById(lineId);
        if (!line) return;
        let pageX, pageY, panel, panelWidth, panelHeight;
            
        line.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
        }
        line.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            panel = e.target.parentElement;
            panel.style.transition = 'none';
            pageX = e.pageX;
            panelWidth = panel.offsetWidth;
            pageY = e.pageY;
            panelHeight = panel.offsetHeight;
            panel.style.zIndex = "-1";
            WebShell.mainsec.style.zIndex = "-1";
        }
        document.onmousemove = (e) => {
            e.stopPropagation();
            if (!panel) return;

            let diffX = (e.pageX - pageX);
            let diffY = (e.pageY - pageY);
            
            switch (direction) {
                case "top":
                    panel.style.height = (panelHeight + diffY) + 'px';
                    break;
                case "left":
                    panel.style.width = (panelWidth + diffX) + 'px';
                    break;
                case "right":
                    panel.style.width = (panelWidth - diffX) + 'px';
                    break;
                case "bottom":
                    panel.style.height = (panelHeight - diffY) + 'px';
                    break;
            }
        }
        document.onmouseup = (e) => {
            e.stopPropagation();
            if (panel) { 
                panel.style.transition = '.5s';
                panel.style.zIndex = "";
            }
            panel = undefined;
            pageX = undefined;
            pageY = undefined;
            panelWidth = undefined;
            panelHeight = undefined;
            WebShell.mainsec.style.zIndex = "";
        }
    },

    IsMobile(){ return (document.body.offsetWidth <= 450); }
}

/*
 * WebShell.browseAsModal(u, p, f, o)
 *   u : URL del iframe principal (la página que se muestra como diálogo)
 *   p : panel o arreglo de paneles  [{panel:"top|right|left|bottom", title:"..."}]
 *       Cada panel se convierte en una pestaña del modal; su iframe nace en
 *       about:blank y lo navegan las mismas funciones que hoy llenan los paneles.
 *   f : callback al cerrar, recibe el resultado pasado a closeModal(result)
 *   o : opciones {showClose:true|false, title:"Título de la pestaña principal"}
 *
 * Propiedades que establece: showingModal, tabsAsPanels, mainModalIframe
 * Cierre: botón rojo (si showClose) o WebShell.closeModal(result)
 *         (desde un iframe: parent.WebShell.closeModal(result))
 */

WebShell.showingModal = false;
WebShell.tabsAsPanels = {};
WebShell.mainModalIframe = null;
WebShell._modal = null;

WebShell._injectModalStyles = function () {
  if (document.getElementById("ws-modal-styles")) return;
  var css =
    ".ws-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center}" +
    ".ws-modal{width:calc(100vw - 40px);height:calc(100vh - 40px);background:#dcdcdc;padding:0 16px 8px;box-sizing:border-box;display:flex;flex-direction:column}" +
    ".ws-modal-header{display:flex;align-items:flex-end;gap:4px;min-height:34px;padding-top:6px}" +
    ".ws-modal-tab{background:#b0ff7a;border:0;padding:6px 14px;cursor:pointer;font:inherit;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".ws-modal-tab.ws-active{background:#fff;font-weight:600}" +
    ".ws-modal-tab:focus-visible,.ws-modal-close:focus-visible{outline:2px solid #333;outline-offset:2px}" +
    ".ws-modal-close{margin-left:auto;width:24px;height:24px;background:#cc3333;border:0;color:#fff;cursor:pointer;font-size:16px;line-height:24px;align-self:center}" +
    ".ws-modal-body{position:relative;flex:1;background:#fff;overflow:hidden}" +
    /* Todos los iframes apilados al 100 %; los inactivos se ocultan con visibility
       (no display:none) para que su contenido conserve dimensiones reales. */
    ".ws-modal-body iframe{position:absolute;inset:0;width:100%;height:100%;border:0;visibility:hidden;pointer-events:none}" +
    ".ws-modal-body iframe.ws-active{visibility:visible;pointer-events:auto}";
  var st = document.createElement("style");
  st.id = "ws-modal-styles";
  st.textContent = css;
  document.head.appendChild(st);
};

WebShell.browseAsModal = function (u, p, f, o) {
  if (this.showingModal) return false; // un solo modal a la vez
  o = Object.assign({ showClose: true, title: "" }, o || {});
  var panels = !p ? [] : Array.isArray(p) ? p : [p];
  var self = this;

  this._injectModalStyles();

  var backdrop = document.createElement("div");
  backdrop.className = "ws-modal-backdrop";

  var modal = document.createElement("div");
  modal.className = "ws-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  var header = document.createElement("div");
  header.className = "ws-modal-header";
  header.setAttribute("role", "tablist");

  var body = document.createElement("div");
  body.className = "ws-modal-body";

  var frames = {};     // "main" + posiciones
  var tabButtons = {};

  function addTab(key, title, src) {
    var ifr = document.createElement("iframe");
    ifr.src = src;
    ifr.title = title;
    body.appendChild(ifr);
    frames[key] = ifr;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ws-modal-tab";
    btn.setAttribute("role", "tab");
    btn.textContent = title;
    btn.title = title;
    btn.addEventListener("click", function () { self.showModalTab(key); });
    header.appendChild(btn);
    tabButtons[key] = btn;
    return ifr;
  }

  var main = addTab("main", o.title || "Principal", u);

  var tabs = {};
  panels.forEach(function (pn) {
    var pos = String(pn.panel || "").toLowerCase();
    if (/* !/^(top|right|left|bottom)$/.test(pos) || */tabs[pos]) return; // uno por posición
    tabs[pos] = addTab(pos, pn.title || pos, "about:blank");
  });

  // Sin paneles ni título no hay pestañas que mostrar: se oculta la del principal
  if (!panels.length && !o.title) tabButtons.main.style.display = "none";

  if (o.showClose) {
    var close = document.createElement("button");
    close.type = "button";
    close.className = "ws-modal-close";
    close.setAttribute("aria-label", "Cerrar");
    close.textContent = "\u00d7";
    close.addEventListener("click", function () { self.closeModal(); });
    header.appendChild(close);
  }

  modal.appendChild(header);
  modal.appendChild(body);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  this._modal = { backdrop: backdrop, callback: f, frames: frames, tabButtons: tabButtons, active: null };
  this.showingModal = true;
  this.tabsAsPanels = tabs;
  this.mainModalIframe = main;
  this.showModalTab("main");
  return true;
};

// Activa una pestaña del modal: "main" o una posición ("left", "right", ...)
WebShell.showModalTab = function (key) {
  if (!this.showingModal || !this._modal) return false;
  var m = this._modal;
  if (!m.frames[key]) return false;
  Object.keys(m.frames).forEach(function (k) {
    var on = k === key;
    m.frames[k].classList.toggle("ws-active", on);
    m.tabButtons[k].classList.toggle("ws-active", on);
    m.tabButtons[k].setAttribute("aria-selected", on ? "true" : "false");
  });
  m.active = key;
  return true;
};

WebShell.closeModal = function (result) {
  if (!this.showingModal || !this._modal) return;
  var m = this._modal;

  // Liberar recursos: descargar cada documento antes de retirar el nodo
  Object.keys(m.frames).forEach(function (k) {
    var ifr = m.frames[k];
    try { ifr.src = "about:blank"; } catch (e) {}
    if (ifr.parentNode) ifr.parentNode.removeChild(ifr);
  });
  if (m.backdrop.parentNode) m.backdrop.parentNode.removeChild(m.backdrop);

  this.showingModal = false;
  this.tabsAsPanels = {};
  this.mainModalIframe = null;
  this._modal = null;

  if (typeof m.callback === "function") {
    try { m.callback(result); } catch (e) { console.error(e); }
  }
};

window.WebShell = WebShell;