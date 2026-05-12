/**
 * JsonViewer — renders any value as pretty-printed, syntax-highlighted JSON.
 * Uses a simple regex-based colorizer on the pre-formatted string (no external deps).
 */

interface JsonViewerProps {
  data: unknown;
  maxHeight?: string;
}

/** Maps each token type to a Tailwind text color class */
function colorize(json: string): React.ReactNode[] {
  // Regex captures: string keys, string values, booleans, null, numbers, punctuation
  const TOKEN = /(\"(?:\\.|[^"\\])*\")\s*(:)?|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}\[\],:])/g;

  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN.exec(json)) !== null) {
    // Plain text between tokens (whitespace / newlines)
    if (match.index > last) {
      nodes.push(json.slice(last, match.index));
    }

    const [full, str, colon, bool, nil, num, punct] = match;

    if (str !== undefined) {
      // key vs string value
      const cls = colon !== undefined ? 'text-blue-300' : 'text-green-300';
      nodes.push(
        <span key={match.index} className={cls}>
          {str}
        </span>
      );
      if (colon) nodes.push(':');
    } else if (bool !== undefined) {
      nodes.push(<span key={match.index} className="text-yellow-300">{bool}</span>);
    } else if (nil !== undefined) {
      nodes.push(<span key={match.index} className="text-red-400">{nil}</span>);
    } else if (num !== undefined) {
      nodes.push(<span key={match.index} className="text-orange-300">{num}</span>);
    } else if (punct !== undefined) {
      nodes.push(<span key={match.index} className="text-gray-400">{punct}</span>);
    } else {
      nodes.push(full);
    }

    last = match.index + full.length;
  }

  if (last < json.length) nodes.push(json.slice(last));
  return nodes;
}

export default function JsonViewer({ data, maxHeight = '480px' }: JsonViewerProps) {
  const json = JSON.stringify(data, null, 2);

  return (
    <pre
      className="bg-gray-950 text-gray-100 p-5 rounded-lg overflow-auto text-xs
                 font-mono leading-5 border border-gray-800 select-text"
      style={{ maxHeight }}
    >
      {colorize(json)}
    </pre>
  );
}
