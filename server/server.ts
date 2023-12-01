// fs
import { readFileSync } from "fs";

// https
import { createServer } from "https";

// ws
import * as WebSocket from "ws";

const server = createServer({
  cert: readFileSync("/etc/ssl/certs/apache-selfsigned.crt"),
  key: readFileSync("/home/eile/.ssl/apache-selfsigned.key")
});

const wss = new WebSocket.WebSocketServer({ server });

let width = 1;
let height = 1;
const state = new Map<string, string>();

wss.on("connection", (socket) => {
  socket.on("error", console.error);

  socket.on("message", (buffer: Buffer, binary) => {
    const data = buffer.toString();
    const type = data[0];
    const message = data.substring(1);
    process.stdout.write(type);

    switch (type) {
      default: {
        const oldState = state.get(type);
        if (oldState === data) {
          break;
        }

        wss.clients.forEach((client) => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(data, { binary });
          }
        });
        state.delete(type); // preserve order
        state.set(type, data);
        break;
      }
      case "T": {
        const tile = message.split(",");
        width = Math.max(width, Math.abs(parseFloat(tile[0]) * 2 + 1));
        height = Math.max(height, Math.abs(parseFloat(tile[1]) * 2 + 1));
        const size = Math.min(width, height, 1);

        wss.clients.forEach((client) => client.send(`T${size},${size}`)); // resize all clients
        state.forEach((buffer) => socket.send(buffer)); // reset new client with last seen state

        console.log(`\n${wss.clients.size} clients ${width}x${height}`);
        break;
      }
    }
  });
});

server.listen(9001);
