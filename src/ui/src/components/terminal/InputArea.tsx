import React from 'react';
import { Play } from 'lucide-react';
import { Button } from '../common/Button';

interface InputAreaProps {
  input: string;
  setInput: (val: string) => void;
  handleSend: (e: React.FormEvent | null) => void;
  connected: boolean;
  t: any;
}

export const InputArea: React.FC<InputAreaProps> = ({ input, setInput, handleSend, connected, t }) => {
  return (
    <div className="p-4 border-t border-white/10 bg-black/20">
      <form onSubmit={handleSend} className="flex gap-3">
        <div className="flex-1 relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(null);
              }
            }}
            placeholder={t.placeholder}
            className="w-full glass-input rounded-xl py-3 px-4 text-base text-white resize-none h-20 bg-black/40 border border-white/10 focus:border-emerald-500 transition-all duration-300 ease-out"
          />
        </div>
        <div className="flex flex-col gap-2 w-32">
          <Button 
            type="submit" 
            disabled={!connected}
            icon={<Play size={16} />}
            className="flex-1"
          >
            {t.send}
          </Button>
          <Button 
            type="button"
            variant="secondary"
            onClick={() => setInput('')}
            className="py-2"
          >
            {t.clear}
          </Button>
        </div>
      </form>
    </div>
  );
};
