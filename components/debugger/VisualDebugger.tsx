'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';

import type { DebuggerChallenge } from '@/content/debugger-challenges';

// ── Draggable pointer handle ──
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      animate={{ scale: isDragging ? 1.3 : 1 }}
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'var(--accent-coral)',
        color: 'var(--paper-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? 'var(--shadow-2)' : '0 2px 6px rgba(0,0,0,0.1)',
        touchAction: 'none',
      }}
    >
      →
    </motion.div>
  );
}

// ── Droppable node ──
function DropNode({
  id,
  label,
  isTarget,
  deleted,
}: {
  id: string;
  label: string;
  isTarget: boolean;
  deleted: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        scale: deleted ? 0 : 1,
        opacity: deleted ? 0 : 1,
        borderColor: isOver && isTarget ? 'var(--amber)' : isOver ? 'var(--role-error)' : 'var(--rule)',
        boxShadow: isOver && isTarget ? '0 0 0 3px color-mix(in srgb, var(--amber) 30%, transparent)' : '0 2px 6px rgba(0,0,0,0.06)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 18px',
        borderRadius: 12,
        background: 'var(--paper-raised)',
        border: '2px solid var(--rule)',
        fontFamily: 'var(--font-dmmono)',
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--text-primary)',
        minWidth: 60,
        justifyContent: 'center',
      }}
    >
      {label}
    </motion.div>
  );
}

// ── Main Visual Debugger ──
interface VisualDebuggerProps {
  challenge: DebuggerChallenge;
}

