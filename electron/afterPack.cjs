const fsp = require("node:fs/promises");
const path = require("node:path");

const KEEP_LOCALES = new Set(["en-US.pak", "ja.pak"]);

exports.default = async function afterPack(context) {
  const localesDir = path.join(context.appOutDir, "locales");
  const entries = await fsp.readdir(localesDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".pak") && !KEEP_LOCALES.has(entry.name))
      .map((entry) => fsp.rm(path.join(localesDir, entry.name), { force: true })),
  );
};
