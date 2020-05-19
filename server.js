'use strict';

// Read .env file.
require("dotenv").config();

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

// Define schema.
const shortySchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: { type: String }
});
const Shorty = mongoose.model("Shorty", shortySchema);

/** this project needs a db !! **/ 
mongoose.connect(
  process.env.DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function (req, res) {
  res.send("OK");
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});