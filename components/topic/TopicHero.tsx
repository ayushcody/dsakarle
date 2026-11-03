'use client';
import { motion } from 'framer-motion';

interface TopicHeroProps {
  slug: string;
  title: string;
  analogy?: string;
  analogyIcon?: string;
  /** Set false when the page already renders the topic's <h1> elsewhere (e.g. HeroBlock). */
  showTitle?: boolean;
}

const HERO_CONFIGS: Record<string, { render: () => React.JSX.Element; bg: string }> = {
  'arrays': {
    bg: 'linear-gradient(135deg, color-mix(in srgb, var(--role-ptr-b) 6%, transparent), color-mix(in srgb, var(--role-ptr-b) 12%, transparent))',
    render: () => <ArrayHero />,
  },
  'stacks': {
    bg: 'linear-gradient(135deg, color-mix(in srgb, var(--amber) 6%, transparent), color-mix(in srgb, var(--amber) 12%, transparent))',
    render: () => <StackHero />,
  },
  'queues': {
    bg: 'linear-gradient(135deg, color-mix(in srgb, var(--teal) 6%, transparent), color-mix(in srgb, var(--teal) 12%, transparent))',
    render: () => <QueueHero />,
  },
  'linked-lists': {
    bg: 'linear-gradient(135deg, color-mix(in srgb, var(--coral) 6%, transparent), color-mix(in srgb, var(--coral) 12%, transparent))',
    render: () => <LinkedListHero />,
  },
};

export function TopicHero({ slug, title, analogy, analogyIcon, showTitle = true }: TopicHeroProps) {
  const config = HERO_CONFIGS[slug];

  return (
    <div style={{
      borderRadius: 16,
      background: config?.bg ?? 'var(--paper-sunken)',
      padding: 32,
      marginBottom: 8,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
        alignItems: 'center',
      }}>
        {/* Left: Title + Analogy */}
        <div>
          {showTitle && (
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 36,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
              lineHeight: 1.2,
            }}>
              {title}
            </h1>
          )}
          {analogy && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: 'color-mix(in srgb, var(--paper-raised) 70%, transparent)',
              borderRadius: 12,
              padding: 16,
              marginTop: showTitle ? 16 : 0,
            }}>
              <span style={{ fontSize: 24 }}>{analogyIcon ?? '💡'}</span>
              <p style={{
                fontFamily: 'var(--font-dmsans)',
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                fontWeight: 500,
                margin: 0,
              }}>
                {analogy}
              </p>
            </div>
          )}
        </div>
        {/* Right: Animated diagram */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
          {config?.render() ?? <GenericHero />}
        </div>
      </div>
    </div>
  );
}

function ArrayHero() {
  const values = [12, 5, 8, 3, 17];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: 'var(--role-ptr-b)',
            color: 'var(--paper-raised)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-dmmono)',
            fontWeight: 700,
            fontSize: 18,
            boxShadow: 'var(--shadow-2)',
          }}>
            {v}
          </div>
          <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 10, color: 'var(--text-muted)' }}>[{i}]</span>
        </motion.div>
      ))}
    </div>
  );
}

function StackHero() {
  const items = ['TOP →', '...', '...', 'BOTTOM'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6 }}>
      {items.map((label, i) => (
        <motion.div
          key={i}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            width: 160,
            height: 40,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-dmmono)',
            fontSize: 13,
            fontWeight: 700,
            border: i === items.length - 1 ? '2px solid var(--accent-coral)' : '1px solid var(--border)',
            background: i === items.length - 1 ? 'var(--accent-coral)' : 'var(--paper-raised)',
            color: i === items.length - 1 ? 'var(--paper-raised)' : 'var(--text-secondary)',
            boxShadow: 'var(--shadow-1)',
          }}
        >
          {label}
        </motion.div>
      ))}
    </div>
  );
}

function QueueHero() {
  const items = ['🟢', '🟡', '🟠', '🔴'];
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--bg-secondary)',
      borderRadius: 999,
      padding: '8px 16px',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>OUT ←</span>
      {items.map((emoji, i) => (
        <motion.div
          key={i}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.12, type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--paper-raised)',
            boxShadow: 'var(--shadow-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          {emoji}
        </motion.div>
      ))}
      <span style={{ fontFamily: 'var(--font-dmmono)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>→ IN</span>
    </div>
  );
}

function LinkedListHero() {
  const nodes = ['A', 'B', 'C', 'D'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {nodes.map((label, i) => (
        <motion.div key={i} style={{ display: 'flex', alignItems: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}>
          <motion.div
            whileHover={{ scale: 1.12, backgroundColor: 'var(--coral)', color: 'var(--paper-raised)' }}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--paper-raised)',
              border: '2px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-dmmono)',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow-1)',
              cursor: 'pointer',
              transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            {label}
          </motion.div>
          {i < nodes.length - 1 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.15 + 0.1, duration: 0.3 }}
              style={{
                transformOrigin: 'left',
                height: 2,
                width: 32,
                background: 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', right: -2, color: 'var(--text-muted)', fontSize: 12 }}>→</span>
            </motion.div>
          )}
        </motion.div>
      ))}
      <span style={{ marginLeft: 8, fontFamily: 'var(--font-dmmono)', fontSize: 13, color: 'var(--text-muted)' }}>NULL</span>
    </div>
  );
}

function GenericHero() {
  return (
    <div style={{
      width: 96,
      height: 96,
      borderRadius: 16,
      background: 'color-mix(in srgb, var(--paper-raised) 60%, transparent)',
      border: '2px dashed var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
    }}>
      🧩
    </div>
  );
}

export default TopicHero;
