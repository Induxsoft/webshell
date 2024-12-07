var fpage =
{
    formId:"", form:null, ff:null,
    url_search_users:"", url_search_groups:"", url_search_shortcuts:"",
    
    init()
    {
        this.form = document.getElementById(this.formId);
        this.ff = this.form.elements;

        const btn_submit = document.getElementById("btn-submit");
        const type = document.getElementById("type");
        const shorttype = document.getElementById("shortcut_type");
        const shortinfo = document.getElementById("shortcut-info");
        const ik_usrgpo = document.getElementById("ik_usrgpo");
        const ik_shortcut = document.getElementById("ik_shortcut");
        const div_relevance = document.getElementById("div_relevance");
        
        type.addEventListener("change", (e) => {
            ik_usrgpo.clear();
            if (e.target.value == "groupid") div_relevance.hidden = false;
            else {
                div_relevance.hidden = true;
                this.ff["relevance"].value = 0;
            }
        });
        
        shorttype.addEventListener("change", (e) => {
            this.ff["shortcut"].value = "";
            this.ff["href"].value = "";
            ik_shortcut.clear();

            if (e.target.value == "choose") {
                shortinfo.hidden = true;
                ik_shortcut.hidden = false;
                ik_shortcut.setAttribute("required",true);
                this.ff["href"].required = false;
            }
            else {
                shortinfo.hidden = false;
                ik_shortcut.hidden = true;
                ik_shortcut.setAttribute("required",false);
                this.ff["href"].required = true;
            }
        });

        ik_usrgpo.onBeforeSearch = (s) => {
            let endpoint = ""
            switch (type.value) {
                case "userid":
                    endpoint = this.url_search_users;
                    break;
                case "groupid":
                    endpoint = this.url_search_groups;
                    break;
                default:
                    endpoint = this.url_search_users;
                    console.warn("Tipo no definido, se usará 'Tipo:Usuario' en su lugar.");
                    break;
            }
            return endpoint.replace("@search",s);
        }

        ik_shortcut.change_event = (data) => {
            this.ff["shortcut"].value = data?.id ?? "";
            this.ff["href"].value = data?.src ?? "";
        }

        btn_submit.addEventListener("click", () => {
            if (shorttype.value == "choose" && (!this.ff["shortcut"].value || !this.ff["href"].value)) {
                alert("Es necesario indicar el acceso");
                return
            }
    
            InduxsoftCrudlModel.Submit(this.form);
        });
    }
}