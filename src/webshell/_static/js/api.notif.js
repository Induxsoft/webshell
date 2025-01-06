var api_notif=
{
    audio:"",
    icon:"",
    title:"Nuevas notificaciones",
    lang:"ES",
    tag:"api_notify",
    dir:"auto",
    renotify:true,
    play_audio:true,
    show_notif:true,
    body:"Tiene notificaciones pendientes",
    time_close:5000,
    notifyMe(data={})
    {
        if(!this.show_notif)
        {
            this.playAudio(this.play_audio);
            return;
        }
        //Vamos a comprobar si el navegador es compatible con las notificaciones
        if (!("Notification" in window)) 
        {
            console.warn("El navegador no soporta las notificación");
        }

        // Vamos a ver si ya se han concedido permisos de notificación
        else if (Notification.permission === "granted") 
        {
            // Si está bien vamos a crear una notificación
            var body = data.body??this.body;
            var icon = this.icon;
            var title = this.title;
            var options = 
            {
                body: body,      //El texto o resumen de lo que deseamos notificar.
                icon: icon,      //El URL de una imágen para usarla como icono.
                lang: this.lang,      //El idioma utilizado en la notificación.
                tag: this.tag,   //Un ID para el elemento para hacer get/set de ser necesario.
                dir: this.dir,     // izquierda o derecha (auto).
            }
            var notification = new Notification(title,options);

            this.playAudio(this.play_audio);
            
            notification.onerror=(e)=>
            {
            }
            notification.onshow=(e)=>
            {
            }
            notification.onclick = function (e) 
            {
                //action
            };
            
            setTimeout(notification.close.bind(notification), this.time_close);
        }
        // De lo contrario, tenemos que pedir permiso al usuario
        else if (Notification.permission !== 'denied' || Notification.permission === "default") 
        {
            Notification.requestPermission(function (permission) 
            {
                // Si el usuario acepta, vamos a crear una notificación
                if (permission === "granted") 
                {
                    var notification = new Notification("Gracias, Ahora podras recibir notificaciones de nuestra página");
                }
            });
        }
        else
        {
            console.log("Estado de la notificación: "+Notification.permission);
        }
        // Por fin, si el usuario ha denegado notificaciones, y usted
        // Quiere ser respetuoso no hay necesidad de preocuparse más sobre ellos.
    },
    playAudio(play_audio=true)
    {
        if(this.audio!="" && play_audio)
        {
            var audio = new Audio(this.audio);
            audio.play();
        }
    }
}