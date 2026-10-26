# CONVERTLY — POORI TAIYARI (Boss ko explain karne ke liye)

> Ye document tumhare project ki "interview/manual" hai. Isay parh lo to tum apne
> boss ke har sawal ka jawab de sakte ho. Har jagah Roman Urdu mein samjhaaya gaya
> hai, lekin technical words English mein rakhe hain (kyunki code aur boss dono
> English mein hi speak karte hain).

---

## PART 1 — PROJECT KYA HAI (30-second pitch)

**Convertly** ek **browser-based file converter website** hai. Matlab:

- User apni files (PDF, DOCX, images, video, audio) upload karta hai **nahi** —
  balki files uski apni computer (browser) mein hi rehti hain.
- Saari conversion **user ke browser (Chrome/Edge) ke andar** hoti hai.
- **Koi server nahi, koi database nahi, koi sign-up nahi.**
- Isliye privacy guaranteed hai — footer mein bhi likha hai:
  *"Convertly runs entirely in your browser. Nothing is uploaded to any server."*

**Boss ko bolne ka tareeqa (one-liner):**

> "Convertly ek 100% client-side file toolkit hai — 12 tools hain PDF, Word,
> image, audio aur video ke. Kuch bhi server par upload nahi hota, sari processing
> browser mein hoti hai, isliye user ki files private rehti hain aur hosting cost
> bhi zero hai."

### Project ke 12 Tools

| # | Tool | Kya karta hai |
|---|------|---------------|
| 1 | PDF to JPG | Har PDF page ki JPG image bana deta hai |
| 2 | JPG to PDF | Kayi images ko jor kar ek PDF bana deta hai |
| 3 | Word to PDF (DOCX→PDF) | Word file ko PDF bana deta hai |
| 4 | PDF to Word (PDF→DOCX) | PDF ka text nikaal kar editable Word file bana deta hai |
| 5 | Merge PDF | Kayi PDFs ko ek file mein jorta hai |
| 6 | Split PDF | PDF ke pages nikaalta hai ya har page ko alag file bana deta hai |
| 7 | Compress PDF | PDF ka size chhota karta hai |
| 8 | Video to MP3 | Video se sirf awaaz nikaal kar MP3 bana deta hai |
| 9 | Audio Trimmer | Audio ka koi hissa kaat kar save karta hai |
| 10 | Video Compressor | Video ka size chhota karta hai (WebM output) |
| 11 | Video to Image | Video ke kisi bhi frame ko JPG/PNG bana deta hai |
| 12 | Audio Recorder | Microphone se record karke download karta hai |

---

## PART 2 — PROJECT KE 2 VERSIONS (sabse important point)

Tumhare project mein **do versions** hain — aur yahi tumhara sabse bada "talking point" hai boss ke saamne:

### Version 1: Vanilla JavaScript (`index.html` + `js/` + `css/`)
- Plain HTML, CSS aur JavaScript — **koi framework nahi**.
- Har tool ka code alag file mein hai (`js/pdf-to-jpg.js`, `js/merge-pdf.js`, etc.).
- Libraries browser mein `<script src="CDN">` se load hoti hain.

### Version 2: React (`convertly-react/` folder)
- **Wahi 12 tools, wahi design, wahi logic — lekin React mein rebuild kiya gaya.**
- Har tool ek **React component** hai (`src/tools/PdfToJpg.jsx`).
- Build tool **Vite** use hua hai, dependencies **npm** se aati hain.
- `npm run build` karne par `dist/` folder banta hai jo kisi bhi hosting par chal sakta hai.

**Boss ko bolna:**

> "Maine pehle pure JavaScript mein poora project banaya, phir usay React mein
> port kiya. React version mein business logic wahi hai, sirf UI handling React
> ke state system (useState) par shift ho gayi hai. Isse code zyada reusable aur
> maintainable ho gaya."

**Kyun React version banaya? (Sawal aa sakta hai)**
1. **Reusable components** — Dropzone, FileCard, ProgressBar ek hi baar banao, 12 tools mein use karo.
2. **State management clean** — DOM khud se manually update karne ki zaroorat nahi.
3. **Build/bundle** — Vite library ko bundle kar deta hai, CDN par dependency kam.
4. **Team work** — React mein naya developer jaldi samajh sakta hai.

---

## PART 3 — LIBRARIES (har library kyun use hui)

Boss zaroor poochhega: "Yeh library kyun? Khud nahi likh sakte the?"

