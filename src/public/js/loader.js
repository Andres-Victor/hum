Notification.requestPermission();

const is_Local = window.location.href.includes('localhost');

const html = //Elementos html de la pagina 
{
    main: document.querySelector('.main'),
    near_container: document.querySelector('.main .near_users__container'),
    local_data: document.querySelector('.main .localData'),
    file_selector: document.getElementById('fileInput'),
    control_panel: document.querySelector('body .control_panel')
}

if(is_Local)
{
    html.control_panel.style.display = 'flex'
    html.control_panel.querySelector('#close_button').onclick = (e)=>{
        socket.emit('hide_window');
    }
    html.control_panel.querySelector('#minimize_button').onclick = (e)=>{
        socket.emit('minimize_window');
    }
}

let target_id = '0'; //Id del usuario al que se le queiere enviar un archivo
let current_sending_id = []; //Lista de usuarios a los que se le estan enviando archivos, 
// Esto es por si el usuario que esta enviando archivos recive una peticion para recibir archivos del mismo usuario al que le esta mandando los archivos lo rechaze inmediatamente
let localData = {name:undefined, id:undefined}; //Datos locales como nombre e id

html.file_selector.addEventListener('change', async function() {
    var files = this.files;
    var files_weight = 0; //Peso de los archivos
    
    const Target_User = Near_Users.find(usr=>usr.id === target_id); //Usuario al que se le enviaran los datos

    current_sending_id.push(Target_User.id); //Se agrega el usuario a la lista

    Target_User.setTransfering(true);
    Target_User.setColor(2);
    Target_User.setSpanText('Subido: 0%')

    
    for (let index = 0; index < files.length; index++) //Se obtiene el tamaño total de los archivos
    {
        const file = files[index];
        files_weight += file.size;
    }
    files_weight = bytesToSize(files_weight); //Se traduce el tamaño a la maxima expresion por ejemplo GB o MB

    const permission = await new Promise((resolve) => //Esta funcion le envia al otro usuario un request para recibir archivos, si el usuario tarda mucho en responder se manda un timeout (400)
    {
        var timeout = setTimeout(() => 
        {
            resolve(400);   
        }, 60000);
        socket.emit('request_transfer', Target_User.id, files.length, files_weight, (answ)=>{
            clearTimeout(timeout);
            resolve(answ);
        });
    });


    switch(permission) //Se verifica la respuesta del usuario 404: el servidor no encontro al usuario 400 El usuario tardo mucho en responder 300: El usuario esta enviando archivos a este dispositivo, false: El usuario no aceptó
    {
    case 400:
        await throwWindow(2, 'ERROR: Time Out', `El dispositivo ${Target_User.name}:${Target_User.id} tardo mucho en responder la peticion de envio de archivos` , 'Aceptar', 0);
        Target_User.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===Target_User.id);
        return;
    case 404:
        await throwWindow(2, 'ERROR: User Not Found', `El dispositivo ${Target_User.name}:${Target_User.id} no fue encontrado por el servidor` , 'Aceptar', 0);
        Target_User.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===Target_User.id);
        return;
    case 300:
        await throwWindow(2, 'ERROR: User Bussy', `El dispositivo ${UserFrom.name}:${UserFrom.id} esta enviando archivos a este dispositivo, espere que la transferencia se complete antes de enviarle otro archivo` , 'Aceptar', 0);
        UserFrom.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===UserFrom.id);
        return;
    case false:
        await throwWindow(1, 'Transferencia Cancelada', `El dispositivo ${Target_User.name}:${Target_User.id} nego la transferencia de archivos` , 'Aceptar', 0);
        Target_User.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===Target_User.id);
        return;
    default:
        // Acción por defecto si no se cumple ninguna de las condiciones anteriores
    }

    Target_User.setColor(1);
    Target_User.updatePercent(0);

    var formData = new FormData(); //Creacion de un formulario de datos

    for (var i = 0; i < files.length; i++) //Se agrega cada archivo al formulario de datos
    {
      formData.append('files', files[i]);
    }
    formData.append('destinationId', target_id); // Adjuntar el ID destino
    formData.append('originId', localData.id); // Adjuntar el ID origen
    
    var xhr = new XMLHttpRequest(); //Se crea un HTTP Request XML

    xhr.upload.onprogress = (event) => // Evento ejecutado cada vez que el request progrese
    {
        // Obtener el porcentaje de progreso
        var percentLoaded = Math.round((event.loaded / event.total) * 100);
        // Actualizar la barra de carga del usuario al que le enviamos los datos que muestra el progreso de subida
        Target_User.updatePercent(percentLoaded);
        // Mostramos un texto abajo que indique el porcentaje de subida
        Target_User.setSpanText('Subido: '+percentLoaded+'%')
    };

    xhr.upload.onloadend = (e)=> // Evento ejecutado cuando el request termine
    {
        console.log('Subida de archivos completada')

        let notification = new Notification("Archivos Enviados Exitosamente", {
            body: `Los archivos selccionados para ${Target_User.name} Se han subido exitosamente al servidor`,
            icon: "./src/icons/HUM.png"
        });
    
        notification.onclick = (e)=>{
            if(!is_Local) return;
            e.preventDefault();
            socket.emit('show_window');
        }

        Target_User.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===Target_User.id);
        html.file_selector.value = '';
    };

    xhr.upload.onerror = (e)=> // Evento ejecutado cuando surja un error
    {
        
        let notification = new Notification("Error al subir los archivos", {
            body: `Ha ocurrido un error al subir los archivos`,
            icon: "./src/icons/HUM.png"
        });
    
        notification.onclick = (e)=>{
            if(!is_Local) return;
            e.preventDefault();
            socket.emit('show_window');
        }

        throwWindow(2, 'ERROR: Upload Failed', `Hubo un fallo al subir los archivos al servidor, intente de nuevo mas tarde` , 'Aceptar', 0);
        Target_User.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===Target_User.id);
        html.file_selector.value = '';
    };

    xhr.onerror = (e)=> // Evento ejecutado cuando surja un error en la solicitud en si
    {
        let notification = new Notification("Error al subir los archivos", {
            body: `Ha ocurrido un error al subir los archivos`,
            icon: "./src/icons/HUM.png"
        });
    
        notification.onclick = (e)=>{
            if(!is_Local) return;
            e.preventDefault();
            socket.emit('show_window');
        }
        throwWindow(2, 'ERROR: Upload Failed', `Hubo un fallo al subir los archivos al servidor, intente de nuevo mas tarde` , 'Aceptar', 0);
        Target_User.resetStatus();
        current_sending_id = current_sending_id.filter(id=>id===Target_User.id);
        html.file_selector.value = '';
    };

    xhr.open('POST', '/upload'); // Se abre el request en la direccion /upload definida por la pagina
    xhr.send(formData); // Se envian los datos
});
socket.on('assingData', (data)=>{
    if(is_Local)
    {
        if(!localStorage.getItem('qr_tutorial'))
        {
            html.main.innerHTML += `        <div class="qr_tutorial">
            <p>Manten presionado el QR para mostrarlo > </p>
        </div>`
        document.getElementById('connection_qr').onclick = ()=>{
            html.main.removeChild(html.main.querySelector('.qr_tutorial'));
            localStorage.setItem('qr_tutorial', true);
            document.getElementById('connection_qr').onclick = (e)=>{}
        }
            
        }
        generateQRCode(data.Dir, document.getElementById('connection_qr'));  
    } 
    html.local_data.querySelector('.name').innerHTML = `Estas conectado a la red con el nombre: <strong>${data.User.name}</strong>`
    localData.name = data.User.name;
    localData.id = data.User.id;
});
socket.on('current_users', (list)=>{
    list.forEach(usr => {
        appendUser(usr.name, usr.id, usr.pc) 
    });
});
socket.on('new_user', (usr)=>{
    appendUser(usr.name, usr.id, usr.pc)
});
socket.on('left_user', (id)=>{
    detachUser(id)
});
socket.on('recive_files', (files, from)=>{
    let progress_list = [];
    const UserFrom = Near_Users.find(usr=>usr.id === from);
    let downloaded = 0;
    UserFrom.setTransfering(true);
    UserFrom.setColor(1);
    UserFrom.updatePercent(0);
    UserFrom.setSpanText('Descargado 0/'+files.length)

    files.forEach((file, index) => 
    {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', './transference_files/'+file, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            if (this.status == 200) {
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(this.response);
                link.download = file;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                downloaded++;
                UserFrom.setSpanText('Descargado '+downloaded+'/'+files.length)
            }
        };
        xhr.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentage = Math.round((e.loaded / e.total) * 100);
                progress_list[index] = percentage;
                let total = 0;    
                progress_list.forEach(per => 
                {
                    total += per;
                });
                total = total / progress_list.length;
                UserFrom.updatePercent(total);  
            }
        });
        xhr.addEventListener('loadend', function(e)
        {
            console.log('Descarga de archivos completada')
            UserFrom.setTransfering(false);
            UserFrom.updatePercent(100);
            UserFrom.setColor(0);
            UserFrom.setSpanText('')
            socket.emit('confirm_files', files);
        })
        xhr.onerror = (e)=>
        {
            let notification = new Notification("Error al descargar los archivos", {
                body: `Ha ocurrido un error al descargar los archivos`,
                icon: "./src/icons/HUM.png"
            });
        
            notification.onclick = (e)=>{
                if(!is_Local) return;
                e.preventDefault();
                socket.emit('show_window');
            }

            throwWindow(2, 'ERROR: Download Failed', `Hubo un fallo al descargar los archivos al servidor, intente de nuevo mas tarde` , 'Aceptar', 0);
            UserFrom.setTransfering(false);
            UserFrom.setColor(0);
            UserFrom.setSpanText('')
        };
        xhr.send();
    });
})
socket.on('request_transfer', async (id_from, quantity, size, callback = ()=>{})=>
{
    if(current_sending_id.find(id=>id === id_from))
    {
        callback(300);
        return;
    }
    
    const UserFrom = Near_Users.find(usr=>usr.id === id_from);
    let notification = new Notification("Solicitud de Transferencia", {
        body: `El usuario ${UserFrom.name} Esta solicitando transferir archivos a este dispositivo`,
        icon: "./src/icons/HUM.png"
    });

    notification.onclick = (e)=>{
        if(!is_Local) return;
        e.preventDefault();
        socket.emit('show_window');
    }
    let answ = await throwWindow(0, 'Solicitud de Transferencia', `El dispositivo ${UserFrom.name}:${UserFrom.id} Quiere transferir ${quantity} archivos (${size}) a este dispositivo`, 'Aceptar', 0, 'Rechazar', 1); 
    callback(answ);
})

