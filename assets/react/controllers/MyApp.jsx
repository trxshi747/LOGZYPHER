import Header from "./Header.jsx"
import Logs from "./Logs.jsx"
import Background from "./Background.jsx"
import { AuthProvider } from "./AuthContext"
import { useState } from "react"

export default function MyApp(){
    const [historyLoaded, setHistoryLoaded] = useState(0);

    const handleHistoryLoaded = async () => {
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
                        <Logs key={historyLoaded} onHistoryLoaded={handleHistoryLoaded} />
                    </div>
                </div>
            </div>  
        </AuthProvider>   
    )
}