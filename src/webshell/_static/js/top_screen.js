var top_screen =
{
    ik_actions: null,
    btn_navbar_lightning: null,
    iframe_view: null,
    url_notif: '',
    url_notif_go: '',
    requesting: false,
    notif_frq: 60,
    
    init()
    {
        this.ik_actions = document.querySelector('#ik_actions');
        this.btn_navbar_lightning = document.querySelector('#btn_navbar_lightning');
        this.iframe_view = document.querySelector('#_main_view');
        this.language_info = document.querySelector('#language_info');
        
        this.set_ik_action_events();
        this.set_interval_refresh_notifs();
        this.set_loading_operation();

        if (!this.requesting) { this.get_notif(); }
        if (language_info) language_info.textContent = (new Intl.NumberFormat()).resolvedOptions().locale;
    },

    load(url){
        let href = url.toString().trim()
        if (!this.iframe_view || !href) return;
        
        let d = this.iframe_view.contentDocument || this.iframe_view.contentWindow.document;
        d.location.href = href;
    },

    // =============== ACCIONES
    set_ik_action_events()
    {
        if (this.btn_navbar_lightning && this.ik_actions)
        {
            this.btn_navbar_lightning.addEventListener('click', () => this.ik_actions.searchText('',false));
            this.ik_actions.change_event = (data) => { this.select_action(data) }
        }
    },
    select_action(data)
    {
        if (data && this.iframe_view) this.iframe_view.src = data.href;
    },

    // =============== NOTIFICACIONES
    close_notis()
    {
        const notis = document.getElementById("btn_notis")
        let instance = bootstrap.Dropdown.getInstance(notis);
        if (!instance) instance = new bootstrap.Dropdown(notis);

        instance.hide();
    },
    set_interval_refresh_notifs()
    {
        let time = 60;

        if (Number(this.notif_frq) != NaN && Number(this.notif_frq) >= 10){
            time = Number(this.notif_frq);
        }

        setInterval(() => {
            if (!this.requesting) {
                this.get_notif();
            }
        }, (time*1000));
    },
    get_notif()
    {
        let endpoint = this.url_notif;
        this.requesting = true;
        InduxsoftCrudlModel.InvokeService(endpoint, null,
            success => { this.requesting = false; this.print_notif(success) },
            failure => { this.requesting = false; console.log((failure.message??JSON.stringify(failure))); },
            "GET", false
        );
    },
    print_notif(data)
    {
        let containr = document.querySelector('#notis_container');
        let notisnum = document.querySelector('#notis_num');
        let num_text = document.querySelector('#notis_num_text');
        let total_nt = (data.length < 1 ? '' : data.length > 5 ? '+5': data.length).toString();
        let template = `
        <li class="d-flex justify-content-between align-items-center">
            <button class="btn-sm btn-close mx-2 no-shadow" type="button" aria-label="Close" onclick="top_screen.close_notis()"></button>
            <a class="dropdown-item text-end" href="#" onclick="top_screen.load('/!/webshell/notiman/'); top_screen.close_notis();">Administrar</a>
        </li>`;
        
        notisnum.classList.toggle('d-none', (total_nt==''));
        num_text.textContent = total_nt;

        data.forEach(noti => {
            let ver_mas = ``;

            if (noti.href)
            {
                let nwhref = this.url_notif_go + noti.id + "/";
                let target = (noti.target == undefined ? '' : (noti.target==1 ? '_blank': '_self'));
                ver_mas = `<button class="btn btn-sm px-2 btn-link border-primary" title="Navegar hacia la url" onclick="top_screen.go_to('${nwhref}','${target}', event)">Ver más</button>`;
            }

            template += `
                <li>
                    <a class="dropdown-item py-2">
                        <h6 class="notify-title">${noti.title}</h6>
                        <small class="notify-desc mb-2">${noti.body}</small>
                        <div class="notify-controls d-flex gap-2">
                            <button class="btn btn-sm px-2 btn-primary" title="Marcar como leido" onclick="top_screen.set_readed_notify('${noti.id}', event)">Marcar como Leído</button>
                            ${ver_mas}
                        </div>
                    </a>
                </li>
            `;
        });

        containr.innerHTML = template;
    },
    go_to(url, target, event)
    {
        event.stopPropagation();
        window.open(url, target);

        if (target == "_blank")
        {
            event.currentTarget.closest('li').remove();
            setTimeout(()=>{
                this.get_notif();
            }, 5000);
        }
    },
    set_readed_notify(notify_id, event)
    {
        event.stopPropagation();

        let btn = event.currentTarget;
        btn.classList.add('disable-element');

        let endpoint = this.url_notif + notify_id + "/";

        this.requesting = true;
        InduxsoftCrudlModel.InvokeService(endpoint, null,
            success => { this.requesting = false; this.get_notif(); },
            failure => { this.requesting = false; btn.classList.remove('disable-element'); alert('No fue posible marcar la notificación como leída. ' + (failure.message??JSON.stringify(failure))); },
            "POST", false
        );
    },

    // =============== LOADING ANIMATION
    set_loading_operation()
    {
        if (!this.iframe_view) return;
        const loading_line = document.querySelector('#loading_line');
        
        this.iframe_view.onload = () =>
        {    
            //Asegurar que no haya animación
            loading_line.classList.remove('loading');
            
            const f=this.iframe_view.contentWindow.onbeforeunload;
            
            this.iframe_view.contentWindow.onbeforeunload = (e) => 
            {
                if (f)
                {
                    var r=f(e);
                    if (r || e.defaultPrevented) return r;
                }
                //Ahora sí, poner la animación
                loading_line.classList.add('loading');
                WebShell.Panels.Dispose(WebShell.Panels.Const.All);
            }
        }
    },
    showModal:function(idmodal)
	{
		this.getBSModal(idmodal).show();
	},
	hideModal:function(idmodal)
	{
		this.getBSModal(idmodal).hide();
	},
	getBSModal(modalId='')
    {
		modalId=modalId.replace("#","");
        const modalElement = document.getElementById(modalId);

        if(!modalElement)
        {
            console.log("Elemento no definido");
            return;
        }
        const bsModal = bootstrap.Modal.getInstance(modalElement);
        if (!bsModal) return new bootstrap.Modal(modalElement);

        return bsModal;
    },
    alerText:function(idelem,text="",css="",time=5000)
	{
		if(idelem.trim()=="")return;
		var elm=document.querySelector(idelem);
		if(!elm)return;

		var _before_css=elm.style.cssText;
		
		elm.innerHTML=text;
		if(css!="")elm.style.cssText=css;

		setTimeout(function()
		{
			elm.innerHTML="";
			elm.style.cssText=_before_css;
		}, time);
	}
}

document.addEventListener('DOMContentLoaded', ()=>{
    top_screen.init();
});