'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { getCurrentTier, hasFeature } from '@/lib/entitlements-adapter';

interface PickItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  location: string;
  picked: boolean;
}

export default function VoicePickingPage() {
  const [isListening, setIsListening] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const [currentItem, setCurrentItem] = useState<PickItem | null>(null);
  const [pickedItems, setPickedItems] = useState<PickItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const tier = getCurrentTier();
  const hasVoicePicking = tier === 'standard' || tier === 'pro' || tier === 'enterprise';

  // Mock picking list - in real app this would come from API
  const mockPickingList: PickItem[] = [
    { id: '1', productName: 'Widget A', sku: 'WGT-A-001', quantity: 5, location: 'Aisle 3, Shelf B', picked: false },
    { id: '2', productName: 'Gadget B', sku: 'GDT-B-002', quantity: 3, location: 'Aisle 5, Shelf C', picked: false },
    { id: '3', productName: 'Tool C', sku: 'TOOL-C-003', quantity: 2, location: 'Aisle 2, Shelf A', picked: false },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          handleVoiceCommand(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (synthRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      synthRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command:', command);

    if (command.includes('yes') || command.includes('confirm') || command.includes('picked')) {
      if (currentItem) {
        // Mark current item as picked
        setPickedItems(prev => [...prev, { ...currentItem, picked: true }]);
        speak(`Item ${currentItem.productName} confirmed as picked.`);
        setCurrentItem(null);
        setCurrentInstruction('');

        // Move to next item
        const nextItem = mockPickingList.find(item =>
          !pickedItems.some(picked => picked.id === item.id) && item.id !== currentItem.id
        );
        if (nextItem) {
          setTimeout(() => {
            giveNextInstruction(nextItem);
          }, 1000);
        } else {
          speak('All items have been picked. Session complete.');
        }
      }
    } else if (command.includes('no') || command.includes('skip') || command.includes('next')) {
      speak('Moving to next item.');
      const nextItem = mockPickingList.find(item =>
        !pickedItems.some(picked => picked.id === item.id)
      );
      if (nextItem) {
        setTimeout(() => {
          giveNextInstruction(nextItem);
        }, 1000);
      }
    } else if (command.includes('repeat') || command.includes('again')) {
      if (currentItem) {
        giveNextInstruction(currentItem);
      }
    } else if (command.includes('stop') || command.includes('cancel')) {
      speak('Voice picking session ended.');
      setCurrentItem(null);
      setCurrentInstruction('');
    }
  };

  const giveNextInstruction = (item: PickItem) => {
    setCurrentItem(item);
    const instruction = `Pick ${item.quantity} ${item.productName} from ${item.location}. Say yes when picked or no to skip.`;
    setCurrentInstruction(instruction);
    speak(instruction);
  };

  const startPickingSession = () => {
    const firstItem = mockPickingList[0];
    if (firstItem) {
      giveNextInstruction(firstItem);
    }
  };

  if (!hasVoicePicking) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Voice Picking</h1>
        <div className="rounded-lg bg-amber-50 p-4 text-amber-700">
          <p className="font-medium">Feature Unavailable</p>
          <p className="text-sm mt-1">Voice picking is currently not available. Please check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Voice Picking</h1>
        <div className="text-sm text-gray-500">
          Status: {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Ready'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice Control Panel */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium mb-3">Voice Controls</h2>
            <div className="space-y-3">
              <button
                onClick={startPickingSession}
                disabled={currentItem !== null}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {currentItem ? 'Session Active' : 'Start Picking Session'}
              </button>

              <button
                onClick={startListening}
                disabled={!currentItem || isListening}
                className="w-full btn btn-secondary disabled:opacity-50"
              >
                {isListening ? 'Listening...' : 'Voice Command'}
              </button>

              <div className="text-sm text-gray-600">
                <p><strong>Commands:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>"Yes" or "Confirm" - Mark item as picked</li>
                  <li>"No" or "Skip" - Move to next item</li>
                  <li>"Repeat" - Repeat current instruction</li>
                  <li>"Stop" - End session</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Current Instruction */}
          {currentInstruction && (
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900 mb-2">Current Instruction</h3>
              <p className="text-blue-800">{currentInstruction}</p>
            </div>
          )}
        </div>

        {/* Picking Progress */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium mb-3">Picking Progress</h2>
            <div className="space-y-2">
              {mockPickingList.map((item) => {
                const isPicked = pickedItems.some(picked => picked.id === item.id);
                const isCurrent = currentItem?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded border ${
                      isPicked ? 'bg-green-50 border-green-200' :
                      isCurrent ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-gray-600">SKU: {item.sku} | Qty: {item.quantity}</p>
                        <p className="text-sm text-gray-600">Location: {item.location}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        isPicked ? 'bg-green-100 text-green-800' :
                        isCurrent ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {isPicked ? 'Picked' : isCurrent ? 'Current' : 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Session Summary */}
          <div className="rounded-lg border p-4">
            <h2 className="font-medium mb-3">Session Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{pickedItems.length}</div>
                <div className="text-sm text-gray-600">Items Picked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {mockPickingList.length - pickedItems.length}
                </div>
                <div className="text-sm text-gray-600">Items Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};