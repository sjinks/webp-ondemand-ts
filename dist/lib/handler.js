"use strict";
const config = require("./config");
const netQuality = require("./netquality");
const imgQuality = require("./imgquality");
const fs = require("fs");
const sharp = require("sharp");
function findDocRoot(host, hostMap) {
    if (host in hostMap) {
        return hostMap[host];
    }
    const keys = Object.keys(hostMap).filter((key) => key.startsWith('.'));
    for (const key of keys) {
        if (key.endsWith(host)) {
            return hostMap[key];
        }
    }
    if ('' in hostMap) {
        return hostMap[''];
    }
    return null;
}
function error400(response) {
    response.statusCode = 400;
    response.setHeader('Cache-Control', 'private, no-cache, no-store');
    response.setHeader('Expires', 'Sat, 25 Aug 1991 03:00:00 GMT');
    response.setHeader('Conetnt-Type', 'text/plain; charset=utf-8');
    response.end('Bad Request');
}
function error403(response) {
    response.statusCode = 403;
    response.setHeader('Cache-Control', 'private, no-cache, no-store');
    response.setHeader('Expires', 'Sat, 25 Aug 1991 03:00:00 GMT');
    response.setHeader('Conetnt-Type', 'text/plain; charset=utf-8');
    response.end('Forbidden');
}
function error404(response) {
    response.statusCode = 404;
    response.setHeader('Cache-Control', 'private, no-cache, no-store');
    response.setHeader('Expires', 'Sat, 25 Aug 1991 03:00:00 GMT');
    response.setHeader('Conetnt-Type', 'text/plain; charset=utf-8');
    response.end('Not Found');
}
function error405(response) {
    response.statusCode = 405;
    response.setHeader('Cache-Control', 'private, no-cache, no-store');
    response.setHeader('Expires', 'Sat, 25 Aug 1991 03:00:00 GMT');
    response.setHeader('Conetnt-Type', 'text/plain; charset=utf-8');
    response.end('Method Not Allowed');
}
function error500(response) {
    response.statusCode = 500;
    response.setHeader('Cache-Control', 'private, no-cache, no-store');
    response.setHeader('Expires', 'Sat, 25 Aug 1991 03:00:00 GMT');
    response.setHeader('Conetnt-Type', 'text/plain; charset=utf-8');
    response.end('Internal Server Error');
}
function sendOKHeaders(response, mtime, negotiate) {
    response.setHeader('Cache-Control', `public, max-age=${config.maxAge()}, s-max-age=${config.maxAge()}`);
    response.setHeader('Last-Modified', mtime.toUTCString());
    if (negotiate) {
        response.setHeader('Accept-CH', 'Width, Viewport-Width, DPR, RTT, ECT, Downlink');
        if (config.achLifetime() > 0) {
            response.setHeader('Accept-CH-Lifetime', config.achLifetime());
        }
        response.setHeader('Vary', 'Width, DPR, Save-Data, RTT, ECT, Downlink, Viewport-Width');
    }
}
function adaptImage(response, file, stats, quality, width, dpr, negotiate, needCDPR, isHEAD) {
    let img = sharp(file);
    let cd = 0.0;
    img.metadata()
        .then(function (metadata) {
        const imageWidth = metadata.width || 0;
        const imageHeight = metadata.height || 0;
        let newWidth = imageWidth;
        if (width) {
            newWidth = Math.min(width, imageWidth);
            cd = (newWidth / width) * dpr;
        }
        const newHeight = (imageHeight * newWidth) / imageWidth;
        if (newHeight < 16383 && newWidth < 16383) {
            response.setHeader('Content-Type', 'image/webp');
        }
        else {
            let format = metadata.format;
            if (format === 'gif' || format === 'svg') {
                format = 'png';
            }
            response.setHeader('Content-Type', `image/${format}`);
        }
        if (newWidth !== imageWidth) {
            img = img.resize(newWidth, undefined);
        }
        if (newHeight < 16383 && newWidth < 16383) {
            img = img.webp({ quality });
        }
        img.toBuffer()
            .then((buf) => {
            sendOKHeaders(response, stats.mtime, negotiate);
            response.setHeader('Content-Length', buf.length);
            if (needCDPR && cd) {
                response.setHeader('Content-DPR', Math.round(cd * 100) / 100);
            }
            if (isHEAD) {
                response.end();
            }
            else {
                response.end(buf);
            }
        })
            .catch(( /*e: Error*/) => error500(response));
    })
        .catch(( /*e: Error*/) => error400(response));
}
module.exports = function requestHandler(request, response) {
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD') {
        return error405(response);
    }
    const docroot = findDocRoot((request.headers.host + '').toLowerCase(), config.hostMap());
    if (docroot === null) {
        return error404(response);
    }
    const parsed = new URL(request.url, 'https://example.com/'); // We don't care about the domain part
    const pathname = decodeURIComponent(parsed.pathname || '');
    const query = parsed.searchParams;
    if (/\.webp$/.test(pathname)) {
        const source = docroot + pathname.slice(0, -5);
        fs.stat(source, (err, stats) => {
            if (err) {
                return err.code === 'EPERM' ? error403(response) : error404(response);
            }
            if (request.headers['if-modified-since']) {
                const since = new Date(request.headers['if-modified-since']);
                stats.mtime.setMilliseconds(0);
                if (stats.mtime <= since) {
                    response.statusCode = 304;
                    response.setHeader('Cache-Control', `public, max-age=${config.maxAge()}, s-max-age=${config.maxAge()}`);
                    response.setHeader('Last-Modified', stats.mtime.toUTCString());
                    return response.end();
                }
            }
            let q = 80;
            let dpr = 1;
            let w = 0;
            let vw = 0;
            let needCDPR = false;
            let neg = false;
            if (query.has('q')) {
                q = parseInt(query.get('q'), 10) || 80;
                dpr = parseInt(query.get('dpr'), 10) || 1;
                w = parseInt(query.get('w'), 10) || 0;
                vw = parseInt(query.get('vw'), 10) || 0;
            }
            else if (config.contentNegotiation() &&
                (request.headers.ect ||
                    request.headers.width ||
                    request.headers['viewport-width'] ||
                    request.headers['save-data'])) {
                const sd = request.headers['save-sata'] === 'on';
                const ect = request.headers.ect || '4g';
                const rtt = parseInt(request.headers.rtt, 10) || 0;
                const dl = parseFloat(request.headers.downlink) || 0;
                const nq = netQuality(sd, rtt, ect, dl);
                q = imgQuality(nq);
                neg = true;
                w = parseInt(request.headers.width, 10) || 0;
                vw = parseInt(request.headers['viewport-width'], 10) || 0;
                dpr = sd ? 1 : parseInt(request.headers.dpr, 10) || 1;
                needCDPR = w > 0;
            }
            w = w > 0 ? w : vw;
            if (w < 0 || q <= 0 || q > 100 || dpr <= 0) {
                return error400(response);
            }
            adaptImage(response, source, stats, q, w, dpr, neg, needCDPR, request.method === 'HEAD');
        });
        return;
    }
    return error404(response);
};
//# sourceMappingURL=handler.js.map