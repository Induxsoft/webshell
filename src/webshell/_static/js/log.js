document.addEventListener("DOMContentLoaded",()=>{log.init();});

window.addEventListener("resize", function(event) 
{
    log.AddHTML(log.header_counter,`<div class="d-none"></div>`);
    log.CalculeContador();
}, true);

var log=
{
    action_current_user:false,
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
        this.iframe_top=window.top.document.getElementById("right-frame");

        this.body_chat=document.getElementById("body-chat");
        this.modal_preview_img=document.getElementById("modal_preview_img");
        this.img_modal_preview=document.getElementById("img-modal-preview");
        this.btn_donwload_img_modal=document.getElementById("btn-donwload-img-modal");

        if(this.body_chat)this.body_chat.addEventListener("scroll", function (e){log.allowScroll=false;});

        if(this.media_list)this.media_list.onClicking=data=>
        {
            log.SelectedElement(data);
        }
        this.last_log = 0;
        this.HTML_module_receptor=`<div class="d-flex justify-content-start module_receptor" id="chat-@id_chat" _date="@date">
            <div class="body-chat-receptor">
                <div class="chat" style="@style_chat">@adjunto 
                    <div class="div-img">@module_adjunto @message</div>
                </div>
                <small class="user">@user</small>
                <small class="fecha-hour d-flex">@fecha_hora</small>
            </div>
        </div>`;

        this.action_current_user_HTML=`
                <div class="btn-goup d-flex justify-content-end" role="group" style="float: right;">
                    <button class="btn bg-transparent btn-sm rounded-0 no-shadow" type="button" id="notif-group-actions" data-bs-toggle="dropdown" aria-expanded="false">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"></path>
                        </svg>
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="notif-group-actions">
                        <li>
                            <button class="dropdown-item" onclick="log.DeleteMessage('@id_chat','@idfile')">Eliminar</a>
                        </li>
                    </ul>
                </div>`;

        this.action_adjunto_user_current_HTML=`
                                <div class="btn-goup d-flex justify-content-center align-items-center btn-file-delete" onclick="log.DeleteFile('@idfile','',event);">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16">
                                        <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"></path>
                                    </svg>
                                </div>`;

        if(!this.action_current_user || this.action_current_user < 1)
        {
            this.action_current_user_HTML="";
            this.action_adjunto_user_current_HTML="";
        }

        this.STYLE_ADJ_emisor_receptor="display: table-row-group;"

        this.HTML_module_emisor=`
        <div class="d-flex justify-content-end module_emisor" id="chat-@id_chat" _date="@date">
            <div class="body-chat-emisor">
                
                ${this.action_current_user_HTML}
                
                <div class="chat" style="@style_chat">@adjunto 
                    <div class="div-img">@module_adjunto @message</div>
                </div>
                <small class="user">@user</small>
                <small class="fecha-hour d-flex">@fecha_hora</small>
            </div>
        </div>`;
        
        this.HTML_adjunto=`
        <div class="btn btn-sm btn-adjunto" title="@name_adjunto" id="adjunto-@idfile">
            <a href="@url" target="_blank" >
                <div class="d-flex">
                    @module_adjunto
                    ${this.action_adjunto_user_current_HTML}
                </div>
                <div class="div-img d-flex align-items-start">
                    <small class="chat-name-adjunto">@name_adjunto</small>
                </div>
            </a>
        </div>
        `;

        this.STYLE_div_adjunto="display:contents;"
        this.HTML_module_adjunto=`<div class="chat-div-adjunto" style="@style">@__tag_o<img src="@src" onerror="this.src='@def_min' " />@__tag_c</div>`;

        this.HTML_redir_chat=`<a href="@url" target="_blank">@html</a>`;
        this.HTML_name_adjunto=`<small class="chat-name-adjunto">@name_adjunto</small>`;

        this.HTML_divider_fecha=`<div class="d-flex" id="div-@fecha">
                                    <hr class="fecha-divider">
                                    <small class="f-fecha">@fecha</small>
                                    <hr class="fecha-divider">
                                </div>`;

        this.HTML_more_mjs=`<div class="d-flex" id="div-more-chat">
                                <hr class="more-chat-divider">
                                <button id="btn-more-chat" class="f-more" onclick="log.more_chat(@pk_max,@pk_min,'@act','@order')">Más mensajes</button>
                                <hr class="more-chat-divider">
                            </div>`;
 //<button class="f-rec-more" onclick="log.more_chat(@pk_max,@pk_min,'@act','@order')">Mensajes recientes</button>
        this.HTML_more_rec_mjs=`<div class="d-flex" id="div-more-rec-chat">
                            <hr class="more-chat-divider">
                            <button class="f-rec-more ms-2" onclick="log.ir_al_actual()">Ir al actual</button>
                            <hr class="more-chat-divider">
                        </div>`;

        if(this.btn_send)this.btn_send.addEventListener("click",()=>{log.SendMessage();});
        if(this.adjunto)this.adjunto.addEventListener("change",()=>{log.SendFile();})
        if(this.txt_message)this.txt_message.addEventListener("keydown",(e)=>{if(e.keyCode ===13)log.SendMessage();});

        if(this.data && this.data.length>0)
        {
            this.CreateBodyChat(this.data);
        }
        this.interval_chat=null;
        this.setInterval();
        this.ObserveScroll();
        log.CalculeContador();
    },
    ScrollGen:true,
    CountScroll:0,
    setInterval()
    {
        if(this.body_chat)
        {
            this.interval_chat= setInterval(() => 
            {
                log.GetMessages();
            }, log.time_load_bitacora);
        }
    },
    Cut(text,length)
    {
        if(text.length<length)return text;

        return text.substring(0,length);
    },
    DeleteMessage(id,idfile="",act="del-msg",method="DELETE")
    {
        var data=
        {
            use_url:true,
            enpoint:`./?id=${id}&page=${act}/`
        }
        var elem=document.getElementById(`chat-${id}`);
        if(!elem)return;
        
        this.InvokeService(method,data,
            (data)=>
            {
                log.DeleteFile(idfile,id,null,false);
            });
    },
    DeleteAdjunto()
    {
        var data=this.data_preview;
		if(!data)
		{
			alert("Debe seleccionar un elemento");
			return;
		}
        var request=
        {
            use_url:true,
            enpoint:`./?id=${data.id??""}&from-file=true&page=del-msg`
        }
		this.InvokeService("DELETE",request,
            (data)=>
            {
                window.location.reload()
            });
		
    },
    DeleteFile(idfile,guid="",event=null,ivkservice=true)
    {
        if(event)
        {
            event.stopPropagation();
            event.preventDefault();
        }

        let elemfile=document.getElementById(`adjunto-${idfile}`);
        if(elemfile)elemfile.remove();

        var row=null;

        if(idfile.trim()!="")row=this.data.find((r)=>r.idarchivo==idfile);
        else row=this.data.find((r)=>r.sys_pk==guid);
       
        if(row)
        {
            if(guid.toString().trim()=="")guid=(row.sys_pk??"").toString();
            
            var elem=document.getElementById(`chat-${guid}`);
            if(!elem)return;

            if(!ivkservice)
            {
                elem.remove();
            }
            else
            {
                log.DeleteMessage(row.sys_pk,idfile);
            }
            log.CheckDivisor(`div-${row.fecha??""}`,(row.fecha??""));
        }
        
    },
    CheckDivisor(iddiv,fecha)
    {
        var divisor=document.getElementById(iddiv);
        var elements=document.querySelectorAll(`#${iddiv} ~ [_date="${fecha}"]`);
        
        if(elements && elements.length <1 && divisor) divisor.remove();
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
        log.allowScroll=true;
        log.printMoreChat=false;
        this.InvokeService("POST",data,
            (data)=>
            {
                log.txt_message.value="";
                log.GetMessages();
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
        log.allowScroll=true;
        log.printMoreChat=false;
        this.endpoint=this.url_root_current;
        this.InvokeService("POST",data,
            (data)=>
            {
                this.adjunto.value="";
                log.GetMessages();
            },
            (failed)=>
            {
                this.adjunto.value="";
                alert(failed.message??JSON.stringify(failed));
            },true);
    },
    GetMessages(endpoint="",callbak_succes=null)
    {
        this.endpoint="";
        this.endpoint+="?from="+(Number(this.last_log) + 1);

        if(endpoint.trim()!="")this.endpoint=endpoint;

        this.InvokeService("GET",null,
            (data)=>
            {
                if(callbak_succes)callbak_succes(data)
                else
                {
                    if(data.data)log.CreateBodyChat(data.data);
                    if(data.adjuntos)log.CreateBodyAdjuntos(data.adjuntos);
                    if(data.eliminados)log.ElementsRemove(data.eliminados);
                }
                log.CountScroll++;
            },(failure)=>{console.log(failure.message??JSON.stringify(failure))});
    },
    ElementsRemove(data)
    {
        if(!data || data.length<1)return

        for (let i = 0; i < data.length; i++) 
        {
            var row = data[i];
            var elem=document.getElementById(`chat-${row.pkmsg??""}`);
            if(elem)elem.remove();

            log.CheckDivisor(`div-${row.fecha??""}`,(row.fecha??""));
        }
    },
    more_chat(from,to,act,_order="")
    {
        let url=`?to=${from}`;

        this.printMoreChat=true;
        log.allowScroll=false;

        let hscroll=(log.body_chat.scrollHeight??0);

        log.GetMessages(url,
        (data)=>
        {
            this.chatArray=data;
            log.CreateBodyChat(data.data,false,false,"div-more-chat");
            this.printMoreChat=false;
            
            log.allowScroll=true;
            if((log.body_chat.scrollHeight??0)>hscroll)hscroll=(log.body_chat.scrollHeight??0) - hscroll;

            log.Scroll(true,0,hscroll,false);
            log.allowScroll=false;
        });
    },
    printMoreChat:false,
    last_pk_chat:0,
    PrintViewMore(data,footer=false)
    {
        let last_pk=(Number(log.last_pk_chat) - 1);
        if(last_pk < 1 && (data.count_msj_pnd??0)<1)return;
        
        var div_more_chat=document.getElementById("div-more-chat");
        if(div_more_chat)
        {
            if((data.count_msj_pnd??0)<1){div_more_chat.classList.add("disable-element");}
            else 
            {
                let btn=document.getElementById("btn-more-chat");
                if(btn)btn.setAttribute("onclick",`log.more_chat(${last_pk},0,'min','')`);
            }
            return;
        }
        else if ((data.count_msj_pnd??0)<1)return;
        
        let html=this.HTML_more_mjs.replaceAll("@pk_max",last_pk).replaceAll("@act","min").replaceAll("@pk_min",0);
        html=html.replace("@order","");
        this.body_chat.innerHTML+=html;
    },
    CreateBodyAdjuntos(data)
    {
        if(!data || data.length<1)return;
        for (let i = data.length; i >=0 ; i--) 
        {
            const item = data[i];
            this.CreateItemAdjunto(item);
        }
    },
    CreateItemAdjunto(row)
    {
        if(!row || !this.adjuntos)return;
        var element=document.getElementById(`adjunto-${row.id}`);
        if(element)return;
        
        let html_adj=this.HTML_module_adjunto.replace("@src",row.mini??"").replaceAll("@def_min",(row.def_mini??"")).replaceAll("@style","");
        if((row.def_mini??"")!="")
        {
            html_adj=html_adj.replace("@__tag_o",`<button onclick="log.Preview('${row.idarchivo}${row.ext}','${log.url_download_adjuntos.replace("@id",row.idarchivo??"")}',event);" style="width: 50px;height: 50px;" >`);
            html_adj=html_adj.replace("@__tag_c",`</button>`);
        }
        else
        {
            html_adj=html_adj.replaceAll("@__tag_o","");
            html_adj=html_adj.replaceAll("@__tag_c","");
        }
        var html=this.HTML_adjunto.replace("@module_adjunto",html_adj).replaceAll("@name_adjunto",log.Cut(row.nombre??"",10)).replace("@url",log.url_download_adjuntos.replace("@id",row.id??""));
        html=html.replaceAll("@idfile",row.id??"");

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
    Preview(idarchivo,link,event=null)
    {
        if(event)
        {
            event.stopPropagation();
            event.preventDefault();
        }
        let url=tools.path_concat((log.chatArray?.url_file_data??""),`${idarchivo}`);
        if(this.modal_preview_img)
        {
            if(this.img_modal_preview)this.img_modal_preview.src="";
            if(this.img_modal_preview)this.img_modal_preview.src=url;
            if(this.btn_donwload_img_modal)this.btn_donwload_img_modal.href=link;
        }
        tools.showModal('modal_preview_img');
    },
    CreateBodyChat(data,scroll=true,indecrement=true,id_element_insert="")
    {
        if(!data || data.length<1)return;
        
        let ult_row=null;
        ult_row=data[data.length - 1];
        
        if(log.last_pk_chat > 0 && (ult_row?.sys_pk??0)<log.last_pk_chat)log.last_pk_chat=ult_row?.sys_pk??0;
        else if(log.last_pk_chat == 0) log.last_pk_chat=ult_row?.sys_pk??0;

        this.PrintViewMore(this.chatArray);

        if(indecrement)
        {
            for (let i = data.length; i >= 0 ; i--) 
            {
                const item = data[i];
                this.CreateItemChat(item,id_element_insert);
            }
        }
        else
        {
            for (let i = 0; i < data.length ; i++) 
            {
                const item = data[i];
                this.CreateItemChat(item,id_element_insert);
            }
        }
        

        if(scroll)
        {
            setTimeout(() => 
            {
                log.allowScroll=true;
                log.Scroll(true);  
            }, 500);
        }
    },
    last_fecha:"",
    CreateItemChat(row,id_element_insert="")
    {
        if(!row || !this.body_chat)return;
        
        var exit_elem=document.getElementById(`chat-${row.sys_pk}`);
        if(exit_elem)return;
        
        var html="";
        if(row.usuario==log.current_user) html=this.HTML_module_emisor;
        else  html=this.HTML_module_receptor;

        let nota=row.nota??"";
        
        let fecha=(row.fecha??"");

        let divisor_fecha=document.getElementById(`div-${fecha}`);
        let html_fecha="";
        if(this.last_fecha!=fecha || !divisor_fecha)
        {
            html_fecha=this.HTML_divider_fecha.replaceAll("@fecha",fecha);
            this.last_fecha=fecha;
        }
        //replace macros de mensajes, usuarios y fechahora
        html=html.replace("@message",nota).replace("@user",row.usuario).replace("@fecha_hora",(row.hora??"").toLowerCase());
        if((row.archivo??"")!="")
        {
            //replace macros de src y img default para las imagenes
            let html_adj=this.HTML_module_adjunto.replace("@src",row.mini??"").replaceAll("@def_min",(row.def_mini??""));
            html_adj=html_adj.replaceAll("@__tag_o","").replaceAll("@__tag_c","");
            //replace de style de las img para no afectar a los chat sin img
            if((row.def_mini??"")!="")
            {
                html_adj=html_adj.replaceAll("@style",this.STYLE_div_adjunto);
                html=html.replaceAll("@style_chat",this.STYLE_ADJ_emisor_receptor);
            }
            else
            {
                html=html.replaceAll("@style_chat","");
            }
            //replace de url para las img y asi poder descargar
            let r=this.HTML_redir_chat.replace("@url",log.url_download_adjuntos.replace("@id",row.idarchivo??"")).replace("@html",html_adj);

            if((row.def_mini??"")!="" && (log.chatArray?.url_file_data??"")!="")
            {
                r=r.replace("<a" ,`<button onclick="log.Preview('${row.idarchivo}${row.ext}','${log.url_download_adjuntos.replace("@id",row.idarchivo??"")}');"`);
                r=r.replace("a>" ,"button>");
            }
            //replace del adjunto con el html ya formado de las img
            html=html.replace("@adjunto",r);
            html=html.replace("@module_adjunto",this.HTML_name_adjunto.replace("@name_adjunto",row.archivo));
        }
        else
        {
            html=html.replace("@adjunto","");
            html=html.replace("@module_adjunto","");
            html=html.replaceAll("@style_chat","");
        }
        html=html.replaceAll("@id_chat",row.sys_pk).replace("@idfile",row.idarchivo??"");
        html=html.replaceAll("@date",fecha);

        if(id_element_insert.trim()!="")
        {
            var elemet_insert_html=document.getElementById(id_element_insert);
            if(elemet_insert_html)
            {
                if(html_fecha!="" && !divisor_fecha)
                {
                    elemet_insert_html.insertAdjacentHTML("afterend",html_fecha);
                    divisor_fecha=document.getElementById(`div-${fecha}`);
                }
                
                if(divisor_fecha)divisor_fecha.insertAdjacentHTML("afterend",html);
                else elemet_insert_html.insertAdjacentHTML("afterend",html);
            }
        }
        else 
        {
            if(html_fecha!="")this.body_chat.innerHTML+=html_fecha;

            this.body_chat.innerHTML+=html;
        }
        
        if(Number(row.sys_pk??0)>this.last_log)this.last_log=Number(row.sys_pk??0);

        if(!this.data)this.data=[];
        
        var r=this.data.find((t)=>t.sys_guid==row.sys_guid);
        if(!r)this.data.push(row);
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
    allowScroll:true,
    Scroll(scrll=false,x=0,y=10000,check_y=true)
    {
        if(!log.allowScroll)return;
        
        var body_chat=document.getElementById("body-chat");

        if(body_chat && (body_chat.scrollHeight??0)>y && check_y)y=(body_chat.scrollHeight??0);

        if(scrll)
        {
            if(log.body_chat)log.body_chat.scrollTo(x, y);
        }
        else 
        {
            var chat_body_h=700;//log.body_chat.clientHeight - 100
            var elements=document.querySelectorAll("#body-chat > div");

            var h=0;
            for (let i = 0; i < elements.length; i++) 
            {
                const element = elements[i];
                if(element)h+=element.clientHeight;
            }
                
            if(h>=chat_body_h) 
            {
                if(log.body_chat)log.body_chat.scrollTo(x, y);
            }
        }
    },
    PanelAvailable()
    {
        var webshell=window.top.WebShell;
        if(!webshell)
        {
            console.warn("No se pudo obtener el elemento de webshell");
            return;
        }
        log.ScrollGen=webshell.Panels.IsOpen(webshell.Panels.Const.Right);
        if(!log.ScrollGen)log.CountScroll=0;
    },
    InvokeService(method,values=null,callbak_succes=null,callbak_failed=null,formdata=false)
    {
        let url=this.endpoint;
        if(values && (tools.ParseBool(values["use_url"]??"")) )
        {
            if((values["enpoint"]??"")!="")url=(values["enpoint"]??"");
        }
        if(method.toLowerCase()=="get")values=null;

        InduxsoftCrudlModel.InvokeService(url, values, 
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