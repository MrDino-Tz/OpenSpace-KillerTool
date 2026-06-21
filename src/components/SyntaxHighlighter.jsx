import { useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

function tokenizeJson(text) {
  const tokens = [];
  const re = /("(?:\\.|[^"\\])*")\s*(?=:)|("(?:\\.|[^"\\])*")|(\b(?:true|false)\b)|(\bnull\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(\S)/g;
  let match;
  let lastIndex = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex)
      tokens.push({ text: text.slice(lastIndex, match.index), type: 'plain' });
    if (match[1]) tokens.push({ text: match[1], type: 'key' });
    else if (match[2]) tokens.push({ text: match[2], type: 'string' });
    else if (match[3]) tokens.push({ text: match[3], type: 'boolean' });
    else if (match[4]) tokens.push({ text: match[4], type: 'null' });
    else if (match[5]) tokens.push({ text: match[5], type: 'number' });
    else tokens.push({ text: match[0], type: 'plain' });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length)
    tokens.push({ text: text.slice(lastIndex), type: 'plain' });
  return tokens;
}

function tokenizeYaml(text) {
  const tokens = [];
  const lines = text.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (li > 0) tokens.push({ text: '\n', type: 'plain' });

    if (/^\s*#/.test(line)) {
      tokens.push({ text: line, type: 'comment' });
      continue;
    }

    const keyMatch = line.match(/^(\s*)([\w_][\w\s_-]*?)(\s*:\s*)(.*)/);
    if (keyMatch) {
      tokens.push({ text: keyMatch[1], type: 'plain' });
      tokens.push({ text: keyMatch[2], type: 'key' });
      tokens.push({ text: keyMatch[3], type: 'plain' });
      tokens.push(...tokenizeYamlValue(keyMatch[4]));
      continue;
    }

    const listMatch = line.match(/^(\s*)(-)\s+(.*)/);
    if (listMatch) {
      tokens.push({ text: listMatch[1], type: 'plain' });
      tokens.push({ text: listMatch[2], type: 'listMarker' });
      tokens.push({ text: ' ', type: 'plain' });
      tokens.push(...tokenizeYamlValue(listMatch[3]));
      continue;
    }

    const valTokens = tokenizeYamlValue(line);
    if (valTokens.length > 0) tokens.push(...valTokens);
    else tokens.push({ text: line, type: 'plain' });
  }
  return tokens;
}

function tokenizeYamlValue(value) {
  const tokens = [];
  const re = /("(?:\\.|[^"\\])*")|('(?:[^']*)')|(\b(?:true|false|yes|no|on|off)\b)|(\bnull|~)\b|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|(#.*$)/g;
  let match;
  let lastIndex = 0;
  while ((match = re.exec(value)) !== null) {
    if (match.index > lastIndex)
      tokens.push({ text: value.slice(lastIndex, match.index), type: 'plain' });
    if (match[1]) tokens.push({ text: match[1], type: 'string' });
    else if (match[2]) tokens.push({ text: match[2], type: 'string' });
    else if (match[3]) tokens.push({ text: match[3], type: 'boolean' });
    else if (match[4]) tokens.push({ text: match[4], type: 'null' });
    else if (match[5]) tokens.push({ text: match[5], type: 'number' });
    else if (match[6]) tokens.push({ text: match[6], type: 'comment' });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < value.length)
    tokens.push({ text: value.slice(lastIndex), type: 'plain' });
  return tokens;
}

function tokenizeXml(text) {
  const tokens = [];
  const re = /(<!--[\s\S]*?-->)|(<[^>]*>)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\s+)|([^<"']+)/g;
  let match;
  let lastIndex = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex)
      tokens.push({ text: text.slice(lastIndex, match.index), type: 'plain' });
    if (match[1]) tokens.push({ text: match[1], type: 'comment' });
    else if (match[2]) tokens.push({ text: match[2], type: 'tag' });
    else if (match[3]) tokens.push({ text: match[3], type: 'string' });
    else if (match[4]) tokens.push({ text: match[4], type: 'string' });
    else if (match[5]) tokens.push({ text: match[5], type: 'plain' });
    else if (match[6]) tokens.push({ text: match[6], type: 'plain' });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length)
    tokens.push({ text: text.slice(lastIndex), type: 'plain' });
  return tokens;
}

const colorMap = {
  key: '#7b1fa2',
  string: '#2e7d32',
  number: '#e65100',
  boolean: '#c62828',
  null: '#c62828',
  comment: '#9e9e9e',
  listMarker: '#1565c0',
  tag: '#1565c0'
};

const tokenizers = { json: tokenizeJson, yaml: tokenizeYaml, xml: tokenizeXml };

function Highlighted({ text, language }) {
  const tokenizer = tokenizers[language] || tokenizeJson;
  const tokens = tokenizer(text);
  return (
    <code style={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {tokens.map((t, i) => (
        <span key={i} style={{ color: colorMap[t.type] || 'inherit' }}>{t.text}</span>
      ))}
    </code>
  );
}

export default function SyntaxHighlighter({ value, language, onChange, placeholder, minHeight, readOnly }) {
  const theme = useTheme();
  const textareaRef = useRef(null);
  const preRef = useRef(null);
  const gutterRef = useRef(null);

  const lineCount = Math.max(1, value ? value.split('\n').length : 0);

  const syncScroll = useCallback(() => {
    if (preRef.current && textareaRef.current && gutterRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
      gutterRef.current.scrollTop = scrollTop;
    }
  }, []);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = 0;
      preRef.current.scrollLeft = 0;
    }
    if (gutterRef.current) gutterRef.current.scrollTop = 0;
  }, [language]);

  const isEmpty = !value?.trim();

  const FONT = '"Courier New", Courier, monospace';
  const FONT_SIZE = '0.85rem';
  const LINE_HEIGHT = 1.6;
  const P = 16;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight,
        '& textarea::placeholder': { color: theme.palette.text.disabled }
      }}
    >
      <Box
        ref={gutterRef}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 44,
          overflow: 'hidden',
          pointerEvents: 'none',
          pt: `${P}px`,
          fontFamily: FONT,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: theme.palette.text.disabled,
          textAlign: 'right',
          borderRight: '1px solid',
          borderColor: theme.palette.divider,
          userSelect: 'none',
          bgcolor: 'action.hover'
        }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <Box key={i} sx={{ pr: 1.5 }}>{i + 1}</Box>
        ))}
      </Box>

      <Box sx={{ ml: '44px', position: 'relative', minHeight }}>
        <Box
          ref={preRef}
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minHeight,
            m: 0,
            p: `${P}px`,
            overflow: 'auto',
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontFamily: FONT,
            fontSize: FONT_SIZE,
            lineHeight: LINE_HEIGHT,
            color: isEmpty ? 'transparent' : 'inherit',
            bgcolor: 'transparent'
          }}
        >
          {!isEmpty && <Highlighted text={value} language={language} />}
          {isEmpty && (
            <Box component="span" sx={{ color: 'text.disabled' }}>
              {placeholder || ''}
            </Box>
          )}
        </Box>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={syncScroll}
          placeholder={placeholder}
          readOnly={readOnly}
          spellCheck={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            minHeight,
            padding: P,
            margin: 0,
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflow: 'auto',
            fontFamily: FONT,
            fontSize: FONT_SIZE,
            lineHeight: LINE_HEIGHT,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: 'transparent',
            caretColor: theme.palette.text.primary,
            background: 'transparent',
            WebkitTextFillColor: 'transparent'
          }}
        />
      </Box>
    </Box>
  );
}