const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8000 });

let connections = [];
const messages = [];

wss.on("connection", function connection(ws) {
  connections.push(ws);
  console.log(`new connection [${connections.length}]`);

  const intervalId = setInterval(() => {
    ws.ping();
  }, 1000);

  messages.forEach((message) => ws.send(message));

  ws.on("close", () => {
    connections = connections.filter((c) => c != ws);
    clearInterval(intervalId);
  });

  ws.on("error", (error) => {
    console.log(`ERROR - ${arguments}`);
  });

  ws.on("message", function incoming(message) {
    messages.push(message);
    console.log("received: %s", message);
    connections.forEach((ws) => ws.send(message));
  });

  ws.on("pong", () => {
    console.log("pong");
  });
});
