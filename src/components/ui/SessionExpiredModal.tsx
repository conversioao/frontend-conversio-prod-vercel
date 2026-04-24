import React from 'react';
import { LogOut, AlertCircle } from 'lucide-react';

interface SessionExpiredModalProps {
    isOpen: boolean;
    onLoginAgain: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ isOpen, onLoginAgain }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden glass-morphism animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-amber-500/10 text-amber-500">
                        <AlertCircle size={32} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-2">Sessão Expirada</h2>
                    <p className="text-zinc-400 mb-8">
                        Para sua segurança, a sua sessão terminou. Por favor, faça login novamente para continuar a utilizar o Conversio.AI.
                    </p>

                    <button
                        onClick={onLoginAgain}
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                    >
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                        Logar Novamente
                    </button>
                </div>
                
                <div className="px-8 py-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-center">
                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Conversio.AI Security</span>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .glass-morphism {
                    background: rgba(18, 18, 18, 0.8);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
            `}} />
        </div>
    );
};

export default SessionExpiredModal;
