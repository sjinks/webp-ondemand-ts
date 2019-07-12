import http = require('http');
import config = require('./lib/config');
import populateEnv = require('./lib/environment');
import handler = require('./lib/handler');

populateEnv();

const server = http.createServer(handler);
server.listen(config.port(), config.listenHost(), (): void => {
    process.send && process.send('ready');
});

process.on('SIGHUP', function(): void {
    const old = {
        port: config.port(),
        listenHost: config.listenHost(),
    };
    populateEnv();
    if (old.port != config.port() || old.listenHost !== config.listenHost()) {
        server.close(function(/* err */): void {
            server.listen(config.port(), config.listenHost());
        });
    }
});

process.on('SIGINT', function(): void {
    server.close(function(err: Error | undefined): void {
        if (err) {
            console.error(err); // eslint-disable-line no-console
            process.exit(1);
        }

        process.exit(0);
    });
});
