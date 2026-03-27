import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Rss, Brain } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { RssSection } from './veille/RssSection';
import { VeilleIaSection } from './veille/VeilleIaSection';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
};

export function Veille() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'ia' ? 'ia' : 'rss';
  const [activeTab, setActiveTab] = useState<'rss' | 'ia'>(initialTab);

  const tabs = [
    { id: 'rss' as const, label: 'Flux RSS', icon: Rss },
    { id: 'ia' as const, label: 'Veille IA', icon: Brain },
  ];

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
    >
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-semibold tracking-tight">Veille</h1>
      </motion.div>

      {/* Tab switcher */}
      <motion.div variants={fadeUp} className="flex gap-1" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              activeTab === id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
            {label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeUp}>
        {activeTab === 'rss' ? <RssSection /> : <VeilleIaSection isAdmin={isAdmin} />}
      </motion.div>
    </motion.div>
  );
}
