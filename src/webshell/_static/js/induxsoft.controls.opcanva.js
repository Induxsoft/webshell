class OpCanva extends HTMLElement
{
    attributes = null;

    scale = 354;
    dpi = 96;
    zoom = 100;
    design = true;
    unit = "cm";
    fit = 1;
    lx = 5000;
    ly = 2500;
    backgroundColor = "";
    backgroundPic = "";
    data = [];
    unitSymbols = ["cm","m","in","ft","yd"]
    clickEvent = null;
    resizingEvent = null;

    _ccntnt = null;
    _ccanva = null;
    _shadow = null;
    _zindex = 100;
    _startX = null;
    _startY = null;
    _unitTemp = null;
    _startWidth = null;
    _startHeight = null;
    _elementResizing = null;
    _equivalenceY = null;
    _equivalenceX = null;
    _convertSizesFromUnit = true;
    _moveSteps = 2;
    _resizeElementsInMouseDevices = true;
    _resizeElementsInTouchDevices = true;

    constructor() 
    {
        super();
        document.addEventListener('DOMContentLoaded', () => this.attributes = this.getAttributeNames());
    }

    static get observedAttributes()
    {
        return  attributes;
    }

    attributeChangeCallback(property, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        this[property] = newValue;
    }

    connectedCallback()
    {
        document.addEventListener('DOMContentLoaded', () => 
        {
            this._shadow    = this.attachShadow({ mode: 'closed' });
            const contnr    = this._createFullElement('div', { id:'OpCanva_contnr', class:'outline' });
            this._ccntnt    = this._createFullElement('div', { id:'OpCanva_ccntnt' }); 
            this._ccanva    = this._createFullElement('div', { id:'OpCanva_ccanva' });
            const cfootr    = this._createFullElement('div', { id:'OpCanva_cfootr', class:'outline' });

            this._loadProperties();

            // CONTROLS
            const zoomCntnr = this._createFullElement('div', { id:'OpCanva_zoomCntnr', class:'d-flex align-items-center wrap outline p-1' });
            const zoomTitle = this._createFullElement('h5', { id:'OpCanva_zoomTitle', class:'text-secondary' });
            const zoomCntrl = this._createFullElement('div', { id:'OpCanva_zoomCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const zoomRange = this._createFullElement('input', { id:'OpCanva_zoomRange', type:'range', min:5, max:500, class:'w-100' });
            const zoomInput = this._createFullElement('input', { id:'OpCanva_zoomInput', type:'number', min:5, max:500, class:'induxsoft-form-control p-1' });
            zoomTitle.textContent = 'Zoom:';
            zoomRange.value = this.zoom;
            zoomInput.value = this.zoom;
            zoomCntrl.appendChild(zoomRange);
            zoomCntrl.appendChild(zoomInput);
            zoomCntnr.appendChild(zoomTitle);
            zoomCntnr.appendChild(zoomCntrl);

            const scalCntnr = this._createFullElement('div', { id:'OpCanva_scalContnr', class:'d-flex align-items-center wrap outline p-1' });
            const scalTitle = this._createFullElement('h5', { id:'OpCanva_scalTitle', class:'text-secondary' });
            const scalCntrl = this._createFullElement('div', { id:'OpCanva_scalCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const scalInput = this._createFullElement('input', { id:'OpCanva_scalInput', type:'number', class:'induxsoft-form-control p-1' });
            scalTitle.textContent = 'Scale:';
            scalInput.value = this.scale;
            scalCntrl.appendChild(scalInput);
            scalCntnr.appendChild(scalTitle);
            scalCntnr.appendChild(scalCntrl);

            const dpiCntnr = this._createFullElement('div', { id:'OpCanva_dpiContnr', class:'d-flex align-items-center wrap outline p-1' });
            const dpiTitle = this._createFullElement('h5', { id:'OpCanva_dpiTitle', class:'text-secondary' });
            const dpiCntrl = this._createFullElement('div', { id:'OpCanva_dpiCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const dpiInput = this._createFullElement('input', { id:'OpCanva_dpiInput', type:'number', class:'induxsoft-form-control p-1' });
            dpiTitle.textContent = 'DPI:';
            dpiInput.value = this.dpi;
            dpiCntrl.appendChild(dpiInput);
            dpiCntnr.appendChild(dpiTitle);
            dpiCntnr.appendChild(dpiCntrl);

            const fitCntnr = this._createFullElement('div', { id:'OpCanva_fitContnr', class:'d-flex align-items-center wrap outline p-1' });
            const fitTitle = this._createFullElement('h5', { id:'OpCanva_fitTitle', class:'text-secondary' });
            const fitCntrl = this._createFullElement('div', { id:'OpCanva_fitCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const fitInput = this._createFullElement('input', { id:'OpCanva_fitInput', type:'number', step:0.1, class:'induxsoft-form-control p-1' });
            fitTitle.textContent = 'Fit:';
            fitInput.value = this.fit;
            fitCntrl.appendChild(fitInput);
            fitCntnr.appendChild(fitTitle);
            fitCntnr.appendChild(fitCntrl);

            const unitCntnr = this._createFullElement('div', { id:'OpCanva_unitCntnr', class:'d-flex align-items-center wrap outline p-1' });
            const unitTitle = this._createFullElement('h5', { id:'OpCanva_unitTitle', class:'text-secondary' });
            const unitCntrl = this._createFullElement('div', { id:'OpCanva_unitCntrl', class:'d-flex align-items-center w-100 gap-1' });
            const unitSlect = this._createFullElement('select', { id:'OpCanva_unitSlect', class:'induxsoft-form-select p-1' });
            unitTitle.textContent = 'Unit:';
            this.unitSymbols.forEach(unitOpt => {
                const option = this._createFullElement('option', { value:unitOpt });
                option.textContent = unitOpt;
                unitSlect.appendChild(option);
            });
            unitSlect.value = this.unit;
            unitCntrl.appendChild(unitSlect);
            unitCntnr.appendChild(unitTitle);
            unitCntnr.appendChild(unitCntrl);

            cfootr.appendChild(unitCntnr);
            cfootr.appendChild(fitCntnr);
            cfootr.appendChild(dpiCntnr);
            cfootr.appendChild(scalCntnr);
            cfootr.appendChild(zoomCntnr);

            // EVENTS
            zoomRange.addEventListener('change', () => {
                this.setZoom(zoomRange.valueAsNumber);
                zoomInput.value = this.zoom;
            });
            zoomInput.addEventListener('change', () => {
                this.setZoom(zoomInput.valueAsNumber);
                zoomRange.value = this.zoom;
            });
            scalInput.addEventListener('change', () => {
                this.setScale(scalInput.value);
            });
            dpiInput.addEventListener('change', () => {
                this.setDpi(dpiInput.value);
            });
            fitInput.addEventListener('change', () => {
                this.setFit(fitInput.value);
            });
            unitSlect.addEventListener('change', () => {
                this.setUnit(unitSlect.value);
            });
            this._ccanva.addEventListener('click', e => {
                let target = e.target;
                this._ccanva.querySelectorAll('.item').forEach(item => item.classList.remove('item-selected'));
                if (target && target.classList.contains('item')) {
                    target.classList.add('item-selected');
                    target.focus();
                }
            }, true);
            
            this._ccanva.addEventListener('keydown', e => {
                e.preventDefault();
            });

            // STYLES
            this._shadow.innerHTML = `
                <style>
                    *{ box-sizing: border-box;margin:0;padding:0; }
                    .d-flex{ display:flex; }
                    .flex-column{ flex-direction: column; }
                    .wrap{ flex-wrap: wrap; }
                    .gap-1{gap:4px;} .gap-2{gap:8px;}
                    .justify-content-start{ justify-content: start; } .justify-content-center{ justify-content: center; } .justify-content-end{ justify-content: end; }
                    .align-items-start{ align-items: start; } .align-items-center{ align-items: center; } .align-items-end{ align-items: end; }
                    .fz-sm{ font-size: .8rem; } .fz-normal{ font-size: 1rem; } .fz-big1{ font-size: 1.2rem; } .fz-big2{ font-size: 1.4rem; }
                    .grow-1{ flex-grow: 1; }
                    .w-100{ width: 100%; }
                    .bordered{ border: 1px solid #DDD; }
                    .noborder{ border: none !important; outline: none !important; }
                    .rounded{ border-radius: 6px; }
                    .rounded-50{ border-radius: 50%; }
                    .p-1{ padding: 4px !important; } .p-2{ padding: 8px; } .p-3{ padding: 12px; } .p-4{ padding: 16px; } .p-5{ padding: 32px; }
                    .ps-1{ padding-left: 4px; }.ps-2{ padding-left: 8px; }.ps-3{ padding-left: 12px; }.ps-4{ padding-left: 16px; }.ps-5{ padding-left: 32px; }
                    .pe-1{ padding-right: 4px; }.pe-2{ padding-right: 8px; }.pe-3{ padding-right: 12px; }.pe-4{ padding-right: 16px; }.pe-5{ padding-right: 32px; }
                    .bg-white{ background-color: #FFF;} .bg-light-gray{ background-color: #F5F5F5; } .bg-transparent{background-color:transparent;}
                    .hide-element{ display: none !important; }
                    .disable-element{ pointer-events: none !important; opacity: .5 !important; }
                    .disable-element-op0{ pointer-events: none !important; opacity: 0 !important; }
                    .outline{ outline: 1px solid #DDD; }
                    .text-secondary{ color: #888; }

                    #OpCanva_contnr{ width: 100%; height: 100%; display: flex; flex-direction: column; }
                    #OpCanva_ccntnt{ width: 100%; height: 100%; overflow:scroll; position: relative; flex-grow: 1; }
                    #OpCanva_ccanva{ overflow:hidden; position: relative; border: 8px solid #DDD; background-repeat: no-repeat; background-size: contain; }
                    #OpCanva_cfootr{ width: 100%; display: flex; flex-wrap: wrap; }
                    #OpCanva_zoomInput,#OpCanva_dpiInput,#OpCanva_fitInput,#OpCanva_unitSlect,#OpCanva_scalInput{ width: 4.5rem; text-align: center; flex-grow: 1; }
                    
                    .item{ position:absolute; background-repeat: no-repeat; background-size: contain; /*outline: 1px solid rgba(180,180,180,.3);*/ }
                    .resizer-point{ width: 12px;height: 12px; background-color: transparent;z-index: 10;position: absolute;right: -6px;bottom: -6px;cursor: crosshair; }
                    .move-point{ width: 50%;height: 16px;background-color: transparent;color:transparent;z-index: 10;position: absolute; top: -8px; left: 25%; cursor: move; }
                    .resizer-point:active,.resizer-point:hover{ background-color: rgba(245,250,255,.8); outline: 1px solid #000; }
                    .move-point:active, .move-point:hover{ background-color: rgba(245,250,255,.8); color: #888; outline: 1px solid #000; }
                    .caption-container{ position: absolute; top: 0; left: 0; height: 100%; width: 100%; font-size: 1em; }

                    .induxsoft-form-control{border: none; outline:1px solid #ced4da;display: block;width: 100%;padding: 0.375rem 0.75rem !important;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-clip: padding-box;appearance: none;transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                    }
                    .induxsoft-form-control:disabled, .induxsoft-form-control[readonly] {background-color: #e9ecef;opacity: 1;
                    }
                    .induxsoft-form-select {display: block;width: 100%;padding: 0.375rem 2.25rem 0.375rem 0.75rem !important;-moz-padding-start: calc(0.75rem - 3px);font-size: 1rem;font-weight: 400;line-height: 1.5;color: #212529;background-color: #fff;background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");background-repeat: no-repeat;background-position: right 0.75rem center;background-size: 16px 12px;border: none;outline:1px solid #ced4da;-webkit-appearance: none;-moz-appearance: none;appearance: none;
                    }

                    .resizer{ background-color: transparent; position: absolute; width: 10px; height: 10px; }
                    /*.resizer-top{ width: 100%; height: 8px; top: -4px; left: 0px; cursor: n-resize; }
                    .resizer-right{ width: 8px; height: 100%; top: 0px; right: -4px; cursor: e-resize; }
                    .resizer-bottom{ width: 100%; height: 8px; bottom: -4px; left: 0px; cursor: n-resize; }
                    .resizer-left{ width: 8px; height: 100%; top: 0px; left: -4px; cursor: e-resize; }*/

                    .resizer-top{ top: -5px; left: 11%; cursor: n-resize; }
                    .resizer-right{ margin:auto; top: 0; bottom: 0; right: -5px; cursor: e-resize; }
                    .resizer-bottom{ margin:auto; bottom: -5px; left: 0; right: 0; cursor: n-resize; }
                    .resizer-left{ margin:auto; top: 0; bottom: 0; left: -5px; cursor: e-resize; }

                    .resizer-corner{ cursor: crosshair; }
                    .resizer-top-left{ top: -5px; left: -5px; }
                    .resizer-top-right{ top: -5px; right: -5px; }
                    .resizer-bottom-right{ bottom: -5px; right: -5px; }
                    .resizer-bottom-left{ bottom: -5px; left: -5px; }

                    .item:hover, .item-selected { outline: 1px solid #000; & .move-point, .resizer { background-color: rgba(245,250,255,.8); color: #000; outline: 1px solid #000; }}
                    .item-selected{ outline: 2px solid #000 !important; }
                </style>
            `;

            this._ccntnt.appendChild(this._ccanva);
            contnr.appendChild(this._ccntnt);
            contnr.appendChild(cfootr);

            this.style.width = "100%";
            this.style.height = "100%";
            this._shadow.appendChild(contnr);

            this._printItems();
        });
    }

    // ========== PREPARE ELEMENTS

    /**
     * @param {string} tagName Nombre de etiqueta.
     * @param {object} attributes Objeto que representan los atributos del elemento, ej: {id:'miElement',class:'mi-element'}
     * @returns Retorna un **nuevo elemento HTML**
     */
    _createFullElement(tagName="div", attributes={})
    {
        const elem = document.createElement(tagName);
        const keys = Object.keys(attributes);
        keys.forEach(key => elem.setAttribute(key, attributes[key]));
        return elem;
    }
    initMoveAndSizableElement=()=>
    {
        let offset = [0,0];
        let isdown = false;
        let moving = false;
        let current = null;

        let elements = this._shadow.querySelectorAll('.item');

        let resizeIn = [];
        if (this._resizeElementsInMouseDevices) resizeIn.push("mousedown");
        if (this._resizeElementsInTouchDevices) resizeIn.push("touchstart");

        elements.forEach(item => 
        {
            if (!this._parseBool(item.getAttribute('locked')))
            {
                // Move
                let movePoint = this._createFullElement('div', { class:'move-point d-flex align-items-center justify-content-center' });
                movePoint.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-arrows-move" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z"/></svg>`
                item.appendChild(movePoint);

                let mouseDown = (isMobile = false) => {
                    return (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        isdown = true;
                        moving = false;
                        offset = [item.offsetLeft - (isMobile ? e.touches[0].pageX : e.clientX), item.offsetTop - (isMobile ? e.touches[0].pageY : e.clientY)];
                        item.style.zIndex = '' + ++this._zindex;
                        current = item;
                        item.click();
                    }
                }

                movePoint.addEventListener('mousedown', mouseDown(false), true);
                movePoint.addEventListener('touchstart', mouseDown(true), true);
                item.onmousedown = mouseDown(false);
                item.ontouchstart = mouseDown(true);
            }

            if (this._parseBool(item.getAttribute('sizable')))
            {
                // Sizable
                const resizer_top = this._createFullElement('div', { class:'resizer resizer-top' });
                const resizer_rgt = this._createFullElement('div', { class:'resizer resizer-right' });
                const resizer_btm = this._createFullElement('div', { class:'resizer resizer-bottom' });
                const resizer_lft = this._createFullElement('div', { class:'resizer resizer-left' });
                const rzr_top_lft = this._createFullElement('div', { class:'resizer resizer-corner resizer-top-left' });
                const rzr_top_rgt = this._createFullElement('div', { class:'resizer resizer-corner resizer-top-right' });
                const rzr_btm_rgt = this._createFullElement('div', { class:'resizer resizer-corner resizer-bottom-right' });
                const rzr_btm_lft = this._createFullElement('div', { class:'resizer resizer-corner resizer-bottom-left' });

                let resizers = [resizer_top, resizer_rgt, resizer_btm, resizer_lft, rzr_top_lft, rzr_top_rgt, rzr_btm_rgt, rzr_btm_lft];

                resizers.forEach(r => item.appendChild(r));

                resizeIn.forEach(eName => {
                    resizer_top.addEventListener(eName, this._resizeYNegative(false, (eName=='touchstart')), false);
                    resizer_rgt.addEventListener(eName, this._resizeXPositive(false, (eName=='touchstart')), false);
                    resizer_btm.addEventListener(eName, this._resizeYPositive(false, (eName=='touchstart')), false);
                    resizer_lft.addEventListener(eName, this._resizeXNegative(false, (eName=='touchstart')), false);
                    rzr_top_lft.addEventListener(eName, this._resizeXNegative(false, (eName=='touchstart')), false); rzr_top_lft.addEventListener(eName, this._resizeYNegative(true, (eName=='touchstart')), false);
                    rzr_top_rgt.addEventListener(eName, this._resizeXPositive(false, (eName=='touchstart')), false); rzr_top_rgt.addEventListener(eName, this._resizeYNegative(true, (eName=='touchstart')), false);
                    rzr_btm_rgt.addEventListener(eName, this._resizeXPositive(false, (eName=='touchstart')), false); rzr_btm_rgt.addEventListener(eName, this._resizeYPositive(true, (eName=='touchstart')), false);
                    rzr_btm_lft.addEventListener(eName, this._resizeXNegative(false, (eName=='touchstart')), false); rzr_btm_lft.addEventListener(eName, this._resizeYPositive(true, (eName=='touchstart')), false);
                });
            }

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.clickEvent){
                    let dataItem = this.getItem(item.getAttribute('id'));
                    this.clickEvent(dataItem);
                }
            },true);
            item.addEventListener('keyup', e => {
                e.preventDefault();
                e.stopPropagation();
                switch(e.key)
                {
                    case "ArrowRight":
                    {
                        item.style.left = `${(item.offsetLeft + this._moveSteps)}px`;
                        this._updateItem(item);
                        break;
                    }
                    case "ArrowDown":
                    {
                        item.style.top = `${(item.offsetTop + this._moveSteps)}px`;
                        this._updateItem(item);
                        break;
                    }
                    case "ArrowLeft":
                    {
                        item.style.left = `${(item.offsetLeft - this._moveSteps)}px`;
                        this._updateItem(item);
                        break;
                    }
                    case "ArrowUp":
                    {
                        item.style.top = `${(item.offsetTop - this._moveSteps)}px`;
                        this._updateItem(item);
                        break;
                    }
                }
            });
        });

        // Move
        const mouseup = () => {
            return (e) => {
                isdown = false;
                if (moving && current) this._updateItem(current)
                moving = false;
                current = null;
            }
        }
        const mousemove = (isMobile = false) => {
            return (e) => {
                if (isdown && current)
                {
                    moving = true;
                    let left = ((isMobile ? e.touches[0].pageX : e.clientX) + offset[0]);
                    let top = ((isMobile ? e.touches[0].pageY : e.clientY) + offset[1]);
                    current.style.left = (left > 0 ? left : 0) + 'px';
                    current.style.top = (top > 0 ? top : 0) + 'px';
                }
            }
        }
        
        this._ccanva.onmouseup = mouseup();
        this._ccanva.ontouchend = mouseup();
        this._ccanva.onmousemove = mousemove(false);
        this._ccanva.ontouchmove = mousemove(true);
    }
    _parseBool=(value, _default = false)=>
    {
        if (value) return (value.toString().toLowerCase() === 'true');
        return _default;
    }
    _parseInt=(value, _default = 0)=>
    {
        if (value != null && value.toString().trim() != '' && isFinite(value.toString().trim()) && !isNaN(value.toString().trim()))
            return Number(value.toString().trim());
        return _default;
    }
    _loadProperties=()=>
    {
        this.setScale(this.getAttribute('scale'), false);
        this.setDpi(this.getAttribute('dpi'), false);
        this.setZoom(this.getAttribute('zoom'), false);
        this.setUnit(this.getAttribute('unit'), false);
        this.setFit(this.getAttribute('fit'), false);
        this.setLXY(this.getAttribute('lx'), this.getAttribute('ly'), false);
        
        this.backgroundColor = (this.getAttribute('background-color') ?? '#FFF');
        this.backgroundPic = (this.getAttribute('background-pic') ?? '');
        this.design = this._parseBool(this.getAttribute('design'), this.design);

        this._ccanva.style.backgroundColor = this.backgroundColor;

        if (this.backgroundPic.trim() != '') this._ccanva.style.backgroundImage = `url(${this.backgroundPic})`;

        if (this.hasAttribute('data') && this.getAttribute('data').trim())
        {
            let data = [];
            try { data = JSON.parse(this.getAttribute('data')); }
            catch(error) { alert('El valor del atributo "data" no contiene un formato JSON válido. ' + error); }
            finally { this.data = data; }
        }
    }
    _generateUUID=()=>
    {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, 
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ========== RESIZE FUNCTIONS

    _getIntStyle=(element, key)=>
    {
        return parseInt(window.getComputedStyle(element).getPropertyValue(key));
    }
    _resizeXPositive=(preventUpdate=false, isMobile=false)=>
    {
        let offsetX = 0;
        let target = null;
        let data = null;

        let elementDrag = (event) => 
        {
            if (target)
            {
                const clientX = (isMobile ? event.touches[0].pageX : event.clientX);
                let x = (clientX - target.offsetLeft - offsetX);
                if (x < 1) x = 1;
                target.style.width = `${x}px`;
                
                if (this.resizingEvent)
                {
                    let lx = this._getLXCalc(target);
                    let ly = this._getLYCalc(target);
                    this.resizingEvent(data, lx, ly);
                }
            }
        }
        let closeDragElement = () => 
        {
            this.removeEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.removeEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
            if (target && !preventUpdate) this._updateItem(target);
            target = null;
            data = null;
        }
        let dragMouseDown = (event) => 
        {
            event.stopPropagation();
            event.preventDefault();
            target = event.target.parentElement;
            if (!data) data = this.getItem(target.getAttribute('id'));

            const clientX = (isMobile ? event.touches[0].pageX : event.clientX);
            offsetX = (clientX - target.offsetLeft - this._getIntStyle(target, 'width'));
            this.addEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.addEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
        }
        return dragMouseDown;
    }
    _resizeYPositive=(preventUpdate=false, isMobile=false)=>
    {
        let offsetY = 0;
        let target = null;
        let data = null;
        
        let elementDrag = (event) => 
        {
            if (target)
            {
                const clientY = (isMobile ? event.touches[0].pageY : event.clientY);
                let y = (clientY - target.offsetTop - offsetY);
                if (y < 1) y = 1
                target.style.height = `${y}px`;
                
                if (this.resizingEvent)
                {
                    let lx = this._getLXCalc(target);
                    let ly = this._getLYCalc(target);
                    this.resizingEvent(data, lx, ly);
                }
            }
        }
        let closeDragElement = () => 
        {
            this.removeEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.removeEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
            if (target && !preventUpdate) this._updateItem(target);
            target = null;
            data = null;
        }
        let dragMouseDown = (event) => 
        {
            event.preventDefault();
            event.stopPropagation();
            target = event.target.parentElement;
            if (!data) data = this.getItem(target.getAttribute('id'));

            const clientY = (isMobile ? event.touches[0].pageY : event.clientY);
            offsetY = (clientY - target.offsetTop - this._getIntStyle(target, 'height'));
            this.addEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.addEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
        }
        return dragMouseDown;
    }
    _resizeXNegative=(preventUpdate=false, isMobile=false)=>
    {
        let offsetX = 0;
        let startX = 0;
        let startW = 0;
        let maxX = 0;
        let target = null;
        let data = null;

        let elementDrag = (event) =>
        {
            const clientX = (isMobile ? event.touches[0].pageX : event.clientX);
            let x = (clientX - offsetX);
            let w = (startW + startX - x);
            if (w < 1) w = 1;
            if (x > maxX) x = maxX;
            
            if (target)
            {
                target.style.left = `${x}px`;
                target.style.width = `${w}px`;

                if (this.resizingEvent)
                {
                    let lx = this._getLXCalc(target);
                    let ly = this._getLYCalc(target);
                    this.resizingEvent(data, lx, ly);
                }
            }
        }
        let closeDragElement = () => 
        {
            this.removeEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.removeEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
            if (target && !preventUpdate) this._updateItem(target);
            target = null;
            data = null;
        }
        let dragMouseDown = (event) =>
        {
            event.preventDefault();
            event.stopPropagation();
            target = event.target.parentElement;
            if (!data) data = this.getItem(target.getAttribute('id'));

            const clientX = (isMobile ? event.touches[0].pageX : event.clientX);
            startX = this._getIntStyle(target, 'left');
            startW = this._getIntStyle(target, 'width');
            offsetX = (clientX - startX);
            maxX = (startX + startW - 1);

            this.addEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.addEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
        }

        return dragMouseDown;
    }
    _resizeYNegative=(preventUpdate=false, isMobile=false)=>
    {
        let offsetY = 0;
        let startY = 0;
        let startH = 0;
        let maxY = 0;
        let target = null;
        let data = null;

        let elementDrag = (event) =>
        {
            const clientY = (isMobile ? event.touches[0].pageY : event.clientY);
            let y = (clientY - offsetY);
            let h = (startH + startY - y);
            if (h < 1) h = 1;
            if (y > maxY) y = maxY;
            
            if (target)
            {
                target.style.top = `${y}px`;
                target.style.height = `${h}px`;

                if (this.resizingEvent)
                {
                    let lx = this._getLXCalc(target);
                    let ly = this._getLYCalc(target);
                    this.resizingEvent(data, lx, ly);
                }
            }
        }
        let closeDragElement = () => 
        {
            this.removeEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.removeEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
            if (target && !preventUpdate) this._updateItem(target);
            target = null;
            data = null;
        }
        let dragMouseDown = (event) =>
        {
            event.preventDefault();
            event.stopPropagation();
            target = event.target.parentElement;
            if (!data) data = this.getItem(target.getAttribute('id'));

            const clientY = (isMobile ? event.touches[0].pageY : event.clientY);
            startY = this._getIntStyle(target, 'top');
            startH = this._getIntStyle(target, 'height');
            offsetY = (clientY - startY);
            maxY = (startY + startH - 1);

            this.addEventListener((isMobile ? 'touchend' : 'mouseup'), closeDragElement);
            this.addEventListener((isMobile ? 'touchmove' : 'mousemove'), elementDrag);
        }

        return dragMouseDown;
    }
    _getLXCalc=(element)=>
    {
        const w = (Number(document.defaultView.getComputedStyle(element).width.replace(/[^0-9.]+/g, '')));
        const lx = (Number(element.getAttribute('equivalencelx')) > 0 ? Number(element.getAttribute('equivalencelx')) : 1);
        return (lx * (w > 0 ? w : 1));
    }
    _getLYCalc=(element)=>
    {
        const h = (Number(document.defaultView.getComputedStyle(element).height.replace(/[^0-9.]+/g, '')));     
        const ly = (Number(element.getAttribute('equivalencely')) > 0 ? Number(element.getAttribute('equivalencely')) : 1);
        return (ly * (h > 0 ? h : 1));
    }

    // ========== PRINT DATA

    _updateItem=(element)=>{
        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => 
            {
                item.focus = false;
                
                if (item.id == element.id)
                {
                    const x = (Number(element.getAttribute('equivalencex')) > 0 ? Number(element.getAttribute('equivalencex')) : 1);
                    const y = (Number(element.getAttribute('equivalencex')) > 0 ? Number(element.getAttribute('equivalencex')) : 1);
                    const w = (Number(document.defaultView.getComputedStyle(element).width.replace(/[^0-9.]+/g, '')));
                    const h = (Number(document.defaultView.getComputedStyle(element).height.replace(/[^0-9.]+/g, '')));
                    const lx = (Number(element.getAttribute('equivalencelx')) > 0 ? Number(element.getAttribute('equivalencelx')) : 1);
                    const ly = (Number(element.getAttribute('equivalencely')) > 0 ? Number(element.getAttribute('equivalencely')) : 1);

                    const new_x = (x * (element.offsetLeft > 0 ? element.offsetLeft : 1));
                    const new_y = (y * (element.offsetTop > 0 ? element.offsetTop : 1 ));
                    const newlx = (lx * (w > 0 ? w : 1));
                    const newly = (ly * (h > 0 ? h : 1));

                    let aplyUpdate = true;

                    if (!this._parseBool(item.overlapping??'false'))
                    {
                        this.data.forEach(itm => 
                        {
                            if (aplyUpdate && item.id != itm.id)
                            {
                                // vertices partiendo de la posicion top-left hacia las manecillas del reloj
                                let movingItm = 
                                {
                                    vrtc1 : { x: new_x, y: new_y },
                                    vrtc2 : { x: (new_x + newlx), y: new_y },
                                    vrtc3 : { x: (new_x + newlx), y: (new_y + newly) },
                                    vrtc4 : { x: new_x, y: (new_y + newly) }
                                }
                                let normalItm = 
                                {
                                    vrtc1 : { x: itm.x, y: itm.y },
                                    vrtc2 : { x: (itm.x + itm.lx), y: itm.y },
                                    vrtc3 : { x: (itm.x + itm.lx), y: (itm.y + itm.ly) },
                                    vrtc4 : { x: itm.x, y: (itm.y + itm.ly) }
                                }
                                /**
                                 * Si no se cumplen ninguno de los siguientes casos están superpuestos de alguna manera 
                                 * y no se aplica el cambio. (A = El item en movimiento, B = Otro item del canva):
                                 * -> A está completamente a la izquierda de B
                                 * -> A está completamente a la derecha de B
                                 * -> A está completamente arriba de B
                                 * -> A está complemante abajo de B
                                 */
                                if (!(movingItm.vrtc2.x <= normalItm.vrtc1.x || movingItm.vrtc1.x >= normalItm.vrtc2.x ||
                                    movingItm.vrtc4.y <= normalItm.vrtc1.y || movingItm.vrtc1.y >= normalItm.vrtc4.y)) {
                                    aplyUpdate = false;
                                }
                            }
                        });
                    }

                    if (aplyUpdate)
                    {
                        item.x = new_x;
                        item.y = new_y;
                        item.lx = newlx;
                        item.ly = newly;
                        item.index = document.defaultView.getComputedStyle(element).zIndex;
                    }
                    item.focus = element.classList.contains('item-selected');
                }
            });
            this._refreshView();
        }
    }
    _refreshView=()=>{
        this._printItems();
    }
    _printItems=()=>{
        if (this._ccanva) this._ccanva.innerHTML = '';

        if (this._convertSizesFromUnit && this._unitTemp && this._unitTemp != this.unit)
        {
            this.ly = (this._cmXUnitTemp(this.ly) / this._cmXUnit(1));
            this.lx = (this._cmXUnitTemp(this.lx) / this._cmXUnit(1));
        }

        this._ccanva.style.height = `${this._zoomVal(this._scaleCalc(this.ly))}px`;
        this._ccanva.style.width = `${this._zoomVal(this._scaleCalc(this.lx))}px`;

        if (this.data && this.data.length > 0)
        {
            this.data.forEach(item => 
            {
                if (this._convertSizesFromUnit && this._unitTemp && this._unitTemp != this.unit)
                {
                    item.lx = (this._cmXUnitTemp(item.lx) / this._cmXUnit(1));
                    item.ly = (this._cmXUnitTemp(item.ly) / this._cmXUnit(1));
                    item.x = (this._cmXUnitTemp(item.x) / this._cmXUnit(1));
                    item.y = (this._cmXUnitTemp(item.y) / this._cmXUnit(1));
                }

                const width = this._sizeCalc(item.lx);
                const height = this._sizeCalc(item.ly);
                const positionX = this._sizeCalc((item.x > 0 ? item.x : 1));
                const positionY = this._sizeCalc((item.y > 0 ? item.y : 1));

                const equivlx = (item.lx/width);
                const equivly = (item.ly/height);
                const equivx = this._parseInt((item.x > 0 ? item.x : 1)/positionX);
                const equivy = this._parseInt((item.y > 0 ? item.y : 1)/positionY);
                
                const element = this._createFullElement('div', { 
                    id: (item.id ?? this._generateUUID()),
                    style:` top:${positionY}px; left:${positionX}px; width:${width}px; height:${height}px; z-index:${item.index ?? 1};`, 
                    class:'item d-flex align-items-center justify-content-center',
                    equivalencelx:`${equivlx}`,
                    equivalencely:`${equivly}`,
                    equivalencex: `${(equivx > 0 ? equivx : equivlx)}`,
                    equivalencey: `${(equivy > 0 ? equivy : equivy)}`,
                    locked: this._parseBool(item.locked),
                    sizable: this._parseBool(item.sizable),
                    title:`Size: ${item.lx.toFixed(2)}${this.unit} x ${item.ly.toFixed(2)}${this.unit}, X: ${item.x.toFixed(2)}, Y: ${item.y.toFixed(2)}`,
                    tabindex: '0'
                });

                element.innerHTML = (item.html ?? '');
                element.style.backgroundColor = (item['background-color'] ?? 'transparent')
                element.style.color = (item['color'] ?? '#000');

                if (item['background-image'] && item['background-image'].trim() != '' )
                    element.style.backgroundImage = `url(${item['background-image']})`;

                this._ccanva.appendChild(element);
                if (item.focus){
                    element.classList.add('item-selected');
                    element.focus();
                }
            });
        }
        if (this.design) this.initMoveAndSizableElement();
        this._unitTemp = this.unit;
    }

    // ========== CALCULATIONS

    _sizeCalc=(v)=>
    {
        let size = this._scaleCalc(v);
        return this._zoomVal(this._fitCalc(size).toFixed(0));
    }
    _fitCalc=(v)=>
    {
        return ((v / this.fit).toFixed(0) * this.fit);
    }
    _scaleCalc=(v)=>
    {
        v = this._cmXUnit(v);
        let px = (v * this._dpiXcm())
        return (px / this.scale);
    }
    _cmXUnit=(v)=>
    {
        switch (this.unit)
        {
            case "cm": v = (v * 1); break;
            case "m":  v = (v * 100); break;
            case "in": v = (v * 2.54); break;
            case "ft": v = (v * 30.48); break;
            case "yd": v = (v * 91.44); break;
        }
        return v;
    }
    _cmXUnitTemp=(v)=>
    {
        switch (this._unitTemp)
        {
            case "cm": v = (v * 1); break;
            case "m":  v = (v * 100); break;
            case "in": v = (v * 2.54); break;
            case "ft": v = (v * 30.48); break;
            case "yd": v = (v * 91.44); break;
        }
        return v;
    }
    _dpiXcm=()=>
    {
        const inch = 2.54;
        return (this.dpi / inch).toFixed(0);
    }
    _zoomVal=(v)=>
    {
        return ((this.zoom / 100) * v);
    }

    // ========== PUBLIC FUNCTIONS

    setData=(data)=>
    {
        try {
            this.data = data;
            this._refreshView();
        } catch (error) {
            alert(error);
        }
    }
    getData=()=>
    {
        return this.data;
    }
    getItem=(id)=>
    {
        return (this.data?.find(item => item.id == id) ?? null);
    }
    addItem=(obj)=>
    {
        this.data.push(obj);
        this._refreshView();
    }
    removeItem=(id)=>
    {
        this.data.forEach((item, index) => {
            if (item.id === id)
                this.data.splice(index, 1);
        });
        this._refreshView();
    }
    setScale=(scale, refreshView = true)=>
    {
        this.scale = this._parseInt(scale, this.scale);
        if (refreshView) this._refreshView();
    }
    getScale=()=>
    {
        return this.scale;
    }
    setDpi=(dpi, refreshView = true)=>
    {
        this.dpi = this._parseInt(dpi, this.dpi);
        if (refreshView) this._refreshView();
    }
    getDpi=()=>
    {
        return this.dpi;
    }
    setUnit=(unitSymbol, refreshView = true)=>
    {
        if (this.unitSymbols.includes(unitSymbol))
        {
            this.unit = unitSymbol;
            if (refreshView) this._refreshView();
        }
    }
    getUnit=()=>
    {
        return this.unit;
    }
    setZoom=(z, refreshView = true)=>
    {
        this.zoom = this._parseInt(z, this.zoom);
        if (refreshView) this._refreshView();
    }
    getZoom=()=>
    {
        return this.zoom;
    }
    setFit=(fit, refreshView = true)=>
    {
        this.fit = this._parseInt(fit, this.fit);
        if (refreshView) this._refreshView();
    }
    getFit=()=>
    {
        return this.fit;
    }
    setLXY=(lx,ly, refreshView = true)=>
    {
        this.lx = this._parseInt(lx, this.lx);
        this.ly = this._parseInt(ly, this.ly);
        if (refreshView) this._refreshView();
    }
    getLX=()=>
    {
        return this.lx;
    }
    getLY=()=>
    {
        return this.ly;
    }
}

customElements.define('op-canva', OpCanva);