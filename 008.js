const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const broadcastMessage = {
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(broadcastMessage));
      }
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});