| Library | Kya karta hai | Kyun use ki |
|---------|---------------|-------------|
| **pdf.js** (pdfjsLib) | PDF ko padhta hai aur har page ko canvas par draw karta hai | PDF parse karna bahut mushkil hai (compressed streams, fonts). Ye Mozilla ki library hai, industry standard |
| **pdf-lib** | Nayi PDF banata, pages copy karta, merge/split karta hai | Ye pure client-side PDF banane ki best library hai, isme text/images embed ho sakte hain |
| **jsPDF** | Images se PDF banata hai (JPG to PDF tool) | Simple aur lightweight, image-based PDF ke liye best |
| **JSZip** | ZIP file banata hai (browser mein) | Bahut saare output files ek saath download karwane ke liye |
| **mammoth** | DOCX ko HTML mein badalta hai | Word format (.docx) actually ZIP + XML hai — samajhna mushkil hai, mammoth ye kaam karta hai |
| **html2pdf.js** | HTML page ko PDF mein screenshot jaisa badalta hai | DOCX→HTML ke baad us HTML ko PDF banane ke liye |
| **docx** | Nayi DOCX (Word) file banata hai | PDF→Word tool ke liye Word file generate karne ke liye |
| **lamejs** | Audio ko MP3 mein encode karta hai | MP3 format proprietary aur complex hai, ye JS port hai |
| **Web Audio API** (built-in) | `decodeAudioData` se audio decode hota hai | Browser ka native API, koi download nahi |
| **MediaRecorder API** (built-in) | Microphone/Screen record karta hai, video compress karta hai | Browser ka native API |
| **Canvas API** (built-in) | Drawing surface — page render, frame capture | PDF page → image, video frame → image sab canvas se hota hai |

**Boss ka sawal: "Kya ye sab khud likh sakte the?"**
> Jawab: "Format parsing (PDF, DOCX, MP3) apne aap likhna months ka kaam hai aur
> unke bugs/security issues maintain karne padenge. Ye sab well-tested open-source
> libraries hain — maine apna time conversion logic aur UI/UX par lagaya."

---

## PART 4 — TOOL-BY-TOOL LOGIC (har tool kaise kaam karta hai)

### 🔁 FLOW 1: PDF to JPG (`js/pdf-to-jpg.js` / `PdfToJpg.jsx`)

**Flow:** PDF → pdf.js se padho → har page canvas par draw karo → canvas se JPG blob banao → download ya ZIP.

**Step-by-step code logic:**

1. User file select/drop karta hai → `setPdfFile()` — check karta hai file PDF hai (`isPdfFile`)
2. "Convert to JPG" click → `convertPdfToJpg()`
3. `file.arrayBuffer()` → `new Uint8Array()` — binary data banaya
4. `pdfjsLib.getDocument({ data })` — PDF parse hui
5. Loop `1 se total pages` tak:
   - `page.getViewport({ scale })` — scale = DPI / 72 (72 = PDF ka default resolution)
   - `MAX_SIDE = 9000` — agar image 9000px se badi ban rahi hai to scale chhota kar diya (browser crash se bachne ke liye)
   - Canvas banaya, `ctx.fillRect('#ffffff')` — **white background** (warna transparent PNG ki jagah kharab dikhta)
   - `page.render(...)` — PDF ka page canvas par draw hua
   - `canvas.toBlob('image/jpeg', quality)` → JPG file bani
   - `URL.createObjectURL(blob)` — temporary URL taake thumbnail dikha sake
6. **ZIP option:** saare JPG blobs JSZip mein daal kar ek file mein download

**Important concepts:**
- **DPI (Dots Per Inch):** Kitne pixels per inch. 150 = screen, 300 = print quality. `scale = dpi/72` kyunki PDF ka internal unit 72 DPI hai.
- **`await nextFrame()`** — `requestAnimationFrame` ka wait. **Ye kyun?** Taake browser har page ke baad UI update kar sake (progress bar chalta rahe) aur tab freeze na ho.
- **Memory cleanup:** `canvas.width = canvas.height = 0` aur `URL.revokeObjectURL()` — browser ki RAM wapas dene ke liye.

---

### 🔁 FLOW 2: JPG to PDF (`js/jpg-to-pdf.js` / `JpgToPdf.jsx`)

**Flow:** Images → canvas se neutralize karo (PNG ki transparency hatao) → jsPDF mein pages add karo → download.

**Logic:**
1. Har image ko `loadImageFile()` mein load karo:
   - Image ko canvas par draw kiya aur **white background** bhara — kyunki PNG mein transparency hoti hai jo PDF mein kaali dikhti hai
   - `canvas.toDataURL('image/jpeg', 0.95)` — sab images ko **uniform JPEG** format mein convert kiya
2. Reorder list — user arrows ya drag se pages ki order badal sakta hai
3. `createPdf()`:
   - **Page size calculate karna — yahan asli maths hai:**
     - A4 = 210×297 mm, Letter = 215.9×279.4 mm
     - Agar "Same as image" mode: page = image ka size (px → mm conversion `25.4/150`)
     - Warna: image ko page ke andar fit karo — `ratio = Math.min(availW/imgW, availH/imgH)` (aspect ratio preserve)
     - Agar image lambi hai (width > height) to page landscape bana diya
   - `doc.addImage(dataUrl, 'JPEG', x, y, w, h)` — image ko page ke **center** mein draw kiya: `x = (pageW - drawW)/2`
   - `doc.save(filename)` — download

**Boss ko batao:** `PX_TO_MM_150DPI = 25.4/150` — 25.4 mm = 1 inch, 150 DPI assumptions se pixel ko millimeter mein convert karte hain.

---

