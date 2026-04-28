'use client';

import { useEffect, useRef } from 'react';

import { useStepperStore } from '@/lib/stepper-store';
import type { CodeLanguage, StepperData } from '@/types/learning';
import { DiagramRouter } from '@/components/diagrams/DiagramRouter';

import { VariableStatePanel } from './VariableStatePanel';
import { ConstraintGauge } from './ConstraintGauge';
import { CodeTabs } from './CodeTabs';

interface StepperBlockProps {
  stepperData: StepperData
  code: Record<CodeLanguage, string>
  renderedCode: Record<CodeLanguage, string>
}

const SPEED_OPTIONS = [0.5, 1, 2] as const;

export function StepperBlock({ stepperData, code, renderedCode }: StepperBlockProps) {
  const {
    currentStep,
    totalSteps,
    setStep,
    nextStep,
    prevStep,
    setTotalSteps,
    isPlaying,
    togglePlay,
    speed,
    setSpeed,
  } = useStepperStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTotalSteps(stepperData.steps.length);
    setStep(0);
  }, [setStep, setTotalSteps, stepperData.steps.length]);

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const store = useStepperStore.getState();
      if (store.currentStep >= store.totalSteps - 1) {
        store.togglePlay();
      } else {
        store.nextStep();
      }
    }, 1200 / speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed]);

  const step = stepperData.steps[currentStep];

  if (!step) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <DiagramRouter
        diagramType={stepperData.diagramType}
        cells={stepperData.array ?? []}
        diagramState={step.diagramState}
        left={(step.diagramState as Record<string, unknown>)?.left as number | undefined ?? -1}
        right={(step.diagramState as Record<string, unknown>)?.right as number | undefined ?? -1}
        windowStart={(step.diagramState as Record<string, unknown>)?.windowStart as number | undefined}
        windowEnd={(step.diagramState as Record<string, unknown>)?.windowEnd as number | undefined}
        highlighted={(step.diagramState as Record<string, unknown>)?.highlighted as number[] | undefined ?? []}
        comparing={(step.diagramState as Record<string, unknown>)?.comparing as number[] | undefined ?? []}
      />

      <p
        style={{
          fontFamily: 'var(--font-dmsans)',
          fontSize: 15,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          padding: '0 16px',
          minHeight: '44px',
        }}
      >
        {step.explanation}
      </p>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            aria-label="Previous step"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 12,
            }}
          >
            ← Prev
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(totalSteps - 1, 0)}
            step={1}
            value={currentStep}
            onChange={(event) => setStep(parseInt(event.target.value, 10))}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                nextStep();
              }
              if (event.key === 'ArrowLeft') {
                prevStep();
              }
            }}
            style={{ flex: 1, minWidth: '220px', accentColor: 'var(--accent-coral)' }}
            aria-label="Step through algorithm"
          />
          <button
            onClick={nextStep}
            disabled={currentStep === totalSteps - 1}
            aria-label="Next step"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'white',
              cursor: 'pointer',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 12,
            }}
          >
            Next →
          </button>
          <button
            onClick={togglePlay}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              background: isPlaying ? 'var(--accent-coral)' : 'white',
              color: isPlaying ? 'white' : 'var(--text-primary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 12,
            }}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        {/* Speed controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-dmmono)',
                fontSize: 11,
                fontWeight: speed === s ? 600 : 400,
                background: speed === s ? 'var(--accent-teal)' : 'transparent',
                color: speed === s ? 'white' : 'var(--text-muted)',
                border: speed === s ? '1px solid transparent' : '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {s}×
            </button>
          ))}
          <button
            onClick={() => { setStep(0); if (isPlaying) togglePlay(); }}
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-dmmono)',
              fontSize: 11,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ↺ Reset
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-dmmono)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          Step {currentStep + 1} of {totalSteps}
        </p>
      </div>

      <VariableStatePanel variables={step.variables} />

      {step.constraintValue !== undefined && step.constraintMax !== undefined && (
        <ConstraintGauge
          currentValue={step.constraintValue}
          maxValue={step.constraintMax}
          label={stepperData.constraintLabel || 'constraint'}
        />
      )}

      <CodeTabs code={code} renderedCode={renderedCode} activeLine={step.activeLine} />
    </div>
  );
}

export default StepperBlock;
