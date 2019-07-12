import net = require('net');

interface Props {
    PORT: number;
    LISTEN_HOST: string;
    CONTENT_NEGOTIATION: boolean;
    MAX_AGE: number;
    ACH_LIFETIME: number;
    HOSTMAP: Record<string, string>;
}

class Config {
    private _props: Props = {
        PORT: 7777,
        LISTEN_HOST: '127.0.0.1',
        CONTENT_NEGOTIATION: true,
        MAX_AGE: 864000,
        ACH_LIFETIME: 864000,
        HOSTMAP: {},
    };

    public setProperty(property: string, value: string): void {
        const map: Record<string, (value: string) => void> = {
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
        } else {
            console.warn('Unknown option', property); // eslint-disable-line no-console
        }
    }

    public port(): number {
        return this._props.PORT;
    }

    public setPort(value: string): void {
        const v = parseInt(value, 10);
        if (!isNaN(v) && v > 0 && v <= 65535) {
            this._props.PORT = v;
        }
    }

    public listenHost(): string {
        return this._props.LISTEN_HOST;
    }

    public setListenHost(value: string): void {
        if (net.isIP(value)) {
            this._props.LISTEN_HOST = value;
        }
    }

    public contentNegotiation(): boolean {
        return this._props.CONTENT_NEGOTIATION;
    }

    public setContentNegotiation(value: string): void {
        this._props.CONTENT_NEGOTIATION = !!parseInt(value, 10);
    }

    public maxAge(): number {
        return this._props.MAX_AGE;
    }

    public setMaxAge(value: string): void {
        const v = parseInt(value, 10);
        if (v >= 0) {
            this._props.MAX_AGE = v;
        }
    }

    public achLifetime(): number {
        return this._props.ACH_LIFETIME;
    }

    public setACHLifetime(value: string): void {
        const v = parseInt(value, 10);
        if (v >= 0) {
            this._props.ACH_LIFETIME = v;
        }
    }

    public hostMap(): Record<string, string> {
        return this._props.HOSTMAP;
    }

    public setHostMap(value: string): void {
        value += '';
        const map: Record<string, string> = {};
        value
            .split(';')
            .filter(Boolean)
            .forEach((item: string): void => {
                const parts = item.split(':', 2);
                if (typeof parts[1] !== 'undefined') {
                    map[parts[0].toLowerCase()] = parts[1];
                }
            });

        this._props.HOSTMAP = map;
    }
}

const config = new Config();

export = config;
