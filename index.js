const wifiName = require('wifi-name');
const path = require('path');
const AutoLaunch = require('auto-launch');
const os = require('os');
const networkInterfaces = os.networkInterfaces();
var LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage(path.resolve(__dirname, './cache/localStorage'));

var autoLauncher = new AutoLaunch({
    name: "HUM - Transferencia de Datos"
});



let localIP;

for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            localIP = net.address;
            break;
        }
    }
}

if(!localStorage.getItem('alreday_started'))
{
    autoLauncher.enable();
    localStorage.setItem('alreday_started', true)
}

global.autoLauncher = autoLauncher;

let startWifi = wifiName.sync()
const port = process.env.PORT || 50205;
const server_direction = `http://${localIP}:${port}`

setInterval(async () => {
  if(wifiName.sync() !== startWifi)
  {
    restart();
  }
}, 60000);

const funnyNames = [
    "Pepito Piscinas",
    "Juan Cachetes",
    "Lola Mento",
    "Pedro Picapiedra",
    "Marta Gasta",
    "Paco Peco",
    "Ana Conda",
    "Tito Flórez",
    "Lucas Lentejas",
    "Casi Fio"
  ]

const server = require("./src/bin/scripts/server")(port, sendFile, ()=>{console.log('Server started at: '+server_direction)});
const window = require("./src/bin/scripts/window")(port);
const socket = require("socket.io");
const fs = require('fs');
const { get } = require('https');
const { PassThrough } = require('stream');
const io = socket(server.server)

const transference_path = path.resolve(__dirname,"./src/public/transference_files/");

fs.readdir(transference_path, (err, files) => {
    if (err) throw err;
  
    for (const file of files) {
      fs.rm(path.join(transference_path, file), (err) => {
        if (err) throw err;
    });
    }
});

let Near_Users = []
let sockets = []

class User 
{
    constructor(socket)
    {
        const userAgent = socket.request.headers['user-agent'];
        this.pc = userAgent.includes('Win');
        this.name = funnyNames[Math.floor(Math.random() * funnyNames.length)]
        this.id = socket.id;
    }
}

function sendFile(files, destiny, origin)
{
    console.log('from '+Near_Users.find(usr=>usr.id === origin).name)
    console.log('to '+Near_Users.find(usr=>usr.id === destiny).name)
    console.log('data '+files)
    const target = sockets.find(sock=>sock.id === destiny);

    if(target)
    {
        target.emit('recive_files', files, origin)
        return true;
    }
    else
    {
        return false;
    }
}

io.on('connection', (socket) => {
    sockets.push(socket);
    socket.emit('current_users', Near_Users);
    const New_User = new User(socket);
    Near_Users.push(New_User);
    socket.emit('assingData', {User: New_User, Dir: server_direction})
    sockets.forEach(socketing => {
        if(socketing.id !== socket.id)socketing.emit('new_user', New_User)
    })

    socket.on('disconnect', ()=>{
        sockets = sockets.filter(socketing=>socketing.id !== socket.id);
        Near_Users = Near_Users.filter(user=>user.id !== socket.id);
        sockets.forEach(socketing => {
            socketing.emit('left_user', socket.id)
        });
    })

    socket.on('confirm_files', files=>{
        files.forEach(file => 
        {
            fs.rm(path.resolve(__dirname, './src/public/transference_files/'+file), ()=>{console.log('file deleted: '+file)})
        });
    })

    socket.on('request_transfer', async (target, quantity, size, callback = (answ)=>{})=>
    {
        var request_target = sockets.find(sock=>sock.id === target);
        if(!request_target)
            callback(404);

        var answ = await new Promise((resolve)=>{
            request_target.emit('request_transfer', socket.id, quantity, size, answ => {resolve(answ)})
        });
        callback(answ);
    })

    socket.on('show_window', ()=>{
        global.win.show();
    });
    socket.on('hide_window', ()=>{
        global.win.hide();
    });
    socket.on('minimize_window', ()=>{
        global.win.minimize();
    });
});

function restart() 
{
    process.on("exit", function () {
        require("child_process").spawn(process.argv.shift(), process.argv, {
            cwd: process.cwd(),
            detached : true,
            stdio: "inherit"
        });
    });
    process.exit();    
}