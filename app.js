var mc = require('minecraft-protocol');
var WebSocketServer = require("ws").Server
var WebSocket = require('ws')
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

app.use(express.static(__dirname + "/"))

var wsc= new WebSocket('ws://a-2b2t-shit-bot.herokuapp.com');
var server = http.createServer(app)
server.listen(port)

console.log("http server listening on %d", port)

var clients = [];
 
var wss = new WebSocketServer({server: server})
var wso;

console.log("websocket server created")
wss.on("connection", function(ws) {
  console.log("Client connected to webserver")
  clients.push(ws);
  
  setInterval(function() {
      for (var i in clients) {
        clients[i].ping("heartbeat");
      }
  }, 1000)
  ws.send(JSON.stringify("Logged in as " + client.username), function() { });
  
  wso = ws;

  ws.on("close", function() {
    clients.splice(clients.indexOf(ws),1)
    console.log("Client disconnected from webserver")
  })
  
  ws.on('error', function() {
    clients.splice(clients.indexOf(ws),1)
    console.log("Client disconnected from webserver")
  });
  
  ws.on('message', function(message) {
      sendAll(JSON.stringify(message), function() { });
  });
})

var clientconnected = false;

wsc.on('open', function() {
      console.log("client connected");
      clientconnected = true;
    });

var client = mc.createClient({
  host: "2b2t.org",   // optional
  port: 25565,         // optional
  username: "redacted",
  password: "redacted",
});

client.on('chat', function(packet) {
  // Listen for chat messages and echo them back.
  var jsonMsg = JSON.parse(packet.message);
  console.log("1 " + JSON.stringify(jsonMsg))
  if ((typeof jsonMsg.extra[0].text === 'undefined' &&/*  jsonMsg.extra[0].split(" ")[0] !== ("<" + client.username + ">") && */jsonMsg.extra[0].length < 100 && jsonMsg.extra[0].charAt(0) !== '/')) {
	  /*client.write("chat", {
      message: jsonMsg.extra[0].slice(jsonMsg.extra[0].split(" ")[0].length, jsonMsg.extra[0].length)
    });*/
    console.log("2 " + JSON.stringify(jsonMsg))
      if (clientconnected)
      wsc.send(linkify(parseChat(jsonMsg, {})));
  } else {
    console.log("3 " + JSON.stringify(jsonMsg))
    if (jsonMsg.extra[0].text.length < 100) {
      if (clientconnected)
      wsc.send(linkify(parseChat(jsonMsg, {})));
    }
  }
});

client.on('keep_alive', function(packet) {
	client.write('keep_alive', packet);
});

setInterval(function() {
	client.write('client_command', {payload: 0});
}, 1000);

function sendAll (message) {
    var ii = 0;
    for (var i in clients) {
        try {
          clients[i].send(message);
          ii = ii + 1;
        }
        catch (err) {
          console.log(err.message);
        }
    }
    console.log("Sent message \"" + message + "\" to " + ii + " clients");
}

var dictionary = {};
dictionary["chat.stream.emote"] = "(%s) * %s %s";
dictionary["chat.stream.text"] = "(%s) <%s> %s";
dictionary["chat.type.achievement"] = "%s has just earned the achievement %s";
dictionary["chat.type.admin"] = "[%s: %s]";
dictionary["chat.type.announcement"] = "[%s] %s";
dictionary["chat.type.emote"] = "* %s %s";
dictionary["chat.type.text"] = "<%s> %s";

var colors = new Array();
colors["black"] = '#000';
colors["dark_blue"] = '#0000AA';
colors["dark_green"] = '#00AA00';
colors["dark_aqua"] = '#00AAAA'
colors["dark_red"] = '#AA0000'
colors["dark_purple"] = '#AA00AA'
colors["gold"] = '#FFAA00'
colors["gray"] = '#AAAAAA'
colors["dark_gray"] = '#555555'
colors["blue"] = '#5555FF'
colors["green"] = '#55FF55'
colors["aqua"] = '#55FFFF'
colors["red"] = '#FF5555'
colors["light_purple"] = '#FF55FF'
colors["yellow"] = '#EEEE00'
colors["white"] = '#000'
colors["obfuscated"] = ''
colors["bold"] = 'bold'
colors["strikethrough"] = '<font style="text-decoration:line-through;">'
colors["underlined"] = '<font style="text-decoration:underline;">'
colors["italic"] = '<font style="font-style:italic;">'
colors["reset"] = '#000'

function parseChat(chatObj, parentState) {
  function getColorize(parentState) {
    var myColor = "";
    if ('color' in parentState) myColor += '<font style="color:' + colors[parentState.color] + ';">';
    if (parentState.bold) myColor += '<font style="font-weight:bold;">';
    if (parentState.underlined) myColor += '<font style="text-decoration:underline;">';
    if (parentState.obfuscated) myColor += "";
    return myColor;
  }
  if (typeof chatObj === "string") {
  	return getColorize(parentState) + htmlEntities(chatObj);
  } else {
    var chat = "";
    if ('color' in chatObj) parentState.color = chatObj['color'];
    if ('bold' in chatObj) parentState.bold = chatObj['bold'];
    if ('italic' in chatObj) parentState.italic = chatObj['italic'];
    if ('underlined' in chatObj) parentState.underlined = chatObj['underlined'];
    if ('strikethrough' in chatObj) parentState.strikethrough = chatObj['strikethrough'];
    if ('obfuscated' in chatObj) parentState.obfuscated = chatObj['obfuscated'];

    if ('text' in chatObj) {
      chat += getColorize(parentState) + htmlEntities(chatObj.text);
    } else if ('translate' in chatObj && dictionary.hasOwnProperty(chatObj.translate)) {
      var args = [dictionary[chatObj.translate]];
      chatObj['with'].forEach(function(s) {
        args.push(parseChat(s, parentState));
      });

    }
    for (var i in chatObj.extra) {
      chat += parseChat(chatObj.extra[i], parentState);
    }
    return chat;
  }
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

//thx pyro u da mvp
function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}
