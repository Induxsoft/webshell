document.addEventListener("DOMContentLoaded",()=>{log.init();})

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
        <a class="btn btn-sm btn-adjunto">
            @module_adjunto
            <div>
                <small class="chat-name-adjunto">@name_adjunto</small>
            </div>
        </a>`;
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

        var html=this.HTML_adjunto.replace("@module_adjunto",this.HTML_module_adjunto).replace("@name_adjunto",item.nombre??"");

        log.header_counter.insertAdjacentHTML("beforebegin",html);
        log.count_adjuntos+=1;
        log.ShowContador();
        log.Contador();
        // this.adjuntos.innerHTML+=
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
            html=html.replace("@adjunto",this.HTML_module_adjunto);
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
        
        setTimeout(()=>{log.adjuntos.innerHTML+=`<div></div>`;},300)
        console.log("inicio")
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