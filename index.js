//get chat
var host = location.origin.replace(/^http/, 'ws')
var ws = new WebSocket(host);
ws.onmessage = function (event) {
    var li = document.createElement('li');
    li.innerHTML = JSON.parse(event.data);
    document.querySelector('#messages').appendChild(li);
    scrollDown();
};

var scrollDown = function () {
    var wtf = $('#messages');
    var height = wtf[0].scrollHeight;
    wtf.scrollTop(height);
}