### 🔁 FLOW 3: DOCX to PDF (`js/docx-to-pdf.js` / `DocxToPdf.jsx`)

**Flow:** DOCX → mammoth se HTML → off-screen div mein HTML dikhao → html2pdf.js se screenshot-style PDF banao.

**Logic:**
1. `mammoth.convertToHtml({ arrayBuffer })` — Word file HTML ban gayi
2. Ek **off-screen hidden div** banaya: `position:fixed; left:-10000px` — matlab screen se bahar
   - **Kyun?** html2pdf ko chahiye ke element browser mein render ho — isliye hide karke (display:none nahi, warna render hi nahi hoga) screen se bahar rakha
3. Custom CSS lagayi — `page-break-after:avoid` headings ke liye, tables ke borders
4. `html2pdf().from(container).outputPdf('blob')` — PDF ban gayi

**Limitation (boss poochh sakta hai):** Complex Word formatting (headers, footers, exact styling) 100% nahi aata — kyunki ye "screenshot" approach hai, real Word engine nahi. **Honest rehna.**

---

### 🔁 FLOW 4: PDF to DOCX (`js/pdf-to-docx.js` / `PdfToDocx.jsx`)

**Flow:** PDF → pdf.js se text nikalo (lines group karo) → docx library se Word file banao.

**Logic — yahan sabse smart code hai:**
1. `page.getTextContent()` — PDF ke andar ke saare text items milte hain, lekin ye **random order** mein hote hain
2. **Line grouping ka logic:**
   - Har text item ka `item.transform[5]` = uska **Y position** (height par)
   - `Math.round(item.transform[5] / 3) * 3` — Y ko 3 ke round-number mein round karke "same line" ki key banai
   - `item.transform[4]` = **X position** (width par)
3. Lines ko **top se bottom** sort kiya (`b[0] - a[0]` — descending Y)
4. Har line ke words ko **left se right** sort kiya (ascending X)
5. `new D.Paragraph({ children: [new D.TextRun({ text })] })` — har line ek Word paragraph
6. `pageBreakBefore: pageNumber > 1` — naye page par Word page break

**Limitation:** Sirf **text-based PDFs** work karte hain. Scanned PDF mein text hai hi nahi (image hai), isliye error: *"No selectable text was found."*

---

### 🔁 FLOW 5: Merge PDF (`js/merge-pdf.js` / `MergePdf.jsx`)

**Flow:** Har PDF → PDFDocument.load → sab pages ek nayi PDF mein copy → save/download.

```js
const out = await PDFLib.PDFDocument.create();   // nayi khali PDF
for (har file) {
  const src = await PDFLib.PDFDocument.load(buffer);
  const pages = await out.copyPages(src, src.getPageIndices()); // saare pages copy
  pages.forEach(p => out.addPage(p));             // naye doc mein add
}
const bytes = await out.save();
```

- `getPageIndices()` = [0, 1, 2...] (zero-based)
- Add hone se **pehle hi** har PDF validate hoti hai (`openPdfLib`) — damaged file pakri jaati hai
- Sirf tab enable hota hai jab **2 ya zyada** files hon

---

### 🔁 FLOW 6: Split PDF (`js/split-pdf.js` / `SplitPdf.jsx`)

**2 modes:**

**Mode A — Extract:** User likhta hai `1-3, 5, 8-10`
- `parseRanges()` function: regex se ranges padhta hai, zero-based indexes mein badalta hai, duplicates hataata hai, invalid input par `null` return karta hai
- `out.copyPages(src, indices)` — sirf selected pages nayi PDF mein

**Mode B — Split each:** Har page ki **alag-alag PDF** bani, sab JSZip mein, ek ZIP download

**Regex ka sawal (boss poochh sakta hai):**
```js
part.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
```
- `^...$` = poora string match hona chahiye
- `(\d+)` = pehla number (group 1)
- `(?:\s*-\s*(\d+))?` = optional — agar dash hai to doosra number (group 2)

---

### 🔁 FLOW 7: Compress PDF (`js/compress-pdf.js` / `CompressPdf.jsx`)

**Technique:** Har PDF page ko **optimized JPG image** banao, phir un images se nayi PDF banao.

```js
const LEVELS = {
  low:    { dpi: 150, quality: 0.85 },  // best quality
  medium: { dpi: 110, quality: 0.7 },   // recommended
  high:   { dpi: 72,  quality: 0.5 },   // smallest file
};
```

- pdf.js se page render → canvas → JPG (low quality) → `out.embedJpg()` → nayi PDF

**Important — honest point boss ko batao:**
> "Is compression mein har page image ban jaata hai, isliye result PDF mein text
> select/copy nahi hota. Ye 'image-based compression' hai. Real vector compression
> (GhostScript jaisa) server-side chahiye hota."

- Agar file pehle se chhoti hai to size kam na ho — ye bhi handle kiya gaya hai (error message)

---

### 🔁 FLOW 8: Video to MP3 (`js/video-to-mp3.js` / `VideoToMp3.jsx`)

**Flow:** Video/Audio file → Web Audio API se decode → lamejs se MP3 encode → download.

