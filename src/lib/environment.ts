import dotenv = require('dotenv');
import fs = require('fs');
import path = require('path');
import config = require('./config');

export = function(): void {
    const environment: string = process.env.NODE_ENV || 'development';
    const files: string[] = ['.env.defaults', '.env', '.env.local', `.env.${environment}`, `.env.${environment}.local`];

    for (const file of files) {
        const fullname = path.join(__dirname, '..', file);
        if (fs.existsSync(fullname)) {
            const options: Record<string, string> = dotenv.parse(fs.readFileSync(fullname));
            for (const key in options) {
                if (key in config) {
                    process.env[key] = options[key];
                    config.setProperty(key, options[key]);
                }
            }
        }
    }
};
