// init project
const express = require('express');
const app = express();
// weather api
const weather = require('weather-js');
// require/import the mongodb native drivers
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const mongoose = require('mongoose');
// connection URL
const url = process.env.MONGOLAB_URI;      
// connection
const promise_connection = mongoose.connect(url);
let db = mongoose.connection;
// if connection is success
promise_connection.then(function(db){
	console.log('Connected to mongodb');
});


// describe the schema
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
let commandSchema = new Schema({
    name: String,
    response: String
});
// get the model
let commandModel = mongoose.model('commands', commandSchema);


// variables
let doEducation = 0;
let user_id = -1;
let commands = [];
let command = {
  name: "",
  response: ""
}


// set USEs
app.use(express.static('public'));

// main page
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// bot AI
const API = require('node-vk-bot-api')
 
const bot = new API(process.env.TOKEN)


// timer/interval to check schedule
setInterval(() => {
  let d = new Date();
  let n = d.getHours();
  
  // if time is 20:00:00 (MSC) => send to me weather forecast for next day
  if(((d.getHours() + 3) == 20) && (d.getMinutes() == 0) && (d.getSeconds() == 0)) {
    weather.find({search: 'Krasnodar', degreeType: 'C'}, function(err, result) {
      if(err) console.log(err);
          bot.reply(process.env.VKID, "Good evening :) now is " + (n+3) +" hours. " + "Tommorow - " + result[0].forecast[2].day);
          bot.reply(process.env.VKID, "Temperature: from " + result[0].forecast[2].low + " to " + result[0].forecast[2].high);
          bot.reply(process.env.VKID, "Sky: " + result[0].forecast[2].skytextday);
    });
  }
}, 1000);


// bot "replying" logic
bot.on((ctx) => {
  if(ctx.body === process.env.PASSWORD) {
    user_id = ctx.peer_id;
    doEducation = 1;
    bot.reply(ctx.peer_id, "enter a command");
  }
  
  else {
    
  if(doEducation == 1 && user_id == ctx.peer_id) {
    command.name = ctx.body;
    doEducation = 2;
    bot.reply(ctx.peer_id, "enter a response");
  }
  else if(doEducation == 2 && user_id == ctx.peer_id) {
    command.response = ctx.body;
    doEducation = 0;
    user_id = -1;
      /******************/
      // add command into DB
      /******************/
          // check if command already exists
          commandModel.findOne({name: command.name}, (err, doc) => {
              if(doc === null) {
                  let cmnd = new commandModel(command);
                  cmnd.save(function (err) {
                    if (!err) {
                      bot.reply(ctx.peer_id, "Command is successfully saved!");
                    }
                    else {
                      bot.reply(ctx.peer_id, "Error, command has not successfully saved, try again, please");
                    }
                  });
              }
              else {
                bot.reply(ctx.peer_id, "Error, command already exist.");
              }
          });
      /******************/
    commands.push(command);
  } 
  else {
      /*********************/
      // try to find command
      /*********************/
          commandModel.findOne({name: ctx.body}, (err, doc) => {
              if(doc === null) {
                bot.reply(ctx.peer_id, "I don't understand you.");
              }
              else {
                bot.reply(ctx.peer_id, doc.response);
              }
          });
      /******************/
  }
    
  }
})
 
// throw list of commands
bot.command('Commands', (ctx) => {
  commandModel.find({}, (err, docs) => {
              if(docs.length == 0) {
                bot.reply(ctx.peer_id, 'There are no commands.')
              }
              else {
                bot.reply(ctx.peer_id, 'Hello, this is list of commands:')
                for(let i = 0; i < docs.length; i++) {
                  bot.reply(ctx.peer_id, '- ' + docs[i].name);
                }
              }
          });
})

bot.listen()


// server listener
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
