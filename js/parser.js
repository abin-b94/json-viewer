/**
 * parser.js
 * High-performance, client-side JSON parsing, validation, formatting, minification,
 * and intelligent error location detection.
 */

/**
 * Format bytes into human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate structural statistics of a parsed JSON object
 * @param {any} val
 * @param {number} currentDepth
 * @returns {{ keysCount: number, depth: number, arrayCount: number, objectCount: number }}
 */
export function getJsonStats(val, currentDepth = 1) {
  let keysCount = 0;
  let maxDepth = currentDepth;
  let arrayCount = 0;
  let objectCount = 0;

  if (val !== null && typeof val === 'object') {
    if (Array.isArray(val)) {
      arrayCount++;
      for (const item of val) {
        if (item !== null && typeof item === 'object') {
          const sub = getJsonStats(item, currentDepth + 1);
          keysCount += sub.keysCount;
          arrayCount += sub.arrayCount;
          objectCount += sub.objectCount;
          if (sub.depth > maxDepth) maxDepth = sub.depth;
        }
      }
    } else {
      objectCount++;
      const keys = Object.keys(val);
      keysCount += keys.length;
      for (const key of keys) {
        const item = val[key];
        if (item !== null && typeof item === 'object') {
          const sub = getJsonStats(item, currentDepth + 1);
          keysCount += sub.keysCount;
          arrayCount += sub.arrayCount;
          objectCount += sub.objectCount;
          if (sub.depth > maxDepth) maxDepth = sub.depth;
        }
      }
    }
  }

  return { keysCount, depth: maxDepth, arrayCount, objectCount };
}

/**
 * Locate line and column in raw text from character offset
 * @param {string} text 
 * @param {number} position 
 * @returns {{ line: number, column: number, snippet: string }}
 */
export function getLineColFromPosition(text, position) {
  const safePos = Math.max(0, Math.min(position, text.length));
  const lines = text.slice(0, safePos).split('\n');
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;

  // Extract snippet around the error
  const allLines = text.split('\n');
  const errorLineIdx = line - 1;
  const targetLine = allLines[errorLineIdx] || '';
  
  // Create visual indicator
  const indicatorIndent = ' '.repeat(Math.max(0, column - 1));
  const snippet = `${targetLine}\n${indicatorIndent}^`;

  return { line, column, snippet };
}

/**
 * Intelligent error parser for syntax errors in JSON strings
 * Works across Chrome/V8, Firefox SpiderMonkey, Safari JSC, and Node.js.
 * @param {string} raw 
 * @param {Error} error 
 * @returns {{ message: string, line: number, column: number, snippet: string }}
 */
export function extractErrorDetails(raw, error) {
  const msg = error.message || 'Invalid JSON syntax';
  let line = null;
  let column = null;
  let position = null;

  // Pattern 1: Explicit position format: "at position 123" or "at position 123 (line 4 column 2)"
  const posMatch = msg.match(/position\s+(\d+)/i);
  if (posMatch) {
    position = parseInt(posMatch[1], 10);
  }

  // Pattern 2: Explicit line and column: "line 4 column 12"
  const lineColMatch = msg.match(/line\s+(\d+)(?:,\s*|\s+)column\s+(\d+)/i);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  } else {
    // Pattern 3: Firefox format: "at line 3 column 5"
    const ffMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (ffMatch) {
      line = parseInt(ffMatch[1], 10);
      column = parseInt(ffMatch[2], 10);
    }
  }

  // Pattern 4: Modern V8 snippet: Unexpected token 'X', ..."broken": ,\n "valid"... is not valid JSON
  if (position === null && line === null) {
    const snippetMatch = msg.match(/\.\.\.(.*?)\.\.\./s);
    if (snippetMatch) {
      let snippet = snippetMatch[1].replace(/^"+|"+$/g, '');
      const foundPos = raw.indexOf(snippet);
      if (foundPos !== -1) {
        // Look for the unexpected token in the snippet if specified
        const tokenMatch = msg.match(/Unexpected token '([^']+)'/i);
        let tokenOffset = 0;
        if (tokenMatch && tokenMatch[1]) {
          const tIdx = snippet.indexOf(tokenMatch[1]);
          if (tIdx !== -1) tokenOffset = tIdx;
        }
        position = foundPos + tokenOffset;
      }
    }
  }

  // If position was determined, derive line and column
  if (position !== null && (line === null || column === null)) {
    const loc = getLineColFromPosition(raw, position);
    line = loc.line;
    column = loc.column;
  }

  // Fallback: Line-only match
  if (line === null) {
    const lineOnlyMatch = msg.match(/line\s+(\d+)/i);
    if (lineOnlyMatch) {
      line = parseInt(lineOnlyMatch[1], 10);
      column = 1;
    }
  }

  // Default fallback if nothing found
  if (line === null) {
    line = 1;
    column = 1;
  }

  // Generate snippet
  const allLines = raw.split('\n');
  const errorLine = allLines[line - 1] || '';
  const indicator = ' '.repeat(Math.max(0, column - 1)) + '^';
  const snippet = `${errorLine}\n${indicator}`;

  return {
    message: cleanErrorMessage(msg),
    line,
    column,
    snippet
  };
}

/**
 * Remove noisy browser prefixes from error messages
 * @param {string} msg 
 * @returns {string}
 */
function cleanErrorMessage(msg) {
  return msg
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/^JSON Parse error:\s*/i, '')
    .replace(/^SyntaxError:\s*/i, '');
}

/**
 * Validate a JSON string
 * @param {string} raw 
 * @returns {{ valid: boolean, data?: any, error?: string, line?: number, column?: number, snippet?: string, stats?: any }}
 */
export function validateJson(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Input is empty. Please paste or load JSON data.',
      line: 1,
      column: 1,
      snippet: ''
    };
  }

  try {
    const data = JSON.parse(raw);
    const byteSize = new Blob([raw]).size;
    const stats = getJsonStats(data);
    const lines = raw.split('\n').length;

    return {
      valid: true,
      data,
      stats: {
        ...stats,
        byteSize,
        formattedSize: formatBytes(byteSize),
        lineCount: lines,
        characterCount: raw.length
      }
    };
  } catch (err) {
    const details = extractErrorDetails(raw, err);
    return {
      valid: false,
      ...details
    };
  }
}

/**
 * Format JSON with 2 spaces (or custom indentation)
 * @param {string} raw 
 * @param {number} spaceCount 
 * @returns {{ success: boolean, formatted?: string, error?: string, line?: number, column?: number, snippet?: string, stats?: any }}
 */
export function formatJson(raw, spaceCount = 2) {
  const validation = validateJson(raw);
  if (!validation.valid) {
    return validation;
  }

  try {
    const formatted = JSON.stringify(validation.data, null, spaceCount);
    return {
      success: true,
      formatted,
      data: validation.data,
      stats: validation.stats
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Formatting failed'
    };
  }
}

/**
 * Minify JSON string (single-line, zero redundant whitespace)
 * @param {string} raw 
 * @returns {{ success: boolean, minified?: string, error?: string, line?: number, column?: number, snippet?: string, stats?: any }}
 */
export function minifyJson(raw) {
  const validation = validateJson(raw);
  if (!validation.valid) {
    return validation;
  }

  try {
    const minified = JSON.stringify(validation.data);
    return {
      success: true,
      minified,
      data: validation.data,
      stats: validation.stats
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Minification failed'
    };
  }
}
