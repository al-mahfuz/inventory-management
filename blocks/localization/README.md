# blocks/localization

Localization dictionaries, one `<module>.<language>.json` file each. Two-way:
`blocks localization pull` writes them, `blocks localization validate` checks them and
`blocks localization push` sends them back.

| File | Language |
|---|---|
| `common.en-US.json` | English — the app default and the source of truth for keys |
| `common.de-DE.json` | German |
| `common.bn-BD.json` | Bengali |

The app bundles these files (`src/lib/i18n/dictionary.ts`) so every screen is translated on
first paint and offline. Values published to the cloud `common` module override the bundled
ones at runtime. The German and Bengali files are typed against the English keys, so a missing
key fails `npm run lint`.

Keys must not start with the module name (`common.`); the validator rejects that. Placeholders
use `{name}` and are filled by `t(key, { name })`.

Adding a key: add it to all three files, then validate and push each language:

```bash
blocks localization validate --file blocks/localization/common.de-DE.json --language de-DE --module common
blocks localization push --file blocks/localization/common.de-DE.json --language de-DE --module common --dry-run
```