export function VisualDebugger({ challenge }: VisualDebuggerProps) {
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletedNodes, setDeletedNodes] = useState<Set<string>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const currentStep = challenge.steps[activeStepIdx];
  const isFinished = activeStepIdx >= challenge.steps.length;

  // Clear feedback after delay
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (isFinished || !currentStep) return;

      const { active, over } = event;
      if (!over) return;

      const dragId = String(active.id);
      const dropId = String(over.id);

      // Check if the correct source was dragged to the correct target
      if (dragId === currentStep.dragSource && dropId === currentStep.dragTarget) {
        // Correct!
        setFeedback({ type: 'success', text: currentStep.onSuccess });
        setCompletedSteps((prev) => [...prev, activeStepIdx]);
        setWrongAttempts(0);
        setShowHint(false);



        if (activeStepIdx === challenge.steps.length - 2) {
          // The step that deletes the node
          const secondToLast = challenge.initialNodes[1]; // B in the A→B→C→D case
          if (secondToLast) {
            setDeletedNodes((prev) => new Set([...Array.from(prev), secondToLast.id]));
          }
        }

        feedbackTimer.current = setTimeout(() => {
          setFeedback(null);
          if (activeStepIdx + 1 >= challenge.steps.length) {
            setIsComplete(true);
          } else {
            setActiveStepIdx((prev) => prev + 1);
          }
        }, 1500);
      } else {
        // Wrong!
        const attempts = wrongAttempts + 1;
        setWrongAttempts(attempts);
        setFeedback({ type: 'error', text: currentStep.onFailure });

        if (attempts >= 2) {
          setShowHint(true);
        }

        feedbackTimer.current = setTimeout(() => setFeedback(null), 2000);
      }
    },
    [activeStepIdx, currentStep, isFinished, wrongAttempts, challenge]
  );

  return (
    <section
      style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        background: 'var(--paper-raised)',
        boxShadow: 'var(--shadow-card)',
        padding: 32,
        marginTop: 40,
      }}
    >
      <h2 className="topic-h2" style={{ marginTop: 0 }}>
        🧩 {challenge.title}
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-dmsans)',
          fontSize: 15,
          color: 'var(--text-secondary)',
          marginBottom: 24,
        }}
      >
        {challenge.description}
      </p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Linked list visualization */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'center',
            padding: '24px 0',
            flexWrap: 'wrap',
          }}
        >
          {challenge.initialNodes.map((node, i) => (
            <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <DropNode
                  id={`node-${node.id}`}
                  label={String(node.value)}
                  isTarget={currentStep?.dragTarget === `node-${node.id}`}
                  deleted={deletedNodes.has(node.id)}
                />
                {/* Pointer handle (draggable) */}
                {node.next !== undefined && !deletedNodes.has(node.id) && (
                  <DragHandle id={`ptr-${node.id}`} />
                )}
              </div>
              {/* Arrow */}
              {i < challenge.initialNodes.length - 1 && !deletedNodes.has(node.id) && (
                <span
                  style={{
                    fontFamily: 'var(--font-dmmono)',
                    fontSize: 18,
                    color: 'var(--text-muted)',
                  }}
                >
                  →
                </span>
              )}
            </div>
          ))}
          {/* NULL node (droppable target) */}
          <DropNode
            id="node-null"
            label="NULL"
            isTarget={currentStep?.dragTarget === 'node-null'}
            deleted={false}
          />
        </div>
      </DndContext>

      {/* Current instruction */}
      {!isComplete && currentStep && (
        <motion.div
          key={activeStepIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 20px',
            textAlign: 'center',
            fontFamily: 'var(--font-dmsans)',
            fontSize: 15,
            color: 'var(--text-primary)',
            marginTop: 16,
          }}
        >
          <strong>Step {activeStepIdx + 1}:</strong> {currentStep.instruction}
        </motion.div>
      )}

      {/* Hint button */}
      {showHint && !isComplete && currentStep && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            onClick={() => setFeedback({ type: 'success', text: `Hint: Drag "${currentStep.dragSource}" to "${currentStep.dragTarget}"` })}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-amber)',
              color: 'var(--accent-amber)',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Show Hint 💡
          </button>
        </div>
      )}

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              marginTop: 16,
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm)',
              background: feedback.type === 'success' ? 'var(--surface-success)' : 'var(--surface-danger)',
              color: feedback.type === 'success' ? 'var(--state-success)' : 'var(--state-danger)',
              fontFamily: 'var(--font-dmsans)',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {feedback.type === 'success' ? '✓ ' : '✗ '}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code panel — lines light up as steps complete */}
      <div
        style={{
          marginTop: 24,
          background: 'var(--paper-sunken)',
          borderRadius: 'var(--radius-sm)',
          padding: 16,
          overflow: 'auto',
          maxHeight: 300,
        }}
      >
        <pre style={{ margin: 0, fontFamily: 'var(--font-dmmono)', fontSize: 13 }}>
          {challenge.code.python.split('\n').map((line, i) => {
            const isHighlighted = completedSteps.some((stepIdx) =>
              line.includes(challenge.steps[stepIdx]?.codeLine?.split('←')[0]?.trim() ?? '___NOMATCH___')
            );
            return (
              <div
                key={i}
                style={{
                  padding: '2px 8px',
                  borderLeft: isHighlighted ? '3px solid var(--state-success)' : '3px solid transparent',
                  background: isHighlighted ? 'color-mix(in srgb, var(--role-found) 8%, transparent)' : 'transparent',
                  opacity: isComplete ? 1 : isHighlighted ? 1 : 0.35,
                  transition: 'all 0.4s ease',
                }}
              >
                {line || '\u00A0'}
              </div>
            );
          })}
        </pre>
      </div>

      {/* Completion state */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 'var(--radius)',
            background: 'var(--surface-success)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <p
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--state-success)',
            }}
          >
            Visual Debugger Complete!
          </p>
          <p
            style={{
              fontFamily: 'var(--font-dmsans)',
              fontSize: 14,
              color: 'var(--text-secondary)',
              marginTop: 4,
            }}
          >
            You performed the operation by hand — now the code makes sense.
          </p>
        </motion.div>
      )}
    </section>
  );
}

export default VisualDebugger;