1. `MT.decodeAudio(file)` → `new AudioContext().decodeAudioData(buffer)` — browser video/audio decode karke **raw PCM samples** deta hai (Float32Array)
2. `MT.encodeMp3()`:
   - `lamejs.Mp3Encoder(channels, sampleRate, kbps)` — encoder banaya
   - **Float32 → Int16 conversion** (`toInt16`): MP3 encoder ko 16-bit integer chahiye
     - `s < 0 ? s * 0x8000 : s * 0x7fff` — 0x8000 = 32768 (negative range), 0x7fff = 32767 (positive range)
   - `BLOCK = 1152` — MP3 ek frame mein 1152 samples leta hai (standard block size)
   - Har 200 blocks ke baad `await nextFrame()` — UI freeze na ho
   - `encoder.flush()` — end ke remaining samples
3. `new Blob(chunks, { type: 'audio/mpeg' })`

**Bitrate kya hai?** Audio ki data ki speed — kbps (kilobits per second). 128 = standard, 320 = best quality, zyada kbps = bada file.

---

### 🔁 FLOW 9: Audio Trimmer (`js/audio-trimmer.js` / `AudioTrimmer.jsx`)

**Flow:** File decode → start/end time user se → us slice ko MP3 ya WAV mein encode → download.

- Start/end seconds mein hain, `from = Math.floor(startSec * sampleRate)` — **sample index** mein convert
- **WAV option** (`encodeWav`): Yahan **binary file format manually likha gaya hai** — 44-byte header:
  - `'RIFF'`, `'WAVE'`, `'fmt '` chunks, sample rate, channels, data size
  - `DataView` + `setUint32(..., true)` — `true` = **little-endian** byte order (x86 computers standard)
  - Ye boss ke liye impress karne wali baat hai: "maine WAV header manually likha hai"

---

### 🔁 FLOW 10: Video Compressor (`js/video-compressor.js` / `VideoCompressor.jsx`)

**Technique — sabse interesting:** Video ko **real-time** naya record karke chhota banaya jaata hai.

1. Video element mein file load (`URL.createObjectURL`)
2. `canvas.captureStream(30)` — canvas se 30 FPS video stream
3. `requestAnimationFrame` loop: har frame video se canvas par draw (scale down — 720p/480p/360p)
4. **Audio bhi capture:**
   - `AudioContext.createMediaElementSource(video)` — video ki awaaz nikali
   - `createMediaStreamDestination()` — recording ke liye destination
   - `dest.stream.getAudioTracks().forEach(t => stream.addTrack(t))` — video stream mein audio add
   - Speaker par awaaz **nahi** jaati (sirf recording mein)
5. `new MediaRecorder(stream, { videoBitsPerSecond })` — **bitrate = quality control**
6. `video.play()` → `await video.onended` → `recorder.stop()`
7. Output: WebM (VP9/Opus codecs)

**Limitation (honest answer):**
> "Ye real-time chalta hai — 2 minute ki video 2 minute mein compress hogi, kyunki
> browser sirf hardware-accelerated re-encoding offer nahi karta. Production mein
> ffmpeg.wasm ya server-side ffmpeg use karte."

**Kyun WebM output?** MediaRecorder browser mein WebM support karta hai, MP4 nahi.

---

### 🔁 FLOW 11: Video to Image (`js/video-frame.js` / `VideoFrame.jsx`)

**Flow:** Video player mein seek karo → "Capture this frame" → canvas par draw → JPG/PNG.

```js
canvas.width = v.videoWidth;
canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.92);
```

- Filename mein time add hota hai: `video-12.5s.jpg` — user ko pata chalta hai kaunsa frame

---

### 🔁 FLOW 12: Audio Recorder (`js/audio-recorder.js` / `AudioRecorder.jsx`)

**Flow:** `getUserMedia({audio:true})` → permission → `MediaRecorder` → chunks → Blob → play/download ya MP3 convert.

- `recorder.start()` → har thori der mein `ondataavailable` event aata hai → chunks array mein push
- `recorder.onstop()` → sab chunks ka `new Blob()` bana diya
- Timer `setInterval` se 250ms mein update hota hai (0:00, 0:01...)
- **Microphone sirf HTTPS ya localhost par chalta hai** — browser security rule

---

## PART 5 — SHARED CODE (common helpers)

### `js/common.js` / `src/lib/helpers.js`

| Function | Kya karta hai | Kyun zaroori |
|----------|---------------|--------------|
| `$` / `$$` | `querySelector` / `querySelectorAll` ka short form | Code chhota |
| `formatBytes(bytes)` | 1024 se divide karke B/KB/MB dikhata | Human-readable size |
| `baseName(filename)` | `"a.pdf"` → `"a"` (extension hataata hai) | Output filenames ke liye |
| `toast(message, type)` | Screen par chhota message dikhata 3.5 second | User feedback |
| `downloadBlob(blob, name)` | `URL.createObjectURL` → fake `<a>` click → `revokeObjectURL` | **Browser se file download karwane ka standard tareeqa** (koi server nahi) |
| `setProgress(prefix, %, text)` | Progress bar update | UX |
| `canvasToBlob(canvas, type, q)` | canvas → Blob (Promise mein) | `toBlob` callback-based hai |
| `nextFrame()` | `requestAnimationFrame` ka Promise | Long loops mein UI freeze na ho |
| `setupDropzone(zone, cb)` | dragenter/dragover/dragleave/drop events | Drag & drop UX |
| `parseRanges(text, total)` | "1-3,5" → [0,1,2,4] | Split PDF |

