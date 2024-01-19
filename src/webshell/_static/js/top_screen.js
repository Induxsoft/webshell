var top_screen =
{
    ik_actions:null,
    btn_navbar_lightning:null,
    iframe_view:null,
    init()
    {
        this.ik_actions = document.querySelector('#ik_actions');
        this.btn_navbar_lightning = document.querySelector('#btn_navbar_lightning');
        this.iframe_view = document.querySelector('#_main_view');
        this.set_ik_action_events();
    },
    set_ik_action_events()
    {
        if (this.btn_navbar_lightning && this.ik_actions)
        {
            this.btn_navbar_lightning.addEventListener('click', () => this.ik_actions.searchText('',false));
            this.ik_actions.change_event = (data) => { this.select_action(data) }
        }
    },
    select_action(data)
    {
        if (this.iframe_view) this.iframe_view.src = data.href;
    }
}

document.addEventListener('DOMContentLoaded', ()=>{
    top_screen.init();
});