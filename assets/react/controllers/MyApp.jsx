import Header from "./Header.jsx"
import Logs from "./Logs.jsx"
import Background from "./Background.jsx"
import WelcomeModal from "./WelcomeModal.jsx"
import { AuthProvider } from "./AuthContext"
import { useState, useEffect } from "react"
import { Analytics } from "@vercel/analytics/react"

export default function MyApp(){
    const [historyLoaded, setHistoryLoaded] = useState(0);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

    const closeWelcome = () => {
        setIsWelcomeOpen(false);
    };

    const [historyLogs, setHistoryLogs] = useState(null);

    const handleHistoryLoaded = async (logs) => {
        if (logs) {
            setHistoryLogs(logs);
        }
        // Incrémenter un compteur pour forcer le re-render
        setHistoryLoaded(prev => prev + 1);
    };

    return (
        <AuthProvider>
          <div>
                <div className="min-h-screen">
                    <div style={{ inset: '0', width: '100vw', height: '100vh', position: 'fixed', zIndex: '-1' }}>
                        <Background />
                    </div>
                    <div className="container mx-auto px-4 py-8">
                        <Header onHistoryLoaded={handleHistoryLoaded} />
                        <Logs key={historyLoaded} onHistoryLoaded={handleHistoryLoaded} initialLogs={historyLogs} />
                    </div>
                </div>
                <WelcomeModal isOpen={isWelcomeOpen} onClose={closeWelcome} />
                <Analytics />
            </div>  
        </AuthProvider>   
    )
}