### Tabs + Home Grid
- `activateTab()` — jo tab active hai uska panel dikhata hai, baaki `hidden`
- **Accessibility:** `role="tab"`, `aria-selected`, arrow keys se tabs navigate — **boss impressed hoga**
- `home-grid.js` / `HomeGrid.jsx` — iLovePDF-style home screen: tool cards + category filter chips + **live search box**

---

## PART 6 — REACT VERSION KE SPECIFIC CONCEPTS

### Architecture

```
convertly-react/
├── index.html          → sirf <div id="root"> + main.jsx
├── vite.config.js      → build config (base: './' taaki kisi folder se chale)
├── package.json        → saari dependencies
└── src/
    ├── main.jsx        → entry: createRoot + ToastProvider
    ├── App.jsx         → layout, panels ki list, activeIndex state
    ├── components/     → 9 reusable UI components
    │   ├── Dropzone.jsx      → file picker with drag & drop
    │   ├── FileCard.jsx      → selected file ka row
    │   ├── ProgressBar.jsx   → PDF tools progress bar
    │   ├── MtProgress.jsx    → media tools progress bar
    │   ├── MtCard.jsx        → media tools file card
    │   ├── MediaDrop.jsx     → media tools file picker
    │   ├── IconButton.jsx    → chhota square button
    │   ├── ReorderList.jsx   → reorderable list (drag + arrows)
    │   └── HomeGrid.jsx      → home screen with search + categories
    ├── hooks/
    │   └── useDropzone.js    → custom hook (drag & drop logic)
    ├── lib/            → helper modules (logic, no UI)
    │   ├── helpers.js  → formatBytes, downloadBlob, parseRanges...
    │   ├── toast.jsx   → Context API based global toast
    │   ├── pdfjs.js    → pdf.js + worker setup
    │   ├── pdfLib.js   → pdf-lib wrapper
    │   ├── audio.js    → decodeAudio, encodeMp3, encodeWav
    │   ├── docx.js / mammoth.js / html2pdf.js → library wrappers
    │   └── icons.jsx   → SVG icons as JSX components
    └── tools/          → 12 tool components
```

### React concepts used (boss poochh sakta hai)

1. **`useState`** — har tool ki state (file, busy, progress, results)
2. **`useRef`** — direct DOM access (input element ka value reset karne ke liye), aur non-render values (uid counter, timer, stream)
   - **Sawal: useState vs useRef?** → useRef change par **re-render nahi** karta; isliye timers/streams/uid ke liye best. input value ke liye bhi chahiye (controlled input nahi hai wahan).
3. **`useEffect`** — cleanup: component unmount par `URL.revokeObjectURL`, `clearInterval`, `stream.stop()`
   ```js
   useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
   ```
   **Kyun?** Memory leak prevention — object URLs browser ki memory pakad kar rakhte hain.
4. **`useRef` for input** — `inputRef.current.value = ''` taake user wahi file dobara select kar sake (warna `change` event fire hi nahi hota)
5. **Context API** (`toast.jsx`) — ek global `toast()` function jo har tool use kare, bina prop drilling ke
   ```js
   const ToastContext = createContext(() => {});
   const toast = useToast(); // kisi bhi component mein
   ```
6. **Custom Hook** (`useDropzone`) — drag & drop logic ek jagah, `Dropzone` aur `MediaDrop` dono use karte hain
7. **Functional updates** — `setResults(prev => ...)` — kyunki async functions mein stale state mil sakti hai
8. **`hidden` prop** — panels `hidden={activeIndex !== i}` — React mein DOM jaisa hi approach, CSS nahi badli

### React mein library wrappers kyun? (`lib/mammoth.js`, `lib/html2pdf.js`, `lib/docx.js`)
> "Ye libraries classic browser scripts hain (module export nahi). Vite/ESM ke saath
> compatibility ke liye maine wrapper likhe hain jo `default` export ya `window.*`
> check karte hain. lamejs ko to lazy-load kiya hai — `ensureLame()` sirf zaroorat
> par script inject karta hai."

### Vanilla vs React — differences boss ke liye

| Topic | Vanilla | React |
|-------|---------|-------|
| UI update | `el.textContent = ...`, `el.hidden = true` | `setState()` |
| File input reset | `input.value = ''` | Same, but via `useRef` |
| Tabs | `activateTab()` manual | `activeIndex` state |
| Shared functions | Global functions in `common.js` | ES module imports |
| Toast | Global `toast()` function | Context API + `useToast()` |
| Drag & drop | `setupDropzone()` attaches listeners | `useDropzone()` returns props |
| Media tools UI | `MT.addTool()` dynamically creates DOM | Panels rendered in `App.jsx` map |
| Libraries | CDN `<script>` tags | npm imports (Vite bundles) |

