/* ==========================================================
   Convertly React - tool registry
   ONE ordered list for the whole app: the home grid renders it,
   the router gives every tool its own page (see App.jsx and
   components/ToolPage.jsx). The id must match what the tool
   component uses for its `panel-<id>` section.

   SEO fields used by ToolPage:
   - slug            URL segment: /tools/<slug>
   - seoTitle        unique <title> of the tool page
   - metaDescription unique meta description
   - intro           paragraph shown under the H1
   - steps           the 3 "How to use" steps
   - faqs            3 Q&As, also emitted as FAQPage JSON-LD

   Keep this order in sync with js/home-grid.js (vanilla version).
   ========================================================== */

import { lazy } from 'react';

/* Each tool is code-split: its code is only downloaded when its own
   page opens, so the home page ships a small bundle instead of all
   27 tools at once (better load performance / Core Web Vitals). */
const PdfToJpg = lazy(() => import('./PdfToJpg.jsx'));
const JpgToPdf = lazy(() => import('./JpgToPdf.jsx'));
const DocxToPdf = lazy(() => import('./DocxToPdf.jsx'));
const PdfToDocx = lazy(() => import('./PdfToDocx.jsx'));
const MergePdf = lazy(() => import('./MergePdf.jsx'));
const SplitPdf = lazy(() => import('./SplitPdf.jsx'));
const CompressPdf = lazy(() => import('./CompressPdf.jsx'));
const VideoToMp3 = lazy(() => import('./VideoToMp3.jsx'));
const AudioTrimmer = lazy(() => import('./AudioTrimmer.jsx'));
const VideoCompressor = lazy(() => import('./VideoCompressor.jsx'));
const VideoFrame = lazy(() => import('./VideoFrame.jsx'));
const AudioRecorder = lazy(() => import('./AudioRecorder.jsx'));
const RotatePdf = lazy(() => import('./RotatePdf.jsx'));
const WatermarkPdf = lazy(() => import('./WatermarkPdf.jsx'));
const PageNumbersPdf = lazy(() => import('./PageNumbersPdf.jsx'));
const PdfMetadata = lazy(() => import('./PdfMetadata.jsx'));
const PdfToText = lazy(() => import('./PdfToText.jsx'));
const ImageCompressor = lazy(() => import('./ImageCompressor.jsx'));
const ImageConverter = lazy(() => import('./ImageConverter.jsx'));
const ImageResizer = lazy(() => import('./ImageResizer.jsx'));
const RotateImage = lazy(() => import('./RotateImage.jsx'));
const AudioConverter = lazy(() => import('./AudioConverter.jsx'));
const ScreenRecorder = lazy(() => import('./ScreenRecorder.jsx'));
const QrCode = lazy(() => import('./QrCode.jsx'));
const Ocr = lazy(() => import('./Ocr.jsx'));
const PdfEditor = lazy(() => import('./PdfEditor.jsx'));
const PrescriptionReader = lazy(() => import('./PrescriptionReader.jsx'));

