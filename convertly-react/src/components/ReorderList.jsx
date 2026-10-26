/* ==========================================================
   Convertly React - .img-list (reorderable list)
   Shared by JPG to PDF (draggable) and Merge PDF (arrows only)
   ========================================================== */
import { useState } from 'react';
import IconButton from './IconButton.jsx';
import { ICON_UP, ICON_DOWN, ICON_TRASH } from '../lib/icons.jsx';

export default function ReorderList({
  id = 'imgList',
  items,
  onMove,
  onRemove,
  draggable = false,
  renderLead,
  renderMeta,
}) {
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  const handleDragStart = (e, item) => {
    if (!draggable) return;
    setDragId(item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
  };

  const handleDragOver = (e, item) => {
    if (dragId === null) return;
    e.preventDefault();
    if (item.id !== dragId) setOverId(item.id);
  };

  const handleDrop = (e, item) => {
    if (dragId === null) return;
    e.preventDefault();
    const from = items.findIndex((it) => it.id === dragId);
    const to = items.findIndex((it) => it.id === item.id);
    if (from >= 0 && to >= 0) onMove(from, to);
    setDragId(null);
    setOverId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  return (
    <ul className="img-list" id={id}>
      {items.map((item, i) => {
        const classes = ['img-item'];
        if (!draggable) classes.push('no-drag');
        if (dragId === item.id) classes.push('dragging');
        if (overId === item.id && dragId !== null && dragId !== item.id) classes.push('drop-target');

        return (
          <li
            key={item.id}
            className={classes.join(' ')}
            data-id={item.id}
            draggable={draggable}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDrop={(e) => handleDrop(e, item)}
            onDragEnd={handleDragEnd}
          >
            <span className="img-order">{i + 1}</span>
            {renderLead(item)}
            <div className="img-meta">
              <strong>{item.name}</strong>
              <span>{renderMeta(item)}</span>
            </div>
            <div className="img-tools">
              <IconButton label="Move up" action="up" disabled={i === 0} onClick={() => onMove(i, i - 1)}>
                {ICON_UP}
              </IconButton>
              <IconButton
                label="Move down"
                action="down"
                disabled={i === items.length - 1}
                onClick={() => onMove(i, i + 1)}
              >
                {ICON_DOWN}
              </IconButton>
              <IconButton
                label={draggable ? 'Remove image' : 'Remove file'}
                action="remove"
                disabled={false}
                extraClass="danger"
                onClick={() => onRemove(i)}
              >
                {ICON_TRASH}
              </IconButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
