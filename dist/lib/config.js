"use strict";
const net = require("net");
class Config {
    constructor() {
        this._props = {
            PORT: 7777,
            LISTEN_HOST: '127.0.0.1',
            CONTENT_NEGOTIATION: true,
            MAX_AGE: 864000,
            ACH_LIFETIME: 864000,
            HOSTMAP: {},
        };
    }
    setProperty(property, value) {
        const map = {
            PORT: this.setPort,
            LISTEN_HOST: this.setListenHost,
            CONTENT_NEGOTIATION: this.setContentNegotiation,
            MAX_AGE: this.setMaxAge,
            ACH_LIFETIME: this.setACHLifetime,
            HOSTMAP: this.setHostMap,
        };
        if (property in map) {
            const method = map[property];
            method.call(this, value);
        }
        else {
            console.warn('Unknown option', property); // eslint-disable-line no-console
        }
    }
    port() {
        return this._props.PORT;
    }
    setPort(value) {
        const v = parseInt(value, 10);
        if (!isNaN(v) && v > 0 && v <= 65535) {
            this._props.PORT = v;
        }
    }
    listenHost() {
        return this._props.LISTEN_HOST;
    }
    setListenHost(value) {
        if (net.isIP(value)) {
            this._props.LISTEN_HOST = value;
        }
    }
    contentNegotiation() {
        return this._props.CONTENT_NEGOTIATION;
    }
    setContentNegotiation(value) {
        this._props.CONTENT_NEGOTIATION = !!parseInt(value, 10);
    }
    maxAge() {
        return this._props.MAX_AGE;
    }
    setMaxAge(value) {
        const v = parseInt(value, 10);
        if (v >= 0) {
            this._props.MAX_AGE = v;
        }
    }
    achLifetime() {
        return this._props.ACH_LIFETIME;
    }
    setACHLifetime(value) {
        const v = parseInt(value, 10);
        if (v >= 0) {
            this._props.ACH_LIFETIME = v;
        }
    }
    hostMap() {
        return this._props.HOSTMAP;
    }
    setHostMap(value) {
        value += '';
        const map = {};
        value
            .split(';')
            .filter(Boolean)
            .forEach((item) => {
            const parts = item.split(':', 2);
            if (typeof parts[1] !== 'undefined') {
                map[parts[0].toLowerCase()] = parts[1];
            }
        });
        this._props.HOSTMAP = map;
    }
}
const config = new Config();
module.exports = config;
//# sourceMappingURL=config.js.map