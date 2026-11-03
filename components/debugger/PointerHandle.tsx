'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

interface PointerHandleProps {
  id: string;
  label?: string;
}

export function PointerHandle({ id, label = '→' }: PointerHandleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      animate={{ scale: isDragging ? 1.3 : 1, opacity: isDragging ? 0.7 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: 'var(--accent-coral)',
        color: 'var(--paper-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 700,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging
          ? 'var(--shadow-2)'
          : '0 2px 6px rgba(0,0,0,0.15)',
        zIndex: isDragging ? 50 : 1,
        touchAction: 'none',
      }}
    >
      {label}
    </motion.div>
  );
}

export default PointerHandle;
