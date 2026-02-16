export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  biweekly: 'Bi-hebdomadaire',
  monthly: 'Mensuel',
};

export function markdownToHtml(markdown: string): string {
  // Enhanced markdown to HTML conversion for newsletter format
  return markdown
    // Headers with emojis
    .replace(/^### (\d+)\. (.+)$/gim, '<h3 class="text-base font-semibold mt-6 mb-2 flex items-center gap-2"><span class="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">$1</span>$2</h3>')
    .replace(/^## 📰 (.+)$/gim, '<h2 class="text-lg font-bold mb-4 pb-2 border-b flex items-center gap-2">📰 $1</h2>')
    .replace(/^## 📋 (.+)$/gim, '<h2 class="text-lg font-bold mt-6 mb-3 pb-2 border-b flex items-center gap-2">📋 $1</h2>')
    .replace(/^## 🔗 (.+)$/gim, '<h2 class="text-lg font-bold mt-6 mb-3 pb-2 border-b flex items-center gap-2">🔗 $1</h2>')
    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-4">$1</h1>')
    // Metadata fields
    .replace(/\*\*📅 Date\*\* : (.+)/gim, '<div class="text-xs text-muted-foreground mb-1">📅 $1</div>')
    .replace(/\*\*🏷️ Catégorie\*\* : (.+)/gim, '<span class="inline-block px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full mb-2">🏷️ $1</span>')
    .replace(/\*\*🔗 Source\*\* : (.+)/gim, '<div class="text-xs mt-2 text-muted-foreground">🔗 $1</div>')
    // Bold and italic
    .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Lists
    .replace(/^[-•] (.+)$/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^(\d+)\. (?!<)(.+)$/gim, '<li class="ml-4 mb-1"><span class="font-medium">$1.</span> $2</li>')
    // Horizontal rules
    .replace(/^---+$/gim, '<hr class="my-4 border-border" />')
    // Line breaks
    .replace(/\n\n/gim, '</p><p class="mb-3">')
    .replace(/\n/gim, '<br />');
}
