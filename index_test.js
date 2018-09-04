// express
const express = require('express');
const app = express();


app.get('/', function(req, res, next) {
  res.send("Welcome to VoiceWIthMe API");
});

// listen for requests
app.listen(process.env.port || 8091, function() {
  console.log('now listening on port: localhost:8091');
});