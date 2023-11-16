export function normalizeQueryHelper(query: string) {
  const trimmedQuery = query?.trim();
  if (!trimmedQuery) {
    return '';
  }
  const charQueryArr = trimmedQuery.split('');
  /**
   * ., +, *, ?, ^, $, (, ), [, ], {, }, |, \.
   */
  return charQueryArr
    .map((c) => {
      switch (c) {
        case '.':
          return '\\.';
        case '+':
          return '\\+';
        case '*':
          return '\\*';
        case '?':
          return '\\?';
        case '^':
          return '\\^';
        case '$':
          return '\\$';
        case '(':
          return '\\(';
        case ')':
          return '\\)';
        case '[':
          return '\\[';
        case ']':
          return '\\]';
        case '{':
          return '\\{';
        case '}':
          return '\\}';
        case '|':
          return '\\|';
        case '\\':
          return '\\\\';
        default:
          return c;
      }
    })
    .join('');
}
