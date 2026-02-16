import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Plus,
  Loader2,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { veilleIaApi, usersApi, type Department } from '@/lib/api';
import { FREQUENCY_LABELS } from './utils';

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
        name,
        description,
        prompt,
        frequency,
        departments: selectedDepartments,
        userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      }),
    onSuccess,
  });

  const toggleDepartment = (id: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Retour
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Nouvelle veille IA</h2>
          <p className="text-sm text-muted-foreground">
            Créez une veille automatique générée par Perplexity
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la veille</Label>
            <Input
              id="name"
              placeholder="ex: Veille Droit Social"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="ex: Actualités du droit social français"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt pour l'IA</Label>
            <Textarea
              id="prompt"
              placeholder="ex: Fais-moi une synthèse des dernières actualités en droit social français : jurisprudence, réformes législatives, décisions importantes..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Ce prompt sera envoyé à Perplexity pour générer le contenu de la veille.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fréquence</Label>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((freq) => (
                <Button
                  key={freq}
                  variant={frequency === freq ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFrequency(freq)}
                >
                  {FREQUENCY_LABELS[freq]}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pôles concernés</Label>
            <div className="grid grid-cols-2 gap-2">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={dept.id}
                    checked={selectedDepartments.includes(dept.id)}
                    onCheckedChange={() => toggleDepartment(dept.id)}
                  />
                  <Label htmlFor={dept.id} className="cursor-pointer">
                    {dept.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs spécifiques
            </Label>
            <p className="text-xs text-muted-foreground">
              En plus des pôles, vous pouvez cibler des utilisateurs individuels.
            </p>
            {orgUsers && orgUsers.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {orgUsers.map((u) => (
                  <div key={u.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${u.id}`}
                      checked={selectedUserIds.includes(u.id)}
                      onCheckedChange={() => toggleUser(u.id)}
                    />
                    <Label htmlFor={`user-${u.id}`} className="cursor-pointer text-sm">
                      {u.firstName} {u.lastName}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Chargement...</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !name ||
                !description ||
                !prompt ||
                (selectedDepartments.length === 0 && selectedUserIds.length === 0) ||
                createMutation.isPending
              }
              className="flex-1"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Créer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
