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
        this.last_log = 0;
        this.HTML_module_receptor=`<div class="d-flex justify-content-start module_receptor">
            <div id="body-chat-receptor">
                <div class="chat">@message</div>
                <small class="user">@user</small>
                <small class="fecha-hour d-flex">@fecha_hora</small>
            </div>
        </div>`;

        this.HTML_module_emisor=`
        <div class="d-flex justify-content-end module_emisor">
            <div id="body-chat-emisor">
                <div class="chat">@message</div>
                <small class="user">@user</small>
                <small class="fecha-hour d-flex">@fecha_hora</small>
            </div>
        </div>`;

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
                console.log(data);
            });
    },
    SendFile()
    {
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
        this.InvokeService("POST",data,
            (data)=>
            {
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
        this.endpoint+="?from="+this.last_log + 1;
        this.InvokeService("GET",null,
            (data)=>
            {
                if(!data)return;
                log.CreateBodyChat(data);

            },(failure)=>{console.log(failure.message??JSON.stringify(failure))});
    },
    CreateBodyChat(data)
    {
        if(!data || data.length<1)return;
        for (let i = 0; i < data.length; i++) 
        {
            const row = data[i];
            this.CreateRowChat(row);
        }
    },
    CreateRowChat(row)
    {
        if(!row || !this.body_chat)return;
        
        var html="";
        if(row.usuario==log.current_user) html=this.HTML_module_emisor;
        else  html=this.HTML_module_receptor;

        html=html.replace("@message",row.nota??"").replace("@user",row.usuario).replace("@fecha_hora",row.fecha_hora??"");

        this.body_chat.innerHTML+=html;
        this.last_log=Number(row.sys_pk??0);
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