---

## PART 7 — IMPORTANT TECHNICAL TERMS (glossary)

Yeh terms boss use kar sakta hai — inhe samajh lo:

| Term | Matlab (simple) |
|------|-----------------|
| **Client-side** | Kaam user ke computer par, server par nahi |
| **Server-side** | Kaam server par hota hai |
| **API** | Kisi library/service ka public interface |
| **Blob** | Binary data ka chunk (file jaisa) — browser memory mein |
| **ArrayBuffer / Uint8Array** | Raw bytes ka array — files ko padhne ke liye |
| **Promise** | Future mein complete hone wali value |
| **async/await** | Promise ko simple line-by-line likhne ka tareeqa |
| **Event** | User action (click, drop) ya system notification |
| **Callback** | Function jo doosre function ke andar pass ho |
| **DOM** | Page ka HTML tree jo JavaScript badal sakta hai |
| **Canvas** | HTML5 drawing surface (pixels banane ke liye) |
| **Object URL** | Blob/Image ko `<img src>` ya download mein dikhane ka temporary URL |
| **Memory leak** | Program ke khatam hone ke baad bhi memory na chhodna |
| **Worker** | Alag thread par heavy kaam (pdf.js apna worker use karta hai) |
| **Bundle** | Sab modules mila kar ek file bana dena (Vite/webpack) |
| **Module (ESM)** | `import`/`export` se code chhota hisson mein baantna |
| **IIFE** | Immediately Invoked Function Expression — `(function(){...})()` — private scope |
| **'use strict'** | JavaScript ko strict mode mein chalana (galtiyan pakadta hai) |
| **DPI** | Dots Per Inch — image resolution |
| **Bitrate (kbps)** | Audio/video data ki speed |
| **Codec** | Video/audio compress/decompress karne wala format (VP9, Opus, H.264) |
| **Aspect ratio** | Width ka height se ratio (image ka shape preserve) |
| **Zero-based index** | Pehla element 0 number par (PDF libraries mein) |
| **Regex** | Text pattern dhoondhne ki language |
| **CORS** | Cross-Origin Resource Sharing (browser security) |
| **HTTPS** | Secure HTTP — mic/clipboard jaisi APIs sirf yahan chalti hain |
| **Vite** | Fast build tool (dev server + production bundle) |
| **JSX** | JavaScript + HTML jaisa syntax (React) |
| **State** | Component ka data jo render decide karta hai |
| **Props** | Parent se child ko data |
| **Context** | Global data bina props ke |
| **Hydration** | (SSR mein) server HTML par JS lagana |

---

## PART 8 — BOSS KE SAWAL AUR JAWAB (Most Likely Questions)

### Q1: "Yeh project kya hai, briefly batao?"
> Convertly ek browser-based file converter hai — 12 tools PDF, Word, image, audio aur video ke. Kuch bhi server par upload nahi hota, sari processing user ke browser mein hoti hai, isliye privacy guaranteed hai aur hosting cost zero hai.

### Q2: "Files upload kahan hoti hain?"
> **Kahin nahi.** `file.arrayBuffer()` file ko browser ki memory mein padhta hai, saari processing client-side hoti hai, aur output `URL.createObjectURL()` + fake anchor click se download hota hai. Koi network request nahi (sirf pehli baar libraries load hone ke liye CDN se).

### Q3: "Privacy kaise ensure ki hai?"
> No backend, no upload, no database, no analytics. Footer mein guarantee likhi hai. Ye hamara USP hai — iLovePDF jaisi sites bhi server par bhejti hain, hum nahi bhejte.

### Q4: "Do versions kyun hain?"
> Pehle vanilla JS mein banaya (proof of concept, koi build step nahi). Phir React mein port kiya taake components reuse hon, state clean ho, aur code maintain karna aasaan ho. Dono same kaam karte hain.

### Q5: "React mein kya change hua?"
> Business logic (conversion algorithms) bilkul same hai. UI handling DOM manipulation se `useState`/`useEffect` par shift ho gayi. Shared components banaye — Dropzone, FileCard, ProgressBar, ReorderList — jo 12 tools use karte hain. Toast ke liye Context API, drag & drop ke liye custom hook `useDropzone`.

### Q6: "DPI ka matlab kya hai? Scale kyun `dpi/72`?"
> DPI = dots per inch. PDF ka internal default resolution 72 DPI hai, isliye 150 DPI chahiye to scale = 150/72 ≈ 2.08. 300 DPI print quality ke liye.

### Q7: "`await nextFrame()` kyun har loop mein?"
> Agar 100 pages ka PDF convert ho raha hai aur hum synchronously sab karein, browser tab freeze ho jayega — progress bar dikhega hi nahi. `requestAnimationFrame` ek frame ka wait karke browser ko repaint karne deta hai. Ye **UI responsiveness** ka standard tareeqa hai.

