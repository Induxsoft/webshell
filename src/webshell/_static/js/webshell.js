const WebShell =
{
    mainsec: document.getElementById("main-sec"),

    Panels:{
        Const:{
            Top:"#webshell-top-panel",
            Left:"#webshell-left-panel",
            Right:"#webshell-right-panel",
            Bottom:"#webshell-bottom-panel",
            All:"[id^='webshell-'][id$='-panel']"
        },

        IsOpen(p){},
        IsAvailable(p){},
        Hide(p){},
        Show(p,u)
        {
            const ElPanels = document.querySelectorAll(p);
            if (ElPanels.length == 0) return;

            ElPanels.forEach((panel) => {
                const frame = panel.querySelector("iframe");
                const fdocument = frame.contentDocument || frame.contentWindow.document;
                let direction = panel.getAttribute("direction");

                frame.src = u;
                panel.style.display = "flex";
                WebShell.setAdjustPanelEvent(`adjust-${direction}-panel`,direction);
                
                /* fdocument.addEventListener("DOMContentLoaded", () => {
                    panel.style.display = "flex";
                    WebShell.setAdjustPanelEvent(`adjust-${direction}-panel`,direction);
                }); */
            });
        }
    },

    setAdjustPanelEvent(lineId, direction) {
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
            if (panel) panel.style.transition = '.5s';
            panel = undefined;
            pageX = undefined;
            pageY = undefined;
            panelWidth = undefined;
            panelHeight = undefined;
            WebShell.mainsec.style.zIndex = "";
        }
    },

    IsMobile(){}
}