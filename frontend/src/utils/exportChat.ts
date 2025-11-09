import type { Conversation } from '@/types';

export function exportAsJSON(conversation: Conversation): void {
  const dataStr = JSON.stringify(conversation, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  downloadFile(dataBlob, `conversation-${conversation.id}.json`);
}

export function exportAsMarkdown(conversation: Conversation): void {
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Created:** ${new Date(conversation.created_at).toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  conversation.messages.forEach((message, index) => {
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `## ${role}\n\n`;
    markdown += `${message.content}\n\n`;

    if (message.sources && message.sources.length > 0) {
      markdown += `**Sources:**\n`;
      message.sources.forEach((source) => {
        markdown += `- ${source.filename}\n`;
      });
      markdown += `\n`;
    }

    if (index < conversation.messages.length - 1) {
      markdown += `---\n\n`;
    }
  });

  const dataBlob = new Blob([markdown], { type: 'text/markdown' });
  downloadFile(dataBlob, `conversation-${conversation.id}.md`);
}

export function exportAsText(conversation: Conversation): void {
  let text = `${conversation.title}\n`;
  text += `Created: ${new Date(conversation.created_at).toLocaleString()}\n`;
  text += `${'='.repeat(50)}\n\n`;

  conversation.messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'USER' : 'ASSISTANT';
    text += `[${role}]\n`;
    text += `${message.content}\n\n`;

    if (message.sources && message.sources.length > 0) {
      text += `Sources:\n`;
      message.sources.forEach((source) => {
        text += `  - ${source.filename}\n`;
      });
      text += `\n`;
    }

    if (index < conversation.messages.length - 1) {
      text += `${'-'.repeat(50)}\n\n`;
    }
  });

  const dataBlob = new Blob([text], { type: 'text/plain' });
  downloadFile(dataBlob, `conversation-${conversation.id}.txt`);
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
