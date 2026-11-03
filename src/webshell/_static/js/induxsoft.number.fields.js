var InduxsoftNumberFields =
{
    Init()
    {
        const number_fields = document.querySelectorAll('input.induxsoft-num-field[type="number"]');
        for (const field of number_fields) {
            if (field.name || field.id) this._renderTextInput(field);
        }
    },

    /**
     * Crea un elemento `input[type="text"]`.
     * @param {HTMLInputElement} numberInput Elemento a procesar.
     */
    _renderTextInput(numberInput)
    {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = numberInput.value || '';
        textInput.dataset.target = numberInput.id || numberInput.name;

        this._bindAttributesAndProperties(numberInput,textInput);
        this._setNumberInputStyle(numberInput);
        this._setEvents(textInput);
        this._format(textInput);

        numberInput.insertAdjacentElement('afterend',textInput);
    },
    /**
     * @param {HTMLInputElement} source Elemento origen
     * @param {HTMLInputElement} target Elemento objetivo
     */
    _bindAttributesAndProperties(source,target)
    {
        target.setAttribute('class',source.getAttribute('class'));
        if (source.hasAttribute('style')) {
            target.setAttribute('style',source.getAttribute('style'));
            source.removeAttribute('style');
        }
        target.readOnly = source.readOnly;
        target.disabled = source.disabled;
        target.required = source.required;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes') {
                    const attrName = mutation.attributeName;
                    const newValue = source.getAttribute(attrName);

                    switch (attrName) {
                        case 'readonly':
                        case 'disabled':
                        case 'required':
                            if (attrName == 'readonly') target.readOnly = source.readOnly;
                            else target[attrName] = source[attrName];
                            break;
                        case 'value':
                        case 'class':
                            target.setAttribute(attrName,newValue);
                            break;
                        // case 'style':
                        //     console.log("No implementado");
                        //     break;
                    }
                }
            });
        });

        observer.observe(source, {
            attributes: true,
            attributeOldValue: true,
            subtree: false
        });

        let lastValue = source.value;
        setInterval(() => {
            if (!source.stopPolling && source.value !== lastValue) {
                target.value = source.value;
                lastValue = source.value;
                this._format(target);
            }
        });
    },
    /**
     * Establece nuevos estilos css al elemento `input[type="number"]`.
     * @param {HTMLInputElement} numberInput Elemento a procesar.
     */
    _setNumberInputStyle(numberInput)
    {
        numberInput.style.cssText = `
            width: 1px !important;
            height: 1px !important;
            border: none !important;
            outline: none !important;
            padding: 0 !important;
            margin: 0 !important;
            opacity: 0 !important;
            box-shadow: none !important;
            background-color: transparent !important;
            pointer-events: none !important;
        `;
        if (numberInput.parentElement)
        {
            switch (getComputedStyle(numberInput.parentElement).position) {
                case 'relative':
                    numberInput.style.cssText += `
                        position: absolute !important;
                        bottom: 0;
                        left: 25%;
                    `;
                    break;
                case 'static':
                    numberInput.style.cssText += `
                        position: absolute !important;
                    `;
                    break;
            }
        }
    },
    /**
     * Establecer eventos al elemento `input[type="text"]`.
     * @param {HTMLInputElement} input Elemento a procesar.
     */
    _setEvents(input)
    {
        const _input = this._getReferredInput(input);

        _input.trigger = function(type,e) {
            const event = new Event(type,e);
            return this.dispatchEvent(event);
        }
        _input.getDecimals = function() {
            if (this.hasAttribute('num-decs')) return parseInt(this.getAttribute('num-decs')) || -1;
            if (this.hasAttribute('step'))
            {
                let step = this.getAttribute('step');
                if (!step.includes('.')) return 0;
                else return step.split('.')[1].length;
            }
            return -1;
        }

        // El elemento gana el foco.
        input.addEventListener('focus', (e) => {
            e.target.value = this._rawValue(e.target);
            _input.trigger('focus',e);
        });
        // El elemento pierde el foco.
        input.addEventListener('blur', (e) => {
            e.target.value = this._rawValue(e.target);
            this._format(e.target);
            _input.trigger('blur',e);
        });
        // Se presiona una tecla sobre el elemento.
        input.addEventListener('keydown', (e) => {
            if (!_input.trigger('keydown',e)) {
                e.preventDefault();
                return
            }

            const controlKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Home','End','Tab'];
            const allowed = ['0','1','2','3','4','5','6','7','8','9','.','-'];
            const value = e.target.value || '';

            // Permitir teclas de control
            if (controlKeys.includes(e.key)) return;
            // Bloquear si la tecla no es válida
            if (!allowed.includes(e.key)) {
                e.preventDefault();
                return
            }
            // Solo un punto permitido
            if (e.key == '.' && value.includes('.')) {
                e.preventDefault();
                return
            }
            // Solo un guion permitido al inicio
            if (e.key == '-' && (value.includes('-') || e.target.selectionStart != 0)) {
                e.preventDefault();
                return
            }
        });
        // Se suelta la tecla presionada.
        input.addEventListener('keyup', (e) => { _input.trigger('keyup',e) });
        // El valor del elemento está por cambiar.
        input.addEventListener('beforeinput', (e) => {
            if (!_input.trigger('beforeinput',e)) {
                e.preventDefault();
                return
            }

            /*
            * Construir el valor que tendrá el input después de la operación.
            * Esto contempla tanto escritura como reemplazo de una selección.
            */
            const start = e.target.selectionStart ?? 0;
            const end = e.target.selectionEnd ?? start;
            const oldValue = e.target.value || '';

            let insertedValue = e.data ?? '';

            // Operaciones de borrado
            if (
                e.inputType === 'deleteContentBackward' ||
                e.inputType === 'deleteContentForward' ||
                e.inputType === 'deleteByCut'
            ) {
                insertedValue = '';
            }

            const newValue =
                oldValue.slice(0, start) +
                insertedValue +
                oldValue.slice(end);

            const decimals = _input.getDecimals();

            /*
            * Estados intermedios válidos.
            *
            * Ejemplos:
            *   ""
            *   "-"
            *   "."
            *   "-."
            *   "0."
            *   ".0"
            *
            * Son necesarios para poder escribir posteriormente
            * valores como:
            *   0.09
            *   .09
            *   -0.09
            */
            const isIntermediate =
                newValue === '' ||
                newValue === '-' ||
                newValue === '.' ||
                newValue === '-.' ||
                newValue === '.0' ||
                newValue === '0.';

            /*
            * Validar estructura numérica antes de aplicar min/max.
            *
            * Permitimos:
            *   123
            *   123.
            *   123.45
            *   .45
            *   -123.45
            *   -.45
            */
            const numericPattern = /^-?(?:\d+(?:\.\d*)?|\.\d*)$/;

            if (!isIntermediate && !numericPattern.test(newValue)) {
                e.preventDefault();
                return
            }

            /*
            * Limitar cantidad de decimales.
            *
            * Importante: "0." todavía tiene cero decimales,
            * por lo que debe permitirse.
            */
            if (decimals >= 0 && newValue.includes('.')) {
                const decimalPart = newValue.split('.')[1];

                if (decimalPart.length > decimals) {
                    e.preventDefault();
                    return
                }
            }

            /*
            * No aplicar min/max mientras el usuario está construyendo
            * el número. Por ejemplo:
            *
            * min="0"
            * escribir "0.09"
            *
            * "0." es un estado intermedio y no debe bloquearse.
            */
            if (!isIntermediate && numericPattern.test(newValue)) {
                const numericValue = Number(newValue);

                if (
                    _input.hasAttribute('max') &&
                    numericValue > Number(_input.getAttribute('max'))
                ) {
                    e.preventDefault();
                    return
                }

                if (
                    _input.hasAttribute('min') &&
                    numericValue < Number(_input.getAttribute('min'))
                ) {
                    e.preventDefault();
                    return
                }
            }
        });
        // El valor del elemento está cambiando.
        input.addEventListener('input', (e) => {
            _input.stopPolling = true;
            _input.value = e.target.value;
            _input.trigger('input',e);
        });
        // El valor del elemento se ha cambiado/confirmado.
        input.addEventListener('change', (e) => {
            _input.stopPolling = false;
            _input.value = this._rawValue(e.target);
            _input.trigger('change',e);
        });
    },
    /**
     * Dar formato al valor del elemento `input[type="text"]`.
     * @param {HTMLInputElement} input Elemento a procesar.
     */
    _format(input)
    {
        const _input = this._getReferredInput(input);
        if (input.value == '' || !_input) return;

        let lcode = _input.getAttribute('num-locale') || (new Intl.NumberFormat()).resolvedOptions().locale;
        let style = _input.getAttribute('num-style') || 'decimal';
        let decimals = _input.getDecimals();

        let options = {
            style: style,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }

        switch (style) {
            case "currency":
                // MXN, USD, EUR, ...
                let currency = (_input.getAttribute('num-currency') || 'MXN').toUpperCase();
                options.currency = currency;
                // symbol, code, name
                let currencyDisplay = (_input.getAttribute('num-currency-display') || '');
                if (currencyDisplay != "") options.currencyDisplay = currencyDisplay;
                break;
            case "unit":
                // meter, kilometer, megabyte, gigabyte, ... 
                let unit = _input.getAttribute('num-unit');
                if (unit) options.unit = unit;
                // long, short
                let unitDisplay = input.getAttribute('num-unit-display');
                if (unitDisplay) options.unitDisplay = unitDisplay;
                break;
            default:
                if (!["percent","decimal"].includes(style)) delete options.style;
                if (decimals < 0) {
                    delete options.minimumFractionDigits;
                    delete options.maximumFractionDigits;
                }
                break;
        }

        const formatter = new Intl.NumberFormat(lcode, options);
        input.value = formatter.format(input.value);
    },
    /**
     * Obtiene el valor numérico de `input[type="text"]`.
     * @param {HTMLInputElement} input Elemento a procesar.
     */
    _rawValue(input)
    {
        const rawValue = parseFloat(input.value.replace(/[^\d.-]/g, ''));
        return isNaN(rawValue) ? '' : rawValue;
    },
    /**
     * Obtener el `input[type="number"]` del `input[type="text"]` proporcionado.
     * @param {HTMLInputElement} input Elemento a procesar.
     * @returns {HTMLInputElement | null}
     */
    _getReferredInput(input)
    {
        const target = input.dataset.target;
        
        if (input.form) {
            const numberInput = input.form.elements[target];
            return numberInput;
        }

        let numberInput = document.getElementById(target);
        if (!numberInput) numberInput = document.querySelector(`input[name="${target}"]`);
        return numberInput;
    },

    //* ======================================== [ OTHERS ] ========================================

    filterFloat:function(evt,input,dec=4)
    {
        // Backspace = 8, Enter = 13, ‘0′ = 48, ‘9′ = 57, ‘.’ = 46, ‘-’ = 43
        var key = window.Event ? evt.which : evt.keyCode;    
        var chark = String.fromCharCode(key);
        var tempValue = input.value+chark;
        if(key >= 48 && key <= 57){
            if(this.filter(tempValue,dec)=== false){
                return false;
            }else{       
                return true;
            }
        }else{
              if(key == 8 || key == 13 || key == 0) {     
                  return true;              
              }else if(key == 46){
                    if(this.filter(tempValue,dec)=== false){
                        return false;
                    }else{       
                        return true;
                    }
              }else{
                  return false;
              }
        }
    },
    filter:function(__val__,dec=4)
    {
    	
    	var regex = "^\([0-9]+\.?[0-9]{0,"+dec+"})$"; 
    	var preg=new RegExp(regex);
        // var preg = /^([0-9]+\.?[0-9]{0,4})$/;  //asi estaba antes ,se corrgio por la var dec
        if(preg.test(__val__) === true){
            return true;
        }else{
           return false;
        }
        
    },
    filterInt:function(evt,input,dec=4)
    {
        // Backspace = 8, Enter = 13, ‘0′ = 48, ‘9′ = 57, ‘.’ = 46, ‘-’ = 43
        var key = window.Event ? evt.which : evt.keyCode;    
        var chark = String.fromCharCode(key);
        var tempValue = input.value+chark;
        if(key >= 48 && key <= 57){
            if(this.filterI(tempValue,dec)=== false){
                return false;
            }else{       
                return true;
            }
        }else{
              if(key == 8 || key == 13 || key == 0) {     
                  return true;              
              }else if(key == 46){
                    if(this.filterI(tempValue,dec)=== false){
                        return false;
                    }else{       
                        return true;
                    }
              }else{
                  return false;
              }
        }
    },
    filterI:function(__val__,dec=4)
    {
        // var preg = /^([0-9]+?[0-9]{0,6})$/; 
		var regex = "^\([0-9]+\?[0-9]{0,"+dec+"})$"; 
    	var preg=new RegExp(regex);
        if(preg.test(__val__) === true){
            return true;
        }else{
           return false;
        }
        
    }
}