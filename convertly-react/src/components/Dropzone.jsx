/* ==========================================================
   Convertly React - .dropzone (PDF tool file picker)
   ========================================================== */
import { useDropzone } from '../hooks/useDropzone.js';

export default function Dropzone({ id, accept, multiple = false, onFiles, icon: Icon, title, sub, inputRef }) {
  const { isOver, dropProps } = useDropzone(onFiles);

  return (
    <label className={isOver ? 'dropzone is-over' : 'dropzone'} id={id + 'Drop'} htmlFor={id + 'Input'} {...dropProps}>
      <input
        ref={inputRef}
        type="file"
        id={id + 'Input'}
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      <Icon />
      <span className="dz-title">{title}</span>
      <span className="dz-sub">{sub}</span>
    </label>
  );
}
