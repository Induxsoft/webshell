var notiman =
{
    dialogId:"new_notif_modal",
    dialog:null,
    mediaId:"notif_media_list",
    media:null,
    formId:"new_notif_form",
    form:null,
    ff:null,
    initiate:false,
    _config:{},
    _params:{},
    _initialData:{},

    init()
    {
        if (this.initiate) return;

        this.dialog = document.getElementById(this.dialogId);
        this.media = document.getElementById(this.mediaId);
        this.form = document.getElementById(this.formId);
        this.ff = this.form.elements;

        const submit = document.getElementById("btn_send_notif");
        // const targets_container = document.getElementById("targets-container");
        // const targets_combo = document.getElementById("_to");
        // const img = document.getElementById("img");
        // const localimg = document.getElementById("local-img");
        const btn_show_media = document.getElementById("btn_show_media");
        
        this.dialog.addEventListener("shown.bs.modal", () => {
            if (this._params["_program"] === "notiman") return;

            Object.entries(this._initialData).forEach(entry => {
                const [name, value] = entry;
                this.ff[name].value = value;
            });

            let def = this.defdata();
            
            this.ff["title"].value ||= def.title;
            this.ff["href"].value ||= def.href;
        });
        this.dialog.addEventListener("hidden.bs.modal", () => { this.form.reset() });
        // targets_container.addEventListener("click", () => {
        //     targets_combo.hidden = !targets_combo.hidden;
        //     if (!targets_combo.hidden) targets_combo.showPicker();
        // });
        // targets_container.addEventListener("blur", () => { targets_combo.hidden = true; });
        // img.addEventListener("change", (e) => { localimg.value = "" });
        // localimg.addEventListener("change", (e) => {
        //     const input = e.target;
        //     const file = input.files[0];
            
        //     if (input.files.length != 1 || (file?.size ?? 0) < 1) {
        //         input.value = "";
        //         return
        //     }

        //     img.value = file?.name;
        // });
        this.media.onClicking = (data) => { this.ff["img"].value = data.src; }
        btn_show_media.addEventListener("click", () => { this.media.hidden = !this.media.hidden });
        submit?.addEventListener("click", () => { this.send() });

        this.getUsersAndGroups();
        this.getMinis();
        this.initiate = true;
    },

    getUsersAndGroups()
    {
        const opt_gp_groups = document.getElementById("opt-gp-groups");
        const opt_gp_users = document.getElementById("opt-gp-users");
        let url = "/!/dbext/tuser/"
        
        fetch(url).then(response => response.json())
        .then(data => {
            if (data?.message) {
                alert(data.message);
                return
            }

            let groups = data?.grupos ?? [];
            let users = data?.usuarios ?? [];

            opt_gp_groups.innerHTML = "";
            groups.forEach(gpo => {
                const option = document.createElement("option");
                option.value = gpo.groupid;
                option.text = gpo.description;
                option.setAttribute("type","group");

                opt_gp_groups.appendChild(option);
            });

            opt_gp_users.innerHTML = "";
            users.forEach(usr => {
                const option = document.createElement("option");
                option.value = usr.userid;
                option.text = usr.username;
                option.setAttribute("type","user");

                opt_gp_users.appendChild(option);
            });
        })
        .catch(error => alert(error.message ?? JSON.stringify(error)))
    },

    getMinis()
    {
        fetch("/!/webshell/notiman/?_view=get-minis").then(resp => resp.json())
        .then(data => {
            if (data?.message) {
                alert(data.message);
                return;
            }

            this.media.setData(data);
        })
        .catch(error => alert(error.message ?? JSON.stringify(error)))
    },

    getInfo(id)
    {
        const openNotifInfo = function() {
            const notif_info = document.getElementById("notif-info");
            let instance = bootstrap.Offcanvas.getInstance(notif_info);
            if (!instance) instance = new bootstrap.Offcanvas(notif_info);
            instance.show();
        }

        let check0 = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-all" viewBox="0 0 16 16"><path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/></svg>'
        let check1 = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-all text-primary" viewBox="0 0 16 16"><path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z"/></svg>'

        let url = "/!/webshell/notiman/"+id+"/get-info/"
        fetch(url).then(resp => resp.json())
        .then(data => {
            if (data?.message) {
                alert(data.message);
                return;
            }

            const notif_info_message = document.getElementById("notif-info-message");
            const notif_info_users = document.getElementById("notif-info-users");
            
            notif_info_message.innerHTML = data.notif.body;
            notif_info_users.innerHTML = "";
            data.users.forEach(obj => {
                let div = document.createElement("div")
                div.classList.add("d-flex", "justify-content-between", "border-bottom", "mb-1");
                
                div.innerHTML = '<div class="d-flex align-items-center gap-1">'+(obj.readed ? check1 : check0)+'<span>'+obj.username+'</span></div>'
                if (obj.readed) div.innerHTML += '<span>'+obj.readedAt+'</span>';

                notif_info_users.appendChild(div);
            });

            openNotifInfo();
        })
        .catch(error => alert(error.message ?? JSON.stringify(error)))
    },

    defdata()
    {
        const _main_view = document.getElementById("_main_view");
        const _view = _main_view.contentDocument || _main_view.contentWindow.document;

        const v12navbar_title = _view.getElementById("v12FormBar_title");
        let title = (v12navbar_title?.textContent ?? "").trim() || _view.title.trim();
        
        return {
            title: title,
            href: _view.location.href
        }
    },

    vermas(el) {
        const container = el.parentElement;
        if (el.classList.contains("expand")) {
            container.querySelector(".card-text").style.display = "initial";
            container.style.maxHeight = "100%";
            el.textContent = "Contraer";
            el.classList.remove("expand");
        }
        else {
            el.classList.add("expand");
            el.textContent = "Ver mas";
            container.style.maxHeight = "100px";
            container.querySelector(".card-text").style.display = "none";
        }
    },

    dlgins()
    {
        if (!this.initiate) this.init();
        
        let instance = bootstrap.Modal.getInstance(this.dialog);
        if (!instance) instance = new bootstrap.Modal(this.dialog);
        
        return instance;
    },
    showDialog(){this.dlgins().show()},
    closeDialog(){this.dlgins().hide()},

    goto(href,target,event) {
        event.stopPropagation();
        window.open(href,target);
    },

    readed(notifId,event)
    {
        event.stopPropagation();
        event.target.disabled = true;
        
        let endpoint = "/!/webshell/notif/go/"+notifId+"/"
        InduxsoftCrudlModel.InvokeService(endpoint, null,
            (r) => {
                if (r.message) {
                    alert(r.message);
                    event.target.disabled = false;
                    return
                }
                window.location.reload();
            },
            (e) => {
                alert(e.message);
                event.target.disabled = false
            },
            "PUT", false
        );
    },

    send()
    {
        if (!this.initiate) this.init();

        const select = this.ff["_to"];
        let to = []
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            if (!option.selected || !option.value) continue;

            let type = option.getAttribute("type");
            let value = option.value;

            let target = {}
            target[type] = value

            to.push(target);
        }
        
        if (to.length < 1) {
            alert("Es necesario seleccionar al menos un destinatario (`Para`).");
            return
        }

        let isNotiman = (this._params["_program"] === "notiman");
        this.ff["to"].value = JSON.stringify(to);

        InduxsoftCrudlModel.Submit(this.form, {},
            (data) => {
                if (data?.message) {
                    alert(data.message)
                    return;
                }
                this.closeDialog();
                if (isNotiman) top.top_screen.load(data.url_redir);
            }
        );
    }
}