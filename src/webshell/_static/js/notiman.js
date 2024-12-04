var notiman =
{
    dialogId:"new_notif_modal",
    dialog:null,
    formId:"new_notif_form",
    form:null,
    ff:null,

    init()
    {
        this.dialog = document.getElementById(this.dialogId);
        this.form = document.getElementById(this.formId);
        this.ff = this.form.elements;

        const submit = document.getElementById("btn_send_notif");
        submit?.addEventListener("click", () => { this.send() });

        this.getUsersAndGroups();
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

        InduxsoftCrudlModel.Submit(this.form, {}, null, null, {redir:false});
    }
}

document.addEventListener("DOMContentLoaded", () => {
    notiman.init();
});