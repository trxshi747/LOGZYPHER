import TextAnimation from "./TextAnimation.jsx"
import ImageAnimation from "./ImageAnimation.jsx"
import logo from "../../images/logo.png";
import AuthModal from './AuthModal';
import HistoryModal from './HistoryModal';
import {useState} from "react";
import { useAuth } from './AuthContext';

export default function Header({ onHistoryLoaded }){
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const { user, logout } = useAuth();

    const handleLoadHistory = async (logs) => {
        // Appeler la fonction parent pour recharger les logs
        if (onHistoryLoaded) {
            await onHistoryLoaded(logs);
        }
    };

    return (
        <header className="mb-8 flex flex-col items-center relative">
            <div className="absolute top-0 right-0 mt-4 mr-4">
                <a 
                    href="https://www.instagram.com/yassirkarrouti/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-12 h-12 rounded-full glass-button border border-white/30 text-white text-3xl transition-all duration-300 hover:scale-110 hover:bg-white/20 shadow-lg"
                    title="Follow me on Instagram"
                >
                    <i className="fab fa-instagram"></i>
                </a>
            </div>
            <div className="flex justify-center w-full mb-6 mt-10">
                <TextAnimation fontSize={120} fontWeight={120}>LOGZYPHER</TextAnimation>
            </div>
             <div className="flex justify-center w-full mb-8">
                <ImageAnimation 
                    src={logo} 
                    baseIntensity={0.03}
                    hoverIntensity={0.25}
                    width={327}
                    height={118}
                    className="cursor-pointer -mr-1"
                />
            </div>
             <div className="flex justify-center w-full mb-18">
                <TextAnimation fontSize={50} fontWeight={100}>Analyze and monitor your application logs</TextAnimation>
            </div>
            <div className="flex justify-center w-full mb-6">
                {user ? (
                    <div className="flex items-center gap-2">
                        <span>
                            <button 
                                onClick={() => setIsHistoryModalOpen(true)}
                                className="mr-2 flex justify-center w-full px-3 py-3 rounded-lg border border-white/30 transition-all duration-200 hover:scale-105 glass-button text-white text-2xl hover:text-white hover:bg-white/15 hover:border-white/40 shadow-lg"
                            >
                                <TextAnimation fontSize={30} fontWeight={180}>History</TextAnimation>
                            </button>
                        </span>
                        <span>
                            <button 
                                onClick={logout}
                                className="ml-2 flex justify-center w-full px-3 py-3 rounded-lg border border-white/30 transition-all duration-200 hover:scale-105 glass-button text-white text-2xl hover:text-white hover:bg-white/15 hover:border-white/40 shadow-lg"
                            >
                                <TextAnimation fontSize={30} fontWeight={180}>Logout</TextAnimation>
                            </button>
                        </span>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-center w-full mb-9">
                            <TextAnimation fontSize={40} fontWeight={100}>Join us to save your analyzed logs</TextAnimation>
                        </div>
                        <button 
                            onClick={() => setIsAuthModalOpen(true)}
                            className="flex justify-center w-full px-3 py-3 rounded-lg border border-white/30 transition-all duration-200 hover:scale-105 glass-button text-white text-2xl hover:text-white hover:bg-white/15 hover:border-white/40 shadow-lg"
                        >
                            <TextAnimation fontSize={30} fontWeight={180}>Login / Register</TextAnimation>
                        </button>
                    </div>
                )}
            </div>

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
            <HistoryModal 
                isOpen={isHistoryModalOpen} 
                onClose={() => setIsHistoryModalOpen(false)}
                onLoadHistory={handleLoadHistory}
            />
        </header>
    )
}