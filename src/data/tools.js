const ALL_TOOLS = [
  { name: 'ASCII Word Art Generator', desc: 'Create ASCII text banners', path: '/tools/text/ascii-generator', category: 'Text Tools', icon: 'FontSizeOutlined' },
  { name: 'Emoji Picker', desc: 'Browse and copy emojis', path: '/tools/text/emoji-picker', category: 'Text Tools', icon: 'SmileOutlined' },
  { name: 'Text to ASCII Binary', desc: 'Convert text to binary and binary to text', path: '/tools/conversion/text-to-binary', category: 'Conversion Tools', icon: 'NumberOutlined' },
  { name: 'Markdown to HTML', desc: 'Live preview and convert Markdown to HTML', path: '/tools/conversion/markdown-to-html', category: 'Conversion Tools', icon: 'FileTextOutlined' },
  { name: 'Color Converter', desc: 'Convert colors between HEX, RGB, HSL, CMYK...', path: '/tools/conversion/color-converter', category: 'Conversion Tools', icon: 'BgColorsOutlined' },
  { name: 'Currency Converter', desc: 'Convert 160+ world currencies in real-time', path: '/tools/conversion/currency-converter', category: 'Conversion Tools', icon: 'MoneyCollectOutlined' },
  { name: 'Code converter', desc: 'Convert between JSON and YAML formats', path: '/tools/conversion/code-converters', category: 'Conversion Tools', icon: 'CodeOutlined' },
  { name: 'Password Generator', desc: 'Generate secure random passwords', path: '/tools/crypto/password-generator', category: 'CryptOK', icon: 'KeyOutlined' },
  { name: 'Password Analyzer', desc: 'Check password strength and crack time', path: '/tools/crypto/password-analyzer', category: 'CryptOK', icon: 'LockOutlined' },
  { name: 'PDF Signature Checker', desc: 'Validate digital signatures in PDFs', path: '/tools/crypto/pdf-signature-checker', category: 'CryptOK', icon: 'SafetyCertificateOutlined' },
  { name: 'Image Resizer', desc: 'Crop, resize, and rotate images', path: '/tools/media/image-resizer', category: 'Image/Video', icon: 'ScissorOutlined' },
  { name: 'Photo Editor', desc: 'Add text, overlays, paint, and erase on photos', path: '/tools/media/photo-editor', category: 'Image/Video', icon: 'EditOutlined' },
  { name: 'QR Code Generator', desc: 'Generate QR codes from text, URLs, or any data', path: '/tools/media/qr-code-generator', category: 'Image/Video', icon: 'QrcodeOutlined' },
  { name: 'PDF Editor', desc: 'Rotate, delete, and reorder pages in PDF files', path: '/tools/document/pdf-editor', category: 'OpenDoc', icon: 'FilePdfOutlined' },
  { name: 'Pigeon API', desc: 'Test HTTP APIs directly from the browser', path: '/tools/dev-gun/pigeon-api', category: 'Dev Gun', icon: 'ApiOutlined' },
  { name: 'Regex Tester', desc: 'Test regular expressions in real-time', path: '/tools/dev-gun/regex-tester', category: 'Dev Gun', icon: 'AuditOutlined' },
  { name: 'File Meta Reader', desc: 'Read file metadata including EXIF data from images', path: '/tools/dev-gun/file-meta-reader', category: 'Dev Gun', icon: 'FileTextOutlined' },
  { name: 'WiFi QR Decoder', desc: 'Decode WiFi QR codes to reveal network name and password', path: '/tools/wifi-shark/qr-decoder', category: 'WiFi Shark', icon: 'ScanOutlined' }
];

export default ALL_TOOLS;
