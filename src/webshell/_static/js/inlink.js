var inlink =
{
    type:{},
    params:{},
    actions:[],
    select:null,

    init()
    {
        this.type.key = this.params?.key;
        this.type.trace = this.params?.trace;
        this.ik_select = document.getElementById("ik-select");
        
        if (this.ik_select) this.ik_select.change_event = (data) => this.create(data);
    },

    actionCreate(id)
    {},

    actionSelect(id)
    {
        if (!id) {
            console.warn("No se proporciono un 'id'.");
            return
        }
        if (!this.ik_select) {
            console.warn("No es encontro el elemento <input-key>");
            return
        }

        let url = `/!/webshell/inlink/?ita=${id}&search=@search`;
        this.select = this.actions.find(o => o.id == id);

        this.ik_select.setAttribute("data-source",url);
        this.ik_select.setAttribute("data-key",this.select?.select_keyfield);
        this.ik_select.setAttribute("data-search",this.select?.select_searchfield);
        this.ik_select.setAttribute("data-text",this.select?.select_textfield);
        this.ik_select.searchText("",false);
    },

    replaceMacros(text,params)
    {
        for (const key in params) {
            text = text.replaceAll(`@${key}`,params[key]);
        }
        return text;
    },

    create(data)
    {
        if (!data) return;

        let endpoint = "/!/webshell/inlink/"
        let payload =
        {
            inlink_type: this.params.inlink_type,
            det1: this.type?.det,
            det2: this.select?.det,
            key1: this.type?.key,
            key2: data[this.select?.select_keyfield],
            endpoint1: this.replaceMacros((this.type?.link ?? "").replace("@key",this.type?.key),this.params),
            endpoint2: this.replaceMacros((this.select?.select_link ?? "").replace("@key",data[this.select?.select_keyfield]),this.params),
            trace1: this.type?.trace,
            trace2: this.replaceMacros(this.select?.select_trace,data)
        };

        const onSuccess = (d) => {
            if (d.message) {
                alert(d.message);
                return
            }
            window.location.reload();
        }

        const onFailure = (e) => {
            if (e.message) alert(e.message);
            else console.error(e);
        }

        InduxsoftCrudlModel.InvokeService(endpoint,payload,onSuccess,onFailure,"POST",false);
    },

    update()
    {},

    delete(id)
    {},
}

document.addEventListener("DOMContentLoaded", () => { inlink.init() });