let Near_Users = []
let blankSpace = document.createElement("div");
blankSpace.style.height = '3vh';
blankSpace.style.width = '90%'

class Near_User
{
    constructor(name, id, pc)
    {
        this.name = name;
        this.id = id;
        this.element = document.createElement('div');
        this.element.classList.add('near_user__card');
        let image = pc ? "src/icons/computer-svgrepo-com.svg" : "src/icons/mobile-svgrepo-com.svg";
        this.element.innerHTML = 
        `
        <div class="icon_zone">
            <div class="icon">
                <img src=${image} alt="">
                <div class="wave">     
                    <img src=${image} alt="">  
                </div>
            </div>
        </div>
        <div class="data">
            <h1>${name}</h1>
            <p>${id}</p>
        </div>
        <span class="transference_progress"></span>
        `

        this.element.addEventListener('click', ()=>{
            target_id = this.id;
            html.file_selector.click();
        });
        html.near_container.appendChild(this.element);

        html.near_container.appendChild(blankSpace);

    }

    updatePercent(percent) 
    {  
        this.element.querySelector('.wave').style.height = `${percent}%`;
    }

    setTransfering(status = false)
    {
        if(status)
            this.element.classList.add('transfering');
        else
            this.element.classList.remove('transfering');
    }

    setColor(colorNum = 0)
    {
        var colorArray = 
        [
            'default_color',
            'green',
            'orange'
        ]

        colorArray.forEach(color => 
        {
            this.element.classList.remove(color);
        });

        this.element.classList.add(colorArray[colorNum]);
    }

    setSpanText(text)
    {
        this.element.querySelector('span.transference_progress').innerHTML = text;
    }

    resetStatus()
    {
        this.setTransfering(false);
        this.setColor(0);
        this.setSpanText('');
    }
}

function appendUser(name, id, pc = true)
{
    Near_Users.push(new Near_User(name, id, pc))
}

function detachUser(id)
{
    let User = Near_Users.find(user=>user.id === id)
    if(!User) return;
    User.element.remove();
    Near_Users = Near_Users.filter(user=>user.id !== id)
}

function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}