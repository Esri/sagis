import fs from 'fs';

export default {
  server: {
    host: "0.0.0.0",
    port: 42000,
    https: {
      key: fs.readFileSync('./ssl/selfsigned.key'),
      cert: fs.readFileSync('./ssl/selfsigned.crt'),
    }
  },
  base: "./",
  build: {
    target: "es2020",
  }
}
