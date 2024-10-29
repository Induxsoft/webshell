document.addEventListener("DOMContentLoaded",()=>{log.init();})

window.addEventListener("resize", function(event) {
    log.AddHTML(log.header_counter,`<div class="d-none"></div>`);
    log.CalculeContador();
}, true);

var log=
{
    init()
    {
        this.endpoint="";
        this.adjuntos=document.getElementById("adjuntos");
        this.body_chat=document.getElementById("body-chat");
        this.txt_message=document.getElementById("txt-message");
        this.btn_send=document.getElementById("btn-send");
        this.adjunto=document.getElementById("adjunto");
        this.header_counter=document.getElementById("header-counter");
        this.counter_text=document.getElementById("counter-text");
        this.media_list=document.getElementById("media-list");
        if(this.media_list)this.media_list.onClicking=data=>
        {
            log.SelectedElement(data);
        }
        this.last_log = 0;
        this.HTML_module_receptor=`<div class="d-flex justify-content-start module_receptor">
            <div class="body-chat-receptor">
                <div class="chat">@adjunto 
                    <div>@module_adjunto @message</div>
                </div>
                <small class="user">@user</small>
                <small class="fecha-hour d-flex">@fecha_hora</small>
            </div>
        </div>`;

        this.HTML_module_emisor=`
        <div class="d-flex justify-content-end module_emisor">
            <div class="body-chat-emisor">
                <div class="chat">@adjunto 
                    <div>@module_adjunto @message</div>
                </div>
                <small class="user">@user</small>
                <small class="fecha-hour d-flex">@fecha_hora</small>
            </div>
        </div>`;

        this.HTML_adjunto=`
        <a class="btn btn-sm btn-adjunto" href="@url" target="_blank">
            @module_adjunto
            <div>
                <small class="chat-name-adjunto">@name_adjunto</small>
            </div>
        </a>`;
        this.HTML_redir_chat=`<a href="@url" target="_blank">@html</a>`;
        this.HTML_module_adjunto=`<div class="chat-div-adjunto"></div>`
        this.HTML_name_adjunto=`<small class="chat-name-adjunto">@name_adjunto</small>`;

        if(this.btn_send)this.btn_send.addEventListener("click",()=>{log.SendMessage();});
        if(this.adjunto)this.adjunto.addEventListener("change",()=>{log.SendFile();})
        if(this.txt_message)this.txt_message.addEventListener("keydown",(e)=>{if(e.keyCode ===13)log.SendMessage();});

        if(this.data && this.data.length>0)this.CreateBodyChat(this.data);
        if(this.body_chat)
        {
            setInterval(() => 
            {
                log.GetMessages();
            }, 2000);
        }
        this.ObserveScroll();
        log.CalculeContador();
    },
    SendMessage()
    {
        if(this.txt_message.value.trim()=="")
        {
            this.txt_message.focus();
            return;
        }
        var data=
        {
            text:this.txt_message.value
        }
        this.InvokeService("POST",data,
            (data)=>
            {
                log.txt_message.value="";
                // console.log(data);
            });
    },
    SendFile()
    {
        if(this.adjunto.value.trim()=="")return;
        
        if(this.adjunto.files.length<1)
        {
            alert("No hay adjuntos por enviar")
            return;
        }
        var data=new FormData();
        data.append("text",this.txt_message.value);

        for (let i = 0; i < this.adjunto.files.length; i++) 
        {
            const file = this.adjunto.files[i];
            data.append(file.name,file);
        }
        this.endpoint=this.url_root_current;
        this.InvokeService("POST",data,
            (data)=>
            {
                this.adjunto.value="";
                console.log(data);
            },null,true);
    },
    DeleteMessage(msgid)
    {
        this.InvokeService("DELETE",null,
            (data)=>
            {
                console.log(data);
            });
    },
    GetMessages()
    {
        this.endpoint="";
        this.endpoint+="?from="+(Number(this.last_log) + 1);
        this.InvokeService("GET",null,
            (data)=>
            {
                if(data.data)log.CreateBodyChat(data.data);
                if(data.adjuntos)log.CreateBodyAdjuntos(data.adjuntos);

            },(failure)=>{console.log(failure.message??JSON.stringify(failure))});
    },
    CreateBodyAdjuntos(data)
    {
        if(!data || data.length<1)return;
        for (let i = 0; i < data.length; i++) 
        {
            const item = data[i];
            this.CreateItemAdjunto(item);
        }
    },
    CreateItemAdjunto(item)
    {
        if(!item || !this.adjuntos)return;
        
        var html=this.HTML_adjunto.replace("@module_adjunto",this.HTML_module_adjunto).replace("@name_adjunto",item.nombre??"").replace("@url",log.url_download_adjuntos.replace("@id",item.id??""));

        this.AddHTML(log.header_counter,html);
        log.count_adjuntos+=1;
        log.ShowContador();
        log.Contador();
    },
    AddHTML(element,html)
    {
        if(!element)return;

        element.insertAdjacentHTML("beforebegin",html);
    },
    CreateBodyChat(data)
    {
        if(!data || data.length<1)return;
        for (let i = 0; i < data.length; i++) 
        {
            const item = data[i];
            this.CreateItemChat(item);
        }
    },
    CreateItemChat(row)
    {
        if(!row || !this.body_chat)return;
        
        var html="";
        if(row.usuario==log.current_user) html=this.HTML_module_emisor;
        else  html=this.HTML_module_receptor;
        let nota=row.nota??"";
        // if(nota.trim()=="")nota=row.archivo??"";
        
        html=html.replace("@message",nota).replace("@user",row.usuario).replace("@fecha_hora",row.fecha_hora??"");
        if((row.archivo??"")!="")
        {
            let r=this.HTML_redir_chat.replace("@url",log.url_download_adjuntos.replace("@id",row.idarchivo??"")).replace("@html",this.HTML_module_adjunto);
            html=html.replace("@adjunto",r);
            html=html.replace("@module_adjunto",this.HTML_name_adjunto.replace("@name_adjunto",row.archivo))
        }
        else
        {
            html=html.replace("@adjunto","");
            html=html.replace("@module_adjunto","");
        }

        this.body_chat.innerHTML+=html;

        if(Number(row.sys_pk??0)>this.last_log)this.last_log=Number(row.sys_pk??0);
    },
    ObserveScroll()
    {
        if(!this.adjuntos)return;

        // Lista de propiedades a observar
        var cambiosaobservar = {childList: true, attributes : true };

        // Funcion que se ejecuta cuando se notifica la mutación
        var callback = function(mutations) 
        {
            // Comprobar overflow en el elemento
            log.ShowContador();
        };

        // Crear el observador con la función que ha de ejecutar
        var observador = new MutationObserver(callback);

        // Observar el elemento
        observador.observe(this.adjuntos, cambiosaobservar);
        
        setTimeout(
            ()=>
            {
                log.AddHTML(log.header_counter,`<div class="d-none"></div>`);
            },300)
    },
    ShowContador()
    {
        var header_counter=document.getElementById("header-counter");
        log.header_counter=header_counter;
        if (log.adjuntos.scrollWidth  > log.adjuntos.clientWidth ) 
        { 
            if(header_counter)
            {
                header_counter.classList.remove("d-none");
                log.Contador();
            }
        }else if(header_counter)header_counter.classList.add("d-none");
    },
    Contador()
    {
        log.counter_text=document.getElementById("counter-text");
        if(log.counter_text)log.counter_text.innerHTML=log.count_adjuntos+"+";
    },
    CalculeContador()
    {
        var ch=document.getElementById("card-header");
        
        var l=log.adjuntos?.querySelectorAll("a");
        if(!l)return ;
        
        var lng=l.length - 1;
        var w=ch.offsetWidth;
        var c=0;
        for (let i = 0; i < lng; i++) 
        {
            const element = l[i];
            w-=element.offsetWidth;
            if(w>0.01)c++;
            else
            {
                break;
            };
        }
        c=lng-c;
        log.count_adjuntos=c;
        this.ShowContador();
    },
    data_preview:null,
	SelectedElement(data)
	{
		this.data_preview=this.getDataById(data.__internal_id__);
	},
	Download()
	{
		var data=this.data_preview;
		if(!data)
		{
			alert("Debe seleccionar un elemento");
			return;
		}
		let url=this.url_download_adjuntos.replace("@id",data.id??"");
		window.open(url,"_blank");
	},
    getDataById(id)
	{
		var data= this.media_list.getData(false).find(e=>e.__internal_id__==id);
		data["index"]= this.media_list.getData(false).findIndex(e=>e.__internal_id__==id);
		return data;
	},
    InvokeService(method,values=null,callbak_succes=null,callbak_failed=null,formdata=false)
    {
        InduxsoftCrudlModel.InvokeService(this.endpoint, values, 
            success => { 
                if(callbak_succes)callbak_succes(success);
            },
            failure => 
            { 
                if(callbak_failed)callbak_failed(failure);
                else alert('Error:\n' + failure.message??JSON.stringify(failure)) 
            },
            method, false,true,"",formdata
        );
    }
}