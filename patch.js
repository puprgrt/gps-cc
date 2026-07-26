const fs = require('fs');

// Monkey patch fs.readlink and fs.promises.readlink for Windows exFAT bug
// where readlink on a file throws EISDIR instead of EINVAL.

const originalReadlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? null : options;
  originalReadlink(path, opts, (err, linkString) => {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    cb(err, linkString);
  });
};

const originalReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return originalReadlinkSync(path, options);
  } catch (err) {
    if (err && err.code === 'EISDIR') {
      err.code = 'EINVAL';
    }
    throw err;
  }
};

if (fs.promises && fs.promises.readlink) {
  const originalReadlinkPromise = fs.promises.readlink;
  fs.promises.readlink = async function (path, options) {
    try {
      return await originalReadlinkPromise(path, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        err.code = 'EINVAL';
      }
      throw err;
    }
  };
}

try {
  // Also try to patch graceful-fs if it's installed at root
  const gracefulFs = require('graceful-fs');
  if (gracefulFs.readlink && gracefulFs.readlink !== fs.readlink) {
    const originalGracefulReadlink = gracefulFs.readlink;
    gracefulFs.readlink = function (path, options, callback) {
      const cb = typeof options === 'function' ? options : callback;
      const opts = typeof options === 'function' ? null : options;
      originalGracefulReadlink(path, opts, (err, linkString) => {
        if (err && err.code === 'EISDIR') {
          err.code = 'EINVAL';
        }
        cb(err, linkString);
      });
    };
  }
} catch (e) {}