### Q8: "URL.createObjectURL / revokeObjectURL kya hai? Kyun use kiya?"
> `createObjectURL` Blob ko temporary `blob:` URL deta hai jise `<img src>` mein use kar sakte hain ya download karwa sakte hain. **Agar revoke na karein to browser RAM mein rehta hai = memory leak.** Isliye har purani URL par `revokeObjectURL` call kiya hai (React mein `useEffect` cleanup mein).

### Q9: "Canvas kyun itna use hua?"
> Browser mein pixels banane ka sirf tareeqa canvas hai:
> - PDF page → canvas → JPG (PDF to JPG, Compress)
> - Image → canvas → white background → uniform JPEG (JPG to PDF)
> - Video frame → canvas → image (Video to Image)
> - Video → canvas → captureStream → compress
> Canvas hi "rendering engine" hai hamare project ka.

### Q10: "Compress PDF kaise karta hai? Limitation?"
> Har page ko low-DPI optimized JPG mein badalta hai, phir un images se nayi PDF. **Limitation:** text select nahi hota (image ban gaya). Ye bataya bhi hai user ko UI mein. Real vector compression ke liye server-side Ghostscript chahiye hota.

### Q11: "PDF to DOCX mein lines kaise bante hain?"
> pdf.js text ko scattered items deta hai. Har item ka Y-coordinate (`transform[5]`) nikaala, 3 ke multiple mein round karke "same line" ka key banaya. Lines ko top-to-bottom, words ko left-to-right sort kiya. Har line = ek Word `Paragraph`.

### Q12: "Scanned PDF kyun nahi chalta (PDF to DOCX)?"
> Scanned PDF mein text hai hi nahi — wo sirf ek image hai. Usmein kuch nikaalne ke liye **OCR (Optical Character Recognition)** chahiye hota (Tesseract.js). Ye future scope hai. Abhi hum sirf text-based PDFs support karte hain.

### Q13: "Video Compressor itna slow kyun?"
> Kyunki ye **real-time** chalta hai — video ko play karke canvas par draw karke dobara record kar rahe hain. 2 min video = 2 min. Browser mein fast video transcoding ka standard API nahi hai. Production mein **ffmpeg.wasm** ya server-side ffmpeg use hote.

### Q14: "MP3 encoding kaise hoti hai?"
> Web Audio API `decodeAudioData` se raw PCM samples (Float32) milte hain → hum unhe Int16 mein convert karte hain (`s * 0x7fff`) → **lamejs** library MP3 frames (1152 samples per block) banati hai → Blob.

### Q15: "WAV file manually kaise banti hai (Audio Trimmer)?"
> WAV ek simple format hai: 44-byte header (`RIFF`, `WAVE`, `fmt`, `data`) + raw samples. `DataView` se byte-dbyte likha: sample rate, channels, data size. `setUint32(..., true)` — `true` = little-endian.

### Q16: "Error handling kaise ki hai?"
> Har tool mein `try/catch/finally`. Specific errors ke specific messages:
> - `PasswordException` → "PDF is password protected"
> - `InvalidPDFException` → "file is damaged"
> - Library not loaded → "Check your internet and refresh"
> `finally` mein hamesha `busy=false` aur button wapas enable — kabhi stuck nahi hoga.

### Q17: "Browser compatibility?"
> Chrome, Edge, Firefox (MediaRecorder, Web Audio, Canvas APIs). Safari mein kuch limitation. Mic ke liye HTTPS/localhost zaroori hai (browser policy).

### Q18: "Large files handle ho sakte hain?"
> Limits lagayi hain taake browser crash na ho: DOCX 25MB, PDF to Word 30MB, media 200MB. PDF pages mein `MAX_SIDE = 9000px` limit hai. Memory manage karne ke liye canvases reset hote hain (`canvas.width = 0`) aur object URLs revoke hote hain.

### Q19: "Accessibility ka khayal kiya hai?"
> Yes — `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-label`, `aria-live="polite"` (toast ke liye), arrow-key navigation tabs par. Screen readers theek se kaam karenge.

### Q20: "Testing? Deployment?"
> Manual testing — har tool ke saare paths (success, invalid file, damaged file, password-protected, single page, empty). Deployment: React version `npm run build` → `dist/` folder kisi bhi static hosting (Netlify/Vercel/GitHub Pages) par. `vite.config.js` mein `base: './'` taaki kisi sub-folder se bhi chale.

### Q21: "Next steps / improvements?"
1. OCR support (Tesseract.js) — scanned PDFs ke liye
2. ffmpeg.wasm — fast video compression (real-time limitation khatam)
3. Web Workers — heavy loops background thread par
4. PDF password protection ka option
5. PWA (offline support)
6. Unit tests (Vitest) + E2E (Playwright)

### Q22: "Ye project khud banaya ya copy?"
> Logic khud likha (conversion flows, line-grouping, WAV header, range parser, drag & drop). Third-party open-source libraries use ki hain file formats ke liye (pdf.js, pdf-lib, jsPDF, mammoth, lamejs) — ye industry standard hai, har converter site yahi use karti hai.

---

