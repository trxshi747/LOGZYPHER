import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, faSearch, faLayerGroup, 
  faExclamationCircle, faExclamationTriangle, 
  faInfoCircle, faBug, faList, faClock, 
  faChevronLeft, faChevronRight, faBugSlash,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from './AuthContext';
import "../../styles/app.css";

export default function Logs({ onHistoryLoaded, initialLogs }) {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState(initialLogs || []);
  const [fileName, setFileName] = useState(initialLogs ? 'Loaded from history' : 'No file selected');
  const [lastUpdated, setLastUpdated] = useState(initialLogs ? new Date().toLocaleString() : 'Never');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const logsPerPage = 20;

  // Safety check: ensure logs is always an array
  const safeLogs = Array.isArray(logs) ? logs : [];
  const totalLogs = safeLogs.length;
  const errorLogs = safeLogs.filter(log => log && log.level === 'ERROR').length;
  const warningLogs = safeLogs.filter(log => log && log.level === 'WARNING').length;
  const infoLogs = safeLogs.filter(log => log && log.level === 'INFO').length;
  const debugLogs = safeLogs.filter(log => log && log.level === 'DEBUG').length;
  const criticalLogs = safeLogs.filter(log => log && log.level === 'CRITICAL').length;

  const LogPie = [
    // ... rest same using infoLogs, totalLogs etc.
    {
      label: 'INFO',
      value: ((infoLogs/totalLogs)*100).toFixed(2),
      color: '#60A5FA'
    },
    {
      label: 'WARNING',
      value: ((warningLogs/totalLogs)*100).toFixed(2),
      color: '#FBBF24'
    },
    {
      label: 'ERROR',
      value: ((errorLogs/totalLogs)*100).toFixed(2),
      color: '#EF4444'
    },
    {
      label: 'DEBUG',
      value: ((debugLogs/totalLogs)*100).toFixed(2),
      color: '#34D399'
    },
    {
      label: 'CRITICAL',
      value: ((criticalLogs/totalLogs)*100).toFixed(2),
      color: '#F87171'
    },
  ];

  const defaultChartData = [
    { label: 'INFO', value: 1, color: '#60A5FA' },
    { label: 'ERROR', value: 1, color: '#EF4444' },
    { label: 'DEBUG', value: 1, color: '#34D399' },
    { label: 'WARNING', value: 1, color: '#FBBF24' },
    { label: 'CRITICAL', value: 1, color: '#F87171' }
  ];
  const valueFormatter = (item) => `${item.value}%`;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            let analyzedLogs = [];
            
            // Regex used in LogController.php
            const pattern = /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+\d{2}:\d{2})\] (\w+)\.(\w+): (.*)$/;
            
            lines.forEach(line => {
                const matches = line.match(pattern);
                if (matches) {
                    analyzedLogs.push({
                        time: matches[1],
                        channel: matches[2],
                        level: matches[3],
                        message: matches[4]
                    });
                }
            });

            const originalCount = analyzedLogs.length;
            let isSummarized = false;

            // Vercel Limit Handling: If data is too large, summarize it on the client
            if (analyzedLogs.length > 10000) {
                isSummarized = true;
                const errors = analyzedLogs.filter(l => ['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'WARNING'].includes(l.level.toUpperCase()));
                const others = analyzedLogs.filter(l => !['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY', 'WARNING'].includes(l.level.toUpperCase()));
                
                const sampledOthers = others.filter((_, index) => index % 10 === 0);
                analyzedLogs = [...errors, ...sampledOthers].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            }

            const token = localStorage.getItem('jwtToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const payload = {
                logs: analyzedLogs,
                filename: file.name
            };

            if (isSummarized) {
                payload.logs = {
                    is_summarized: true,
                    original_count: originalCount,
                    data: analyzedLogs
                };
            }

            const response = await fetch('/api/upload_file', { 
                method: 'POST', 
                headers: headers,
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                setLogs(analyzedLogs);
                setLastUpdated(new Date().toLocaleString());
                filterLogs(analyzedLogs, currentFilter, currentSearch);
                if (onHistoryLoaded) onHistoryLoaded();
            } else {
                console.error('Upload failed:', response.statusText);
                if (response.status === 413) {
                    alert('Log file is too large for the server even after compression. Showing local results only.');
                    setLogs(analyzedLogs);
                    setLastUpdated(new Date().toLocaleString());
                    filterLogs(analyzedLogs, currentFilter, currentSearch);
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        setIsLoading(false);
        alert('Error reading file');
    };
    reader.readAsText(file);
  }

  const testAuthentication = async () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        try {
            const response = await fetch('/api/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                console.log('User is authenticated');
                return true;
            } else {
                console.log('User not authenticated');
                localStorage.removeItem('jwtToken');
                return false;
            }
        } catch (error) {
            console.error('Auth test error:', error);
            return false;
        }
    }
    return false;
  };

   const fetchLogData = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/show_log_data?_format=json',{
            headers: {
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            // Safety: Ensure it's an array. Handle old object format if present.
            const actualLogs = Array.isArray(data.my_log) ? data.my_log : (data.my_log?.data || []);
            setLogs(actualLogs);
            setLastUpdated(new Date().toLocaleString());
            filterLogs(actualLogs, currentFilter, currentSearch);
            
            // Mettre à jour le nom du fichier si des logs sont chargés
            if (actualLogs && actualLogs.length > 0) {
                setFileName('Loaded from history');
            }
          }
        } catch (error) {
          console.error('Error', error);
        } finally {
            setIsLoading(false);
        }
    };

   useEffect(() => {
        if (initialLogs) {
            const actualLogs = Array.isArray(initialLogs) ? initialLogs : (initialLogs.data || []);
            setLogs(actualLogs);
            setFileName('Loaded from history');
            setLastUpdated(new Date().toLocaleString());
            filterLogs(actualLogs, currentFilter, currentSearch);
        } else if (onHistoryLoaded) {
            fetchLogData();
        }
    }, [initialLogs, onHistoryLoaded]);

  const filterLogs = (logsToFilter = logs, filter = currentFilter, search = currentSearch) => {
    const searchTerm = search.toLowerCase();
    
    // Safety check: ensure logsToFilter is an array
    const safeToFilter = Array.isArray(logsToFilter) ? logsToFilter : (logsToFilter?.data || []);

    const filtered = safeToFilter.filter(log => {
      if (!log) return false;
      const matchesFilter = filter === 'all' || (log.level && log.level.toLowerCase() === filter.toLowerCase());
      const matchesSearch = searchTerm === '' || 
        (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });
    
    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (event) => {
    setCurrentSearch(event.target.value)
    filterLogs(logs, currentFilter, currentSearch);
  };

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    filterLogs(logs, filter, currentSearch);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getLevelIcon = (level) => {
    switch(level) {
      case 'ERROR':
        return { icon: faExclamationCircle, color: 'text-red-400' };
      case 'WARNING':
        return { icon: faExclamationTriangle, color: 'text-yellow-400' };
      case 'INFO':
        return { icon: faInfoCircle, color: 'text-blue-400' };
      case 'DEBUG':
        return { icon: faBug, color: 'text-green-400' };
      case 'CRITICAL':
        return { icon: faBugSlash, color: 'text-red-300' };
      default:
        return { icon: faLayerGroup, color: 'text-white' };
    }
  };

  const getLevelBadgeColor = (level) => {
    switch(level) {
      case "ERROR":
        return "bg-red-500/20 text-red-300 border border-red-500/30"
      case "WARNING":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
      case "INFO":
        return "bg-blue-500/20 text-blue-300 border border-blue-500/30"
      case "DEBUG":
        return "bg-green-500/20 text-green-300 border border-green-500/30"
      case "CRITICAL":
        return "bg-red-600/20 text-red-200 border border-red-600/30"
      default:
        return "bg-white/10 text-white border border-white/20"
    }
  };

  const highlightSearchTerm = (message) => {
    if (!currentSearch || !message) return message;
    const regex = new RegExp(`(${escapeRegExp(currentSearch)})`, 'gi');
    return message.replace(regex, '<span class="bg-yellow-400/30 text-yellow-200">$1</span>');
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const startIdx = (currentPage - 1) * logsPerPage;
  const endIdx = Math.min(startIdx + logsPerPage, filteredLogs.length);
  const paginatedLogs = filteredLogs.slice(startIdx, endIdx);

  return (
      <div className="relative">
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex flex-col items-center justify-center transition-all duration-500">
          <div className="glass-card p-12 rounded-3xl flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/20">
            <div className="relative">
              <FontAwesomeIcon icon={faSpinner} className="text-white text-8xl animate-spin" />
              <div className="absolute inset-0 blur-2xl bg-white/20 animate-pulse rounded-full"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-5xl text-white font-bold tracking-wider uppercase">Analyzing Logs</p>
              <p className="text-2xl text-white/60">Processing data through our neural engine...</p>
            </div>
            <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-white/40 animate-progress"></div>
            </div>
          </div>
        </div>
      )}
      <div className="glass-card rounded-xl p-6 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-3xl font-medium text-white/90 mb-2">Upload Log File</label>
            <div className="flex items-center">
              <input type="file" id="logFile" accept=".log,.txt" className="hidden" onChange={handleFileUpload} />
              <button
                onClick={() => document.getElementById("logFile").click()}
                className="glass-button text-2xl text-white px-4 py-2 rounded-l-lg transition-all duration-200 hover:scale-105"
              >
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                Choose File
              </button>
              <span className="px-4 py-2 text-2xl glass-input border-l-0 rounded-r-lg text-white/70 flex-1 truncate">
                {fileName}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-3xl font-medium text-white/90 mb-2">Search Logs</label>
            <div className="relative">
              <input
                type="text"
                id="searchInput"
                placeholder="Search logs..."
                className="w-full glass-input px-4 py-2 text-2xl rounded-lg focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-200"
                value={currentSearch}
                onChange={handleSearch}
              />
              <button
                id="searchBtn"
                className="absolute right-3 top-2.5 text-white/60 hover:text-white/90 transition-colors duration-200"
                onClick={handleSearch}
              >
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <span className="text-3xl font-medium text-white/90">Filter by :</span>
          <div className="flex flex-wrap gap-2">
            {["all", "info", "debug", "error", "warning", "critical"].map((level) => (
              <button
                key={level}
                className={`px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  currentFilter === level
                    ? "bg-white/20 border-white/40 text-white text-2xl shadow-lg"
                    : "glass-button text-white/70 text-2xl hover:text-white hover:bg-white/15"
                }`}
                onClick={() => handleFilterChange(level)}
              >
                {level === "all" && <FontAwesomeIcon icon={faLayerGroup} className="mr-1 text-white/70" />}
                {level === "info" && <FontAwesomeIcon icon={faInfoCircle} className="mr-1 text-blue-400" />}
                {level === "debug" && <FontAwesomeIcon icon={faBug} className="mr-1 text-green-400" />}
                {level === "error" && <FontAwesomeIcon icon={faExclamationCircle} className="mr-1 text-red-400" />}
                {level === "warning" && (
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1 text-yellow-400" />
                )}
                {level === "critical" && <FontAwesomeIcon icon={faBugSlash} className="mr-1 text-red-300" />}
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="glass-card rounded-xl p-4 border-l-4 border-white/30 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-medium text-white/70">Total Logs</p>
                  <p className="text-3xl font-bold text-white">{totalLogs}</p>
                </div>
                <FontAwesomeIcon icon={faList} className="text-white/60 text-3xl" />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-white/30 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white/70 text-3xl">Last Updated</p>
                  <p className="text-2xl font-bold text-white">{lastUpdated}</p>
                </div>
                <FontAwesomeIcon icon={faClock} className="text-white/60 text-3xl" />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-blue-400 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-medium text-white/70">Infos</p>
                  <p className="text-3xl font-bold text-white">{infoLogs}</p>
                </div>
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 text-3xl" />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-green-400 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-medium text-white/70">Debugs</p>
                  <p className="text-3xl font-bold text-white">{debugLogs}</p>
                </div>
                <FontAwesomeIcon icon={faBug} className="text-green-400 text-3xl" />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-red-400 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-medium text-white/70">Errors</p>
                  <p className="text-3xl font-bold text-white">{errorLogs}</p>
                </div>
                <FontAwesomeIcon icon={faExclamationCircle} className="text-red-400 text-3xl" />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-yellow-400 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-medium text-white/70">Warnings</p>
                  <p className="text-3xl font-bold text-white">{warningLogs}</p>
                </div>
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 text-3xl" />
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border-l-4 border-red-300 hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-medium text-white/70">Criticals</p>
                  <p className="text-3xl font-bold text-white">{criticalLogs}</p>
                </div>
                <FontAwesomeIcon icon={faBugSlash} className="text-red-300 text-3xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="glass-card rounded-xl p-6 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <PieChart
              series={[
                {
                  data: logs.length > 0 ? LogPie : defaultChartData,
                  highlightScope: { fade: "global", highlight: "item" },
                  faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                  valueFormatter,
                },
              ]}
              height={400}
              width={500}
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden mt-6 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5 backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-3xl font-medium text-white/80 uppercase tracking-wider"
                >
                  Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-3xl font-medium text-white/80 uppercase tracking-wider"
                >
                  Channel
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-3xl font-medium text-white/80 uppercase tracking-wider"
                >
                  Level
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-3xl font-medium text-white/80 uppercase tracking-wider"
                >
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-2xl  text-white/60">
                    {logs.length === 0
                      ? "No log entries available. Upload a log file to begin."
                      : "No log entries match your filters."}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, index) => {
                  const { icon, color } = getLevelIcon(log.level)
                  const badgeColor = getLevelBadgeColor(log.level)

                  return (
                    <tr
                      key={index}
                      className={`border-l-4 border-white/20 hover:bg-white/5 transition-all duration-200`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-2xl text-white/90 space-x-1">
                          <span>{log.time?.split("T")[0] || "N/A"}</span>
                          <span style={{ marginLeft: "20px" }}>{log.time?.split("T")[1]?.split(".")[0] || "N/A"}</span>
                          <span style={{ marginLeft: "20px" }} className="text-2xl text-white/50">
                            {log.time?.split("+")[1]
                              ? `UTC+${log.time.split("+")[1]}`
                              : log.time?.split("-")[1]
                                ? `UTC${log.time.split("-")[1]}`
                                : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white/90 text-2xl">{log.channel || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={icon} className={`${color} mr-2`} />
                          <span className={`px-2 py-1 text-2xl font-semibold rounded-full ${badgeColor} capitalize`}>
                            {log.level || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-2xl text-white/90"
                          dangerouslySetInnerHTML={{ __html: highlightSearchTerm(log.message || "No message") }}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <div className="text-3xl text-white/70">
          Showing <span className="text-white text-3xl">{filteredLogs.length > 0 ? startIdx + 1 : 0}</span> to{" "}
          <span className="text-white text-3xl">{endIdx}</span> of <span className="text-white text-3xl">{filteredLogs.length}</span>{" "}
          entries
        </div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-2 glass-button rounded-lg text-white/80 text-2xl transition-all duration-200 ${currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20 hover:scale-105"}`}
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${currentPage === 1 ? "bg-white/20 text-white border text-3xl border-white/30 shadow-lg" : "glass-button text-white/80 text-3xl hover:bg-white/15"}`}
            onClick={() => handlePageChange(1)}
          >
            1
          </button>
          {currentPage > 3 && <span className="px-3 py-2 text-2xl text-white/60">...</span>}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => page > 1 && page < totalPages && Math.abs(page - currentPage) <= 2)
            .map((page) => (
              <button
                key={page}
                className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${currentPage === page ? "bg-white/20 text-white border border-white/30 shadow-lg" : "glass-button text-white/80 hover:bg-white/15"}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          {currentPage < totalPages - 2 && <span className="px-3 py-2 text-2xl text-white/60">...</span>}
          {totalPages > 1 && (
            <button
              className={`px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${currentPage === totalPages ? "bg-white/20 text-white border border-white/30 shadow-lg" : "glass-button text-white/80 hover:bg-white/15"}`}
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          )}
          <button
            className={`px-3 py-2 glass-button rounded-lg text-2xl text-white/80 transition-all duration-200 ${currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20 hover:scale-105"}`}
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </div>
  );
};
