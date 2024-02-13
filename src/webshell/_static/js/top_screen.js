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
        this.set_ik_action_events();
        this.set_interval_refresh_notifs();
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
        let template = ``;
        let containr = document.querySelector('#notis_container');
        let notisnum = document.querySelector('#notis_num');
        let num_text = document.querySelector('#notis_num_text');
        let total_nt = (data.length < 1 ? '' : data.length > 5 ? '+5': data.length).toString();
        
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
}

document.addEventListener('DOMContentLoaded', ()=>{
    top_screen.init();
});