export const TOOLS = [
  {
    id: 'pdf2jpg',
    title: 'PDF to JPG',
    desc: 'Turn every page of a PDF into a sharp JPG image.',
    cat: 'convert',
    color: '#d97706',
    icon: 'image',
    slug: 'pdf-to-jpg',
    seoTitle: 'PDF to JPG Converter - Free, No Upload | Convertly',
    metaDescription:
      'Turn every page of a PDF into a sharp JPG image. Choose 100-300 DPI and JPG quality, then download all pages at once - private and free.',
    intro:
      'Turn every page of a PDF into a crisp JPG image you can drop into slides, posts or emails. Choose the resolution from 100 to 300 DPI, fine-tune the JPG quality, and download every page in one go - the file never leaves your browser.',
    steps: [
      'Drop your PDF into the box (up to 30 MB).',
      'Pick a resolution - 100 DPI for screens, 300 DPI for print - and the JPG quality.',
      'Press "Convert to JPG" and download your images.',
    ],
    faqs: [
      {
        q: 'Which resolution should I choose?',
        a: '100 DPI is plenty for on-screen use, 150-200 DPI looks sharp in presentations, and 300 DPI is print quality. Higher DPI means bigger, heavier images.',
      },
      {
        q: 'Does converting damage the original PDF?',
        a: 'No. Your PDF is only read, never changed - the JPGs are generated from a copy of each page.',
      },
      {
        q: 'Are my pages uploaded anywhere?',
        a: 'No. The conversion runs inside your browser, so the document stays on your device from start to finish.',
      },
    ],
    Component: PdfToJpg,
  },
  {
    id: 'jpg2pdf',
    title: 'JPG to PDF',
    desc: 'Combine your images into one PDF in any order.',
    cat: 'convert',
    color: '#d97706',
    icon: 'toPdf',
    slug: 'jpg-to-pdf',
    seoTitle: 'JPG to PDF - Combine Photos into One PDF | Convertly',
    metaDescription:
      'Combine JPG, PNG and WebP images into a single PDF in any order. Choose page size and margin, then download - free and private.',
    intro:
      'Bring your photos, scans and screenshots together in one tidy PDF. Add as many JPG, PNG or WebP images as you like, drag them into the right order, pick the page size and margin, and download a document ready to print, email or upload.',
    steps: [
      'Add the images you want - JPG, PNG or WebP.',
      'Drag the thumbnails into order and choose the page size (A4, US Letter or fit the image).',
      'Click "Create PDF" and download the file.',
    ],
    faqs: [
      {
        q: 'Which image formats can I turn into a PDF?',
        a: 'JPG, PNG and WebP are all supported, and you can mix them in one document - each image becomes a page.',
      },
      {
        q: 'Can I make the pages a different size?',
        a: 'Yes. Pick A4, US Letter or "same as image" so each page matches its picture, and choose between no, small or medium margins.',
      },
      {
        q: 'Do the images get uploaded to a server?',
        a: 'Never. Your pictures are stitched into the PDF inside your browser and stay on your device.',
      },
    ],
    Component: JpgToPdf,
  },
  {
    id: 'docx2pdf',
    title: 'Word to PDF',
    desc: 'Convert DOCX documents into easy to share PDFs.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
    slug: 'word-to-pdf',
    seoTitle: 'Word to PDF Converter - DOCX to PDF Free | Convertly',
    metaDescription:
      'Convert Word documents into clean PDFs that keep their fonts, tables and layout. Works in your browser - no Word install, no upload.',
    intro:
      'Turn a DOCX into a PDF that looks the same on every device. Fonts, tables, images and page breaks stay in place, so your report, resume or form arrives exactly as you laid it out - no Microsoft Word required.',
    steps: [
      'Select your Word document (.docx, up to 25 MB).',
      'Give the converter a moment to lay out the pages.',
      'Download the finished PDF.',
    ],
    faqs: [
      {
        q: 'Do I need Microsoft Word installed?',
        a: 'No. The conversion happens in your browser - there is nothing to install, no sign-up and no add-in.',
      },
      {
        q: 'Will tables and images survive the conversion?',
        a: 'Yes. Layout elements are rendered into the PDF so they look the way they did in the document.',
      },
      {
        q: 'Why is there a 25 MB limit?',
        a: 'Big files are converted on your device, and 25 MB keeps the browser responsive while every page is drawn.',
      },
    ],
    Component: DocxToPdf,
  },
  {
    id: 'pdf2docx',
    title: 'PDF to Word',
    desc: 'Get the text of your PDF as an editable DOCX file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
    slug: 'pdf-to-word',
    seoTitle: 'PDF to Word Converter - Edit PDF as DOCX | Convertly',
    metaDescription:
      'Extract the text of a PDF into an editable Word document. Copy, rewrite and reuse the content - free, private, no upload.',
    intro:
      'Get your PDF back as an editable Word document. The text is pulled out page by page into a DOCX you can rewrite, restyle and save - ideal for reusing a chapter of a report or fixing a typo in a document you can no longer edit.',
    steps: [
      'Choose the PDF (up to 30 MB) - it must contain selectable text.',
      'Let the converter extract the text into DOCX.',
      'Download the file and edit it in Word, LibreOffice or Google Docs.',
    ],
    faqs: [
      {
        q: 'Will a scanned PDF work?',
        a: 'Scanned pages have no text layer, so there is nothing to extract. Run them through the OCR tool first to get editable text.',
      },
      {
        q: 'Can I edit the result straight away?',
        a: 'Yes - the download is a standard DOCX file that opens in any word processor.',
      },
      {
        q: 'Is my document uploaded for conversion?',
        a: 'No. The extraction runs on your device and the PDF never touches a server.',
      },
    ],
    Component: PdfToDocx,
  },
  {
    id: 'merge',
    title: 'Merge PDF',
    desc: 'Join several PDFs into one, in the order you want.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'merge',
    slug: 'merge-pdf',
    seoTitle: 'Merge PDF - Combine Multiple PDFs into One | Convertly',
    metaDescription:
      'Join two or more PDFs into a single file in the exact order you want. Free, unlimited and private - nothing is uploaded.',
    intro:
      'Join several PDFs into one document in the order you choose. Add contracts, chapters or scans, drag them into sequence, and download a single, neatly combined PDF - no watermarks and no page limits.',
    steps: [
      'Add the PDFs you want to join (each up to 30 MB).',
      'Drag the files into the order they should appear.',
      'Press "Merge PDF" and download the combined document.',
    ],
    faqs: [
      {
        q: 'Is there a limit to how many PDFs I can merge?',
        a: 'No fixed limit - add as many files as your device can handle and combine them in a single run.',
      },
      {
        q: 'Does merging change the quality?',
        a: 'No. Pages are copied from the originals exactly as they are, with no re-rendering or compression.',
      },
      {
        q: 'What happens to a damaged or protected file?',
        a: 'Files that cannot be opened are skipped with a message, so you can drop them and merge the rest.',
      },
    ],
    Component: MergePdf,
  },
  {
    id: 'split',
    title: 'Split PDF',
    desc: 'Extract pages or split a PDF into separate files.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'split',
    slug: 'split-pdf',
    seoTitle: 'Split PDF - Extract Pages or Split into Files | Convertly',
    metaDescription:
      'Split a PDF your way: extract pages like 1-5 into one file, or break every page into a separate PDF in a ZIP. Private and free.',
    intro:
      'Take one PDF apart the way you need. Extract an exact range of pages into a new document, or split every page into its own file and get them all in a ZIP - handy for pulling out a chapter or sending single pages on their own.',
    steps: [
      'Drop in your PDF (up to 30 MB).',
      'Choose a mode: extract selected pages, or split every page apart.',
      'Press "Split PDF" and download the result.',
    ],
    faqs: [
      {
        q: 'How do I extract pages 5 to 12?',
        a: 'Use the extract mode and enter the range - formats like "5-12" or "1-3, 5, 8-10" both work. You get one PDF with just those pages.',
      },
      {
        q: 'What does the ZIP option do?',
        a: '"Split every page" writes each page as its own PDF and packs them into a single ZIP download.',
      },
      {
        q: 'Is the original PDF modified?',
        a: 'No. It stays untouched - the split files are copies of its pages.',
      },
    ],
    Component: SplitPdf,
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    desc: 'Reduce the file size while keeping good quality.',
    cat: 'optimize',
    color: '#16a34a',
    icon: 'compress',
    slug: 'compress-pdf',
    seoTitle: 'Compress PDF - Reduce PDF File Size Online | Convertly',
    metaDescription:
      'Shrink a PDF to a smaller file size with three quality levels: best quality, recommended or smallest file. Free, private, no upload.',
    intro:
      'Make a heavy PDF easier to email and upload. Choose how much compression you want - from keeping the best quality to squeezing out the smallest file - and see exactly how much space you saved before you download.',
    steps: [
      'Select the PDF to shrink (up to 30 MB).',
      'Pick a level: Low for best quality, Medium recommended, High for the smallest file.',
      'Press "Compress PDF" and download the lighter document.',
    ],
    faqs: [
      {
        q: 'How much smaller will my PDF get?',
        a: 'It depends on the content: photo-heavy files shrink the most. The tool shows the before and after size with the percentage saved.',
      },
      {
        q: 'Will the pages look blurry?',
        a: 'Low and Medium keep pages crisp for screen and printing; High trades some sharpness for the biggest size cut.',
      },
      {
        q: 'Is the compression done on a server?',
        a: 'No - pages are re-rendered inside your browser and the file never leaves your device.',
      },
    ],
    Component: CompressPdf,
  },
  {
    id: 'mp3',
    title: 'Video to MP3',
    desc: 'Pull the sound out of a video and save it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'music',
    slug: 'video-to-mp3',
    seoTitle: 'Video to MP3 Converter - Extract Audio | Convertly',
    metaDescription:
      'Pull the audio out of a video and save it as an MP3. Choose 128, 192 or 320 kbps - fast, free and done in your browser.',
    intro:
      'Extract the soundtrack from any video and keep it as a standalone MP3. Great for grabbing a song from a clip, saving a lecture audio, or keeping only what you need - with quality from standard 128 up to 320 kbps.',
    steps: [
      'Choose the video (MP4, WebM or similar, up to 200 MB).',
      'Pick the MP3 quality: 128, 192 or 320 kbps.',
      'Press convert and download the audio file.',
    ],
    faqs: [
      {
        q: 'Which video formats can I use?',
        a: 'Common video files such as MP4 and WebM work - if your browser can play it, the tool can pull its audio out.',
      },
      {
        q: 'What MP3 quality should I pick?',
        a: '128 kbps is fine for speech, 192 kbps is a good everyday choice, and 320 kbps is the best quality an MP3 offers.',
      },
      {
        q: 'Does the video get uploaded?',
        a: 'No. The audio is extracted on your device, so nothing is sent anywhere.',
      },
    ],
    Component: VideoToMp3,
  },
  {
    id: 'trim',
    title: 'Audio Trimmer',
    desc: 'Cut the part you need from any audio file.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'scissors',
    slug: 'audio-trimmer',
    seoTitle: 'Audio Trimmer - Cut and Trim Audio Online | Convertly',
    metaDescription:
      'Cut the part you need from any audio file. Set the start and end point, choose MP3 or WAV, and download - free and private.',
    intro:
      'Chop an intro, ringtone or sample out of any audio file in seconds. Enter where the cut should start and stop, choose MP3 or WAV as the output, and download just the part you wanted.',
    steps: [
      'Add an audio (or video) file with sound.',
      'Enter the start and end time of the clip you want.',
      'Trim and download the result as MP3 or WAV.',
    ],
    faqs: [
      {
        q: 'Can I trim a video file too?',
        a: 'Yes - the tool accepts audio files and videos alike, and keeps only the sound from the range you set.',
      },
      {
        q: 'How do I set exact cut points?',
        a: 'Type the start and end in seconds, for example start 12.5 and end 30, for precise cuts.',
      },
      {
        q: 'Is my original file overwritten?',
        a: 'Never - you always download a new file, and the original audio stays exactly as it was.',
      },
    ],
    Component: AudioTrimmer,
  },
  {
    id: 'vcomp',
    title: 'Video Compressor',
    desc: 'Make big videos smaller and easier to share.',
    cat: 'video',
    color: '#db2777',
    icon: 'video',
    slug: 'video-compressor',
    seoTitle: 'Video Compressor - Make Videos Smaller | Convertly',
    metaDescription:
      'Compress a video to a smaller size by lowering the resolution or bitrate. Keep original size, 720p, 480p or 360p - private and free.',
    intro:
      'Shrink a video until it fits an upload limit or sends cleanly over chat. Choose a target resolution - keep the original, or drop to 720p, 480p or 360p - then set the quality and watch the file get lighter.',
    steps: [
      'Select the video you want to shrink (up to 200 MB).',
      'Choose the output size and quality (High, Medium or Small file).',
      'Compress, then download the lighter video.',
    ],
    faqs: [
      {
        q: 'Will compressing ruin the video quality?',
        a: 'Higher quality settings keep the picture close to the original; Small file gives the most savings for the most compression.',
      },
      {
        q: 'Which resolution should I pick?',
        a: 'Keep the original for the best look, 720p for everyday HD, and 480p or 360p when file size matters more than detail.',
      },
      {
        q: 'Where does the video go during compression?',
        a: 'Nowhere - it is re-encoded inside your browser like every other tool here.',
      },
    ],
    Component: VideoCompressor,
  },
  {
    id: 'vframe',
    title: 'Video to Image',
    desc: 'Capture any frame of a video as JPG or PNG.',
    cat: 'video',
    color: '#db2777',
    icon: 'frame',
    slug: 'video-to-image',
    seoTitle: 'Video to Image - Capture Frames as JPG or PNG | Convertly',
    metaDescription:
      'Grab any frame from a video and save it as a JPG or PNG image. Scrub to the exact moment and capture it - free and private.',
    intro:
      'Pull a still image out of a video at exactly the moment you want. Scrub through the timeline, pause on the perfect frame, and save it as a JPG or PNG - ready for a thumbnail, a presentation or a meme.',
    steps: [
      'Choose a video (MP4, WebM, MOV or MKV).',
      'Scrub to the frame you want and pick JPG or PNG.',
      'Capture and download the image.',
    ],
    faqs: [
      {
        q: 'Why would I choose PNG over JPG?',
        a: 'PNG keeps the frame pixel-perfect with no compression artefacts; JPG makes a smaller file for photos and thumbnails.',
      },
      {
        q: 'Can I capture more than one frame?',
        a: 'Yes - run the tool as many times as you like, and each capture downloads as its own image file.',
      },
      {
        q: 'Does the video leave my device?',
        a: 'No. Frames are decoded locally in your browser.',
      },
    ],
    Component: VideoFrame,
  },
  {
    id: 'rec',
    title: 'Audio Recorder',
    desc: 'Record your voice and download it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'mic',
    slug: 'audio-recorder',
    seoTitle: 'Audio Recorder - Record Your Voice to MP3 | Convertly',
    metaDescription:
      'Record audio from your microphone and download it as an MP3. Start, stop and save in one click - nothing is uploaded.',
    intro:
      'Capture your voice, an instrument or anything your microphone hears, then save it as a handy MP3. Hit record, do your thing, stop - and download the clip without ever creating an account.',
    steps: [
      'Allow microphone access when the browser asks.',
      'Press record and stop when you are done.',
      'Download the recording as MP3.',
    ],
    faqs: [
      {
        q: 'Where is the recording stored?',
        a: 'It is held in your browser while you work and written to a file when you download it - nothing is uploaded.',
      },
      {
        q: 'Can I record in MP3 directly?',
        a: 'Yes. The raw capture is converted to MP3 in the browser, ready to download and share.',
      },
      {
        q: 'What if the browser blocks the microphone?',
        a: 'Check the padlock icon in the address bar, allow microphone access for this site, then reload and try again.',
      },
    ],
    Component: AudioRecorder,
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    desc: 'Turn your PDF pages the way you need.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'rotate',
    badge: true,
    slug: 'rotate-pdf',
    seoTitle: 'Rotate PDF - Turn PDF Pages 90 or 180 | Convertly',
    metaDescription:
      'Rotate every page of a PDF at once: 90 clockwise, 90 counter-clockwise or 180 degrees. Fix sideways scans in seconds - private and free.',
    intro:
      'Fix a PDF that opens sideways or upside down. Turn every page by the same angle in one click - 90 degrees either way or a full 180 - and download a document that reads the right way round.',
    steps: [
      'Add the PDF with the crooked pages (up to 30 MB).',
      'Choose the rotation: 90 right, 90 left or 180 degrees.',
      'Apply the rotation and download the corrected PDF.',
    ],
    faqs: [
      {
        q: 'Can I rotate only some pages?',
        a: 'This tool turns every page by the same angle - ideal for scans where the whole document is sideways.',
      },
      {
        q: 'Will rotating reduce the quality?',
        a: 'No. The pages are turned in place; nothing is re-scanned or compressed.',
      },
      {
        q: 'Does the original file change?',
        a: 'No - a rotated copy is created and your original stays exactly as it was.',
      },
    ],
    Component: RotatePdf,
  },
  {
    id: 'watermark',
    title: 'Watermark PDF',
    desc: 'Stamp a text watermark over every page.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'drop',
    badge: true,
    slug: 'watermark-pdf',
    seoTitle: 'Watermark PDF - Add Text Watermark to PDF | Convertly',
    metaDescription:
      'Stamp a text watermark across every page of a PDF. Choose light, normal or strong opacity and download - free, private, no upload.',
    intro:
      'Mark a document as confidential, draft or sample by stamping your own words across every page. Type the watermark text, pick how strong it should look, and download a protected copy of your PDF.',
    steps: [
      'Drop in the PDF you want to mark (up to 30 MB).',
      'Type the watermark text and choose Light, Normal or Strong opacity.',
      'Apply the watermark and download the new PDF.',
    ],
    faqs: [
      {
        q: 'Will the watermark cover my content?',
        a: 'It is drawn over the pages with the opacity you choose, so Light keeps text readable while still showing ownership.',
      },
      {
        q: 'Can I mark only part of the document?',
        a: 'The stamp is applied to every page - split the file first if you only need to mark a section.',
      },
      {
        q: 'Is my PDF uploaded?',
        a: 'No. The watermark is drawn onto the pages inside your browser.',
      },
    ],
    Component: WatermarkPdf,
  },
  {
    id: 'pagenums',
    title: 'Page Numbers',
    desc: 'Add page numbers to any PDF in seconds.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'hash',
    badge: true,
    slug: 'add-page-numbers-pdf',
    seoTitle: 'Add Page Numbers to a PDF - Free Online | Convertly',
    metaDescription:
      'Add page numbers to any PDF: pick bottom or top, center or right, set the starting number and download - private and free.',
    intro:
      'Give a document proper pagination. Choose where the number sits - bottom center, bottom right, top center or top right - decide which number to start from, and every page gets its label in one pass.',
    steps: [
      'Select the PDF you want to number (up to 30 MB).',
      'Choose the position and the starting number.',
      'Apply and download the numbered PDF.',
    ],
    faqs: [
      {
        q: 'Where can the numbers appear?',
        a: 'Four spots are available: bottom center, bottom right, top center and top right - pick whichever matches your document style.',
      },
      {
        q: 'Can I start counting from another number?',
        a: 'Yes. Set "Start at" to any number, which is handy when the numbering continues from a previous section.',
      },
      {
        q: 'Does it work on scanned PDFs?',
        a: 'Yes - the number is drawn on top of the page image, so scans are numbered just like digital documents.',
      },
    ],
    Component: PageNumbersPdf,
  },
  {
    id: 'metadata',
    title: 'PDF Metadata',
    desc: 'Edit the title, author and keywords of a PDF.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'info',
    badge: true,
    slug: 'edit-pdf-metadata',
    seoTitle: 'Edit PDF Metadata - Title, Author, Keywords | Convertly',
    metaDescription:
      'Edit the title, author, subject and keywords inside a PDF properties panel. Fix the details other people see - free and private.',
    intro:
      'Clean up the properties file managers and libraries show for your PDF. Correct the title, put your name in the author field, add a subject and comma-separated keywords, and save a document that is properly catalogued.',
    steps: [
      'Open the PDF whose details you want to change.',
      'Edit the title, author, subject and keywords - current values are filled in.',
      'Save to download the updated PDF.',
    ],
    faqs: [
      {
        q: 'Where do these details show up?',
        a: 'In the file Properties or Get Info panel, and in library tools like Zotero that read PDF metadata.',
      },
      {
        q: 'Will editing metadata change the pages?',
        a: 'No - only the document information is touched; the pages themselves stay exactly as they were.',
      },
      {
        q: 'Can I clear a field?',
        a: 'Yes. Empty the box and save to remove that value from the properties.',
      },
    ],
    Component: PdfMetadata,
  },
  {
    id: 'pdftotxt',
    title: 'PDF to Text',
    desc: 'Pull the plain text out of a PDF as a TXT file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'text',
    badge: true,
    slug: 'pdf-to-text',
    seoTitle: 'PDF to Text Converter - Extract Text as TXT | Convertly',
    metaDescription:
      'Pull the plain text out of a PDF and download it as a TXT file. Fast, free and private - works on any text-based PDF.',
    intro:
      'Get the words out of a PDF without re-typing a thing. The text is read page by page and saved as a simple TXT file you can paste into an editor, search or translate.',
    steps: [
      'Choose a PDF that has selectable text (up to 30 MB).',
      'Wait while the text is read out of each page.',
      'Download the TXT file.',
    ],
    faqs: [
      {
        q: 'Why does nothing come out of my scanned PDF?',
        a: 'Scans are pictures of text, not text itself. Use the OCR tool first to turn the images into readable words.',
      },
      {
        q: 'Is the layout kept?',
        a: 'The text is saved as plain TXT, so line breaks follow the reading order rather than the visual columns.',
      },
      {
        q: 'Is my document uploaded?',
        a: 'No - the extraction happens entirely in your browser.',
      },
    ],
    Component: PdfToText,
  },
  {
    id: 'imgcomp',
    title: 'Image Compressor',
    desc: 'Reduce image size while keeping good quality.',
    cat: 'image',
    color: '#0891b2',
    icon: 'imgComp',
    badge: true,
    slug: 'image-compressor',
    seoTitle: 'Image Compressor - Reduce Image Size Online | Convertly',
    metaDescription:
      'Make JPG, PNG or WebP images smaller with a quality slider. See the size you saved before downloading - free and private.',
    intro:
      'Shrink heavy images before you upload them to a website, form or marketplace. Set the quality, watch the file get lighter, and download a JPG that still looks good.',
    steps: [
      'Add a JPG, PNG or WebP image.',
      'Move the quality slider until the size looks right.',
      'Compress and download the smaller image.',
    ],
    faqs: [
      {
        q: 'Which format comes out?',
        a: 'The result is a JPG - the best all-round choice for photographs and web pages.',
      },
      {
        q: 'How low can I push the quality?',
        a: 'The tool tells you when an image is already small; dropping quality too far starts to show blocking, so stop when it still looks clean.',
      },
      {
        q: 'Do my photos get uploaded?',
        a: 'No. Compression runs on a canvas inside your browser.',
      },
    ],
    Component: ImageCompressor,
  },
  {
    id: 'imgconv',
    title: 'Image Converter',
    desc: 'Convert images between JPG, PNG and WebP.',
    cat: 'image',
    color: '#0891b2',
    icon: 'swap',
    badge: true,
    slug: 'image-converter',
    seoTitle: 'Image Converter - JPG, PNG and WebP | Convertly',
    metaDescription:
      'Convert images between JPG, PNG and WebP in one click. Any of them in, any of them out - free, private, no upload.',
    intro:
      'Swap images between the three formats the web runs on. Turn a PNG into a JPG for smaller files, keep transparency with PNG, or export modern WebP - whichever way you need, in one click.',
    steps: [
      'Select the image to convert (JPG, PNG or WebP).',
      'Choose the output format.',
      'Convert and download the new file.',
    ],
    faqs: [
      {
        q: 'What is the difference between these formats?',
        a: 'JPG is compact for photos, PNG keeps transparency and sharp edges, and WebP gives modern browsers the best of both at a smaller size.',
      },
      {
        q: 'Does converting lose quality?',
        a: 'Each conversion re-saves the image once; going JPG to PNG keeps every pixel, while saving to JPG adds a little compression.',
      },
      {
        q: 'Is the original image changed?',
        a: 'No - you download a new file and the original stays as it was.',
      },
    ],
    Component: ImageConverter,
  },
  {
    id: 'imgsize',
    title: 'Image Resizer',
    desc: 'Change the width and height of any image.',
    cat: 'image',
    color: '#0891b2',
    icon: 'expand',
    badge: true,
    slug: 'image-resizer',
    seoTitle: 'Image Resizer - Resize by Width and Height | Convertly',
    metaDescription:
      'Resize any image to an exact width and height in pixels, from 1 to 8000 px. Free, private and done in your browser.',
    intro:
      'Change an image to the exact dimensions a site, profile or print job asks for. Enter the width and height in pixels - anywhere from 1 up to 8000 - and download a picture that fits perfectly.',
    steps: [
      'Choose the image you want to resize.',
      'Enter the new width and height in pixels (1-8000).',
      'Resize and download the result.',
    ],
    faqs: [
      {
        q: 'Will resizing make the image blurry?',
        a: 'Growing an image beyond its natural size softens it - shrink or match the original dimensions for the cleanest result.',
      },
      {
        q: 'Can I keep the original proportions?',
        a: 'The fields start from the current size, so adjust one side to the number you need and set the other to match it.',
      },
      {
        q: 'Is there a maximum size?',
        a: 'Yes - each side can be between 1 and 8000 pixels, which covers everything from favicons to large banners.',
      },
    ],
    Component: ImageResizer,
  },
  {
    id: 'imgrot',
    title: 'Rotate Image',
    desc: 'Turn an image 90° or 180° in one click.',
    cat: 'image',
    color: '#0891b2',
    icon: 'rotate',
    badge: true,
    slug: 'rotate-image',
    seoTitle: 'Rotate Image - Turn Photos 90 or 180 | Convertly',
    metaDescription:
      'Rotate a photo 90 degrees clockwise, 90 counter-clockwise or 180 degrees in one click. Fast, free and private - no upload.',
    intro:
      'Straighten a photo that came out on its side with a single click. Turn it a quarter turn either way or flip it fully upside down, and download the corrected image in the format it came in.',
    steps: [
      'Pick the image you want to turn.',
      'Choose 90 clockwise, 90 counter-clockwise or 180 degrees.',
      'Rotate and download the new image.',
    ],
    faqs: [
      {
        q: 'Does the file type stay the same?',
        a: 'Yes - a rotated JPG stays a JPG and a PNG stays a PNG, so transparency and quality carry over.',
      },
      {
        q: 'What happens to the dimensions after a quarter turn?',
        a: 'Width and height swap, so a landscape photo becomes portrait after 90 degrees.',
      },
      {
        q: 'Is my image uploaded anywhere?',
        a: 'No. The rotation happens on a canvas in your browser.',
      },
    ],
    Component: RotateImage,
  },
  {
    id: 'audioconv',
    title: 'Audio Converter',
    desc: 'Convert audio files to MP3 or WAV.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'swap',
    badge: true,
    slug: 'audio-converter',
    seoTitle: 'Audio Converter - Convert to MP3 or WAV | Convertly',
    metaDescription:
      'Convert MP3, WAV, M4A or OGG audio to MP3 or WAV with quality from 128 to 320 kbps. Free, private, in your browser.',
    intro:
      'Move audio between formats without installing a converter. Bring in MP3, WAV, M4A or OGG, choose MP3 with 128, 192 or 320 kbps quality or uncompressed WAV, and download the file your player or editor wants.',
    steps: [
      'Add the audio file you want to convert.',
      'Choose the output format - MP3 or WAV - and the quality if you pick MP3.',
      'Convert and download the result.',
    ],
    faqs: [
      {
        q: 'When should I pick WAV instead of MP3?',
        a: 'WAV is lossless and ideal for editing or burning to disc; MP3 is much smaller and perfect for listening and sharing.',
      },
      {
        q: 'Which MP3 quality is best?',
        a: '128 kbps suits speech, 192 kbps is a balanced default, and 320 kbps is the highest quality an MP3 supports.',
      },
      {
        q: 'Where is my audio processed?',
        a: 'Entirely on your device - the file is never uploaded.',
      },
    ],
    Component: AudioConverter,
  },
  {
    id: 'screen',
    title: 'Screen Recorder',
    desc: 'Record your screen and save it as a video.',
    cat: 'video',
    color: '#db2777',
    icon: 'screen',
    badge: true,
    slug: 'screen-recorder',
    seoTitle: 'Screen Recorder - Record Your Screen Online | Convertly',
    metaDescription:
      'Record your screen, a window or a browser tab directly in the browser and save it as MP4 or WebM. Free, private, no watermarks.',
    intro:
      'Show instead of tell: capture your screen while you make a walkthrough, demo or bug report. Pick what to share, allow tab audio if you want sound, and download the video as MP4 or WebM.',
    steps: [
      'Press record and pick a screen, window or browser tab to share.',
      'Stop when you are finished recording.',
      'Download the video (MP4 or WebM, depending on your browser).',
    ],
    faqs: [
      {
        q: 'Do I need to install screen capture software?',
        a: 'No. Capture uses the browser built-in screen sharing, so it works on any modern browser with no extension.',
      },
      {
        q: 'Can the recording include sound?',
        a: 'Yes - allow sharing tab audio when the browser asks and that audio is captured together with the video.',
      },
      {
        q: 'Is the recording uploaded?',
        a: 'Never. It stays in your browser until you download it.',
      },
    ],
    Component: ScreenRecorder,
  },
  {
    id: 'qr',
    title: 'QR Code Generator',
    desc: 'Create a QR code from any text or link.',
    cat: 'tools',
    color: '#64748b',
    icon: 'qr',
    badge: true,
    slug: 'qr-code-generator',
    seoTitle: 'QR Code Generator - Free QR Codes from Text | Convertly',
    metaDescription:
      'Create a QR code from any text or link in seconds. Download it as PNG in 256, 512 or 1024 px, or as scalable SVG - free.',
    intro:
      'Turn a link, Wi-Fi note or plain text into a scannable QR code. Type what should go in, pick the size, and download a crisp PNG for screens or an SVG that scales to any print size.',
    steps: [
      'Type or paste the text or URL for the code.',
      'Choose the size: 256, 512 or 1024 px.',
      'Download the PNG or SVG.',
    ],
    faqs: [
      {
        q: 'Should I use PNG or SVG?',
        a: 'PNG is perfect for websites, docs and chat; SVG scales without losing sharpness, which makes it the right pick for print.',
      },
      {
        q: 'Can a QR code hold more than a link?',
        a: 'Yes - any text works: a URL, a short message, contact details or a Wi-Fi password.',
      },
      {
        q: 'Do the codes expire?',
        a: 'No. Everything is generated from your text right here, with no third-party service and no expiry date.',
      },
    ],
    Component: QrCode,
  },
  {
    id: 'ocr',
    title: 'Image & PDF OCR',
    desc: 'Read the text from scans and photos.',
    cat: 'tools',
    color: '#64748b',
    icon: 'scan',
    badge: true,
    slug: 'ocr',
    seoTitle: 'OCR Online - Extract Text from Images and PDFs | Convertly',
    metaDescription:
      'Read the text from scans, photos and screenshots with OCR. Works on JPG, PNG and PDF - extract to TXT free and private.',
    intro:
      'Turn a picture of text into real, selectable words. Drop in a scan, photo or screenshot and the OCR engine reads it - in English - then hands you the text as a TXT file to copy, search or edit.',
    steps: [
      'Add a JPG, PNG or PDF scan with reasonably clear text.',
      'Let the OCR engine read the page.',
      'Download the extracted text as TXT.',
    ],
    faqs: [
      {
        q: 'Which languages does it read?',
        a: 'This build recognises English text, which covers most documents, screenshots and printed pages.',
      },
      {
        q: 'What image quality works best?',
        a: 'Sharp, well-lit images with upright text read best; a quick crop to the text area also improves accuracy.',
      },
      {
        q: 'Is the image sent to the cloud?',
        a: 'No. Recognition runs inside your browser, so your document stays private.',
      },
    ],
    Component: Ocr,
  },
  {
    id: 'pdfedit',
    title: 'Edit PDF Text',
    desc: 'Change the text written inside any PDF.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'pencil',
    badge: true,
    slug: 'edit-pdf-text',
    seoTitle: 'Edit PDF Text - Change Text in a PDF Online | Convertly',
    metaDescription:
      'Click any line of text in a PDF to change it, then save the updated document. Fix typos and labels free, private, no upload.',
    intro:
      'Fix a typo or swap a label without going back to the source file. Click any line of text in the preview, type the correction, and save a PDF with your change in its place.',
    steps: [
      'Open the PDF you want to amend (up to 30 MB).',
      'Click a line of text and type your change.',
      'Save to download the edited PDF.',
    ],
    faqs: [
      {
        q: 'Does it work on scanned PDFs?',
        a: 'Scanned pages have no text layer to edit - the tool works on documents where the text is selectable.',
      },
      {
        q: 'What about rotated or skewed text?',
        a: 'Straight, horizontal lines are what this tool edits; rotated or skewed text is left untouched so nothing gets mangled.',
      },
      {
        q: 'Is my PDF uploaded?',
        a: 'No - the page is rendered and saved locally in your browser.',
      },
    ],
    Component: PdfEditor,
  },
  {
    id: 'rx',
    title: 'Prescription Reader',
    desc: "Read a doctor's handwritten prescription with AI.",
    cat: 'tools',
    color: '#64748b',
    icon: 'rx',
    badge: true,
    slug: 'prescription-reader',
    seoTitle: 'AI Prescription Reader - Read Handwritten Notes | Convertly',
    metaDescription:
      'Upload a photo or scan of a handwritten prescription and let AI read it: patient, doctor, medicines, advice and tests in tidy cards.',
    intro:
      'Handwriting on a prescription can be hard to follow. Upload a photo, scan or PDF and the AI reads it for you, organising the patient details, doctor, medicines, advice and suggested tests into clear cards - plus a full transcription you can check yourself.',
    steps: [
      'Add a photo, scan or PDF of the prescription (JPG, PNG or PDF).',
      'Enter your AI provider details (API key, model and base URL).',
      'Run the reader and review the structured result.',
    ],
    faqs: [
      {
        q: 'Which AI service does it use?',
        a: 'Any OpenAI-compatible API: paste your API key, model name and base URL, and the image is sent straight to that provider.',
      },
      {
        q: 'What will I get back?',
        a: 'Patient and doctor details, a list of medicines, complaint notes, advice and tests - along with the full transcription of what was written.',
      },
      {
        q: 'Is this medical advice?',
        a: 'No. It is a reading aid to help you understand what was written; always confirm medicines and doses with a qualified professional.',
      },
      {
        q: 'Are prescriptions stored?',
        a: 'Nothing is stored here - the image goes directly to the AI provider you configured.',
      },
    ],
    Component: PrescriptionReader,
  },
];
