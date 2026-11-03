class CustomSchedule extends HTMLElement
{
    attributes = null;
    events = [];
    view = 'week';
    day = 'now';
    breaks = '';
    holidays = '';
    weekend = 'saturday,sunday';
    start_weekday = 'sunday';
    start_lab_hour = 0;
    end_lab_hour = 24;
    interval = 30;
    increment = 0;
    min_duration = 15;
    max_duration = 60;

    Const = {
        Events: {
            CellClick:'cellclick',
            CellDoubleClick:'celldblclick',
            ItemClick:'itemclick',
            ItemDoubleClick:'itemdblclick',
            ItemMoving:'itemmoving',
            ItemMoved:'itemmoved',
            ItemResizing:'itemresizing',
            ItemResized:'itemresized',
            BeforeCreateItem:'beforecreateitem',
            ItemCreated:'itemcreated',
            BeforeUpdateItem:'beforeupdateitem',
            ItemUpdated:'itemupdated',
            BeforeDeleteItem:'beforedeleteitem',
            ItemDeleted:'itemdeleted'
        }
    };

    #weekdays = [
        {en:'sunday',es:'domingo'},
        {en:'monday',es:'lunes'},
        {en:'tuesday',es:'martes'},
        {en:'wednesday',es:'miércoles'},
        {en:'thursday',es:'jueves'},
        {en:'friday',es:'viernes'},
        {en:'saturday',es:'sábado'}
    ];
    #view_range = [];
    #shadow = null;
    #events_backup = null;
    #table_layer = null;
    #tasks_layer = null;
    #resizeObserver = null;

    constructor() {
        super();
        this.#deepFreeze(this.Const);
        this.#shadow = this.attachShadow({mode:'closed'});
        this.#shadow.innerHTML = `
        <style>
            table {
                width: 100%;
                font-size: 1rem;
                /* table-layout: fixed; */
                border-spacing: 1px;
                border-collapse: collapse;
            }
            thead {
                position: sticky;
                top: 0;
                z-index: 15;
                text-transform: capitalize;
            }
            thead tr th:nth-child(1) {
                position: sticky;
                left: 0;
                top: 0;
                z-index: 15;
            }
            thead th label {
                display: block;
                font-weight: bold;
            }
            thead th small {
                font-size: .8rem;
            }
            tbody tr th {
                position: sticky;
                left: 0;
                z-index: 10;
            }
            tr th {
                background-color: #7532F9;
                color: #FFFFFF;
                padding: 4px 8px;
                outline: 1px solid #DDD;
                font-weight: normal;
                position: relative;
                cursor: pointer;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                -o-text-overflow: ellipsis;
            }
            tr td {
                height: 1.4rem;
                outline: 1px solid #EDEDED;
                position: relative;
                padding: 4px;
            }
            tbody tr { position: relative; }
            tbody tr:hover { background-color: #F5F5F5; }
            td.breaks,
            td.weekend,
            td.holidays
            {
                /* pointer-events: none; */
                background-color: #e9ecef;
                opacity: 1;
                outline: 1px solid #FFF;
            }
            td[data-datetime] {
                min-width: 100px;
                /* max-width: 1fr; */
                word-break: break-word;
            }
            .now {
                background-color: purple;
            }
            .event-task {
                position: absolute;
                pointer-events: auto;
                /* box-sizing: border-box; */
                font-size: 0.75rem;
                border-radius: 4px;
                box-shadow: 1px 1px 4px rgba(0,0,0,0.1);
                padding: 2px 4px;
                overflow: hidden;
                cursor: pointer;
                z-index: 5;
            }
            .event-task .content {
                white-space: pre-wrap;
            }
            .event-task.dragging {
                opacity: 0.7;
                cursor: grabbing;
            }
            .event-task.selected {
                box-shadow: 1px 1px 4px #7532F9;
            }
            .resize-handle {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                cursor: ns-resize;
                background-color: #F8F8F8;
            }
            .resize-handle:hover {
                background-color: #DDD;
            }
            #schedule-wrapper {
                position: relative;
                overflow: auto;
                height: 100%;
            }
            #table-layer {
                position: relative;
                padding-bottom: .25rem;
                /* El 'z-index' evita que los <th> de la tabla se sobrepongan a los eventos */
            }
            #tasks-layer {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 5;
                pointer-events: none;
            }

            @media (max-width: 575px)
            {
                td[data-datetime] {
                    min-width: 150px;
                }
                /* thead tr th:nth-child(1), tbody tr th { display: none; }
                tbody tr td::before {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    content: attr(data-time);
                    color: #6c757d;
                } */
            }
            /* Small devices (landscape phones, 576px and up) */
            @media (min-width: 576px) { }
            /* Medium devices (tablets, 768px and up) */
            @media (min-width: 768px) { }
            /* Large devices (desktops, 992px and up) */
            @media (min-width: 992px) { }
        </style>

        <div id="schedule-wrapper">
            <div id="table-layer"></div>
            <div id="tasks-layer"></div>
        </div>
        `;
    }
    // Observa atributos a cambiar
    static get observedAttributes() {
        return ['events','view','day','breaks','holidays','weekend','start-weekday','start-lab-hour','end-lab-hour', 'interval', 'increment', 'min-duration', 'max-duration'];
    }
    // Reacciona a cambios de atributo
    attributeChangedCallback(attribute, oldValue, newValue)
    {
        if (newValue === oldValue) return;
        
        let property = attribute.replaceAll('-','_');
        if (property in this)
        {
            if (typeof this[property] == 'string') this[property] = newValue;
            else if (typeof this[property] == 'number') this[property] = Number(newValue);
            else if (typeof this[property] == 'boolean') this[property] = this.#boolval(newValue);
            else if (typeof this[property] == 'object') this[property] = JSON.parse(newValue);

            // console.log(`Atributo cambiado: ${attribute} de ${oldValue} a ${newValue}`);
        }

        switch (attribute) {
            case 'events':
                this.renderEvents();
                break;
            case 'view':
            case 'day':
            case 'start-weekday':
            case 'start-lab-hour':
            case 'end-lab-hour':
            case 'interval':
                this.setScheduleTable();
                this.renderEvents();
                if (attribute=='day' || attribute=='interval') {
                    this.setReadonlyStyles();
                }
                break;
            case 'breaks':
            case 'weekend':
            case 'holidays':
                this.setReadonlyStyles();
                break;
        }
    }
    // Se llama cuando se inserta en el DOM
    connectedCallback()
    {
        this.attributes = this.getAttributeNames();
        this.#table_layer = this.#shadow.querySelector('#table-layer');
        this.#tasks_layer = this.#shadow.querySelector('#tasks-layer');

        const wrapper = this.#shadow.querySelector('#schedule-wrapper');
        
        this.setScheduleTable();
        this.renderEvents();
        this.#setControlStyles();
        
        this.#resizeObserver = new ResizeObserver(() => this.#onResizeOrScroll());
        this.#resizeObserver.observe(wrapper);
    }
    // Se llama cuando se quita del DOM
    disconnectedCallback() {
        if (this.#resizeObserver) {
            this.#resizeObserver.disconnect();
            this.#resizeObserver = null;
        }
    }

    //#region Métodos públicos
    setScheduleTable()
    {
        if (!this.#table_layer) return;
        this.#table_layer.innerHTML = '';

        const table = document.createElement('table');
        const columns = this.#getColumns();
        const weekdays = this.getWeekdays();

        this.#view_range = [columns[0], columns[columns.length - 1]];

        this.#setScheduleHead(table,columns,weekdays);
        this.#setScheduleBody(table,columns,weekdays);

        this.#table_layer.appendChild(table);
    }

    renderEvents()
    {
        if (!this.#tasks_layer) return;
        this.#tasks_layer.innerHTML = '';
        
        this.events.forEach(event => {
            this.renderEvent(event);
        });
    }

    renderEvent(event)
    {
        if (!event || !this.#tasks_layer) return false;
        if (!this.bwnDate(this.dateFormat(event.start), this.#view_range[0], this.#view_range[1])) return false;
        const taskEl = this.#createTaskElement(event);
        if (!taskEl) return false;
            
        this.#tasks_layer.appendChild(taskEl);
        this.#setTaskEvents(taskEl,event);
        return true;
    }

    isValidEvent(event)
    {
        if (!event) return false;
        if (typeof event != 'object') return false;
        if (Array.isArray(event)) return false;

        const required = ['id','start','duration'];
        const keys = Object.keys(event);

        if (keys.length < required.length) return false;
        // Verificar existencia de propiedades requeridas
        return required.every(field => keys.includes(field));
    }

    save(newEvent)
    {
        if (!this.isValidEvent(newEvent)) return;
        const index = this.events.findIndex(e => e.id == newEvent.id);
        
        if (index == -1)
        {
            this.renderEvent(newEvent);
            this.events.push(newEvent);
        }
        else
        {
            if (this.#updateTaskElement(newEvent)) {
                this.events[index] = newEvent;
            }
        }
    }

    delete(id)
    {
        if (!this.events || !id) return false;

        const index = this.events.findIndex(e => e.id == id);
        if (index == -1) return false;

        const eventArgs = {
            index: index,
            item: this.events[index]
        };

        const BeforeDeleteItem = new CustomEvent(this.Const.Events.BeforeDeleteItem, {
            bubbles: true,
            cancelable: true,
            detail: eventArgs
        });
        const ok = this.dispatchEvent(BeforeDeleteItem);
        if (!ok) return false;

        const element = this.getTaskElementById(eventArgs.item.id);
        this.events.splice(index,1);
        if (element) element.remove();

        this.dispatchEvent(new CustomEvent(this.Const.Events.ItemDeleted, { detail: eventArgs }));
        return true;
    }

    setReadonlyStyles()
    {
        let weekend = (this.weekend.trim() == "") ? '' : 'td.'+this.weekend.replaceAll(' ','').replaceAll(',',',td.')+',';
        let holidays = '';
        let breaks = '';

        if (this.holidays.trim() != "")
        {
            const isDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v);
            const isMMdd = v => /^\d{2}-\d{2}$/.test(v);
            const temp = 'td[data-date="@"],';
            const year = (this.day=='now' ? new Date() : new Date(this.day)).getFullYear();

            for (const val of this.holidays.replaceAll(' ','').split(',')) {
                if (isDate(val)) holidays += temp.replace('@',val);
                else if (isMMdd(val)) holidays += temp.replace('@',year+'-'+val);
            }
        }
        if (this.breaks.trim() != "")
        {
            const weekdays = {
                sunday: 'sunday', domingo: 'domingo',
                monday: 'monday', lunes: 'lunes',
                tuesday: 'tuesday', martes: 'martes',
                wednesday: 'wednesday', miércoles: 'miércoles', miercoles: 'miercoles',
                thursday: 'thursday', jueves: 'jueves',
                friday: 'friday', viernes: 'viernes',
                saturday: 'saturday', sábado: 'sábado', sabado: 'sabado'
            };

            const parseBreak = (value) => {
                value = value.trim();

                const match = value.match(/^(?:(\S+)\s+)?(\d{2}:\d{2})-(\d{2}:\d{2})$/i);
                if (!match) return null;

                let [,weekday,start,end] = match;
                weekday = weekday?.toLowerCase();

                return {
                    weekday: weekdays[weekday] || null,
                    start,
                    end
                };
            };

            for (const rawBreak of this.breaks.split(','))
            {
                const parsed = parseBreak(rawBreak);
                if (!parsed) continue;

                const { weekday, start, end } = parsed;

                for (const hour of this.getHours())
                {
                    if (!this.bwnHours(hour,start,end)) continue;

                    if (weekday) breaks += `td.${weekday}[data-time="${hour}"],`;
                    else breaks += `td[data-time="${hour}"],`;
                }
            }
        }

        let selectors = weekend + holidays + breaks;
        if (selectors.trim() == "") return;
        if (selectors.endsWith(',')) selectors = selectors.slice(0,-1);

        const style = document.createElement('style');
        style.id = 'readonly-styles';
        style.innerHTML = `
        ${selectors}
        {
            background-color: #e9ecef;
            opacity: 1;
            outline: 1px solid #ffffff;
        }
        `;

        this.#shadow.querySelector('#readonly-styles')?.remove();
        this.#shadow.appendChild(style);
    }

    backup() { this.#events_backup = JSON.parse(JSON.stringify(this.events)); }
    restore()
    {
        if (!this.#events_backup) return;
        this.events = JSON.parse(JSON.stringify(this.#events_backup));
        this.renderEvents();
    }
    //#endregion

    //#region Métodos privados
    #setScheduleHead(table,columns,weekdays)
    {
        const thead = document.createElement('thead');
        const row = document.createElement('tr');
        const now = this.dateFormat(new Date());

        row.appendChild(document.createElement('th'));
        
        let d = 0;
        for (let i = 0; i < columns.length; i++) {
            const cell = document.createElement('th');
            let day = weekdays[d].en;
            let dia = weekdays[d].es;
            let date = columns[i];
            
            cell.classList.add(day,dia);
            cell.dataset.date = date;
            cell.innerHTML = `
            <div>
                <label>${dia}</label>
                <small>${date}</small>
            </div>`;

            if (date == now) cell.classList.add('now');
            
            row.appendChild(cell);
            (d < 6) ? d++ : d = 0;
        }
        
        thead.appendChild(row);
        table.appendChild(thead);
    }

    #setScheduleBody(table,columns,weekdays)
    {
        const hours = this.getHours();
        const tbody = document.createElement('tbody');
        
        for (let i = 0; i < hours.length; i++) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            let hour = hours[i];
            let row = (i+1);
            let d = 0;

            th.dataset.time = hour;
            th.textContent = hour;
            tr.appendChild(th);

            for (let j = 0; j < columns.length; j++) {
                const td = document.createElement('td');
                let col = (j+1);
                let day = weekdays[d].en;
                let dia = weekdays[d].es;
                let date = columns[j];
                let datetime = `${date} ${hour}`

                td.classList.add(day,dia);
                td.id = `${col}:${row}`;
                td.dataset.datetime = datetime;
                td.dataset.date = date;
                td.dataset.time = hour;
                this.#setCellClickEvents(td);

                tr.appendChild(td);
                (d < 6) ? d++ : d = 0;
            }
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
    }

    #setElementPosition(event,taskEl)
    {
        const [dateStr, timeStr] = this.datetimeFormat(event.start).split(' ');
        const [hour, minute] = timeStr.split(':').map(Number);

        const interval = this.interval;
        const startHour = this.start_lab_hour;
        const cellHeight = this.#getCellHeight();
        const rect = this.#getCellOffset(dateStr);
        // Calcula el número de bloques desde el inicio
        const minutesFromStart = (hour * 60 + minute) - (startHour * 60);
        const topOffset = rect.top + (minutesFromStart / interval) * cellHeight;

        const durationBlocks = parseInt(event.duration) / interval;
        const height = durationBlocks * cellHeight;

        taskEl.style.cssText = `
            top: ${topOffset}px;
            height: ${height}px;
            left: ${rect.left}px;
            width: ${rect.width - 8}px;
            background-color: ${event.backcolor || '#FFFFE1'};
            color: ${event.color || '#000'};
        `;
    }

    #createTaskElement(event)
    {
        const BeforeCreateItem = new CustomEvent(this.Const.Events.BeforeCreateItem, {
            bubbles: true,
            cancelable: true,
            detail: { item: event }
        });
        const ok = this.dispatchEvent(BeforeCreateItem);
        if (!ok) return null;

        const taskEl = document.createElement('div');
        const content = this.#createFullElement('div', { class: 'content' });
        const resizeHandle = this.#createFullElement('div', { class:'resize-handle' });

        taskEl.id = event.id;
        taskEl.className = 'event-task';
        taskEl.appendChild(content);
        this.#setElementPosition(event,taskEl);
        taskEl.appendChild(resizeHandle);
        content.textContent = event?.caption??'';

        const ItemCreated = new CustomEvent(this.Const.Events.ItemCreated, {
            detail: {
                item: event,
                element: taskEl
            }
        });
        this.dispatchEvent(ItemCreated);

        return taskEl;
    }

    #updateTaskElement(event,taskEl=null)
    {
        if (!taskEl) taskEl = this.getTaskElementById(event.id);

        const eventArgs = {
            oldItem: this.events.find(e => e.id == event.id),
            oldElement: taskEl.cloneNode(true),
            newItem: event
        };

        const BeforeUpdateItem = new CustomEvent(this.Const.Events.BeforeUpdateItem, {
            bubbles: true,
            cancelable: true,
            detail: eventArgs
        });
        const ok = this.dispatchEvent(BeforeUpdateItem);
        if (!ok) return false;

        taskEl.querySelector('.content').textContent = event?.caption??'';
        this.#setElementPosition(event,taskEl);

        eventArgs.newElement = taskEl;
        this.dispatchEvent(new CustomEvent(this.Const.Events.ItemUpdated, { detail: eventArgs }));
        return true;
    }

    #setCellClickEvents(cell)
    {
        const eventArgs = {
            cell: cell,
            datetime: cell.dataset.datetime,
            date: cell.dataset.date,
            time: cell.dataset.time
        };
        let clickTimeout = null;

        cell.addEventListener('click', (e) => {
            if (clickTimeout) return; //Evitar 'click' si se hace 'doble click'.
            //Esperar por el 'doble clic'.
            clickTimeout = setTimeout(() => {
                // Disparar evento personalizado al hacer clic.
                this.dispatchEvent(new CustomEvent(this.Const.Events.CellClick, { detail: eventArgs }));
                clickTimeout = null;
            },200);
        });
        cell.addEventListener('dblclick', (e) => {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            // Disparar evento personalizado al hacer doble clic.
            this.dispatchEvent(new CustomEvent(this.Const.Events.CellDoubleClick, { detail: eventArgs }));
        });
    }

    #setTaskEvents(taskEl,eventData)
    {
        let clickTimeout = null;
        let isDragging = false;

        taskEl.addEventListener('click', (e) => {
            if (isDragging) return; //Evitar 'click' si se arrastra.
            
            this.#shadow.querySelectorAll('.event-task.selected').forEach(element => element.classList.remove('selected'));
            taskEl.classList.add('selected');
            
            if (clickTimeout) return; //Evitar 'click' si se hace 'doble click'.
            //Esperar por el 'doble clic'.
            clickTimeout = setTimeout(() => {
                // Disparar evento personalizado al hacer clic.
                this.dispatchEvent(new CustomEvent(this.Const.Events.ItemClick, { detail: eventData }));
                clickTimeout = null;
            },200);
        });
        taskEl.addEventListener('dblclick', (e) => {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            // Disparar evento personalizado al hacer doble clic.
            this.dispatchEvent(new CustomEvent(this.Const.Events.ItemDoubleClick, { detail: eventData }));
        });
        
        taskEl.addEventListener('mousedown', e => { this.#startDrag(e, taskEl) });

        const handle = taskEl.querySelector('.resize-handle');
        if (handle) {
            handle.addEventListener('mousedown', e => {
                e.stopPropagation(); // Evita iniciar arrastre al mismo tiempo.
                this.#startResize(e, taskEl);
            });
        }
    }

    #startDrag(e,taskEl)
    {
        e.preventDefault();

        const eventData = this.events.find(ev => ev.id === taskEl.id);
        const backupData = JSON.parse(JSON.stringify(eventData));
        const taskRect = taskEl.getBoundingClientRect();
        const shiftX = e.clientX - taskRect.left;
        const shiftY = e.clientY - taskRect.top;
        const initialStart = backupData.start;

        taskEl.classList.add('dragging');
        let successDrag = false;

        const onMouseMove = (moveEvent) => {
            const x = moveEvent.clientX;
            const y = moveEvent.clientY;
            
            const cell = this.#shadow.elementFromPoint(x,y);
            if (!cell || cell.tagName != 'TD') return;
            // Disparar evento personalizado durante el arrastre.
            const eventArgs = {
                item: backupData,
                cell: cell,
                from: initialStart,
                to: cell.dataset.datetime
            };
            const ItemMoving = new CustomEvent(this.Const.Events.ItemMoving, {
                bubbles: true,
                cancelable: true,
                detail: eventArgs
            });
            successDrag = this.dispatchEvent(ItemMoving);
            if (!successDrag) return;
            // Mover visualmente la tarea
            const rect = cell.getBoundingClientRect();
            taskEl.style.position = 'fixed';
            taskEl.style.top = `${y - shiftY}px`;
            taskEl.style.left = `${rect.left}px`;
            taskEl.style.width = `${rect.width - 8}px`;
        };

        const onMouseUp = (upEvent) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            taskEl.classList.remove('dragging');
            // Oculta temporalmente el div arrastrado para detectar el <td> debajo
            taskEl.style.visibility = 'hidden';
            const cell = this.#shadow.elementFromPoint(upEvent.clientX, upEvent.clientY);
            taskEl.style.visibility = 'visible';

            if (!successDrag || !cell || cell.tagName != 'TD')
            {
                // Si se soltó fuera de una celda válida o se cancelo el evento, volver al estado original.
                this.#updateTaskElement(backupData);
            }
            else
            {
                eventData.start = cell.dataset.datetime;
                this.#updateTaskElement(eventData);

                const eventArgs = {
                    item: eventData,
                    cell: cell,
                    from: initialStart,
                    to: cell.dataset.datetime
                };
                this.dispatchEvent(new CustomEvent(this.Const.Events.ItemMoved, { detail: eventArgs }));
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    #startResize(e, taskEl)
    {
        e.preventDefault();

        const eventData = this.events.find(ev => ev.id === taskEl.id);
        const backupData = JSON.parse(JSON.stringify(eventData));
        const interval = this.interval;
        const cellHeight = this.#getCellHeight();
        const startY = e.clientY;
        const startHeight = taskEl.offsetHeight;
        const minHeight = this.min_duration / interval * cellHeight;
        const maxHeight = this.max_duration / interval * cellHeight;

        let successDrag = false;

        const onMouseMove = (moveEvent) => {
            const delta = moveEvent.clientY - startY;
            let newHeight = startHeight + delta;
            // Aplicar límites
            newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
            const newDuration = Math.round((newHeight / cellHeight) * interval);
            // Disparar evento personalizado durante el redimensionamiento.
            const eventArgs = {
                item: backupData,
                oldDuration: backupData.duration,
                newDuration: newDuration
            };
            const ItemResizing = new CustomEvent(this.Const.Events.ItemResizing, {
                bubbles: true,
                cancelable: true,
                detail: eventArgs
            });
            successDrag = this.dispatchEvent(ItemResizing);
            if (!successDrag) return;
            
            taskEl.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (!successDrag)
            {
                // Si se cancelo el evento, volver al estado original.
                this.#updateTaskElement(backupData);
            }
            else
            {
                const newDuration = Math.round(taskEl.offsetHeight / cellHeight) * interval;
                eventData.duration = newDuration;
                this.#updateTaskElement(eventData);

                const eventArgs = {
                    item: eventData,
                    oldDuration: backupData.duration,
                    newDuration: newDuration
                };
                this.dispatchEvent(new CustomEvent(this.Const.Events.ItemResized, { detail: eventArgs }));
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    #getColumns()
    {
        const weekdays = this.getWeekdays();
        const baseDate = (this.day.toLowerCase()=="now") ? new Date() : new Date(this.day + 'T00:00');
        const baseWeekday = baseDate.getDay();

        const diff = (baseWeekday - this.#startWeekdayIndex() + 7) % 7;
        const startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - diff);

        const totalDays = (weekdays.length * this.#nweek());
        let result = [];

        for (let i = 0; i < totalDays; i++) {
            let date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            result.push(this.dateFormat(date));
        }

        return result;
    }

    #onResizeOrScroll()
    {
        this.events.forEach(item => {
            const element = this.getTaskElementById(item.id);
            if (element) this.#updateTaskElement(item,element);
        });
    }
    //#endregion

    //#region Funciones auxiliares
    getTaskElementById(id)
    {
        try {
            const taskEl = this.#shadow.querySelector('#tasks-layer #'+id);
            return taskEl;
        } catch (error) {
            return null;
        }
    }

    getWeekdays()
    {
        const index = this.#startWeekdayIndex();

        if (this.view == "day") return [this.#weekdays[index]];
        if (index == 0) return this.#weekdays;

        return [...this.#weekdays.slice(index), ...this.#weekdays.slice(0,index)];
    }

    getHours()
    {
        const intervals = [15,30,60,120];
        const result = [];
        const pad = (num) => num.toString().padStart(2, '0');

        let start = ((this.start_lab_hour ?? -1) < 0) ? 0 : this.start_lab_hour;
        let end = ((this.end_lab_hour ?? 25) > 24) ? 24 : this.end_lab_hour;
        if (!intervals.includes(this.interval)) {
            console.warn("Intervalo inválido");
            this.interval = 30;
        }

        const endMin = end * 60;
        let totalMin = start * 60;

        while (totalMin <= endMin) {
            const hour = Math.floor(totalMin / 60);
            const minute = totalMin % 60;
            result.push(`${pad(hour)}:${pad(minute)}`);
            totalMin += this.interval;
        }

        return result;
    }

    bwnDate(value,min,max)
    {
        const parse = (v) => new Date(v).getTime();

        const v = parse(value);
        const a = parse(min);
        const b = parse(max);

        return (v >= a && v <= b);
    }

    bwnHours(value,min,max)
    {
        const parse = (v) => {
            const [h, m] = v.split(':').map(Number);
            return h * 60 + m;
        }

        const v = parse(value);
        const a = parse(min);
        const b = parse(max);

        return (v >= a && v <= b);
    }

    dateFormat(value)
    {
        const date = (value instanceof Date) ? value : new Date(value);

        const yyyy = date.getFullYear().toString();
        const MM = (date.getMonth() + 1).toString().padStart(2,'0');
        const dd = date.getDate().toString().padStart(2,'0');

        return yyyy +"-"+ MM +"-"+ dd;
    }

    datetimeFormat(value)
    {
        const date = (value instanceof Date) ? value : new Date(value);

        const HH = date.getHours().toString().padStart(2,'0');
        const mm = date.getMinutes().toString().padStart(2,'0');

        return this.dateFormat(date) +" "+ HH +":"+ mm;
    }

    setCustomStyles(styles)
    {
        if (typeof styles != 'string' || styles.trim() == '') return;
        this.#shadow.innerHTML += `<style>${styles}</style>`;
    }

    #setControlStyles()
    {
        document.addEventListener('DOMContentLoaded', () => {
            const controlStyles = this.querySelector('control-styles');
            const styles = controlStyles?.innerHTML ?? '';
            
            this.setCustomStyles(styles);
        });
    }

    #deepFreeze(obj) {
        Object.getOwnPropertyNames(obj).forEach(prop => {
            const value = obj[prop];
            if (value && typeof value === 'object') {
                this.#deepFreeze(value);
            }
        });
        return Object.freeze(obj);
    }

    #createFullElement(tagName, attributes={}, innerHTML="")
    {
        const element = document.createElement(tagName);
        const keys = Object.keys(attributes);
        
        keys.forEach(k => element.setAttribute(k, attributes[k]));
        if (innerHTML.trim() !== "") element.innerHTML = innerHTML.trim();
        
        return element;
    }

    #startWeekdayIndex()
    {
        let index = this.#weekdays.findIndex(d => d.en == this.start_weekday || d.es == this.start_weekday);
        if (index == -1) {
            console.warn("Día inválido");
            index = 0;
        }
        return index;
    }

    #boolval(v)
    {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'number') return (v != 0);
        if (typeof v === 'string') {
            return ["true","1","yes","y","si","sí","s","ok","on","v","verdadero","verdad","correcto","cierto","positivo","+"].includes(v.trim().toLowerCase());
        }

        return false
    }

    #nweek() {
        if (!this.view.endsWith("week")) return 1;

        let v = Number(this.view.replace("week",""));
        if (v <= 0) v = 1;
        return v;
    }

    #getHeadHeight() {
        const cell = this.#shadow.querySelector('thead th');
        return cell ? cell.offsetHeight : 40;
    }

    #getCellHeight() {
        const cell = this.#shadow.querySelector('tbody td');
        return cell ? cell.offsetHeight : 20;
    }

    #getColumnWidth() {
        const firstRow = this.#shadow.querySelector('tbody tr');
        if (!firstRow) return 80;
        const cell = firstRow.querySelector('td');
        return cell ? cell.offsetWidth : 80;
    }

    #getCellOffset(dateStr) {
        const selector = `td[data-datetime^="${dateStr}"]`;
        const cell = this.#shadow.querySelector(selector);
        
        if (!cell) return { top: 0, left: 0, width: 0, height: 0 };

        const parent = this.#shadow.querySelector('#schedule-wrapper');
        const cellRect = cell.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        
        return {
            top: cellRect.top - parentRect.top + parent.scrollTop,
            left: cellRect.left - parentRect.left + parent.scrollLeft,
            width: cell.offsetWidth,
            height: cell.offsetHeight
        };
    }
    //#endregion
}

customElements.define('custom-schedule', CustomSchedule);