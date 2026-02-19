import { useProductivityTracker } from '@/hooks/useProductivityTracker';
import { AlertTriangle, MousePointer2, Keyboard, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export function ActivityWarningPopup() {
  const { activeWarning, warningMessage, dismissWarning } = useProductivityTracker();

  useEffect(() => {
    if (!activeWarning) return;

    const timer = setTimeout(() => {
      dismissWarning();
    }, 3000);

    return () => clearTimeout(timer);
  }, [activeWarning, dismissWarning]);

  if (!activeWarning) return null;

  const getIcon = () => {
    switch (activeWarning) {
      case 'mouseIdle':
        return <MousePointer2 className="h-5 w-5 text-yellow-600" />;
      case 'keyboardIdle':
        return <Keyboard className="h-5 w-5 text-yellow-600" />;
      case 'longKeyPress':
        return <Timer className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getTitle = () => {
    switch (activeWarning) {
      case 'mouseIdle':
        return 'Mouse Inactive';
      case 'keyboardIdle':
        return 'Keyboard Inactive';
      case 'longKeyPress':
        return 'Long Key Press';
      default:
        return 'Activity Warning';
    }
  };

  const getBgColor = () => {
    switch (activeWarning) {
      case 'longKeyPress':
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-yellow-50 border-yellow-300';
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${getBgColor()} border-b-2 shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white rounded-full shadow-sm animate-pulse">
              {getIcon()}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{getTitle()}</span>
              <span className="text-gray-600 text-sm">-</span>
              <span className="text-gray-600 text-sm">{warningMessage}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissWarning}
            className="h-8 px-3 text-black hover:text-gray-900 transition-all duration-300 backdrop-blur-[100px]"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          >
            <span className="mr-1">I'm Active</span>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
