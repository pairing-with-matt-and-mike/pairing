const WebSocket = require("ws");

const ws = new WebSocket("ws://localhost:8000/");

ws.on("open", function open() {
  ws.send(`something - ${Date.now()}`);
  // setInterval(() => {
  //   ws.ping("FOO");
  // }, 1000);
});

ws.on("message", function incoming(data) {
  console.log(`RECV: ${data}`);
});

ws.on("ping", function pong(data) {
  console.log(`PING: ${data}`);
  // ws.pong();
});
