var tools =
{
    /**
     * @param {*} elementOrSelector Elemento HTML o selector del elemento.
     * @param {string} eventName Nombre qualificado del evento.
     * @returns 
     */
    trigger(elementOrSelector,eventName)
    {
        if (!elementOrSelector || !eventName) return;

        const element = (typeof elementOrSelector === "string") ? document.querySelector(elementOrSelector) : elementOrSelector;
        if (!element) {
            console.error("Elemento no encontrado.");
            return
        }

        const event = new Event(eventName, {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(event);
    },

    uuid(dashes=false) {
        let regex = dashes ? [1e7]+-1e3+-4e3+-8e3+-1e11 : [1e7]+1e3+4e3+8e3+1e11;
        return (regex).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },

    copy(text)
    {
        if (!text) return;

        if (!this._toast)
        {
            const overlay = document.createElement('div');
            overlay.className = 'position-fixed top-0 end-0 p-3';
            overlay.style.zIndex = '1080';
            
            const toast = document.createElement('div');
            toast.className = 'toast align-items-center bg-white';
            toast.role = 'alert';
            toast.ariaLive = 'assertive';
            toast.ariaAtomic = 'true';
            toast.innerHTML = `
            <div class="toast-body">
                Se copio al portapapeles.
            </div>
            `;
            overlay.appendChild(toast);
            document.body.appendChild(overlay);
            this._toast = toast;
        }
        let bsToast = bootstrap.Toast.getInstance(this._toast);
        if (!bsToast) bsToast = new bootstrap.Toast(this._toast);

        navigator.clipboard.writeText(text)
        .then(() => { bsToast.show() })
        .catch(err => { alert("Error al copiar.") });
    },

    copyOf(id) {
        const el = document.getElementById(id);
        this.copy(el.value ?? el.textContent);
    },

    async pasteTo(id)
    {
        const input = document.getElementById(id);
        const text = await navigator.clipboard.readText();
        input.value = text;
    },

    setGuidTo(id,dashes=true) {
        const input = document.getElementById(id);
        input.value = this.uuid(dashes);
    },

    ParseBool(v) 
    {
        if (typeof v === "boolean") return v;
        if (typeof v === "number") return (v != 0);
        if (typeof v === "string") {
            return ["true","1","yes","y","si","sí","s","ok","on","v","verdadero","verdad","correcto","cierto","positivo","+"].includes(v.trim().toLowerCase());
        }

        return false
    },

    path_concat(p1,p2,...px)
    {
        p1 = p1.toString().replaceAll("\\","/");
        p2 = p2.toString().replaceAll("\\","/");

        let l1 = p1.split("/");
        let l2 = p2.split("/");
        
        let path = [...l1, ...l2];

        for (let i = 0; i < px.length; i++) {
            const p = px[i].toString().replaceAll("\\","/");
            let l = p.split("/");
            path = path.concat(l);
        }

        return path.join("/").replace(/\/+/g, '/');
    },

    url_encode(url)
    {
        let _url = btoa(url);
        
        _url = _url.replaceAll("=","|");
        _url = _url.replaceAll("/","_");
        _url = _url.replaceAll("+","-");
        
        return _url;
    },

    url_decode(url)
    {
        url = url.replaceAll("|","=");
        url = url.replaceAll("_","/");
        url = url.replaceAll("-","+");
        
        return atob(url);
    },

    distinctArrays(arr1, arr2)
    {
        if (arr1.length !== arr2.length) return true;
        // Comparar cada objeto dentro de los arrays
        for (let i = 0; i < arr1.length; i++) {
            if (JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) return true;
        }

        return false;
    },

    isValidFloat(number,decimals)
    {
        const regex = "^\([0-9]+\.?[0-9]{0,"+decimals+"})$";
        const preg = new RegExp(regex);
        return preg.test(number);
    },

    format:function(number, decPlaces = 2, decSep = ".", thouSep = ",")
    {
        if (isNaN(number)) return "NaN";

        const sign = number < 0 ? "-" : "";
        number = Math.abs(number).toFixed(decPlaces);

        const parts = number.split(".");
        let integerPart = parts[0];
        const decimalPart = parts[1] || "";
        // Agregar separadores de miles
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thouSep);
        // Reconstruir el número formateado
        return sign + integerPart + (decPlaces > 0 ? decSep + decimalPart : "");
    },

    showModal:function(idmodal)
	{
		this.getBSModal(idmodal).show();
	},
	hideModal:function(idmodal)
	{
		this.getBSModal(idmodal).hide();
	},
	getBSModal(modalId)
    {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.log("Elemento no definido");
            return;
        }
        
        let bsModal = bootstrap.Modal.getInstance(modalElement);
        if (!bsModal) bsModal = new bootstrap.Modal(modalElement);

        return bsModal;
    },
    V12FormBarDisableControls(disable,form=null)
    {
        const v12FormBar = document.getElementById("v12FormBar_content");
        if (v12FormBar) v12FormBar.querySelectorAll("button,a").forEach(v12btn => 
        {
            v12btn.style.pointerEvents = (disable) ? "none" : "";
            v12btn.style.backgroundColor = (disable) ? "#e9ecef" : "";
            v12btn.style.opacity = (disable) ? "1" : "";
        });
        
        if(form)form.querySelectorAll("button").forEach(frmbtn => 
        {
            frmbtn.disabled = disable;
        });
    },
    FireError(msg,form,err_timeout=7)
    {
        if(!form)return;
        const div = document.createElement("div");
        const text = document.createTextNode(msg);
        
        div.classList.add("alert", "alert-danger", "overflow-auto", "mb-2");
        div.appendChild(text);
        /**
         * [ insertar elemento adyacente ]
         * 
         * beforebegin: Para insertar el nodo HTML antes del inicio del elemento.
         * beforeend: Éste es similar al appendChild(). Como sugiere el nombre, la posición beforeend coloca el elemento justo después del último hijo.
         * afterbegin: como sugiere el nombre, esta opción inserta el elemento justo después de la etiqueta de apertura del nodo seleccionado y lo coloca antes del primer hijo.
         * afterend: se refiere a la posición después de que se cierra la etiqueta de nodo HTML de destino.
         */
        form.insertAdjacentElement("beforebegin",div);
        setTimeout(() => {
            div.remove();
        }, (err_timeout * 1000));
    }
}