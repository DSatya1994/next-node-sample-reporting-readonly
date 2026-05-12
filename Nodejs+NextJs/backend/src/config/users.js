/**
 * Parses the USERS environment variable into a username → password map.
 *
 * .env format:
 *   USERS=admin:password1,alice:password2
 *
 * Passwords may contain colons — only the first colon is used as separator.
 */
const getUsers = () => {
  const raw = process.env.USERS || '';
  return raw.split(',').reduce((acc, pair) => {
    const idx = pair.indexOf(':');
    if (idx === -1) return acc;
    const username = pair.slice(0, idx).trim();
    const password = pair.slice(idx + 1).trim();
    if (username && password) {
      acc[username] = password;
    }
    return acc;
  }, {});
};

module.exports = { getUsers };
