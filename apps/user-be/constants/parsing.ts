export function tryParseJson(value: unknown): unknown {
      if (typeof value !== 'string') {
        return value;
      }

      let s = value.trim();
      // Quick check: only attempt parse on objects/arrays
      if (!s.startsWith('{') && !s.startsWith('[')) {
        return value;
      }

      // Sanitize JS-only literals so they're valid JSON
      const sanitized = s
        .replace(/\bNaN\b/g, 'null')
        .replace(/\b(Infinity|-Infinity)\b/g, 'null');

      // If nothing changed, we'll parse the original; otherwise parse the sanitized
      const toParse = sanitized === s ? s : sanitized;

      try {
        return JSON.parse(toParse);
      } catch (e: any) {
        this.logger.error(
          `tryParseJson failed${toParse !== s ? ' (after sanitization)' : ''}: ${e.message}`
        );
        // leave it as the raw string if parsing still fails
        return value;
      }
    }