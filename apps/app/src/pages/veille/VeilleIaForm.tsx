import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { veilleIaApi, usersApi, type Department } from '@/lib/api';
import { FREQUENCY_LABELS } from './utils';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
};

export function VeilleIaForm({
  departments,
  onCancel,
  onSuccess,
}: {
  departments: Department[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const { data: orgUsers } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      veilleIaApi.create({
        name, description, prompt, frequency,
        departments: selectedDepartments,
        userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      }),
    onSuccess,
    onError: (error) => {
      console.error('Veille IA creation failed:', error);
    },
  });

  const toggleDepartment = (id: string) => {
    setSelectedDepartments((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]);
  };

  return (
    <motion.div
      className="max-w-xl space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
    >
      {/* Back */}
      <motion.div variants={fadeUp}>
        <button onClick={onCancel} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Veilles IA
        </button>
      </motion.div>

      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-semibold tracking-tight">Nouvelle veille IA</h2>
        <p className="text-sm text-muted-foreground mt-1">Créez une veille automatique générée par Perplexity</p>
      </motion.div>

      {/* Form — flat, no card */}
      <motion.div variants={fadeUp} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[13px]">Nom</Label>
          <Input id="name" placeholder="ex: Veille Droit Social" value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-[13px]">Description</Label>
          <Input id="description" placeholder="ex: Actualites du droit social francais" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prompt" className="text-[13px]">Prompt pour l'IA</Label>
          <Textarea
            id="prompt"
            placeholder="ex: Fais-moi une synthèse des dernières actualités en droit social..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="text-[13px]"
          />
          <p className="text-[11px] text-muted-foreground/50">Ce prompt sera envoyé à Perplexity.</p>
        </div>

        <div className="space-y-2">
          <Label className="text-[13px]">Fréquence</Label>
          <div className="flex flex-wrap gap-1">
            {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((freq) => (
              <button
                key={freq}
                onClick={() => setFrequency(freq)}
                className={cn(
                  'px-3 py-1 text-[13px] font-medium rounded-md transition-colors duration-100',
                  frequency === freq ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {FREQUENCY_LABELS[freq]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[13px]">Pôles concernés</Label>
          <div className="grid grid-cols-2 gap-2">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center gap-2">
                <Checkbox id={dept.id} checked={selectedDepartments.includes(dept.id)} onCheckedChange={() => toggleDepartment(dept.id)} />
                <Label htmlFor={dept.id} className="text-[13px] cursor-pointer">{dept.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {orgUsers && orgUsers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[13px]">Utilisateurs spécifiques</Label>
            <p className="text-[11px] text-muted-foreground/50">En plus des pôles, ciblez des utilisateurs individuels.</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {orgUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <Checkbox id={`user-${u.id}`} checked={selectedUserIds.includes(u.id)} onCheckedChange={() => toggleUser(u.id)} />
                  <Label htmlFor={`user-${u.id}`} className="text-[13px] cursor-pointer">{u.firstName} {u.lastName}</Label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} size="sm" className="h-9">Annuler</Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!name || !description || !prompt || (selectedDepartments.length === 0 && selectedUserIds.length === 0) || createMutation.isPending}
            size="sm"
            className="h-9 gap-1.5"
          >
            {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {createMutation.isPending ? 'Création...' : 'Créer'}
          </Button>
        </div>
        {createMutation.isError && (
          <p className="text-[13px] text-destructive">La création a échoué. Vérifiez les champs et réessayez.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
