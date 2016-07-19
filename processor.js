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

module.exports = {
  size(xml, cb) {
    cb(null, (xml || '').length);
  },
  extractToken(xml, cb) {
    parser.parseString(xml, (err, result) => {
      if (err && typeof cb === 'function') {
        cb(err);
        return;
      }
      const changes = result.Changes;
      const commitToken = changes && changes.commitToken ? changes.commitToken[0] : '';
      if (typeof cb === 'function') cb(null, commitToken);
    });
  },
  downloadImages(xml, localpath, limit, cb) {
    const retry = (img, cb) => {
      cb(img.err);
      if (img.chances > 0) {
        img.changes--;
        request.get(img.url)
        .on('error', (err) => {
          img.err = err;
          retry(img, cb);
        })
        .on('response', (res) => {
          cb(null, `Retrying download for ${img.url}, ${img.chances} retries remaining...`);
        })
        .pipe(fs.createWriteStream(img.localfilename));
      } else {
        cb(`Giving up on ${img.url}.`);
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
          .on('error', (err) => {
            retry({ url: u, localfilename, chances: RETRIES, err }, cb);
          })
          .on('response', (res) => {
            cb(null, `Downloading ${u}...`);
          })
          .pipe(fs.createWriteStream(localfilename));
        }
      });
    });
  },
};
