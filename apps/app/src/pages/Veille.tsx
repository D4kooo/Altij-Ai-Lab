import { useState } from 'react';
import { Rss, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { RssSection } from './veille/RssSection';
import { VeilleIaSection } from './veille/VeilleIaSection';

export function Veille() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [mainTab, setMainTab] = useState<'rss' | 'ia'>('rss');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Veille</h1>
        <p className="text-muted-foreground mt-1">
          Suivez l'actualité juridique via vos flux RSS et les veilles IA
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'rss' | 'ia')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rss" className="gap-2">
            <Rss className="h-4 w-4" />
            Flux RSS
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <Brain className="h-4 w-4" />
            Veille IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rss" className="mt-6">
          <RssSection />
        </TabsContent>

        <TabsContent value="ia" className="mt-6">
          <VeilleIaSection isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
