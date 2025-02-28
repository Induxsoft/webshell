document.addEventListener("DOMContentLoaded",()=>{interchat.init();})
window.addEventListener("resize", function(event) 
{
    interchat.MediaQuery(interchat.chatInternalSeleted!=null);
}, true);

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
        this.btn_add_interchat_user=document.getElementById("btn_add_interchat_user");
        this.module_modal_users=document.getElementById("module-modal-users");
        this.module_iframe_interchat=document.getElementById("module-iframe-interchat");
        this.module_header=document.getElementById("module-header");
        this.interchat_init_page=document.getElementById("interchat-init-page");
        this.btn_refresh_topic=document.getElementById("btn_refresh_topic");
        //botones headers chat
        this.h_btn_add_user=document.getElementById("h_btn_add_user");
        this.h_btn_list_user=document.getElementById("h_btn_list_user");
        this.h_btn_close_chat=document.getElementById("h_btn_close_chat");
        this.h_btn_del_chat=document.getElementById("h_btn_del_chat");
        this.hm_btn_del_user=document.getElementById("hm_btn_del_user");
        this.col_1_chat=document.getElementById("col-1-chat");
        this.col_2_chat=document.getElementById("col-2-chat");
        this.card_body_interchat=document.getElementById("card-body-interchat");
        this.btn_media_exit=document.getElementById("btn_media_exit");
        this.module_exit_media=document.getElementById("module_exit_media");
        this.name_chat=document.getElementById("name_chat");
        this.check_admin=document.getElementById("check_admin");
        this.loading_chats=document.getElementById("loading-chats");
        this.div_chat_and_header=document.getElementById("div-chat-and-header");
        //CAMPOS DE ENTRADAS
        this.title=document.getElementById("title");

        this.audio_alert=document.getElementById("audio-alert");
        if(this.title)this.title.addEventListener("keypress",(event)=>
        {
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if(keycode=="13")interchat.SaveTopic();
        });
        if(this.btn_add_topic)this.btn_add_topic.addEventListener("click",()=>{interchat.OpenModal();});
        if(this.btn_add_interchat)this.btn_add_interchat.addEventListener("click",()=>{interchat.SaveTopic();});
        if(this.btn_refresh_topic)this.btn_refresh_topic.addEventListener("click",()=>{interchat.Refresh();});;
        
        this.item_HTML=`<div class="interchat-item pt-2 pe-2 ps-2" onclick="interchat.InterChatSelected('${interchat._DET}','@guid')" id="interchat-@guid">
                            <div class="d-flex align-items-center">
                                <div class="interchat-img">
                                    <p class="m-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" fill="currentColor" class="bi bi-people-fill" viewBox="0 0 16 16">
                                            <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.24 2.24 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.3 6.3 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"></path>
                                        </svg>
                                    </p>
                                </div>
                                
                                <h5 class="ms-2">@title</h5>

                                <div class="flex-grow-1 d-flex justify-content-end">
                                    
                                    <svg class="me-2 notif-chat d-none" id="noti-@guid" xmlns="http://www.w3.org/2000/svg" width="25" height="24" fill="currentColor" class="bi bi-chat" viewBox="0 0 16 16">
                                        <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
                                    </svg>

                                    <small>@fecha</small>
                                </div>                                
                            </div>
                            <hr class="p-0 m-0" id="div_@guid">
                        </div>`;

        if(this.module_interchat)this.module_interchat.innerHTML="";
        // if(this.usuario)this.usuario.addEventListener("change",()=>{});
        if(this.btn_add_interchat_user)this.btn_add_interchat_user.addEventListener("click",()=>{interchat.SaveUsers();});
        
        this.PageInit();

        this.PrintChat(this.array);
        this.StartInterval();

        this.MediaQuery();
    },

    getFooterChat(guid)
    {
        return new Promise((res)=>
        {
            var bitacora=interchat.iframe_interchat;
            if(!bitacora)
            {
                res(null);
                return null;
            }

            var intfooter=setInterval(() => 
            {
                const _view = bitacora.contentDocument || bitacora.contentWindow.document;

                if(!_view)
                {
                    res(null);
                    clearInterval(intfooter);
                    return null;
                }

                var footer=_view.getElementById("chat-footer-"+guid);
                if(footer)
                {
                    res(footer);
                    clearInterval(intfooter);
                    return footer;
                }
            }, 100);
        });
    },
    Refresh()
    {
        window.location.reload();
    },
    PageInit(_module="")
    {
        if(interchat.chatInternalSeleted)return;

        if(this.h_btn_add_user)this.h_btn_add_user.classList.remove("d-none");
        if(this.h_btn_list_user)this.h_btn_list_user.classList.remove("d-none");
        if(this.h_btn_close_chat)this.h_btn_close_chat.classList.remove("d-none");
        if(this.h_btn_del_chat)this.h_btn_del_chat.classList.remove("d-none");
        if(this.hm_btn_del_user)this.hm_btn_del_user.classList.remove("d-none");
        if(this.div_chat_and_header)this.div_chat_and_header.classList.remove("d-none");

        switch (_module) 
        {
            case "activas":
                if(interchat.interchat_init_page)interchat.interchat_init_page.classList.add("d-none");
                // if(interchat.module_header)interchat.module_header.classList.remove("d-none");
                if(interchat.module_iframe_interchat)interchat.module_iframe_interchat.classList.remove("d-none");
                break;
            case "archivadas":
                if(interchat.interchat_init_page)interchat.interchat_init_page.classList.add("d-none");
                // if(interchat.module_header)interchat.module_header.classList.add("d-none");

                if(this.h_btn_add_user)this.h_btn_add_user.classList.add("d-none");
                if(this.h_btn_close_chat)this.h_btn_close_chat.classList.add("d-none");
                if(this.h_btn_del_chat)this.h_btn_del_chat.classList.add("d-none");
                if(this.hm_btn_del_user)this.hm_btn_del_user.classList.add("d-none");


                if(interchat.module_iframe_interchat)interchat.module_iframe_interchat.classList.remove("d-none");
                break;
            default:
                // if(interchat.module_header)interchat.module_header.classList.add("d-none");
                if(interchat.module_iframe_interchat)interchat.module_iframe_interchat.classList.add("d-none");
                if(interchat.interchat_init_page)interchat.interchat_init_page.classList.remove("d-none");

                if(this.h_btn_add_user)this.h_btn_add_user.classList.add("d-none");
                if(this.h_btn_list_user)this.h_btn_list_user.classList.add("d-none");
                if(this.h_btn_close_chat)this.h_btn_close_chat.classList.add("d-none");
                if(this.h_btn_del_chat)this.h_btn_del_chat.classList.add("d-none");
                if(this.hm_btn_del_user)this.hm_btn_del_user.classList.add("d-none");
                if(this.div_chat_and_header)this.div_chat_and_header.classList.add("d-none");
                break;
        }
    },
    chatInternalSeleted:null,
    addOptions(element,data,value="sys_pk",text="username")
    {
        for (let i = 0; i < data.length; i++) 
        {
            const row = data[i];
            interchat.addOption(element,row);
        }
    },
    addOption(element,row,value="sys_pk",text="username")
    {
        const option = document.createElement("option");
        option.value = row[value];
        option.text = row[text] + (row?.isadmin? " - [Admin]":"");
        option.setAttribute("_id","item_"+(row[value]??""));
        option.setAttribute("isadmin",(row?.isadmin));

        element.appendChild(option);
    },
    AddUser()
    {
        if(!this.usuario)return;

        var user=this.usuario.getValue();
        if(!user || Object.keys(user).length<1)
        {
            interchat.alerText("#lbl_alert_interchat_user","Debe selecionar un usuario");
            return;
        }
        user["isadmin"]=this.check_admin?.checked??false;

        interchat.addOption(interchat.list_user,user);
        this.usuario.setValue({});
        if(this.check_admin)this.check_admin.checked=false;
    },
    CloseChat()
    {
        let res=confirm("¿Esta seguro de cerrar la conversación?");
        if(!res)return;

        if(!this.chatInternalSeleted || this.chatInternalSeleted < 1)
        {
            alert("Debe seleccionar una conversación");
            return;
        }

        var data=
        {
            enpoint:`./${this.chatInternalSeleted}/close-interchat/`,
            use_url:true
        }
        var interchat=document.getElementById("interchat-"+this.chatInternalSeleted);
        this.InvokeService("DELETE",data,
        (data)=>
        {
            this.chatInternalSeleted=null;
            this.PageInit();
            if(interchat)interchat.remove();
        });
    },
    DeleteChat()
    {
        let res=confirm("¿Esta seguro de eliminar la conversación?");
        if(!res)return;

        if(!this.chatInternalSeleted || this.chatInternalSeleted < 1)
        {
            alert("Debe seleccionar una conversación");
            return;
        }

        var data=
        {
            enpoint:`./${this.chatInternalSeleted}/del-interchat/`,
            use_url:true
        }
        var interchat=document.getElementById("interchat-"+this.chatInternalSeleted);
        this.InvokeService("DELETE",data,
        (data)=>
        {
            this.chatInternalSeleted=null;
            this.PageInit();
            if(interchat)interchat.remove();
        });
    },
    DeleteUser()
    {
        let list = [];
        let cound_admin=0;
        let show_msg=false;
        Array.from(this.list_user).forEach(opt => 
        {
            let isadmin=tools.ParseBool(opt.getAttribute("isadmin"));
            if(isadmin)cound_admin++;

            if(opt.selected)
            {
                if(this.ArrayUsers)
                {
                    list.push(opt.value);
                    if(isadmin)
                    {
                        cound_admin--;
                        show_msg=true;
                    }
                }
                else
                {
                    opt.remove();
                }
            }
        });
        
        if(!this.ArrayUsers)return

        if(!this.chatInternalSeleted || this.chatInternalSeleted < 1)
        {
            interchat.alerText("#lbl_alert_interchat_user","Debe seleccionar una conversación");
            return;
        }
        if(cound_admin<1 && show_msg)
        {
            interchat.alerText("#lbl_alert_interchat_user","Antes de eliminar el(los) administrador(es) debe elegir otro usuario como administrador");
            return;
        }
        var data=
        {
            users:list,
            enpoint:`./${this.chatInternalSeleted}/del-users/`,
            use_url:true
        }

        this.InvokeService("PUT",data,
        (data)=>
        {
            interchat.QuitOptionSelectUser(interchat.list_user,data);
        });
        
    },
    CheckMessage()
    {
        var list=[];
        var dt={};
        for (let i = 0; i < interchat.array.length; i++) 
        {
            const item = interchat.array[i];

            if((dt[item.sys_pk]??0)<1)
            {
                var obj=
                {
                    chat:item.sys_pk,
                    last_massage:item.last_massage
                }
                list.push(obj);
                dt[item.sys_pk]=item.sys_pk;
            }
        }
        
        if(list.length<1)return;

        var data=
        {
            enpoint:`./all/get-interchat/`,
            use_url:true,
            chats:list
        }

        this.InvokeService("PUT",data,
            (data)=>
            {
                interchat.PrintNotifChat(data);
            },(failed)=>{console.log(failed.message??JSON.stringify(failed));});
    },
    PrintNotifChat(data)
    {
        for (let i = 0; i < data.length; i++) 
        {
            const item = data[i];
            var row=interchat.array.find((r)=>r.sys_pk==item.chat);

            if(!tools.ParseBool(item["exist_user_in_topic"]??false) && row)
            {
                var element_interchat=document.getElementById("interchat-"+row.sys_guid);
                if(element_interchat)element_interchat.remove();
                interchat.chatInternalSeleted=null;
                interchat.PageInit();
            }

            if(row && row.sys_guid!=interchat.chatInternalSeleted && Number(item.last_massage??0) > Number(row.last_massage??0))
            {
                var elem=document.getElementById("noti-"+row.sys_guid);
                if(elem)elem.classList.remove("d-none");
                row.last_massage=item.last_massage;
                interchat.PlayAudio();
            }
            else if(row && interchat.chatInternalSeleted && row.sys_guid==interchat.chatInternalSeleted)
            {
                row.last_massage=item.last_massage;
            }
        }
    },
    PlayAudio()
    {
        // if(interchat.audio_alert)interchat.audio_alert.play();
    },
    QuitOptionSelectUser(select,data)
    {
        var options=select.options;

        for (let i = 0; i < options.length; i++) 
        {
            const op = options[i];
            if(op)
            {
                var row=data.find((r)=>r.user==op.value);
                if(row)
                {
                    op.remove();
                }
            }
        }
    },
    Users()
    {
        if(!this.chatInternalSeleted || this.chatInternalSeleted < 1)
        {
            alert("Debe seleccionar una conversación");
            return;
        }

        var data=
        {
            enpoint:`./${this.chatInternalSeleted}/get-users/`,
            use_url:true
        }
        
        this.InvokeService("GET",data,
        (data)=>
        {
            this.ArrayUsers=data;
            interchat.OpenModalUser(null);
            interchat.addOptions(interchat.list_user,data);
        });
    },
    SaveUsers()
    {
        let list = [];
        Array.from(this.list_user).forEach(opt => 
        {
            var obj=
            {
                user:opt.value,
                admin:tools.ParseBool(opt.getAttribute("isadmin"))
            }
            list.push(obj);
        });

        if(list.length<1)
        {
            tools.alerText("#lbl_alert_interchat_user","Debe agregar usuarios");
            return;
        }
        if(!this.chatInternalSeleted || this.chatInternalSeleted < 1)
        {
            tools.alerText("#lbl_alert_interchat_user","Debe seleccionar una conversación");
            return;
        }
        if(list.length<1)
        {
            tools.alerText("#lbl_alert_interchat_user","Debe agregar uno o más usuario(s)");
            return;
        }
        var data=
        {
            users:list,
            topic:this.chatInternalSeleted,
            enpoint:"./_new/add-users/",
            use_url:true
        }

        this.InvokeService("POST",data,
        (data)=>
        {
            tools.hideModal("modal_topic_add_user");
            this.fields("#modal_topic_add_user","clear");
        });
    },
    ArrayUsers:null,
    OpenModalUser(e)
    {
        if(this.module_modal_users)this.module_modal_users.classList.add("d-none");
        if(e)
        {
            e.stopPropagation();
            this.ArrayUsers=null;
            if(this.module_modal_users)this.module_modal_users.classList.remove("d-none");
        }
        this.list_user.innerHTML="";
        interchat.fields("#modal_topic_add_user","clear");
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
    MediaQuery(onclicking=false)
    {
        var w=document.body.offsetWidth;
        var h=document.body.offsetHeight;

        if(w>750)
        {
            if(this.col_1_chat)
            {
                this.col_1_chat.classList.add("h-100");
            }
            if(this.card_body_interchat)
            {
                this.card_body_interchat.classList.remove("d-none");
            }
            if(this.module_exit_media)
            {
                this.module_exit_media.classList.add("d-none");
            }
        }
        else
        {
            if(this.module_exit_media)
            {
                this.module_exit_media.classList.remove("d-none");
            }
            if(!onclicking)
            {
                if(this.col_2_chat)
                {
                    this.col_2_chat.classList.add("d-none");
                }
                
                if(this.col_1_chat)
                {
                    this.col_1_chat.classList.add("h-100");
                }
                if(this.card_body_interchat)
                {
                    this.card_body_interchat.classList.remove("d-none");
                }
                this.RemoveClassSelected();
                return;
            }

            if(interchat.chatInternalSeleted)
            {
                var chat_selected=this.array.find((r)=>r.sys_guid==interchat.chatInternalSeleted);
                if(chat_selected)
                {
                    let text=chat_selected.title??"";
                    if(this.name_chat)this.name_chat.textContent=interchat.Cut(text,15)+ (text.length>15 ? "..." :"");
                }
            }

            if(this.col_2_chat)
            {
                this.col_2_chat.classList.remove("d-none");
            }
            if(this.col_1_chat)
            {
                this.col_1_chat.classList.remove("h-100");
            }
            if(this.card_body_interchat)
            {
                this.card_body_interchat.classList.add("d-none");
            }
        }
    },
    Cut(text,length)
    {
        if(text.length<length)return text;

        return text.substring(0,length);
    },
    SetDivisorChat(guid,InvokeService=false)
    {
        var divisor=document.getElementById("div_"+guid);
        
        if(divisor)
        {
            divisor.classList.add("div-selected");
            if(divisor.parentElement)divisor.parentElement.classList.add("interchat-selected");
        }
        if(!InvokeService)return;

        // var row=interchat.array.find((r)=>r.sys_guid==guid);
        // if(row && tools.ParseBool(row.show_notif??false))
        // {
        //     var data=
        //     {
        //         use_url:true,
        //         endpoint:`./${guid}/interchat-readed/`
        //     }
        //     console.log(data)
        //     this.InvokeService("PUT",data,
        //         (data)=>
        //         {
        //             console.log(data)
        //         },(failure)=>{console.log(failure.message??JSON.stringify(failure))});
        // }
        
    },
    InterChatSelected(det,guid)
    {
        if(!this.iframe_interchat || this.url_bitacora.trim()=="")return;

        this.RemoveClassSelected();
        //remover notificacion de mensajes
        var elem=document.getElementById("noti-"+guid);
        if(elem)elem.classList.add("d-none");
        ///////
        interchat.chatInternalSeleted=null;

        this.PageInit(interchat.InterChatActivas ?"activas":"archivadas");
        if(this.loading_chats)this.loading_chats.classList.remove("d-none");

        interchat.SetDivisorChat(guid,true);

        interchat.chatInternalSeleted=guid;
        this.MediaQuery(true);

        let url_src=this.url_bitacora.replace("@det",det).replace("@guid",guid);
        this.iframe_interchat.src=url_src;

        interchat.getFooterChat(guid).then(footer=>
        {
            if(footer)
            {
                setTimeout(() => 
                {
                    if(interchat.loading_chats)interchat.loading_chats.classList.add("d-none");
                }, 1000);

                if(!interchat.InterChatActivas)
                {    
                    footer.classList.add("d-none");
                }
                else
                {
                    footer.classList.remove("d-none");
                }
            }
            
        });
        
    },
    StartInterval()
    {
        if(this.module_interchat && this.intervalGetChat)
        {
            this.interval=setInterval(() => 
            {
                interchat.GetMessages();
            }, interchat.time_load_interchat);
        }

        setInterval(() => 
        {
            interchat.CheckMessage();    
        }, interchat.time_load_interchat_notif);
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
        let lng=array.length;
        for (let i = 0; i < lng; i++) 
        {
            const element = array[i];
            interchat.PrintItemChat(element);
        }
        interchat.SelectChatCurrente();
    },
    SelectChatCurrente()
    {
        if(!interchat.chatInternalSeleted)return;

        interchat.RemoveClassSelected();

        interchat.SetDivisorChat(interchat.chatInternalSeleted);
    },
    InterChatActivas:true,
    ChatActivas()
    {
        if(!this.module_interchat)return;

        this.intervalGetChat=true;
        this.InterChatActivas=true;
        this.module_interchat.innerHTML="";
        this.last_log=0;
        interchat.GetMessages();
        this.StartInterval();

        this.PageInit("activas");
        interchat.array=interchat.ArrayMessages;

        if(!interchat.array)interchat.array=[];
    },
    ChatArchivadas()
    {
        if(!this.module_interchat)return;

        this.PageInit("archivadas");

        this.intervalGetChat=false;
        this.InterChatActivas=false;
        this.ClearInterval();
        this.module_interchat.innerHTML="";
        this.last_log=0;
        this.GetMessages("&close=true");
    },
    PrintItemChat(row)
    {
        if(!this.intervalGetChat && this.InterChatActivas)return;

        var exist_element=document.getElementById("interchat-",(row.sys_guid??""));

        var html=this.item_HTML.replace("@title",row.title??"").replace("@fecha",row.fecha??"").replaceAll("@guid",row.sys_guid??"");
        if(!exist_element)
        {
            this.module_interchat.insertAdjacentHTML("afterbegin",html);
        }
        if(tools.ParseBool((row.show_notif??false)))
        {
            var elem=document.getElementById("noti-"+row.sys_guid);
            if(elem)elem.classList.remove("d-none");
        }
        
        if(!this.array)this.array=[];
        this.array.push(row);

        if(Number(row.sys_pk??0)>this.last_log)this.last_log=Number(row.sys_pk??0);
    },
    ArrayMessages:null,
    GetMessages(params="")
    {
        this.endpoint="";
        this.endpoint+="?from="+(Number(this.last_log) + 1)+params;
        
        this.InvokeService("GET",null,
        (data)=>
        {
            interchat.PrintChat(data);
            interchat.ArrayMessages=data;
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
                interchat.GetMessages();
                tools.hideModal("modal_topic_main");
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
        let url=this.endpoint;
        if(values && (tools.ParseBool(values["use_url"]??"").toString()) )
        {
            if((values["enpoint"]??"")!="")url=(values["enpoint"]??"");
        }
        if(method.toLowerCase()=="get")values=null;

        InduxsoftCrudlModel.InvokeService(url, values, 
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