import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, faSearch, faLayerGroup, 
  faExclamationCircle, faExclamationTriangle, 
  faInfoCircle, faBug, faList, faClock, 
  faChevronLeft, faChevronRight, faBugSlash
} from '@fortawesome/free-solid-svg-icons';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from './AuthContext';
import "../../styles/app.css";

export default function Logs({ onHistoryLoaded }) {
  const { user } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [fileName, setFileName] = useState('No file selected');
  const [lastUpdated, setLastUpdated] = useState('Never');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;
  const totalLogs = logs.length;
  const errorLogs = logs.filter(log => log.level === 'ERROR').length;
  const warningLogs = logs.filter(log => log.level === 'WARNING').length;
  const infoLogs = logs.filter(log => log.level === 'INFO').length;
  const debugLogs = logs.filter(log => log.level === 'DEBUG').length;
  const criticalLogs = logs.filter(log => log.level === 'CRITICAL').length;

  const LogPie = [
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
    const formData = new FormData();
    formData.append('log_file', file);
    
    try {
        const token = localStorage.getItem('jwtToken');
        const headers = {};
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/upload_file', { 
            method: 'POST', 
            body: formData,
            headers: headers
        });
        
        if (response.ok) {
            setTimeout(() => { fetchLogData(); } , 500);
        } else {
            console.error('Upload failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
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
        try {
          const response = await fetch('/show_log_data?_format=json',{
            headers: {
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setLogs(data.my_log);
            setLastUpdated(new Date().toLocaleString());
            filterLogs(data.my_log, currentFilter, currentSearch);
            
            // Mettre à jour le nom du fichier si des logs sont chargés
            if (data.my_log && data.my_log.length > 0) {
                setFileName('Loaded from history');
            }
          }
        } catch (error) {
          console.error('Error', error);
        }
    };

   useEffect(() => {
        if (onHistoryLoaded) {
            // Si onHistoryLoaded change, recharger les données
            fetchLogData();
        }
    }, [onHistoryLoaded]);

  const filterLogs = (logsToFilter = logs, filter = currentFilter, search = currentSearch) => {
    const searchTerm = search.toLowerCase();
    
    const filtered = logsToFilter.filter(log => {
      const matchesFilter = filter === 'all' || log.level.toLowerCase() === filter.toLowerCase();
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
      <div>
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
