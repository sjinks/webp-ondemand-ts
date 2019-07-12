"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const config = require("./lib/config");
const populateEnv = require("./lib/environment");
const handler = require("./lib/handler");
populateEnv();
const server = http.createServer(handler);
server.listen(config.port(), config.listenHost(), () => {
    process.send && process.send('ready');
});
process.on('SIGHUP', function () {
    const old = {
        port: config.port(),
        listenHost: config.listenHost(),
    };
    populateEnv();
    if (old.port != config.port() || old.listenHost !== config.listenHost()) {
        server.close(function ( /* err */) {
            server.listen(config.port(), config.listenHost());
        });
    }
});
process.on('SIGINT', function () {
    server.close(function (err) {
        if (err) {
            console.error(err); // eslint-disable-line no-console
            process.exit(1);
        }
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map