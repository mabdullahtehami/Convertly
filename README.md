# Convertly

A free, privacy-first file toolbox with **26 tools** for PDF, images, audio and video.
Everything runs **right in your browser** — no uploads, no sign-up, no watermarks, no file size limits.

## Features

- **100 % client-side** — files never leave the device, there is no backend at all
- **26 working tools** covering PDF, image, audio, video and everyday utilities
- **Two implementations** of the same product: plain HTML/CSS/JS and React + Vite
- **No dependencies to install** for the vanilla version — open `index.html` and it runs

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
│   └── tool-icons.js       # one icon map for the home grid (both versions)
├── css/                    # style.css · home-grid.css · media-tools.css (both versions)
├── convertly-react/        # React + Vite implementation
│   └── src/
│       ├── components/     # Dropzone, FileCard, HomeGrid, …
│       ├── tools/          # one component per tool
│       ├── lib/            # pdf.js / pdf-lib / audio / helpers
│       └── hooks/
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

Issues and pull requests are welcome. Keep the two versions in step: a tool added to
`js/` should also get a component in `convertly-react/src/tools/`, a card in both home
grids, and a row in the table above.

