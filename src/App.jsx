import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function App() {
  const initialTasks = useMemo(() => {
    try {
      const raw = localStorage.getItem('lifehud.tasks')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }, [])
  const [tasks, setTasks] = useState(initialTasks)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('主线')
  const initialActive = useMemo(() => {
    try {
      const raw = localStorage.getItem('lifehud.active')
      return raw ? JSON.parse(raw) : { activeTaskId: null, startTime: null }
    } catch {
      return { activeTaskId: null, startTime: null }
    }
  }, [])
  const [activeTaskId, setActiveTaskId] = useState(initialActive.activeTaskId)
  const [startTime, setStartTime] = useState(initialActive.startTime)
  const [now, setNow] = useState(Date.now())
  const [isSettling, setIsSettling] = useState(false)
  const [bodyState, setBodyState] = useState(null)
  const [wisdomType, setWisdomType] = useState('')
  const [wisdomQuote, setWisdomQuote] = useState('')
  const [charisma, setCharisma] = useState('')
  const [moods, setMoods] = useState([])
  const [moneyDelta, setMoneyDelta] = useState('')
  const [view, setView] = useState('terminal')
  const [logs, setLogs] = useState([])
  const [adminOpen, setAdminOpen] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('lifehud.tasks', JSON.stringify(tasks))
  }, [tasks])
  useEffect(() => {
    localStorage.setItem('lifehud.active', JSON.stringify({ activeTaskId, startTime }))
  }, [activeTaskId, startTime])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const onAdd = () => {
    const t = title.trim()
    if (!t) return
    const item = {
      id: Date.now(),
      title: t,
      type,
      status: '待启动'
    }
    setTasks(prev => [item, ...prev])
    setTitle('')
  }

  const startTask = (id) => {
    setTasks(prev => prev.map(it => it.id === id ? { ...it, status: '进行中' } : it))
    setActiveTaskId(id)
    setStartTime(Date.now())
  }

  const formatElapsed = (ms) => {
    if (!ms || ms < 0) return '00:00:00'
    const s = Math.floor(ms / 1000)
    const hh = String(Math.floor(s / 3600)).padStart(2, '0')
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }
  const currentTask = tasks.find(t => t.id === activeTaskId)
  const elapsed = startTime ? formatElapsed(now - startTime) : null
  const endTask = () => {
    if (activeTaskId != null) {
      setTasks(prev => prev.map(it => it.id === activeTaskId ? { ...it, status: '已结束' } : it))
    }
    setIsSettling(true)
  }
  const confirmArchive = () => {
    const endTime = Date.now()
    try {
      const raw = localStorage.getItem('lifehud.logs')
      const logs = raw ? JSON.parse(raw) : []
      logs.push({
        taskId: activeTaskId,
        title: currentTask?.title,
        type: currentTask?.type,
        startTime,
        endTime,
        elapsedMs: startTime ? endTime - startTime : 0,
        bodyState,
        wisdomType,
        wisdomQuote,
        charisma,
        moods,
        moneyDelta: Number(moneyDelta) || 0
      })
      localStorage.setItem('lifehud.logs', JSON.stringify(logs))
    } catch {}
    setActiveTaskId(null)
    setStartTime(null)
    setIsSettling(false)
    setBodyState(null)
    setWisdomType('')
    setWisdomQuote('')
    setCharisma('')
    setMoods([])
    setMoneyDelta('')
  }

  useEffect(() => {
    if (view === 'logs') {
      try {
        const raw = localStorage.getItem('lifehud.logs')
        const arr = raw ? JSON.parse(raw) : []
        arr.sort((a,b) => (b.endTime||0) - (a.endTime||0))
        setLogs(arr)
      } catch {
        setLogs([])
      }
    }
  }, [view, isSettling])

  const formatDateTime = (ms) => {
    if (!ms) return ''
    const d = new Date(ms)
    const Y = d.getFullYear()
    const M = String(d.getMonth()+1).padStart(2,'0')
    const D = String(d.getDate()).padStart(2,'0')
    const h = String(d.getHours()).padStart(2,'0')
    const m = String(d.getMinutes()).padStart(2,'0')
    return `${Y}-${M}-${D} ${h}:${m}`
  }

  const exportArchive = () => {
    try {
      const nowStr = (() => {
        const d = new Date()
        const Y = d.getFullYear()
        const M = String(d.getMonth()+1).padStart(2,'0')
        const D = String(d.getDate()).padStart(2,'0')
        const h = String(d.getHours()).padStart(2,'0')
        const m = String(d.getMinutes()).padStart(2,'0')
        return `${Y}${M}${D}_${h}${m}`
      })()
      const tasksData = JSON.parse(localStorage.getItem('lifehud.tasks') || '[]')
      const logsData = JSON.parse(localStorage.getItem('lifehud.logs') || '[]')
      const data = { tasks: tasksData, logs: logsData }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Life_Log_Backup_${nowStr}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const triggerImport = () => {
    if (fileRef.current) fileRef.current.value = ''
    fileRef.current?.click()
  }

  const onImportFile = async (e) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      const text = await file.text()
      const obj = JSON.parse(text)
      if (!obj || !Array.isArray(obj.tasks) || !Array.isArray(obj.logs)) {
        alert('存档格式不正确')
        return
      }
      localStorage.setItem('lifehud.tasks', JSON.stringify(obj.tasks))
      localStorage.setItem('lifehud.logs', JSON.stringify(obj.logs))
      location.reload()
    } catch {
      alert('导入失败，请检查文件内容')
    }
  }

  const nuclearReset = () => {
    const ok = confirm('此操作将抹除所有视域记录与智慧碎片，确认开启新轮回？')
    if (!ok) return
    localStorage.clear()
    location.reload()
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4">
        <header className="py-4">
          <div className="font-mono text-sm tracking-tight">
            [ TERMINAL v1.0 - LIFE_NAVIGATOR ]
          </div>
          <div className="border-b border-slate-700 mt-2" />
        </header>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setView('terminal')}
            className={`text-xs rounded-md px-3 py-1 ${view==='terminal' ? 'bg-slate-800 text-slate-200 ring-1 ring-cyan-500' : 'bg-slate-900 text-slate-400 ring-1 ring-slate-700'}`}
          >
            任务终端
          </button>
          <button
            onClick={() => setView('logs')}
            className={`text-xs rounded-md px-3 py-1 ${view==='logs' ? 'bg-slate-800 text-slate-200 ring-1 ring-cyan-500' : 'bg-slate-900 text-slate-400 ring-1 ring-slate-700'}`}
          >
            冒险日志
          </button>
        </div>
        {view==='terminal' && currentTask ? (
          <section className="mt-16 flex flex-col items-center text-center gap-8">
            <div className="text-2xl sm:text-3xl text-slate-200">
              TARGET: <span className="font-semibold">[ {currentTask.title} ]</span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl text-slate-100">
              ELAPSED: {elapsed}
            </div>
            <button
              onClick={endTask}
              className="mt-8 border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10 rounded-md px-5 py-3"
            >
              结束任务并结算感知
            </button>
            {isSettling && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="max-w-2xl w-full mx-4 border border-slate-700 rounded-lg bg-slate-900/80 p-6 max-h-[80vh] overflow-y-auto">
                  <div className="text-slate-200 font-mono text-sm mb-4">[ 结算档案 ]</div>
                  <div className="space-y-3">
                    <div className="border border-slate-800 rounded-md p-3">
                      <div className="text-slate-300 text-sm mb-2">[ 躯体状态 ]</div>
                      <div className="grid grid-cols-5 gap-2">
                        <button
                          onClick={() => setBodyState('枯竭')}
                          className={`h-10 rounded-md text-xs bg-red-900 text-red-200 ${bodyState==='枯竭' ? 'ring-2 ring-cyan-400 animate-pulse' : 'ring-1 ring-slate-700'}`}
                        >
                          枯竭
                        </button>
                        <button
                          onClick={() => setBodyState('疲劳')}
                          className={`h-10 rounded-md text-xs bg-orange-900 text-orange-200 ${bodyState==='疲劳' ? 'ring-2 ring-cyan-400 animate-pulse' : 'ring-1 ring-slate-700'}`}
                        >
                          疲劳
                        </button>
                        <button
                          onClick={() => setBodyState('平稳')}
                          className={`h-10 rounded-md text-xs bg-slate-800 text-slate-200 ${bodyState==='平稳' ? 'ring-2 ring-cyan-400 animate-pulse' : 'ring-1 ring-slate-700'}`}
                        >
                          平稳
                        </button>
                        <button
                          onClick={() => setBodyState('充沛')}
                          className={`h-10 rounded-md text-xs bg-emerald-900 text-emerald-200 ${bodyState==='充沛' ? 'ring-2 ring-cyan-400 animate-pulse' : 'ring-1 ring-slate-700'}`}
                        >
                          充沛
                        </button>
                        <button
                          onClick={() => setBodyState('巅峰')}
                          className={`h-10 rounded-md text-xs bg-cyan-900 text-cyan-200 ${bodyState==='巅峰' ? 'ring-2 ring-cyan-400 animate-pulse' : 'ring-1 ring-slate-700'}`}
                        >
                          巅峰
                        </button>
                      </div>
                    </div>
                    <div className="border border-slate-800 rounded-md p-3">
                      <div className="text-slate-300 text-sm mb-2">[ 智慧视域 ]</div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={wisdomType}
                          onChange={e => setWisdomType(e.target.value)}
                          className="bg-slate-900 text-slate-300 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value="">选择视域分类</option>
                          <option value="逻辑构建">逻辑构建</option>
                          <option value="系统洞察">系统洞察</option>
                          <option value="人道共情">人道共情</option>
                          <option value="自省觉察">自省觉察</option>
                        </select>
                        <input
                          value={wisdomQuote}
                          onChange={e => setWisdomQuote(e.target.value.slice(0,20))}
                          maxLength={20}
                          placeholder="在此记录一行智慧金句 (20字以内)"
                          className="flex-1 bg-slate-900 text-slate-300 placeholder-slate-500 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="border border-slate-800 rounded-md p-3">
                      <div className="text-slate-300 text-sm mb-2">[ 场能连接 ]</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['独处 (自洽)','对话 (被看见)','共鸣 (相互启发)','领导 (场能辐射)'].map(c => (
                          <button
                            key={c}
                            onClick={() => setCharisma(charisma === c ? '' : c)}
                            className={`h-10 rounded-md text-xs ${charisma===c ? 'ring-2 ring-cyan-400 animate-pulse bg-cyan-900 text-cyan-200' : 'ring-1 ring-slate-700 bg-slate-800 text-slate-200'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="border border-slate-800 rounded-md p-3">
                      <div className="text-slate-300 text-sm mb-2">[ 情绪锚点 ]</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="text-xs text-emerald-300">[ 需求得到满足 ]</div>
                          <div className="max-h-52 overflow-auto flex flex-wrap gap-2">
                            {['兴奋','喜悦','欣喜','甜蜜','精力充沛','兴高采烈','感激','感动','乐观','自信','振作','振奋','开心','高兴','快乐','愉快','幸福','陶醉','满足','欣慰','心旷神怡','喜出望外','平静','自在','舒适','放松','踏实','安全','温暖','放心','无忧无虑'].map(w => {
                              const active = moods.includes(w)
                              return (
                                <button
                                  key={w}
                                  onClick={() => setMoods(prev => active ? prev.filter(x=>x!==w) : [...prev,w])}
                                  className={`px-2 py-1 rounded-md text-xs ${active ? 'ring-2 ring-cyan-400 animate-pulse bg-emerald-900 text-emerald-200' : 'ring-1 ring-slate-700 bg-emerald-950 text-emerald-300'}`}
                                >
                                  {w}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-amber-300">[ 需求未得到满足 ]</div>
                          <div className="max-h-52 overflow-auto flex flex-wrap gap-2">
                            {['害怕','担心','焦虑','忧虑','着急','紧张','心神不宁','心烦意乱','忧伤','沮丧','灰心','气馁','泄气','绝望','伤感','凄凉','悲伤','恼怒','愤怒','烦恼','苦恼','生气','厌烦','不满','不快','不耐烦','不高兴','震惊','失望','困惑','茫然','寂寞','孤独','郁闷','难过','悲观','沉重','麻木','精疲力尽','委靡不振','疲惫不堪','昏昏欲睡','无精打采','尴尬','惭愧','内疚','妒忌','遗憾','不舒服'].map(w => {
                              const active = moods.includes(w)
                              return (
                                <button
                                  key={w}
                                  onClick={() => setMoods(prev => active ? prev.filter(x=>x!==w) : [...prev,w])}
                                  className={`px-2 py-1 rounded-md text-xs ${active ? 'ring-2 ring-cyan-400 animate-pulse bg-amber-900 text-amber-200' : 'ring-1 ring-slate-700 bg-amber-950 text-amber-300'}`}
                                >
                                  {w}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border border-slate-800 rounded-md p-3">
                      <div className="text-slate-300 text-sm mb-2">[ 现实回报 ]</div>
                      <input
                        value={moneyDelta}
                        onChange={e => setMoneyDelta(e.target.value.replace(/[^\d-]/g,''))}
                        placeholder="筹码增量"
                        className="bg-slate-900 text-slate-300 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={confirmArchive}
                      className="border-2 border-cyan-500 text-cyan-300 hover:bg-cyan-500/10 rounded-md px-4 py-2"
                    >
                      确认存档
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : view==='terminal' ? (
          <section className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="任务描述"
                className="flex-1 bg-slate-900 text-slate-300 placeholder-slate-500 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-600"
              />
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="bg-slate-900 text-slate-300 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-600"
              >
                <option value="主线">主线剧情</option>
                <option value="支线">支线任务</option>
                <option value="日常">日常副本</option>
              </select>
              <button
                onClick={onAdd}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-md px-3 py-2"
              >
                录入
              </button>
            </div>
 
            <div className="border border-slate-800 rounded-md">
              <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-800">
                看板
              </div>
              {tasks.filter(t => t.status === '待启动').length ? (
                <ul className="divide-y divide-slate-800">
                  {tasks.filter(t => t.status === '待启动').map(item => (
                    <li key={item.id} className="px-3 py-3 flex items-center gap-3">
                      <span className="text-xs text-slate-400 shrink-0">[ {item.type} ]</span>
                      <span className="text-slate-200 flex-1 truncate">{item.title}</span>
                      <button
                        onClick={() => startTask(item.id)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-slate-900 rounded-md px-3 py-1 text-sm"
                      >
                        启动
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-4 text-sm text-slate-500">[ 暂无待处理视域 ]</div>
              )}
            </div>
          </section>
        ) : (
          <section className="mt-4 space-y-3">
            {logs.length ? (
              <ul className="space-y-3">
                {logs.map((lg, idx) => (
                  <li key={idx} className="relative bg-slate-900/50 border border-slate-800 rounded-md p-3">
                    {(() => {
                      const colorMap = {
                        '逻辑构建': { bar: 'bg-blue-400', glow: 'drop-shadow-[0_0_8px_#60A5FA]' },
                        '系统洞察': { bar: 'bg-indigo-500', glow: 'drop-shadow-[0_0_8px_#6366F1]' },
                        '人道共情': { bar: 'bg-rose-400', glow: 'drop-shadow-[0_0_8px_#FB7185]' },
                        '自省觉察': { bar: 'bg-teal-400', glow: 'drop-shadow-[0_0_8px_#2DD4BF]' }
                      }
                      const cm = colorMap[lg.wisdomType] || { bar: 'bg-slate-600', glow: 'drop-shadow-[0_0_8px_#64748B]' }
                      const glow = lg.bodyState === '巅峰' ? cm.glow : ''
                      return (
                        <div className={`absolute left-0 top-0 h-full w-1 ${cm.bar} ${glow}`} />
                      )
                    })()}
                    <div className="ml-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <div className="font-semibold text-slate-100 truncate">{lg.title || '未命名任务'}</div>
                          <div className="text-xs text-slate-400">[ {lg.type || '未知类型'} ]</div>
                        </div>
                        <div className="text-xs text-slate-500">{formatDateTime(lg.endTime)}</div>
                      </div>
                      {lg.wisdomQuote ? (
                        <div className={`font-serif italic rounded-md px-3 py-2 mt-3 mb-3 text-base font-semibold ${(['逻辑构建','系统洞察'].includes(lg.wisdomType) ? 'bg-emerald-500/10 text-emerald-200' : (['人道共情','自省觉察'].includes(lg.wisdomType) ? 'bg-amber-500/10 text-amber-200' : 'bg-slate-800 text-slate-200'))}`}>
                          「{lg.wisdomQuote}」
                        </div>
                      ) : null}
                      <div className="text-[11px] text-slate-400">
                        [ 躯体: {lg.bodyState || '未知'} ] [ 场能: {lg.charisma || '未知'} ]
                      </div>
                      {Array.isArray(lg.moods) && lg.moods.length ? (
                        <div className="mt-1 text-[11px]">
                          {(() => {
                            const ok = new Set(['兴奋','喜悦','欣喜','甜蜜','精力充沛','兴高采烈','感激','感动','乐观','自信','振作','振奋','开心','高兴','快乐','愉快','幸福','陶醉','满足','欣慰','心旷神怡','喜出望外','平静','自在','舒适','放松','踏实','安全','温暖','放心','无忧无虑'])
                            return lg.moods.map((w, i) => {
                              const satisfied = ok.has(w)
                              return (
                                <span key={`${w}-${i}`} className={satisfied ? 'text-cyan-400' : 'text-amber-500'}>
                                  {w}{i < lg.moods.length - 1 ? '、' : ''}
                                </span>
                              )
                            })
                          })()}
                        </div>
                      ) : null}
                      <div className="absolute bottom-2 right-3 font-mono text-yellow-400/80 text-xs">
                        + {lg.moneyDelta || 0} 筹码
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-4 text-sm text-slate-500">[ 历史记录尚是一片虚空 ]</div>
            )}
          </section>
        )}

        <section className="mt-8">
          <div className="border border-slate-800 rounded-md bg-slate-950/80">
            <button
              onClick={() => setAdminOpen(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300"
            >
              <span>[ 系统管理 / SYSTEM_ADMIN ]</span>
              <span className="text-slate-500">{adminOpen ? '收起' : '展开'}</span>
            </button>
            {adminOpen && (
              <div className="px-3 pb-3 space-y-2 text-xs">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={exportArchive}
                    className="border border-slate-700 rounded-md px-3 py-2 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  >
                    导出生命存档
                  </button>
                  <button
                    onClick={triggerImport}
                    className="border border-slate-700 rounded-md px-3 py-2 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  >
                    注入历史视域
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={onImportFile}
                  />
                  <button
                    onClick={nuclearReset}
                    className="border-2 border-red-600 text-red-400 rounded-md px-3 py-2 bg-slate-900 hover:bg-red-600/10"
                  >
                    启动周期归零
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
