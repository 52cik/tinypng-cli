const ora = require('ora');
const { src, dest } = require('vinyl-fs');
const through = require('through2-concurrent');
const { upload, download } = require('./utils');

const validExtensions = /\.(png|jpg|jpeg)$/i;
let fileCount = 0;
let orgSize = 0;
let tinySize = 0;

const tinify = through.obj({ maxConcurrency: 10 }, function(file, _, cb) {
  const filename = file.relative;

  if (!validExtensions.test(file.path)) {
    cb(null, file);
    return;
  }

  fileCount += 1;
  orgSize += file.contents.length;

  const done = buf => {
    tinySize += buf.length;
    file.contents = buf;
    cb(null, file);
  };

  upload(file.contents, filename)
    .then(download)
    .then(done)
    .catch(cb);
});

function entry(globs, folder) {
  const start = Date.now();
  const spinner = ora('processing...').start();
  src(globs)
    .pipe(tinify)
    .pipe(dest(folder))
    .on('end', () => {
      const stop = Date.now();
      spinner.succeed(
        `done in ${((stop - start) / 1000) |
          0}s, files: ${fileCount}, size: ${(orgSize / 1024) |
          0}kb, tiny: ${(tinySize / 1024) | 0}kb.`,
      );
    });
}

module.exports = entry;
