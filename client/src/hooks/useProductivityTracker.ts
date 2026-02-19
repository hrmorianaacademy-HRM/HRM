import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

type ProductivityEvent = {
  eventType: 'mouseIdleWarning' | 'keyboardIdleWarning' | 'longKeyPressWarning' | 'tabSwitch';
  metadata?: {
    url?: string;
    fromUrl?: string;
    key?: string;
    duration?: number;
    browserInfo?: string;
  };
};

type WarningType = 'mouseIdle' | 'keyboardIdle' | 'longKeyPress' | null;

const MOUSE_IDLE_TIMEOUT = 30000; // 30 seconds for testing
const KEYBOARD_IDLE_TIMEOUT = 30000; // 30 seconds for testing
const LONG_KEY_PRESS_THRESHOLD = 3000; // 3 seconds
const EVENT_BATCH_INTERVAL = 10000; // 10 seconds

export function useProductivityTracker() {
  const { user, isAuthenticated } = useAuth();
  const [activeWarning, setActiveWarning] = useState<WarningType>(null);
  const [warningMessage, setWarningMessage] = useState<string>('');
  
  const mouseIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyPressStartTime = useRef<Map<string, number>>(new Map());
  const eventQueue = useRef<ProductivityEvent[]>([]);
  const batchTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabSwitchStartTime = useRef<number | null>(null);
  const tabSwitchFromUrl = useRef<string | null>(null);
  const activeWarningRef = useRef<WarningType>(null);
  const isSetup = useRef(false);

  const userRole = (user as any)?.role;
  const userId = (user as any)?.id;
  const shouldTrack = isAuthenticated && (userRole === 'hr' || userRole === 'tech-support');

  const getBrowserInfo = () => {
    return navigator.userAgent;
  };

  const sendEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    
    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];
    
    try {
      console.log('Sending productivity events:', eventsToSend);
      const response = await fetch('/api/productivity/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ events: eventsToSend })
      });
      if (!response.ok) {
        console.error('Failed to send productivity events:', response.status);
        eventQueue.current.push(...eventsToSend);
      } else {
        console.log('Productivity events sent successfully');
      }
    } catch (error) {
      console.error('Failed to send productivity events:', error);
      eventQueue.current.push(...eventsToSend);
    }
  }, []);

  const queueEvent = useCallback((event: ProductivityEvent) => {
    console.log('Queuing productivity event:', event.eventType);
    eventQueue.current.push({
      ...event,
      metadata: {
        ...event.metadata,
        browserInfo: getBrowserInfo()
      }
    });
  }, []);

  const dismissWarning = useCallback(() => {
    activeWarningRef.current = null;
    setActiveWarning(null);
    setWarningMessage('');
  }, []);

  useEffect(() => {
    if (!shouldTrack || !userId) {
      console.log('Productivity tracking not enabled - shouldTrack:', shouldTrack, 'userId:', userId, 'userRole:', userRole);
      return;
    }

    if (isSetup.current) {
      console.log('Productivity tracking already set up, skipping');
      return;
    }

    console.log('✅ Setting up productivity tracking for role:', userRole, 'userId:', userId);
    isSetup.current = true;

    const showWarning = (type: WarningType, message: string) => {
      console.log('🚨 Showing warning:', type, message);
      activeWarningRef.current = type;
      setActiveWarning(type);
      setWarningMessage(message);
    };

    const resetMouseIdleTimer = () => {
      if (mouseIdleTimer.current) {
        clearTimeout(mouseIdleTimer.current);
      }
      if (activeWarningRef.current === 'mouseIdle') {
        activeWarningRef.current = null;
        setActiveWarning(null);
        setWarningMessage('');
      }
      mouseIdleTimer.current = setTimeout(() => {
        console.log('⏰ Mouse idle timeout triggered!');
        showWarning('mouseIdle', 'You have been inactive for 30 seconds.');
        queueEvent({ eventType: 'mouseIdleWarning' });
      }, MOUSE_IDLE_TIMEOUT);
    };

    const resetKeyboardIdleTimer = () => {
      if (keyboardIdleTimer.current) {
        clearTimeout(keyboardIdleTimer.current);
      }
      if (activeWarningRef.current === 'keyboardIdle') {
        activeWarningRef.current = null;
        setActiveWarning(null);
        setWarningMessage('');
      }
      keyboardIdleTimer.current = setTimeout(() => {
        console.log('⏰ Keyboard idle timeout triggered!');
        showWarning('keyboardIdle', 'Keyboard inactive warning');
        queueEvent({ eventType: 'keyboardIdleWarning' });
      }, KEYBOARD_IDLE_TIMEOUT);
    };

    const handleMouseMove = () => {
      resetMouseIdleTimer();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      resetKeyboardIdleTimer();
      
      if (!keyPressStartTime.current.has(e.key)) {
        keyPressStartTime.current.set(e.key, Date.now());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const startTime = keyPressStartTime.current.get(e.key);
      if (startTime) {
        const duration = Date.now() - startTime;
        keyPressStartTime.current.delete(e.key);
        
        if (duration >= LONG_KEY_PRESS_THRESHOLD) {
          console.log('⌨️ Long key press detected:', e.key, duration, 'ms');
          showWarning('longKeyPress', `Long key press detected (${e.key}).`);
          queueEvent({ 
            eventType: 'longKeyPressWarning', 
            metadata: { key: e.key, duration } 
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchStartTime.current = Date.now();
        tabSwitchFromUrl.current = window.location.href;
        console.log('📑 Tab switched away from:', window.location.href);
      } else {
        const duration = tabSwitchStartTime.current 
          ? Math.round((Date.now() - tabSwitchStartTime.current) / 1000) 
          : 0;
        const fromUrl = tabSwitchFromUrl.current || 'Unknown';
        tabSwitchStartTime.current = null;
        tabSwitchFromUrl.current = null;
        
        queueEvent({ 
          eventType: 'tabSwitch', 
          metadata: { 
            url: 'Switched to another tab/app',
            fromUrl: fromUrl,
            duration 
          } 
        });
        console.log('📑 Tab switched back, was away for:', duration, 'seconds, from:', fromUrl);
      }
    };

    const handleBlur = () => {
      console.log('🪟 Window lost focus from:', window.location.href);
      tabSwitchStartTime.current = Date.now();
      tabSwitchFromUrl.current = window.location.href;
    };

    const handleFocus = () => {
      if (tabSwitchStartTime.current) {
        const duration = Math.round((Date.now() - tabSwitchStartTime.current) / 1000);
        const fromUrl = tabSwitchFromUrl.current || 'Unknown';
        tabSwitchStartTime.current = null;
        tabSwitchFromUrl.current = null;
        
        queueEvent({ 
          eventType: 'tabSwitch', 
          metadata: { 
            url: 'Window lost focus',
            fromUrl: fromUrl,
            duration 
          } 
        });
        console.log('🪟 Window regained focus, away for:', duration, 'seconds, from:', fromUrl);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    resetMouseIdleTimer();
    resetKeyboardIdleTimer();

    batchTimer.current = setInterval(sendEvents, EVENT_BATCH_INTERVAL);

    console.log('✅ Productivity tracking fully initialized - timers started');

    return () => {
      console.log('🧹 Cleaning up productivity tracking');
      isSetup.current = false;
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);

      if (mouseIdleTimer.current) clearTimeout(mouseIdleTimer.current);
      if (keyboardIdleTimer.current) clearTimeout(keyboardIdleTimer.current);
      if (batchTimer.current) clearInterval(batchTimer.current);

      sendEvents();
    };
  }, [shouldTrack, userId, userRole, queueEvent, sendEvents]);

  return {
    activeWarning,
    warningMessage,
    dismissWarning,
    isTracking: shouldTrack && !!userId
  };
}
