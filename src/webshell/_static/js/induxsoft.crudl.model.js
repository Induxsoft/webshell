var InduxsoftCrudlModel =
{
	async InvokeService(url, data, success, fail, method='GET', reload=true, async=true, autorizations='', formdata=false, beforeFetch=null) 
	{
		let fetchData = {
			method: method,
			mode: 'cors',
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		}

		if (autorizations) fetchData.headers['Authorization'] = autorizations;
		
		if (data) {
			if (formdata)
				fetchData['body'] = data;
			else {
				fetchData.headers['Content-Type'] = 'application/json';
				fetchData['body'] = JSON.stringify(data);
			}
		}

		const resHandler = res => {
			if (method.toUpperCase() == "DELETE" && (res == null || res == 'undefined')) {
				success(res);
			}
			else {
				const isJson = res.headers.get('content-type')?.includes('application/json');
				if (isJson) {
					res.json().then(json => {
						if (json.success && success) {
							success(json.data ?? json);
						}
						else if (!json.success && json.success != null && json.success != undefined && fail) {
							fail(json);
						}
						else {
							if (res.status >= 200 && res.status < 300 && success) {
								success(json);
							}
							else {
								if (fail) fail(json);
							}
						}
					}).catch(error => success(error));
				}
				else {
					success(res);
				}
			}

			if (reload)
				window.location.reload();
		}

		if (beforeFetch) beforeFetch(fetchData);

		if (async) {
			await fetch(url, fetchData).then(resHandler).catch(error => {
				if (fail) fail(error.message ?? JSON.stringify(error));
			});
		}
		else {
			fetch(url, fetchData).then(resHandler).catch(error => {
				if (fail) fail(error.message ?? JSON.stringify(error));
			});
		}
	},

	Submit(formOrId, details={}, success=null, failure=null, {url="", url_exit="", err_timeout=7, redir=true}={})
	{
		const form = (typeof formOrId === "string") ? document.getElementById(formOrId) : formOrId;
		if (!form) {
			console.error("No se encontro el formulario.");
			return
		}
		if (form.nodeName !== "FORM") {
			console.error("El elemento proporcionado no es un Formulario.");
			return
		}
		if (!form.reportValidity()) return;

		// Desctivar controles del v12FormBar y Formulario
		const DisableControls = (disable) => {
			const v12FormBar = document.getElementById("v12FormBar_content");
			if (v12FormBar) v12FormBar.querySelectorAll("button,a").forEach(v12btn => {
				v12btn.style.pointerEvents = (disable) ? "none" : "";
				v12btn.style.backgroundColor = (disable) ? "#e9ecef" : "";
				v12btn.style.opacity = (disable) ? "1" : "";
			});
			form.querySelectorAll("button").forEach(frmbtn => {
				frmbtn.disabled = disable;
			});
		}
		DisableControls(true);

		const ff = form.elements;
		const fd = new FormData(form);
		
		let endpoint = (url.trim() != "") ? url : (form.action || "./");
		let method = ((Number(fd.get("sys_pk")) || 0) > 0) ? "PATCH" : "POST";
		
		Object.entries(details).forEach(entry => {
			const [key, obj] = entry;
			fd.append(key,JSON.stringify(obj));
		});

		const FireError = (msg) => {
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

		if (!success) success = (data) => {
			if (!(data?.success??true) || (data?.message??"")!="") {
				FireError(data?.message ?? JSON.stringify(data));
				DisableControls(false);
				return
			}
			// console.log(data)
			if (redir) window.location.href = data.url_redir ?? (url_exit || "../");
			else
			{
				Array.from(ff).forEach(el => {
					if ("defaultValue" in el) el.defaultValue = el.value;
				});
			}
		}

		if (!failure) failure = (error) => {
			FireError(error?.message ?? JSON.stringify(error));
			DisableControls(false);
		}

		InduxsoftCrudlModel.InvokeService(endpoint,fd,success,failure,method,false,true,"",true);
	},

	UrlReplace(url, params)
	{
		let url_sect = url.split('?');
		let url_base = url_sect[0];
		let url_prms = '';
		let url_new = url_base;
		let new_parms = '';

		if (url_sect.length > 0) url_prms = url_sect[1];
		if (!params) params = {};

		if (url_prms != '')
		{
			let keyvalues = url_prms.split('&');
			keyvalues.forEach((kv,i) => {
				let kvl = kv.split('=');
				let key = kvl[0];
				let val = (params[key] ?? (kvl.length > 0 ? kvl[1] : ''));
				new_parms += (i==0?'?':'&') + key + '=' + val;
			});
		}

		url_new += new_parms;
		return url_new;
	},

	UrlAddParameter(url, param, value)
	{
		var hash       = {};
		var parser     = document.createElement('a');
	
		parser.href    = url;
	
		var parameters = parser.search.split(/\?|&/);
	
		for(var i=0; i < parameters.length; i++) {
			if(!parameters[i])
				continue;
	
			var ary      = parameters[i].split('=');
			hash[ary[0]] = ary[1];
		}
	
		hash[param] = value;
	
		var list = [];  
		Object.keys(hash).forEach(function (key) {
			list.push(key + '=' + hash[key]);
		});
	
		parser.search = '?' + list.join('&');
		return parser.href;
	},

	Delete(id, url="") {
		if ((typeof id === "number" && id <= 0) || (typeof id === "string" && id.trim() == "")) {
            console.error("Debe indicar un identificador válido");
            return;
        }
		if (!confirm("¿Desea eliminar el registro seleccionado?")) return;

		let endpoint = (url) ? url.replace("{id}",id) : "./"+id+"/";

		this.InvokeService(endpoint, null,
			function (data) {
				window.location.reload();
			},
			function (error) {
				if (error.message) alert(error.message);
				else console.error(error);
			}, "DELETE", false, false
		);
	}
}