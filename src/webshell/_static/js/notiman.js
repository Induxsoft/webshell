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
    elems_controls_check:null,
    elems_controls_buttons:null,
    init()
    {
        if (this.initiate) return;

        this.dialog = document.getElementById(this.dialogId);
        this.media = document.getElementById(this.mediaId);
        this.form = document.getElementById(this.formId);
        this.usr_group=document.getElementById("usr_group");
        this.select_urg_grp=document.getElementById("select_urg_grp");
        this._to=document.getElementById("_to");
        this._end=document.getElementById("end");
        this._start=document.getElementById("start");
        this.select_vigencia=document.getElementById("select_vigencia");
        this.check_repetir=document.getElementById("check_repetir");
        this.controls_check=document.getElementById("controls_check");
        this.controls_buttons=document.getElementById("controls_buttons");
        this._intervalo=document.getElementById("intervalo");
        this.cant_veces=document.getElementById("cant_veces");


        if(this.controls_check)this.elems_controls_check=this.controls_check.querySelectorAll("input[type='checkbox']");
        if(this.controls_buttons)this.elems_controls_buttons=this.controls_buttons.querySelectorAll("button");
        this.ff = this.form.elements;

        const submit = document.getElementById("btn_send_notif");
        // const targets_container = document.getElementById("targets-container");
        // const targets_combo = document.getElementById("_to");
        // const img = document.getElementById("img");
        // const localimg = document.getElementById("local-img");
        const btn_copy_link = document.getElementById("btn_copy_link");
        const btn_show_media = document.getElementById("btn_show_media");
        
        this.dialog.addEventListener("shown.bs.modal", () => {
            if (this._params["_program"] === "notiman") return;

            Object.entries(this._initialData).forEach(entry => {
                const [name, value] = entry;
                this.ff[name].value = value;
            });

            let def = this.defdata();
            
            this.ff["title"].value ||= def.title;
            this.ff["href"].value ||= def.go;
        });
        this.dialog.addEventListener("hidden.bs.modal", () => 
        { 
            this.form.reset() 
            tools.trigger(this.check_repetir,"change");
            this.PintButton();
        });
      
        this.media.onClicking = (data) => { this.ff["img"].value = data.src; }
        btn_copy_link.addEventListener("click", () => {
            const url = this.ff["href"].value;
            navigator.clipboard.writeText(url)
            .then(() => { console.log("Se copio el enlace al portapapeles.") })
            .catch(() => { alert("Error al copiar el enlace al portapapeles.") });
        });
        btn_show_media.addEventListener("click", () => { this.media.hidden = !this.media.hidden });
        submit?.addEventListener("click", () => { this.send() });

        this.getMinis();
        this.initiate = true;

        if(this.usr_group)this.usr_group.onBeforeSearch=(surl)=>
        {
            if(!this.select_urg_grp)return;

            return surl.replace("@_get",this.select_urg_grp.value??"");
        }

        if(this.select_urg_grp)this.select_urg_grp.addEventListener("change",()=>
        {
            if(this.usr_group)this.usr_group.setValue({});
            if(this._to)
            {
                this.DelPara(false);
                this._to.value="";
            }
        });
        if(this.check_repetir)this.check_repetir.addEventListener("change",()=>
        {
            if(this.controls_check)
            {
                this.DisabledElements(this.elems_controls_check,!this.check_repetir.checked);
            }

            if(this.controls_buttons)
            {
                this.DisabledElements(this.elems_controls_buttons,!this.check_repetir.checked);
            }
        });

        if(this.select_vigencia)this.select_vigencia.addEventListener("change",()=>
        {
            if(!this._end)return;

            this._end.setAttribute("readonly",true);
            this._end.removeAttribute("required");
            this._end.value="";
            if(Number(this.select_vigencia.value)==99 )
            {
                this._end.removeAttribute("readonly");
                this._end.setAttribute("required",true);
            }
        });

        if(this._intervalo)this._intervalo.addEventListener("change",()=>
        {
            if(!this.cant_veces)return;

            this.cant_veces.setAttribute("readonly",true);
            this.cant_veces.value=0;

            if(Number(this._intervalo.value)==1)
            {
                this.cant_veces.value=1;
                this.cant_veces.removeAttribute("readonly");
            }
        });
    },
    GetElements(elm="check")
    {
        var repetir=[]
        if(elm!="check")
        {
            if(this.buttonClicked)repetir.push(this.buttonClicked.value);
        }
        else
        {
            for (let i = 0; i < this.elems_controls_check.length; i++) 
            {
                const element = this.elems_controls_check[i];
                if(element && element.checked)repetir.push(element.value);   
            }
        }
        return repetir;
    },
    DisabledElements(elements,disabled)
    {
        if(!elements)return;
        
        this.buttonClicked=null;
        for (let i = 0; i < elements.length; i++) 
        {
            const element = elements[i];
            if(element)
            {
                if(element.type=="checkbox")element.checked=false;
                element.disabled=disabled;
            }
        }
    },
    PintButton()
    {
        if(!this.elems_controls_buttons)return;

        for (let i = 0; i < this.elems_controls_buttons.length; i++) 
        {
            const element = this.elems_controls_buttons[i];
            if(element)element.classList.remove("paint-button");
        }
        
        if(this.buttonClicked)this.buttonClicked.classList.add("paint-button");
    },
    buttonClicked:null,
    RepeatButton(btn,check=false)
    {   
        if(check)
        {
            this.DisabledElements(this.elems_controls_buttons,false);
        }
        else
        {
            this.DisabledElements(this.elems_controls_check,false);
            this.buttonClicked=btn;
        }
        this.PintButton();
    },
    addOption(element,row,value="sys_pk",text="name")
    {
        const option = document.createElement("option");
        option.value = row[value];
        option.text = row[text] + (row?.isadmin? " - [Admin]":"");
        option.setAttribute("_id","item_"+(row[value]??""));
        option.setAttribute("isgroup",(row?.isgroup));

        element.appendChild(option);
    },
    DelPara(showalert=true)
    {
        let usr=0;
        Array.from(this._to).forEach(opt => 
        {
            if(showalert && opt.selected)
            {
                opt.remove();
                usr=1;
                return;
            }
            else{opt.remove();}
        });

        if(showalert && usr<1)
        {
            alert("Debe seleccionar un usuario o grupo");
        }
    },
    AddPara()
    {
        if(!this._to)return;
        if(!this.usr_group)return;

        let row=this.usr_group.getValue();
        if(!row || Object.keys(row).length<1)
        {
            alert("Debe seleccionar un usuario o grupo");
            return;
        }

        row["isgroup"]=this.select_urg_grp?.value=="group";

        this.addOption(this._to,row);
        this.usr_group.setValue({});
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
        let href = _view.location.href;
        
        return {
            title: title,
            href: href,
            go: href.split("!")[0] +"?go="+ tools.url_encode(href)
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

        Array.from(select).forEach(opt => 
        {
            let value = opt.value;
            let isgroup=tools.ParseBool(opt.getAttribute("isgroup"));
            let target = 
            {
                isgroup:isgroup
            };

            if(isgroup)target["group"]=value;
            else target["user"]=value;

            to.push(target);
        });
        
        if (to.length < 1) 
        {
            alert("Es necesario seleccionar al menos un destinatario (`Para`).");
            return
        }
        if(this._end.value.trim()!="")
        {
            let end=new Date(this._end.value);
            let start=new Date(this._start.value);

            if(end < start)
            {
                alert("La fecha de la vigencia no puede ser menor a la fecha de inicio");
                return;
            }
        }
        var repetir=this.GetElements();
        if(repetir.length<1)repetir=this.GetElements("button");
        var details=
        {
            // _repetir:this.check_repetir.checked,
            // _vigencia:this.select_vigencia.value,
            // _unafecha:this._end.value??"",
            arrayrep:repetir
        }

        let isNotiman = (this._params["_program"] === "notiman");
        this.ff["to"].value = JSON.stringify(to);

        InduxsoftCrudlModel.Submit(this.form, details,
            (data) => {
                if (data?.message) {
                    alert(data.message)
                    return;
                }
                this.closeDialog();
                if (isNotiman) top.top_screen.load(data.url_redir);
            }
        );
    },
    Delete(sys_pk)
    {
        if(!confirm("¿Esta seguro de eliminar la notificación programada?"))return;

        let endpoint = "/!/webshell/notiman/"+sys_pk+"/delete-notif/"
        InduxsoftCrudlModel.InvokeService(endpoint, null,
            (r) => 
            {
                window.location.reload();
            },
            (e) => 
            {
                alert(e.message);
            },
            "DELETE", false
        );
    }
}