const { sign } = require('app-builder-lib/out/codeSign/macCodeSign');

exports.sign = async function signWithResolvedIdentity(options) {
  // electron-builder's default path rewrites this hash back to a certificate
  // name, which fails when the imported keychain contains duplicate subjects.
  return sign(options);
};
