const { execFileSync } = require('node:child_process');
const { sign } = require('app-builder-lib/out/codeSign/macCodeSign');

exports.sign = async function signWithResolvedIdentity(options) {
  if (process.env.CI === 'true' && process.platform === 'darwin') {
    const identityLine = execFileSync(
      '/usr/bin/security',
      ['find-identity', '-v', '-p', 'codesigning'],
      {
        encoding: 'utf8',
      }
    )
      .split('\n')
      .find((line) => options.identity && line.includes(options.identity));

    if (!identityLine?.includes('Developer ID Application:')) {
      throw new Error(
        `Expected Developer ID Application signing identity, got ${identityLine || 'none'}`
      );
    }
  }

  // electron-builder's default path rewrites this hash back to a certificate
  // name, which fails when the imported keychain contains duplicate subjects.
  return sign(options);
};
