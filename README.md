# Convertly

A free, privacy-first file toolbox with **26 tools** for PDF, images, audio and video.
Everything runs **right in your browser** — no uploads, no sign-up, no watermarks, no account.

## Features

- **100 % client-side** — files never leave the device, there is no backend at all
- **26 working tools** covering PDF, image, audio, video and everyday utilities
- **Two implementations** of the same product: plain HTML/CSS/JS and React + Vite
- **No dependencies to install** for the vanilla version — open `index.html` and it runs
- **One tool list per version** — `js/home-grid.js` (vanilla) and `convertly-react/src/tools/registry.js` (React)
  each hold the ordered tools, so a card and the panel it opens can never drift apart

The only limits are small per-tool caps (25 MB per DOCX, 30 MB per PDF, 200 MB per media file)
that keep a single browser tab responsive — there is no server-side upload limit because
nothing is ever uploaded.

## Tools

| Tool | What it does | Tool | What it does |
|---|---|---|---|
| PDF to JPG | Turn PDF pages into images | Image Compressor | Make images smaller |
| JPG to PDF | Combine images into one PDF | Image Converter | JPG ⇄ PNG ⇄ WebP |
| Word to PDF | Convert DOCX into PDF | Image Resizer | Change width & height |
| PDF to Word | Get an editable DOCX | Rotate Image | Turn an image 90° or 180° |
| Merge PDF | Join many PDFs into one | Video to MP3 | Pull sound out of a video |
| Split PDF | Extract or split pages | Audio Trimmer | Cut any part of audio |
| Compress PDF | Smaller PDF, good quality | Video Compressor | Make videos smaller |
| Rotate PDF | Turn all PDF pages | Video to Image | Save any frame as a picture |
| Watermark PDF | Stamp text on every page | Audio Recorder | Record voice as MP3 |
| Page Numbers | Number every PDF page | Audio Converter | Convert audio to MP3/WAV |
| PDF Metadata | Edit title, author, keywords | Screen Recorder | Record your screen |
| PDF to Text | Pull out the plain text | QR Code Generator | Make a QR code from text |
| Edit PDF Text | Change the text inside a PDF | Image & PDF OCR | Read text from scans & photos |

## Project structure

```
Convertly/
├── index.html              # vanilla app (open it directly or serve it)
├── js/                     # vanilla app logic — one file per tool
│   ├── common.js           # shared helpers, dropzones, panel switching (loads first)
│   ├── home-grid.js        # home screen: cards, category chips, search
│   ├── media-ui.js         # shared markup + audio helpers for the media tools
│   ├── tools-ui.js         # shared markup + image helpers for tools 13–26
│   └── tool-icons.js       # one icon map for the home grid (both versions)
├── css/                    # style.css · home-grid.css · media-tools.css (both versions)
├── convertly-react/        # React + Vite implementation
│   └── src/
│       ├── components/     # Dropzone, FileCard, HomeGrid, ReorderList, …
│       ├── tools/          # one component per tool + registry.js (the ordered tool list)
│       ├── lib/            # pdf.js / pdf-lib / docx / audio / helpers / icons / toast
│       └── hooks/          # useDropzone + deliverFiles (drag & drop and file input)
├── README.md
└── .gitignore
```

Styles in `css/` and the home-grid icon map in `js/tool-icons.js` are shared by both
versions — change them once and both apps pick it up.

## Getting started

### Vanilla (root)

```bash
# either open index.html straight in the browser, or:
python -m http.server 8000
# -> http://localhost:8000
```

### React (`convertly-react/`)

```bash
cd convertly-react
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Tech

pdf.js and pdf-lib (PDF), Tesseract.js (OCR), lamejs (MP3), html2pdf.js / jsPDF (documents),
Canvas + MediaRecorder (images, video, screen). React version: React 19 + Vite.

## Privacy

Your files never leave your device. All the work happens inside your browser —
there is no server to upload to.

## Contributing

Issues and pull requests are welcome. Keep the two versions in step: a tool added to `js/`
should also get a component in `convertly-react/src/tools/`, an entry in
`convertly-react/src/tools/registry.js`, a card in `js/home-grid.js`, and a row in the table above.

