document.addEventListener("DOMContentLoaded", () => {
    setTimeout(()=>{v12_on_resize();},200);

    const inputs = document.querySelectorAll('form [required]');
    inputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) label.style.fontWeight = 'bold';
    });
});

window.addEventListener("resize", function(event) {
    v12_on_resize();
}, true);

function v12_on_resize()
{
    let const_h=24;
    let work_area=document.getElementById("work_area");
    if (!work_area) return;

    let overflow=document.body.offsetHeight-window.innerHeight;
    let h=work_area.offsetHeight-overflow-const_h;
    work_area.style.height=h+"px";
}

function getPrintableHTML()
{
    const container = document.createElement("div");
    container.setAttribute("data-print-mode",1);

    container.innerHTML = `
    <!-- link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous" -->
    <style>
        table { width:100%; margin-bottom:1rem; caption-side:bottom; border-collapse:collapse; color:#212529; border-color:#dee2e6; }
        table>:not(caption)>* { border-width: 1px 0; }
        table>:not(caption)>*>* { border-width: 0 1px; padding: .25rem .25rem; }
        tr th { background-color:#DCDCDC; text-align:center; font-size:.9rem; font-weight:500; outline:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; -o-text-overflow:ellipsis; }
        tr th > .sizable-border { height:unset!important; }
        tr td { background-color:#FFFFFF; color:#000000; font-size:.8rem; }
        
        /* .bg-light-gray { background-color: #DCDCDC !important; }
        .bg-yellow { background-color: #ffe484 !important; }
        .fw-500 { font-weight: 500 !important; } */
    </style>
    `;

    document.querySelectorAll(".printable-element").forEach(el => 
    {
        if (el.tagName==="EDIT-TABLE" )
        {
            let div=document.createElement("div");
            div.style.cssText="display:flex;width:auto;min-width:100%;overflow: auto;";
            div.appendChild(el._shadow.getElementById(el.id).cloneNode(true));
            container.appendChild(div);
        }
        else if(el.tagName==="TABLE")
        {
            let div=document.createElement("div");
            div.style.cssText="display:flex;width:auto;min-width:100%;overflow: auto;";
            div.appendChild(el);
            container.appendChild(div);
        }
        else container.appendChild(el.cloneNode(true));
    });
    // Array.prototype.forEach.call(container.querySelectorAll("*"), function(element){
    //     element.removeAttribute('style');
    // });
    return container;
}

function v12PrintHTML()
{
    let data = { doc: getPrintableHTML().outerHTML.replaceAll("show-on-print","") }
    
    const onSuccess = (data) => {
        if (data.message) {
            alert(data.message);
            return
        }
        
        window.open(data.url,"_blank");
    }

    const onFailure = (error) => {
        alert(error.message ?? JSON.stringify(error))
    }

    InduxsoftCrudlModel.InvokeService("/webshell/_services/save-view.dkl",data,onSuccess,onFailure,"POST",false);
}