## PART 9 — DEEP-DIVE SAWAL (agar boss technical ho)

### "Promise/async-await samjhao"
> Promise = future value. `await` = is line par ruk jao jab tak value na aa jaye, lekin browser doosre kaam karta rahe (non-blocking). `async` function hamesha Promise return karti hai.

### "useRef vs useState?"
> `useState` change par **re-render** karta hai — UI dikhane ke liye. ` useRef` change par render nahi karta — timers, DOM elements, streams, counters ke liye.

### "Stale closure problem React mein?"
> Long async functions mein purani state ki value reh jaati hai. Isliye functional updates use kiye: `setResults(prev => [...prev, result])`. Aur AudioRecorder mein `useRef` (chunksRef, streamRef) taake values fresh rahein.

### "IIFE kyun (vanilla version)?"
> `(function(){ ... })()` — immediately invoked. Har tool ka code private scope mein: `el`, `state`, `choose` jaisi variables **global namespace mein pollution nahi** karte. Isliye 12 tools mein same naam ke variables use ho sakte hain.

### "'use strict' kya karta hai?"
> JavaScript ke silent bugs pakadta hai: undeclared variables, duplicate parameters, `this = undefined`. Best practice.

### "ZIP mein STORE compression kyun?"
> `compression: 'STORE'` — JPG/PDF/MP3 pehle se compressed hain, dobara compress karne se fayda nahi aur CPU waste hoti hai. STORE = bina compress kiye sirf pack.

### "Compress PDF vs PDF to JPG mein farq?"
> Same technique (page → image) lekin Compress PDF **ek hi PDF** output karta hai (images nayi PDF mein embed), jabke PDF to JPG har page alag JPG file deta hai.

### "Event delegation (`e.target.closest`) kyun?"
> List ke saare buttons par individually listener lagane ki zaroorat nahi — ek listener parent par, `closest('button[data-action]')` se pata chalta hai kaunsa button click hua. Dynamic items (jo baad mein add hon) bhi automatically kaam karenge.

### "Vite kyun webpack nahi?"
> Vite faster hai (native ES modules dev mein, esbuild bundling production mein) aur config minimal hai. `base: './'` set kiya taaki `dist/` kisi bhi folder/static host se chale.

### "Chunk size warning limit 4000 kyun (vite.config.js)?"
> Libraries (pdf-lib, jspdf, docx) badi hain — build warn karta tha. Limit badha di warning khatam karne ke liye. (Achha point: production mein code splitting bhi ho sakti hai.)

---

## PART 10 — BOSS KE LIYE DEMO PLAN (5-minute script)

1. **Home screen dikhao** — 12 tool cards, category filter chips, search box (type "pdf")
2. **PDF to JPG** — ek 3-page PDF, 150 DPI, convert → thumbnails → ZIP download
3. **Merge PDF** — 2 PDFs, order change karke merge
4. **Split PDF** — "1-3, 5" type karo → extracted PDF
5. **Compress PDF** — before/after size dikhao
6. **JPG to PDF** — 3 images, drag se reorder, A4 page
7. **Video to MP3** (agar time ho)
8. **Bolo:** "Ye sab browser mein hua — DevTools Network tab kholo, koi upload nahi dikhega"

**Pro tip:** Boss ko DevTools (F12 → Network) dikhana sabse strong proof hai ke kuch upload nahi ho raha.

---

## PART 11 — CHEAT SHEET: Code lines jo yaad rakhni hain

```js
// File padhna (binary)
const data = new Uint8Array(await file.arrayBuffer());

// PDF parse
const pdf = await pdfjsLib.getDocument({ data }).promise;

// Page render on canvas
const viewport = page.getViewport({ scale: dpi / 72 });
await page.render({ canvasContext: ctx, viewport }).promise;

// Canvas → image
const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);

// Download (no server!)
const url = URL.createObjectURL(blob);
// ... fake <a> click ...
URL.revokeObjectURL(url); // memory free

// Merge (pdf-lib)
const out = await PDFDocument.create();
const pages = await out.copyPages(src, src.getPageIndices());
pages.forEach(p => out.addPage(p));

// Audio decode
const ctx = new AudioContext();
const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());

// Record
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const rec = new MediaRecorder(stream);

// UI freeze na ho
await new Promise(r => requestAnimationFrame(r));
```

---

## PART 12 — LAST-MINUTE CONFIDENCE POINTS

1. **"Sab kuch browser mein hai"** — ye tumhara main selling point hai, 10 baar repeat kar sakte ho
2. Limitations **khud batao** (scanned PDF, real-time compression) — honesty impress karti hai
3. **Two versions** banane ka point — aap sirf "banaya" nahi, "refactor/port" bhi kiya
4. Accessibility, error handling, memory cleanup — ye "junior developers nahi sochte" wali baatein hain
5. Agar koi sawal na aaye to aao: *"Kya aap chahte hain main kisi specific tool ka code walk-through karwa doon?"*

---

Best of luck! 💪 Pehle PART 1, 2, 3 aur 8 (Q&A) zaroor parh lena — 80% sawal wahin cover ho jayenge.
