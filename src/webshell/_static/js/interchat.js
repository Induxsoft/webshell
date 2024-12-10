document.addEventListener("DOMContentLoaded",()=>{interchat.init();})

var interchat=
{
    endpoint:"",
    array:[],
    last_log:0,
    intervalGetChat:true,
    interval:null,
    url_bitacora:"",
    _DET:"",
    init()
    {
        this.btn_add_topic=document.getElementById("btn_add_topic");
        this.btn_add_interchat=document.getElementById("btn_add_interchat");
        this.module_interchat=document.getElementById("module-interchat");
        this.iframe_interchat=document.getElementById("iframe-interchat");
        this.usuario=document.getElementById("usuario");
        this.list_user=document.getElementById("list_user");

        if(this.btn_add_topic)this.btn_add_topic.addEventListener("click",()=>{interchat.OpenModal();});
        if(this.btn_add_interchat)this.btn_add_interchat.addEventListener("click",()=>{interchat.SaveTopic();});

        this.item_HTML=`<div class="interchat-item pt-2 pe-2 ps-2" onclick="interchat.InterChatSelected('${interchat._DET}','@guid')" id="interchat-@guid">
                            <div class="d-flex align-items-center">
                                <div class="interchat-img">
                                    <p>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
                                            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"></path>
                                        </svg>
                                    </p>
                                </div>
                                
                                <h5 class="ms-2">@title</h5>

                                <div class="flex-grow-1 d-flex justify-content-end">
                                    <button class="border-0 me-2" onclick="interchat.OpenModalUser(event,'@guid');">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill-add" viewBox="0 0 16 16">
                                            <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                                            <path d="M2 13c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4"/>
                                        </svg>
                                    </button>
                                    <small>@fecha</small>
                                </div>                                
                            </div>
                            <hr class="p-0 m-0" id="div_@guid">
                        </div>`;

        if(this.module_interchat)this.module_interchat.innerHTML="";
        if(this.usuario)this.usuario.addEventListener("change",()=>{interchat.AddUser();});

        this.PrintChat(this.array);
        this.StartInterval();
        
    },
    chatInternalSeleted:null,
    AddUser()
    {
        if(!this.usuario)return;

        var user=this.usuario.getValue();
        if(!user || Object.keys(user).length<1)return;

        const add = (data) => 
        {
            const select = interchat.list_user;
            const option = document.createElement("option");
            option.value = data.sys_pk;
            option.text = data.username;

            select.appendChild(option);
        }
        add(user);
        this.usuario.setValue({});
    },
    OpenModalUser(e,guid)
    {
        if(e)
        {
            e.stopPropagation();
        }
        this.chatInternalSeleted=guid;
        tools.showModal("modal_topic_add_user");
    },
    RemoveClassSelected()
    {
        if(!this.module_interchat)return;

        var elements=this.module_interchat.querySelectorAll("hr");
        for (let i = 0; i < elements.length; i++) 
        {
            const element = elements[i];
            if(element)
            {
                element.classList.remove("div-selected");
                if(element.parentNode)element.parentNode.classList.remove("interchat-selected");
            }
        }
    },
    InterChatSelected(det,guid)
    {
        if(!this.iframe_interchat || this.url_bitacora.trim()=="")return;

        this.RemoveClassSelected();

        var divisor=document.getElementById("div_"+guid);
        if(divisor)
        {
            divisor.classList.add("div-selected");
            if(divisor.parentElement)divisor.parentElement.classList.add("interchat-selected");
        }

        let url_src=this.url_bitacora.replace("@det",det).replace("@guid",guid);
        this.iframe_interchat.src=url_src;
    },
    StartInterval()
    {
        if(this.module_interchat && this.intervalGetChat)
        {
            this.interval=setInterval(() => 
            {
                interchat.GetMessages();
            }, interchat.time_load_bitacora);
        }
    },
    ClearInterval()
    {
        if(!this.interval)return;

        this.intervalGetChat=false;
        clearInterval(this.interval);
    },
    PrintChat(array)
    {
        if(!this.module_interchat)
        {
            console.warn("No hay un elemento interchat");
            return;
        }

        for (let i = 0; i < array.length; i++) 
        {
            const element = array[i];
            interchat.PrintItemChat(element);
        }
    },

    ChatActivas()
    {
        if(!this.module_interchat)return;

        this.intervalGetChat=true;
        this.module_interchat.innerHTML="";
        this.last_log=0;
        interchat.GetMessages();
        this.StartInterval();
    },
    ChatArchivadas()
    {
        if(!this.module_interchat)return;

        this.intervalGetChat=false;
        this.ClearInterval();
        this.module_interchat.innerHTML="";
        this.last_log=0;
        this.GetMessages("&close=true");
    },
    PrintItemChat(row)
    {
        if(!this.intervalGetChat)return;

        var html=this.item_HTML.replace("@title",row.title??"").replace("@fecha",row.fecha??"").replaceAll("@guid",row.sys_guid??"");
        this.module_interchat.insertAdjacentHTML("afterbegin",html);

        if(Number(row.sys_pk??0)>this.last_log)this.last_log=Number(row.sys_pk??0);
    },
    GetMessages(params="")
    {
        this.endpoint="";
        this.endpoint+="?from="+(Number(this.last_log) + 1)+params;
        
        this.InvokeService("GET",null,
            (data)=>
            {
                interchat.PrintChat(data);
            },(failure)=>{console.log(failure.message??JSON.stringify(failure))});
    },
    fields(idmodal,act,idalert="",array={},idelements="input,textarea,select")
    {
        var data={}
        var element=document.querySelector(idmodal);
        if(!element)return data;

        var elements=element.querySelectorAll(idelements);

        for (let i = 0; i < elements.length; i++) 
        {
            const element = elements[i];
            if(element)
            {
                var name=element.name.trim()=="" ? (element.id??""): element.name;
                var required=element.getAttribute("required");
                var message=element.getAttribute("alert")??"El campo "+name+" es requerido";

                switch (act) 
                {
                    case "set":
                        element.value=array[name] ?? "";
                        data[name]=array[name]??"";
                        break;
                    case "clear":
                        element.value="";
                    break;
                    default:
                        
                        if(tools.ParseBool(required) && element.value.trim()=="")
                        {
                            if(idalert.trim()!="")
                            {
                                interchat.alerText(idalert,message);
                                return false;
                            }
                            alert(message);
                            return false;
                        }
                        
                        data[name]=element.value;
                        break;
                }
            }
        }
        return data;
    },
    OpenModal()
    {
        tools.showModal("modal_topic_main");
    },
    SaveTopic()
    {
        var data=this.fields("#modal_topic_main","","#lbl_alert_interchat");
        if(!data || Object.keys(data).length<1)return;

        this.InvokeService("POST",data,
            (data)=>
            {
                tools.hideModalModal("modal_topic_main");
                this.fields("#modal_topic_main","clear");
            });
    },
    alerText:function(idelem,text="",css="",time=5000)
	{
		if(idelem.trim()=="")return;
		var elm=document.querySelector(idelem);
		if(!elm)return;

		var _before_css=elm.style.cssText;
		
		elm.innerHTML=text;
		if(css!="")elm.style.cssText=css;

		setTimeout(function()
		{
			elm.innerHTML="";
			elm.style.cssText=_before_css;
		}, time);
	},
    InvokeService(method,values=null,callbak_succes=null,callbak_failed=null,formdata=false)
    {
        InduxsoftCrudlModel.InvokeService(this.endpoint, values, 
            success => 
            { 
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