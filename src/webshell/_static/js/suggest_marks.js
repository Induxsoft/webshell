var macros = {
  vars: {},

  // estado interno
  _dropdown: null,
  _items: [],
  _activeIndex: 0,
  _currentEl: null,
  _trigger: null,

  suggest(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return;

    this._ensureStyles();
    this._ensureDropdown();

    form.addEventListener("input", (e) => this._handleInput(e));
    form.addEventListener("keydown", (e) => this._handleKeydown(e));
  },

  // ========================
  // Core
  // ========================

  _handleInput(e) {
    const el = e.target;
    if (!this._isValidInput(el)) return;

    const info = this._getTriggerInfo(el);

    if (!info) {
      this._close();
      return;
    }

    this._trigger = info;

    const results = this._search(info.query);

    if (results.length) {
      this._render(results, el);
    } else {
      this._close();
    }
  },

  _handleKeydown(e) {
    if (!this._items.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this._activeIndex = (this._activeIndex + 1) % this._items.length;
        this._updateActive();
        break;

      case "ArrowUp":
        e.preventDefault();
        this._activeIndex =
          (this._activeIndex - 1 + this._items.length) % this._items.length;
        this._updateActive();
        break;

      case "Enter":
      case "Tab":
        e.preventDefault();
        this._insert(this._activeIndex);
        break;

      case "Escape":
        this._close();
        break;
    }
  },

  // ========================
  // Trigger
  // ========================

  _getTriggerInfo(el) {
    const pos = el.selectionStart;
    const text = el.value.slice(0, pos);

    const match = text.match(/{{([\w_]*)$/);
    if (!match) return null;

    return {
      query: match[1],
      start: pos - match[0].length,
      end: pos
    };
  },

  // ========================
  // Normalización + búsqueda
  // ========================

  _normalizeVars() {
    // Convierte { key: {label, aliases} } → array usable
    return Object.entries(this.vars).map(([key, meta]) => {
      return {
        key,
        label: meta?.label || "",
        aliases: meta?.aliases || []
      };
    });
  },

  _search(query) {
    const q = query.toLowerCase();

    return this._normalizeVars()
      .filter(v => {
        return (
          v.key.toLowerCase().includes(q) ||
          v.label.toLowerCase().includes(q) ||
          v.aliases.some(a => a.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  },

  // ========================
  // UI
  // ========================

  _ensureStyles() {
    if (document.getElementById("macros-autocomplete-style")) return;

    const style = document.createElement("style");
    style.id = "macros-autocomplete-style";

    style.textContent = `
    .macros-autocomplete {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        max-height: 200px;
        overflow-y: auto;
        font-family: sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .macros-autocomplete .item {
        padding: 6px 10px;
        cursor: pointer;
    }

    .macros-autocomplete .item.active {
        background: #007bff;
        color: #fff;
    }

    .macros-autocomplete small {
        display: block;
        font-size: 11px;
        opacity: 0.7;
    }
    `;

    document.head.appendChild(style);
  },

  _ensureDropdown() {
    if (this._dropdown) return;

    const div = document.createElement("div");
    div.className = "macros-autocomplete";
    div.style.position = "fixed";
    div.style.display = "none";
    div.style.zIndex = 9999;

    div.addEventListener("mousedown", (e) => {
      const item = e.target.closest(".item");
      if (!item) return;

      this._insert(Number(item.dataset.index));
    });

    document.body.appendChild(div);
    this._dropdown = div;
  },

  _render(items, el) {
    this._items = items;
    this._activeIndex = 0;
    this._currentEl = el;

    this._dropdown.innerHTML = items
      .map((v, i) => `
        <div class="item ${i === 0 ? "active" : ""}" data-index="${i}">
          <strong>${v.key}</strong>
          ${v.label ? `<small>${v.label}</small>` : ""}
        </div>
      `)
      .join("");

    this._position(el);
    this._dropdown.style.display = "block";
  },

  _position(el) {
    const rect = el.getBoundingClientRect();

    this._dropdown.style.top = rect.bottom + "px";
    this._dropdown.style.left = rect.left + "px";
    this._dropdown.style.width = rect.width + "px";
  },

  _updateActive() {
    const nodes = this._dropdown.querySelectorAll(".item");

    nodes.forEach((n, i) => {
      n.classList.toggle("active", i === this._activeIndex);
    });
  },

  // ========================
  // Insert
  // ========================

  _insert(index) {
    const el = this._currentEl;
    if (!el) return;

    const v = this._items[index];

    const value = el.value;

    const before = value.slice(0, this._trigger.start);
    const after = value.slice(this._trigger.end);

    el.value = `${before}{{${v.key}}}${after}`;

    const pos = before.length + v.key.length + 4;
    el.setSelectionRange(pos, pos);

    el.dispatchEvent(new Event("input", { bubbles: true }));

    this._close();
  },

  // ========================
  // Utils
  // ========================

  _close() {
    this._dropdown.style.display = "none";
    this._items = [];
    this._currentEl = null;
    this._trigger = null;
  },

  _isValidInput(el) {
    return (
      el &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
      !el.disabled &&
      !el.readOnly
    );
  }
};