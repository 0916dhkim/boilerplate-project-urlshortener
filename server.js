'use strict';

// Read .env file.
require("dotenv").config();

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var cors = require('cors');
const dns = require("dns");
const url = require("url");

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
const SHORT_URL_LENGTH = 6;

// Define schema.
const shortySchema = new mongoose.Schema({
  original: { type: String, required: true },
  short: { type: String }
});
const Shorty = mongoose.model("Shorty", shortySchema);

// Random alphanumeric string generator.
function generateRandomAlphanumericChar() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return chars[Math.floor(Math.random() * chars.length)];
}
function generateShortUrl(len) {
  let res = "";
  for (let i = 0; i < len; i++) {
    res += generateRandomAlphanumericChar();
  }
  return res;
}

/** this project needs a db !! **/ 
mongoose.connect(
  process.env.DB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
).then(() => console.log("Connected to DB."));

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

async function lookupDns(host) {
  return new Promise((resolve, reject) => {
    dns.lookup(host, (err, address, family) => {
      if (err) {
        reject(err);
      }
      resolve(address);
    });
  });
}

app.post("/api/shorturl/new", async function (req, res) {
  try {
    // Verify request.
    const urlString = req.body.url;
    if (!urlString) {
      throw new Error("Request does not have original url.");
    }
    const parsedUrl = url.parse(urlString);
    if (!parsedUrl.host) {
      throw new Error("Url is not well-formed.");
    }
    await lookupDns(parsedUrl.host); // Verify DNS lookup.

    // Check if original URL exists in database.
    await Shorty.findOne({ original: urlString }).then(async (shorty) => {
      if (!shorty) {
        // No matching URL.
        // Put shorturl in database.
        const shorturl = generateShortUrl(SHORT_URL_LENGTH);
        shorty = new Shorty({
          original: urlString,
          short: shorturl
        });
        await shorty.save();

        return shorturl;
      }
      return shorty.short;
    }).then(shorturl => {
      res.send({
        original_url: urlString,
        short_url: shorturl
      });
    });
  } catch (e) {
    res.send({
      error: e.message
    });
  }
});

app.get("/api/shorturl/:shorturl", async function (req, res) {
  try {
    await Shorty.findOne({ short: req.params.shorturl }).then(shorty => {
      if (!shorty) {
        throw new Error("Short URL not found.");
      }
      res.redirect(shorty.original);
    });
  } catch (e) {
    res.send({
      error: e.message
    });
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});