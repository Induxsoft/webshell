var notiman =
{
    dialogId:"new_notif_modal",
    dialog:null,
    mediaId:"notif_media_list",
    media:null,
    formId:"new_notif_form",
    form:null,
    ff:null,

    init()
    {
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

        submit?.addEventListener("click", () => { this.send() });
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
        btn_show_media.addEventListener("click", () => { this.media.hidden = !this.media.hidden });
        this.media.onClicking = (data) => {
            this.ff["img"].value = data.src;
        }

        this.getUsersAndGroups();
        this.getMinis();
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
                option.value = gpo.goupid;
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

        this.ff["to"].value = JSON.stringify(to);

        InduxsoftCrudlModel.Submit(this.form);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    notiman.init();
});