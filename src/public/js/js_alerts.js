async function throwWindow(color = 0, title = 'Aviso', content='Esto es un aviso', button_right_text='Aceptar', button_right_color = 0, button_left_text=undefined, button_left_color = 0)
{
    const element = document.createElement('div');
    element.classList.add('js_alert__container');

    const colorList = 
    [
        '',
        'danger',
        'caution'
    ]
    const button_colorList = 
    [
        '',
        'deny'
    ]

    element.innerHTML = `
    <div class="js_alert__window ${colorList[color]}">
    <h1 class="title">${title}</h1>
    <div class="content">
        <p>${content}</p>
    </div>
    <div class="buttons">
        ${button_left_text ? `<button class="${button_colorList[button_left_color]}" id="btn_l">${button_left_text}</button>` : ''}
        <button class="${button_colorList[button_right_color]}" id="btn_r">${button_right_text}</button>
    </div>
</div>
    `

    document.body.appendChild(element);

    const button_left = element.querySelector('#btn_l');
    const button_right = element.querySelector('#btn_r');

    const answ = await new Promise((resolve)=>{
        button_right.onclick = (e)=>{resolve(true)};
        button_left ? button_left.onclick = (e)=>{resolve(false)} : null;
    })

    document.body.removeChild(element);
    return answ;
}

async function throwInput(color = 0, title = 'Input', placeHolder = 'Enter Text..', button_right_text='Aceptar', button_right_color = 0, button_left_text='Cancelar', button_left_color = 0)
{
    const element = document.createElement('div');
    element.classList.add('js_alert__container');

    const colorList = 
    [
        '',
        'danger',
        'caution'
    ]
    const button_colorList = 
    [
        '',
        'deny'
    ]

    element.innerHTML = `
    <div class="js_alert__window ${colorList[color]}">
    <h1 class="title">${title}</h1>
    <div class="content">
        <input id="text_area" type="text" placeholder="${placeHolder}">
    </div>
    <div class="buttons">
        <button class="${button_colorList[button_left_color]}" id="btn_l">${button_left_text}</button>
        <button class="${button_colorList[button_right_color]}" id="btn_r">${button_right_text}</button>
    </div>
</div>
    `

    document.body.appendChild(element);

    const button_left = element.querySelector('#btn_l');
    const button_right = element.querySelector('#btn_r');
    const text_value = element.querySelector('#text_area');

    const answ = await new Promise((resolve)=>{
        button_right.onclick = (e)=>{resolve(text_value.value)};
        button_left.onclick = (e)=>{resolve(false)};
    })

    document.body.removeChild(element);
    return answ;
}

// throwWindow(2, 'Solicitud de Transferencia', 'El dispositivo "Casi Fio" Quiere transferir 40 archivos (450mb) a este dispositivo', 'Aceptar', 0, 'Cancelar', 1).then(res=>console.log(res));
// throwWindow(2, 'ERROR', 'Ocurrio un error al intentar transferir 420 archivos a "Casi Fio" Intente de nuevo mas tarde o use un medio alternativo para transferir los archivos', 'Aceptar', 0).then(res=>console.log(res));
// throwInput(0, 'Como te llamas', 'Tu nombre..', 'Aceptar', 0, 'Cancelar', 1).then(dat=>console.log(dat));