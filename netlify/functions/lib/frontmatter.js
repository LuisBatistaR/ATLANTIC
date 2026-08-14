function yamlString(value) {
  // JSON strings are valid YAML double-quoted scalars and safely escape quotes,
  // backslashes, line breaks and Unicode control characters.
  return JSON.stringify(String(value));
}

function serializeFrontmatter(data) {
  const lines = Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${typeof value === 'boolean' ? String(value) : yamlString(value)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null' || trimmed === '~') return null;
  if (trimmed.startsWith('"')) {
    try { return JSON.parse(trimmed); } catch (_) { return trimmed; }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed;
}

function parseFrontmatter(source) {
  const match = String(source).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: String(source) };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(key)) continue;
    data[key] = parseScalar(line.slice(separator + 1));
  }
  return { data, content: match[2].replace(/^\r?\n/, '') };
}

module.exports = { serializeFrontmatter, parseFrontmatter };
