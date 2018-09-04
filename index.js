// express
const express = require('express');
const app = express();
// Add headers
app.use(function(req, res, next) {
  // Website you wish to allow to connect
  // res.setHeader('Access-Control-Allow-Origin', 'http://localhost:23477');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// configure the app to use bodyParser
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// database
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/nuchatbot-dev", function(error) {
  if (error)
    console.log(error);
  console.log("connection successful");
});
mongoose.Promise = global.Promise;
// middleware
const logger = require('morgan');
app.use(logger('dev'))
// public folder
app.use('/public', express.static('./public'));
// webiste
app.use(express.static('public'));
// models
const User = require('./models/user');
const Parent = require('./models/parent');
const Item = require('./models/item');
const Feedback = require('./models/feedback');
const Contact = require('./models/contact');
// create file or folder
const fs = require('fs');
// upload file
const multer = require('multer');
const path = require('path');

// ==========================================================================
// GOOGLE CLOUD API =========================================================
// ==========================================================================
const Translate = require('@google-cloud/translate');
const speech = require('@google-cloud/speech');
const projectId = 'aa6486b9a97774c94284daa0839a97d0db1808a2';
const translate = new Translate({projectId: projectId});
const clientSpeechToText = new speech.SpeechClient();

// ==========================================================================
// UPLOAD FUNCTIONS =========================================================
// ==========================================================================
const storage = multer.diskStorage({
  destination: function(req, file, next) {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    var folder = './public/uploads/' + year;
    // if the folder not exist yet, then create
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    folder += '/' + month;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }

    next(null, folder)
  },
  filename: function(req, file, next) {
    next(null, Date.now() + path.extname(file.originalname));
  }
});
// check file type
function checkFileType(file, next) {
  // allowed extension
  const filetypes = /jpeg|jpg|png|gif|wav/;
  // check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return next(null, true);
  } else {
    next('Error: Alowed Images Only!');
  }
}
// Init Upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100000000
  },
  fileFilter: function(req, file, next) {
    checkFileType(file, next);
  }
}).single('image');

// ==========================================================================
// API FUNCTIONS ============================================================
// ==========================================================================
app.get('/api', function(req, res, next) {
  res.send("Welcome to NU Chatbot API");
});

app.post('/api/speech-to-text', function(req, res, next) {
  // The target language (eg: en, km, ...)
  const target = req.query.target;
  const platform = req.query.platform;

  if (target == undefined ) {
    res.status(500).json({message: "Bad Query", success: false});
    return;
  }

  upload(req, res, function(err) {
    console.log(req.file);
    if (err) {
      console.log("Photo API ERROR: " + err);
      res.send("Error");
    } else {
      if (req.file == undefined) {
        res.send("Error: No file");
      } else {
        // uploaded successful
        const filename = req.file.path;
        const encoding = 'LINEAR16';
        var sampleRateHertz = 16000;
        const languageCode = target;
        const config = {
          encoding: encoding,
          sampleRateHertz: sampleRateHertz,
          languageCode: languageCode
        };
        const audio = {
          content: fs.readFileSync(filename).toString('base64')
        };
        const request = {
          config: config,
          audio: audio
        };
        // Detects speech in the audio file
        clientSpeechToText.recognize(request).then(data => {
          const response = data[0];
          console.log(response);
          const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
          console.log(`Transcription: `, transcription);
          res.send({
            "text": transcription,
            "target": target,
            "speechUrl": req.file.path});
        }).catch(err => {
          console.error('ERROR:', err);
        })
      }
    }
  });
});

app.post('/api/translation', function(req, res, next) {
  // The target language (eg: en, km, ...)
  const target = req.query.target;
  console.log(target);
  if (target == undefined) {
    res.status(500).json({message: "Bad Query", success: false});
    return;
  }

  var text = req.body.inputText;
  translate.translate(text, target).then(results => {
    const translation = results[0];
    console.log(`Text: ${text}`);
    console.log(`Translation: ${translation}`);
    res.send({"inputText": text, "translatedText": translation, "targetTranslation": req.body.targetTranslation, "inputSpeechUrl": req.body.inputSpeechUrl});

  }).catch(err => {
    console.error('ERROR:', err);
    res.send("Translation Error");
  });
});

