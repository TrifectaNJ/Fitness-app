import React from 'react';
import { supabase } from '@/lib/supabase';

interface ComponentStyles {
  fontSize?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderStyle?: string;
  borderColor?: string;
  borderWidth?: string;
  width?: string;
  height?: string;
}

interface PageElement {
  id: string;
  pageKey: string;
  type: 'text' | 'button' | 'input' | 'container' | 'image' | 'heading';
  content: string;
  styles: ComponentStyles;
  position: { x: number; y: number };
  visible: boolean;
  order: number;
}

interface StyleableComponentProps {
  pageKey: string;
  children: React.ReactNode;
  className?: string;
}

const StyleableComponent: React.FC<StyleableComponentProps> = ({ 
  pageKey, 
  children, 
  className = '' 
}) => {
  const [elements, setElements] = React.useState<PageElement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const mountedRef = React.useRef(true);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    mountedRef.current = true;
    
    // Delay the request slightly to not compete with critical auth requests
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        loadPageElements();
      }
    }, 100);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pageKey]);

  const loadPageElements = async () => {
    // Skip if component is unmounted
    if (!mountedRef.current) return;
    
    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const { data, error } = await supabase
        .from('page_elements')
        .select('*')
        .eq('page_key', pageKey)
        .eq('visible', true)
        .order('order_index')
        .abortSignal(abortControllerRef.current.signal);

      if (!mountedRef.current) return;

      if (error) {
        // Silently fail for non-critical page elements
        console.warn('Failed to load page elements (non-critical):', error.message);
        return;
      }

      const loadedElements: PageElement[] = (data || []).map(item => ({
        id: item.id,
        pageKey: item.page_key,
        type: item.element_type,
        content: item.content,
        styles: item.styles || {},
        position: item.position || { x: 0, y: 0 },
        visible: item.visible ?? true,
        order: item.order_index || 0
      }));

      setElements(loadedElements);
    } catch (error: any) {
      // Handle all errors gracefully - this is non-critical functionality
      if (error?.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }
      
      const message = error?.message?.toLowerCase() || '';
      
      if (message.includes('timeout')) {
        console.warn('Page elements request timed out (non-critical)');
      } else if (message.includes('failed to fetch') || message.includes('network') || message.includes('unable to connect')) {
        console.warn('Network error loading page elements (non-critical)');
      } else {
        console.warn('Error loading page elements (non-critical):', error?.message || error);
      }
      // Don't block the UI - just continue without custom elements
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const renderElement = (element: PageElement) => {
    const style: React.CSSProperties = {
      ...element.styles,
      position: 'absolute',
      left: element.position.x,
      top: element.position.y,
      zIndex: 10
    };

    switch (element.type) {
      case 'heading':
        return (
          <h2 key={element.id} style={style} className="font-bold">
            {element.content}
          </h2>
        );
      case 'text':
        return (
          <p key={element.id} style={style}>
            {element.content}
          </p>
        );
      case 'button':
        return (
          <button key={element.id} style={style} className="cursor-pointer">
            {element.content}
          </button>
        );
      case 'input':
        return (
          <input 
            key={element.id} 
            style={style} 
            placeholder={element.content}
            className="border"
          />
        );
      case 'container':
        return (
          <div key={element.id} style={style} className="border border-dashed border-gray-300">
            {element.content || 'Container'}
          </div>
        );
      case 'image':
        return (
          <div key={element.id} style={style} className="bg-gray-200 flex items-center justify-center">
            {element.content || 'Image'}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      {!isLoading && elements.map(renderElement)}
    </div>
  );
};

export default StyleableComponent;
