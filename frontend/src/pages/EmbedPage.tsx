import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatWidget from '@/components/ChatWidget';
import { ToastProvider } from '@/contexts/ToastContext';

// Create a separate query client for the embed page
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function EmbedPage() {
  // Read configuration from URL parameters
  const params = new URLSearchParams(window.location.search);
  const position = (params.get('position') as 'bottom-right' | 'bottom-left') || 'bottom-right';
  const primaryColor = params.get('color') || '#3b82f6';
  const title = params.get('title') || 'AI Support Chat';

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="min-h-screen bg-transparent">
          <ChatWidget
            position={position}
            primaryColor={primaryColor}
            title={title}
          />
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}
