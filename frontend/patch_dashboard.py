import re

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

# Replace the whole return statement of Dashboard component
replacement = """  return (
    <div className="space-y-6 w-full max-w-[1200px] mx-auto pb-16">
      
      {/* 1. Dashboard Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleResetDemo}
            className="flex items-center space-x-1 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-sm font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset Demo
          </button>
          
          <button className="flex items-center space-x-1 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full text-sm font-semibold cursor-pointer transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>

          <button className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-semibold shadow-sm transition-colors cursor-pointer border border-transparent">
             <Plus className="w-4 h-4 mr-1" />
             Create Report
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STAT ROW ABOVE THE TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Stat 1: Total Matters */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Total Matters</p>
              <h3 className="text-gray-900 text-2xl font-bold">{totalMatters}</h3>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">•••</button>
        </div>

        {/* Stat 2: Completed */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1 flex items-center">
                 Completed <span className="ml-2 text-emerald-500 text-[10px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded">+{progressPercent}%</span>
              </p>
              <h3 className="text-gray-900 text-2xl font-bold">{completedMatters}</h3>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">•••</button>
        </div>

        {/* Stat 3: In Progress */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1 flex items-center">
                 In Progress <span className="ml-2 text-red-500 text-[10px] font-bold bg-red-50 px-1.5 py-0.5 rounded">2 alert</span>
              </p>
              <h3 className="text-gray-900 text-2xl font-bold">{matters.filter(m => m.status === 'progress').length}</h3>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">•••</button>
        </div>

        {/* Stat 4: Needs Attention */}
        <div className="bg-white rounded-[20px] p-5 border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">Needs Attention</p>
              <h3 className="text-gray-900 text-2xl font-bold flex items-baseline">
                {matters.filter(m => m.status === 'stuck').length}
                <span className="text-[10px] text-gray-400 font-medium ml-1">matters</span>
              </h3>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600 cursor-pointer">•••</button>
        </div>

      </div>

      {/* 3. Matters List / Interactive Table */}
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden flex flex-col mt-4">
        
        {/* Table Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by matter, category..." 
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 bg-gray-50 rounded-full p-1 border border-gray-100">
                <button className="px-4 py-1 text-xs font-bold text-gray-900 bg-white rounded-full shadow-sm">All</button>
                <button className="px-4 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900">Done</button>
                <button className="px-4 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900">Pending</button>
                <button className="px-4 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900">Review</button>
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 bg-white text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4 font-semibold">Matter #</th>
                <th className="px-6 py-4 font-semibold">Topic</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold">Last Updated</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {matters.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                  
                  {/* ID */}
                  <td className="px-6 py-4 font-mono text-xs text-gray-900 font-bold whitespace-nowrap">
                    {m.id}
                  </td>
                  
                  {/* Name & Details */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                         m.category === 'Environmental' ? 'bg-emerald-500' :
                         m.category === 'Social' ? 'bg-blue-500' :
                         'bg-purple-500'
                      }`}>
                         {m.category.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block">{m.name}</span>
                        <span className="text-[11px] text-gray-500">Owner not assigned</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Category */}
                  <td className="px-6 py-4 text-gray-500">
                    {m.category}
                  </td>
                  
                  {/* Progress bar */}
                  <td className="px-6 py-4 max-w-[140px] md:w-[180px]">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                             className={`h-1.5 rounded-full ${m.progress === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                             style={{ width: `${m.progress}%` }} 
                          />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 shrink-0">{m.progress}%</span>
                    </div>
                  </td>
                  
                  {/* Last updated */}
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {m.lastUpdated}
                  </td>
                  
                  {/* Status Pill */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      m.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                      m.status === 'stuck' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        m.status === 'done' ? 'bg-emerald-500' :
                        m.status === 'stuck' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`} />
                      {m.status === 'done' ? 'Done' : m.status === 'progress' ? 'Pending' : m.status === 'stuck' ? 'Review' : 'Draft'}
                    </span>
                  </td>
                  
                  {/* Action buttons */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setEditingMatter(m);
                        setNewProgress(m.progress);
                        setNewStatus(m.status);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Edit progress details"
                    >
                      <span className="font-bold tracking-widest leading-none block">...</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
           <span className="text-xs font-medium text-gray-500">Showing 1-9 of {totalMatters}</span>
           <div className="flex items-center space-x-1">
              <button className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-50">&lt;</button>
              <button className="w-7 h-7 rounded bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">1</button>
              <button className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-600 font-bold flex items-center justify-center text-xs hover:bg-gray-50">2</button>
              <button className="w-7 h-7 rounded bg-white border border-gray-200 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-50">&gt;</button>
           </div>
        </div>
      </div>

      {/* 4. Interactive Drawer / Modal for editing progress */}
      {editingMatter && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 shadow-2xl rounded-[24px] w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Edit Status</h4>
                <span className="text-xs text-gray-500 block mt-0.5">{editingMatter.name}</span>
              </div>
              <button 
                onClick={() => setEditingMatter(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 cursor-pointer font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateProgress} className="p-6 space-y-6">
              
              {/* Progress Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-900">Completion</label>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{newProgress}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={newProgress}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setNewProgress(value);
                    if (value === 100) {
                      setNewStatus('done');
                    } else if (value > 0) {
                      setNewStatus('progress');
                    } else {
                      setNewStatus('stuck');
                    }
                  }}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none" 
                />
              </div>

              {/* Status State selector */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['done', 'progress', 'stuck', 'review'] as Status[]).map((statusVal) => (
                    <button
                      key={statusVal}
                      type="button"
                      onClick={() => {
                        setNewStatus(statusVal);
                        if (statusVal === 'done') {
                          setNewProgress(100);
                        } else if (statusVal === 'stuck' && newProgress === 100) {
                          setNewProgress(0);
                        }
                      }}
                      className={`py-2 px-1.5 border-2 rounded-xl text-xs font-bold capitalize transition-all text-center cursor-pointer ${
                        newStatus === statusVal 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {statusVal === 'progress' ? 'Pending' : statusVal === 'review' ? 'Review' : statusVal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingMatter(null)}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                   type="submit"
                   className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"""

pattern = re.compile(r'  return \(\s*<div className="space-y-8.*?\n\}\n$', re.DOTALL)
new_code = pattern.sub(replacement, code)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(new_code)
