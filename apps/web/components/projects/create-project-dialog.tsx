'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@flowline/ui';
import { FolderPlus, X, AlertCircle, Sparkles } from 'lucide-react';
import { apiClient } from '../../lib/api/client';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export function CreateProjectDialog({ isOpen, onClose }: CreateProjectDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 4) {
      const derivedKey = val
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase();
      setKey(derivedKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) {
      setError('Project name and key are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const project = await apiClient('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim(),
          color,
        }),
      });

      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      router.push(`/projects/${project.key || project.id}/board`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="relative w-full max-w-lg border-border bg-card shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs mb-1">
            <Sparkles className="h-4 w-4" />
            <span>New Workspace Project</span>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">Create Project</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Set up an agile engineering board with automated backlog and sprint tracking.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Project Name</label>
              <Input
                placeholder="e.g. Core API Service"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Key Prefix</label>
                <Input
                  placeholder="e.g. CORE"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                  className="text-xs uppercase font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Used for issue keys (e.g. {key || 'PROJ'}-1)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Accent Color</label>
                <div className="flex items-center gap-1.5 pt-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-card' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Description (Optional)</label>
              <Input
                placeholder="Primary backend synchronization engine"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold gap-1.5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <FolderPlus className="h-3.5 w-3.5" />
                    Create Project
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
