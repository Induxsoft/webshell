document.addEventListener("DOMContentLoaded",()=>{interchat.init();})

var interchat=
{
    endpoint:"",
    init()
    {
        this.btn_add_topic=document.getElementById("btn_add_topic");
        this.btn_add_interchat=document.getElementById("btn_add_interchat");

        if(this.btn_add_topic)this.btn_add_topic.addEventListener("click",()=>{interchat.OpenModal();});
        if(this.btn_add_interchat)this.btn_add_interchat.addEventListener("click",()=>{interchat.SaveTopic();});

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