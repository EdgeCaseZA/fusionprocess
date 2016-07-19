const xml2js = require('xml2js');
const request = require('request');
const xpath = require('xml2js-xpath');
const fs = require('fs');
const url = require('url');
const path = require('path');

const RETRIES = 3;

const parser = new xml2js.Parser({
  mergeAttrs: true,
});

const callback = {
  error(cb, err) {
    if (err && typeof cb === 'function') cb(err);
    return !!err;
  },
  result(cb, res) {
    if (typeof cb === 'function') cb(null, res);
  },
};

module.exports = {
  size(xml, cb) {
    callback.result(cb, (xml || '').length);
  },
  extractToken(xml, cb) {
    parser.parseString(xml, (err, result) => {
      if (callback.error(cb, err)) return;
      const changes = result.Changes;
      const commitToken = changes && changes.commitToken ? changes.commitToken[0] : '';
      callback.result(cb, commitToken);
    });
  },
  downloadImages(xml, localpath, limit, cb) {
    const retry = (img, cb) => {
      callback.error(cb, img.err);
      if (img.chances > 0) {
        request.get(img.url)
        .on('error', (err) => retry({ url: img.url, localfilename: img.localfilename, chances: img.chances - 1, err }, cb))
        .on('response', () => callback.result(cb, `Retrying download for ${img.url}, ${img.chances - 1} retries remaining...`))
        .pipe(fs.createWriteStream(img.localfilename));
      } else {
        callback.error(cb, `Giving up on ${img.url}.`);
      }
    };
    parser.parseString(xml, (err, result) => {
      const matches = xpath.find(result, '//Photo/url');
      if (limit > 0) matches.splice(limit);
      if (!fs.existsSync(localpath)) {
        fs.mkdirSync(localpath);
      }
      matches.forEach((u) => {
        if (u) {
          const localfilename = path.join(localpath, path.basename(url.parse(u).pathname));
          request.get(u)
          .on('error', (err) => retry({ url: u, localfilename, chances: RETRIES, err }, cb))
          .on('response', () => callback.result(cb, `Downloading ${u}...`))
          .pipe(fs.createWriteStream(localfilename));
        }
      });
    });
  },
};
