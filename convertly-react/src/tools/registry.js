/* ==========================================================
   Convertly React - tool registry
   ONE ordered list for the whole app: the home grid renders it,
   the app shell mounts a panel for it. The id must match what the
   tool component uses for its `panel-<id>` section.

   Keep this order in sync with js/home-grid.js (vanilla version).
   ========================================================== */

import PdfToJpg from './PdfToJpg.jsx';
import JpgToPdf from './JpgToPdf.jsx';
import DocxToPdf from './DocxToPdf.jsx';
import PdfToDocx from './PdfToDocx.jsx';
import MergePdf from './MergePdf.jsx';
import SplitPdf from './SplitPdf.jsx';
import CompressPdf from './CompressPdf.jsx';
import VideoToMp3 from './VideoToMp3.jsx';
import AudioTrimmer from './AudioTrimmer.jsx';
import VideoCompressor from './VideoCompressor.jsx';
import VideoFrame from './VideoFrame.jsx';
import AudioRecorder from './AudioRecorder.jsx';
import RotatePdf from './RotatePdf.jsx';
import WatermarkPdf from './WatermarkPdf.jsx';
import PageNumbersPdf from './PageNumbersPdf.jsx';
import PdfMetadata from './PdfMetadata.jsx';
import PdfToText from './PdfToText.jsx';
import ImageCompressor from './ImageCompressor.jsx';
import ImageConverter from './ImageConverter.jsx';
import ImageResizer from './ImageResizer.jsx';
import RotateImage from './RotateImage.jsx';
import AudioConverter from './AudioConverter.jsx';
import ScreenRecorder from './ScreenRecorder.jsx';
import QrCode from './QrCode.jsx';
import Ocr from './Ocr.jsx';
import PdfEditor from './PdfEditor.jsx';

export const TOOLS = [
  {
    id: 'pdf2jpg',
    title: 'PDF to JPG',
    desc: 'Turn every page of a PDF into a sharp JPG image.',
    cat: 'convert',
    color: '#d97706',
    icon: 'image',
    Component: PdfToJpg,
  },
  {
    id: 'jpg2pdf',
    title: 'JPG to PDF',
    desc: 'Combine your images into one PDF in any order.',
    cat: 'convert',
    color: '#d97706',
    icon: 'toPdf',
    Component: JpgToPdf,
  },
  {
    id: 'docx2pdf',
    title: 'Word to PDF',
    desc: 'Convert DOCX documents into easy to share PDFs.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
    Component: DocxToPdf,
  },
  {
    id: 'pdf2docx',
    title: 'PDF to Word',
    desc: 'Get the text of your PDF as an editable DOCX file.',
    cat: 'convert',
    color: '#2563eb',
    icon: 'doc',
    Component: PdfToDocx,
  },
  {
    id: 'merge',
    title: 'Merge PDF',
    desc: 'Join several PDFs into one, in the order you want.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'merge',
    Component: MergePdf,
  },
  {
    id: 'split',
    title: 'Split PDF',
    desc: 'Extract pages or split a PDF into separate files.',
    cat: 'organize',
    color: '#ef4b2b',
    icon: 'split',
    Component: SplitPdf,
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    desc: 'Reduce the file size while keeping good quality.',
    cat: 'optimize',
    color: '#16a34a',
    icon: 'compress',
    Component: CompressPdf,
  },
  {
    id: 'mp3',
    title: 'Video to MP3',
    desc: 'Pull the sound out of a video and save it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'music',
    Component: VideoToMp3,
  },
  {
    id: 'trim',
    title: 'Audio Trimmer',
    desc: 'Cut the part you need from any audio file.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'scissors',
    Component: AudioTrimmer,
  },
  {
    id: 'vcomp',
    title: 'Video Compressor',
    desc: 'Make big videos smaller and easier to share.',
    cat: 'video',
    color: '#db2777',
    icon: 'video',
    Component: VideoCompressor,
  },
  {
    id: 'vframe',
    title: 'Video to Image',
    desc: 'Capture any frame of a video as JPG or PNG.',
    cat: 'video',
    color: '#db2777',
    icon: 'frame',
    Component: VideoFrame,
  },
  {
    id: 'rec',
    title: 'Audio Recorder',
    desc: 'Record your voice and download it as MP3.',
    cat: 'audio',
    color: '#7c3aed',
    icon: 'mic',
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
    Component: PdfEditor,
  },
];
