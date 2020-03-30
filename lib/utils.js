const got = require('got');
const { pipeline, Readable } = require('stream');

const toReadableStream = input =>
  new Readable({
    read() {
      this.push(input);
      this.push(null);
    },
  });

const headers = (acceptAll = true) => ({
  accept: acceptAll
    ? '*/*'
    : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'accept-encoding': 'gzip, deflate, br',
  'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ja;q=0.6',
  referer: 'https://tinypng.com/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
});

/**
 * upload
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {Promise<string>}
 */
const upload = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    pipeline(
      toReadableStream(buffer),
      got.stream
        .post('https://tinypng.com/web/shrink', { headers: headers(true) })
        .on('response', res =>
          resolve(`${res.headers.location}/${filename.replace(/[\\/]/g, '_')}`),
        ),
      err => {
        if (err) reject(err);
      },
    );
  });
};

/**
 * download
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const download = url =>
  got(url, { responseType: 'buffer', headers: headers(false) }).then(
    res => res.body,
  );

module.exports = {
  upload,
  download,
};
