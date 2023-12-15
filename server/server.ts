/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { readFileSync } from "fs";
import { createServer } from "https";
import * as WebSocket from "ws";

const server = createServer({
  cert: readFileSync("./ssl/selfsigned.crt"),
  key: readFileSync("./ssl/selfsigned.key")
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
        width = Math.max(width, Math.abs(parseFloat(tile[0])) + 1);
        height = Math.max(height, Math.abs(parseFloat(tile[1])) + 1);
        const size = Math.min(width, height);

        wss.clients.forEach((client) => client.send(`T${size},${size}`)); // resize all clients
        state.forEach((buffer) => socket.send(buffer)); // reset new client with last seen state

        console.log(`\n${wss.clients.size} clients ${width}x${height}`);
        break;
      }
    }
  });
});

server.listen(42001);
