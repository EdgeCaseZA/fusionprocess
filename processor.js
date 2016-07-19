const xml2js = require('xml2js');
const request = require('request');
const xpath = require('xml2js-xpath');
const fs = require('fs');
const url = require('url');
const path = require('path');

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
    parser.parseString(xml, (err, result) => {
      const matches = xpath.find(result, '//Photo/url');
      if (limit > 0) matches.splice(limit);
      if (!fs.existsSync(localpath)) {
        fs.mkdirSync(localpath);
      }
      matches.forEach((u) => {
        const localfilename = path.join(localpath, path.basename(url.parse(u).pathname));
        if (u) {
          request.get(u)
          .on('error', (err) => {
            cb(err);
          })
          .on('response', (res) => {
            cb(null, `Downloaded ${u}. Status ${res.statusCode} , Type ${res.headers['content-type']}`);
          })
          .pipe(fs.createWriteStream(localfilename));
        }
      });
    });
  },
};
