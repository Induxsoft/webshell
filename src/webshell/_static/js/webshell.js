const WebShell =
{
    mainsec: document.getElementById("main-sec"),

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
            const ElPanels = document.querySelectorAll(p);
            if (ElPanels.length == 0) return;
            
            ElPanels.forEach((panel) => {
                let selector = "#"+panel.id;
                if (this.IsOpen(selector)) {
                    let index = this.Open.indexOf(selector);
                    this.Open.splice(index,1);
                    panel.style.display = "none";
                }
            });
        },
        Show(p,u)
        {
            const ElPanels = document.querySelectorAll(p);
            if (ElPanels.length == 0) return;

            ElPanels.forEach((panel) => {
                const frame = panel.querySelector("iframe");
                let selector = "#"+panel.id;
                let direction = panel.getAttribute("direction");

                if (!this.IsAvailable(selector))
                {
                    this.Available.push(selector);

                    const OpenTab = document.getElementById(`webshell-open-${direction}-panel`);
                    const CloseTab = document.getElementById(`webshell-close-${direction}-panel`);
                    const TabTitle = document.getElementById(`webshell-${direction}-tab-content`);
                    const HeaderTitle = document.getElementById(`webshell-${direction}-panel-header-title`);
                    
                    frame.src = u;
                    
                    frame.onload = () => {
                        let title = frame.contentDocument.title;
                        
                        TabTitle.textContent = title;
                        HeaderTitle.textContent = title;

                        OpenTab.addEventListener("click", () => {
                            this.Show(selector);
                            OpenTab.hidden = true;
                        });
                        CloseTab.addEventListener("click", () => {
                            this.Hide(selector);
                            OpenTab.hidden = false;
                        });
                        
                        WebShell.setAdjustPanelEvent(`adjust-${direction}-panel`,direction);
                        if (!WebShell.IsMobile()) panel.style.display = "flex";
                        else OpenTab.hidden = false;
                        this.Open.push(selector);
                    }
                }
                else
                {
                    this.Open.push(p);
                    panel.style.display = "flex";
                }
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

    IsMobile(){ return (document.body.offsetWidth <= 360); }
}

// WebShell.Panels.Show(WebShell.Panels.Const.Right,"https://v12demo1.induxsoft.net/!/webshell/log/FFFFFE/@/");
document.getElementById("_main_view").contentWindow.onunload = function(e) {
    WebShell.Panels.Hide(WebShell.Panels.Const.All);
}