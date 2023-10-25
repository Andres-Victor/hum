const path = require('path');

let callback = (f_l,d)=>{ return false}

const express = require('express');
const app = express();
const server = require('http').createServer(app);
app.use(express.static(path.resolve(__dirname,'../../public')));

var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname,'../../public/transference_files/'))
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage });
app.post('/upload', upload.array('files'), function (req, res, next) {
  var files = req.files;
  var destinationId = req.body.destinationId;
  var originId = req.body.originId;
  var fileNames = []
  // Obtener la ruta de los archivos subidos
  for (var i = 0; i < files.length; i++) 
    {
        fileNames.push(files[i].originalname);
    }
    callback(fileNames, destinationId, originId)
});


module.exports = (port, cb, onstart = ()=>{})=>
    {
      callback = cb;
      server.listen(port);
      onstart();
      return {server};
    }