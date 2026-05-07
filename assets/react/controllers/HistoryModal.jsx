import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function HistoryModal({ isOpen, onClose, onLoadHistory }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    } else {
      setHistory([]);
      setError(null);
    }
  }, [isOpen, user]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to fetch history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadHistory = async (historyId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await fetch(`/api/history/${historyId}/load`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Appeler la fonction parent pour mettre à jour les logs
        await onLoadHistory(data.logs);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        setError(errorData.message || 'Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      setError('Failed to load history. Please try again.');
    }
  };

  const handleDownloadHistory = async (historyId, filename) => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await fetch(`/api/history/${historyId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      setError(errorData.message || 'Failed to download history');
    }
  } catch (error) {
    console.error('Error downloading history:', error);
    setError('Failed to download history. Please try again.');
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-4xl shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-5xl text-white font-medium">History</h2>
          <button 
            onClick={onClose}
            className="text-white text-3xl hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={fetchHistory}
              className="ml-2 underline hover:text-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-white text-3xl text-center py-8">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-white text-2xl text-center py-8">
            {error ? 'No history available' : 'No history found'}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-3xl text-white/80">Filename</th>
                  <th className="px-6 py-3 text-left text-3xl text-white/80">Date</th>
                  <th className="px-6 py-3 text-left text-3xl text-white/80">Log Entries</th>
                  <th className="px-6 py-3 text-left text-3xl text-white/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white text-2xl truncate max-w-xs" title={item.filename}>
                        {item.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white text-2xl">{item.uploadedAt}</td>
                    <td className="px-6 py-4 text-white text-2xl">{item.logCount}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleLoadHistory(item.id)}
                        className="glass-button text-white px-4 py-2 rounded-lg text-2xl hover:bg-white/20 transition-all duration-200 hover:scale-105"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDownloadHistory(item.id, item.filename)}
                        className="glass-button text-white px-4 py-2 rounded-lg text-2xl hover:bg-white/20 transition-all duration-200 hover:scale-105 ml-4"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}