// ==========================================================================
// Contact API ===============================================================
// ==========================================================================
// create new contact
app.post('/api/contact', async function(req, res, next){
  const secret = req.query.secret;

  if (secret == undefined) {
    res.status(500).json({
      message: "Bad Query",
      success: false
    });
    return;
  }

  if(secret != "b5ed678f64a4")
  {
    res.status(500).json({
      message: "Secret ID not found!",
      success: false
    });
    return;
  }

  try {
    var contact = Contact(req.body);
    var result = await contact.save();
    res.send(result);
  } catch(err){
    res.status(500).json(err);
  }

});

// update contact by id
app.put('/api/contact/:id', async function(req, res, next){
  const secret = req.query.secret;

  if (secret == undefined) {
    res.status(500).json({
      message: "Bad Query",
      success: false
    });
    return;
  }

  if(secret != "b5ed678f64a4")
  {
    res.status(500).json({
      message: "Secret ID not found!",
      success: false
    });
    return;
  }


  try {
    const contact = await Contact.findByIdAndUpdate({_id: req.params.id}, req.body);
    if(contact) {
      Contact.findById(req.params.id).then(function(data){
         res.send(data);
      });
    } else {
      res.status(500).json({
       message: 'Id not found', success: false
      });
    }
  } catch(err){
    res.status(500).json(err);
  }

});


// delete contact by id
app.delete('/api/contact/:id', async function(req, res, next){
  const secret = req.query.secret;

  if (secret == undefined) {
    res.status(500).json({
      message: "Bad Query",
      success: false
    });
    return;
  }

  if(secret != "b5ed678f64a4")
  {
    res.status(500).json({
      message: "Secret ID not found!",
      success: false
    });
    return;
  }


  try {
    await Contact.remove({_id: req.params.id});
    res.status(200).json({
      message: "Delete successful!",
      success: true
    });
  } catch(err){
    res.status(500).json(err);
  }

});

// get contacts
app.get('/api/contact/all', async function(req, res, next){

  const secret = req.query.secret;

  if (secret == undefined) {
    res.status(500).json({
      message: "Bad Query",
      success: false
    });
    return;
  }

  if(secret != "b5ed678f64a4")
  {
    res.status(500).json({
      message: "Secret ID not found!",
      success: false
    });
    return;
  }

  var contacts = await Contact.find().sort({createdAt: -1}).limit(30);;
  res.send(contacts);

});

// get contacts by id
app.get('/api/contact/id/:id', async function(req, res, next){

  const secret = req.query.secret;

  if (secret == undefined) {
    res.status(500).json({
      message: "Bad Query",
      success: false
    });
    return;
  }

  if(secret != "b5ed678f64a4")
  {
    res.status(500).json({
      message: "Secret ID not found!",
      success: false
    });
    return;
  }

  var contact = await Contact.findById(req.params.id);
  res.send(contact);

});
// ==========================================================================
// TEST CLOUD API ===============================================================
// ==========================================================================
app.get('/api/test/translation', async function(req, res, next){
  const text = 'Hello, world!';
  const target = 'km';
  translate
    .translate(text, target)
    .then(results => {
      const translation = results[0];
      const result = {
        "text": text,
        "translation": translation
      }
      console.log("Response: ", result);
      res.send(result);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
});

app.get('/api/test/speech-to-text', async function(req, res, next){
  // The name of the audio file to transcribe
  const fileName = './resources/audio.wav';

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(fileName);
  const audioBytes = file.toString('base64');

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  clientSpeechToText
    .recognize(request)
    .then(data => {
      const response = data[0];
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log(`Transcription: ${transcription}`);
      res.send(transcription);
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
});
// ==========================================================================
// MIDDLEWARE ===============================================================
// ==========================================================================
// catch 404 errors and forward them to error handling middleware
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// error handling middleware
app.use(function(err, req, res, next) {
  console.log(err);
  const error = app.get('env') === 'development'
    ? err
    : {};
  const status = err.status || 500;
  res.status(status).send({error: error.message});
});
// listen for requests
app.listen(process.env.port || 7080, function() {
  console.log('now listening on port: localhost:7080');
});
