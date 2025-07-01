// api/index.js
const server = require('../server'); // Caminho: volta 1 nível pra `server.js`

module.exports = server.handler; // Exporta o handler
