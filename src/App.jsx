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
  const [description, setDescription] = useState('')
  const [type, setType] = useState('主线')
  const [parentId, setParentId] = useState('')
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
  const [glitchTriggered, setGlitchTriggered] = useState(false)
  const [glitchText, setGlitchText] = useState('')
  const [glitchResponse, setGlitchResponse] = useState('')
  const [divergeMode, setDivergeMode] = useState(false)
  const [divergeTask, setDivergeTask] = useState('')
  
  const divergePool = [
    '起身走向离你最近的一扇窗户，凝视远方 60 秒',
    '寻找一个表面粗糙的物体（如砖墙、木头、石块），用指尖感受其纹理 30 秒',
    '原地进行 5 个深蹲或一次长达 30 秒的拉伸',
    '寻找并观察房间内光线落下的边缘，拍摄一张光影对比最强烈的照片',
    '缓慢喝下一杯 200ml 的温水或冰水，感受液体经过食道的完整路径',
    '去寻找一种非办公环境的气味（如茶叶、香水、调料、甚至是一本书的味道）',
    '用力摩擦双手直到发热，然后将掌心覆盖在紧闭的双眼上',
    '用你的非惯用手在纸上（或画板上）画出一个完美的圆',
    '打开窗户或走出门，数出你看到的第 7 个移动物体是什么颜色',
    '闭上眼，尝试识别出当前环境中三个不同距离的声源',
    '深呼吸，告诉自己：“刚才那个忙碌的人不是我，我只是一个暂住在在这个身体里的观察者。”',
    '对着一件毫无意义的办公用品（如订书机、回形针）发呆 30 秒，并发现它的一个“美学特征”'
  ]

  const [entropy, setEntropy] = useState(0)

  const calculateEntropy = () => {
    try {
      const raw = localStorage.getItem('lifehud.logs')
      const arr = raw ? JSON.parse(raw) : []
      arr.sort((a,b) => (b.endTime||0) - (a.endTime||0))
      const last = arr.slice(0,5)
      if (last.length === 0) { setEntropy(0); return }
      const typeCount = {}
      const titleCount = {}
      last.forEach(l => {
        if (l.type) typeCount[l.type] = (typeCount[l.type]||0)+1
        if (l.title) titleCount[l.title] = (titleCount[l.title]||0)+1
      })
      const maxType = Object.values(typeCount).reduce((a,b)=>Math.max(a,b),0)
      const maxTitle = Object.values(titleCount).reduce((a,b)=>Math.max(a,b),0)
      let score = 0
      if (maxType >= 3) score += (maxType - 2) * 25
      if (maxTitle >= 2) score += (maxTitle - 1) * 25
      
      // 检查最近是否有路径纠偏
      const hasFix = last.some(l => l.type === 'DIVERGE_FIX')
      if (hasFix) score = Math.floor(score * 0.6) // 降低 40%

      score = Math.max(0, Math.min(100, score))
      setEntropy(score)
    } catch {
      setEntropy(0)
    }
  }

  useEffect(() => {
    calculateEntropy()
  }, [view, isSettling, tasks, logs]) // 增加 logs 依赖

  const glitchPool = [
    '感知并放松你此时此刻紧绷的肩膀',
    '进行 3 次极慢的深呼吸，感受空气进入肺底',
    '将视线移开屏幕，聚焦于 5 米外的一个固定点',
    '感受喉咙的干渴程度，若有需要，起去喝一口水',
    '闭眼 5 秒，分辨出此时环境背景中最小的那个声音',
    '在视线范围内迅速找到 3 个蓝色的物体',
    '感受屁股与椅面、脚底与地面的压力分配',
    '用手背感受一下你面前空气的温度',
    '用你的非惯用手调整一下鼠标或水杯的位置',
    '停下手中的字，在脑中默念刚才想的那句话，但是倒着念一遍',
    '保持头不动，用余光扫视你左右两侧的最边缘景物',
    '用手指轻抚你桌面上离你最近的一个不同材质的物体',
    '默念一句：“我正在玩一个关于当前任务的模拟游戏。”',
    '想象 10 年后的你正在看现在的这个瞬间，他会说什么？',
    '假设你是一个潜伏在天花板上的观察者，观察正在桌前工作的那个你',
    '问自己：目前的忙碌是在创造秩序，还是在逃避混乱？'
  ]

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
      description,
      type,
      parentId,
      isSummitted: type === '支线' ? false : undefined,
      medal: type === '支线' ? '' : undefined,
      status: '待启动'
    }
    setTasks(prev => [item, ...prev])
    setTitle('')
    setDescription('')
    setParentId('')
  }

  const startTask = (id) => {
    setTasks(prev => prev.map(it => it.id === id ? { ...it, status: '进行中', hasGlitch: it.hasGlitch ?? false } : it))
    setActiveTaskId(id)
    setStartTime(Date.now())
    setGlitchTriggered(false)
    setGlitchText('')
  }

  const formatElapsed = (ms) => {
    if (divergeMode) return 'ERROR: DIVERGED'
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
    if (divergeMode) return
    if (activeTaskId != null) {
      setTasks(prev => prev.map(it => it.id === activeTaskId ? { ...it, status: '已结束' } : it))
    }
    setIsSettling(true)
  }
  const [selectedMainQuestId, setSelectedMainQuestId] = useState('')
  const [scrollToSideQuestId, setScrollToSideQuestId] = useState(null)
  
  const [celebration, setCelebration] = useState(null)

  const onAchieveSideQuest = (item) => {
    // 检查是否有未完成的日常副本（即还在 tasks 列表中的）
    const unfinishedRoutines = tasks.filter(t => String(t.parentId) === String(item.id) && t.type === '日常')
    
    if (unfinishedRoutines.length > 0) {
      alert(`以下关联副本尚未完结（请先完成或销毁）：\n${unfinishedRoutines.map(t => `• ${t.title}`).join('\n')}`)
      return
    }
    
    // 达成支线：标记为 isSummitted
    setTasks(prev => prev.map(t => t.id === item.id ? { ...t, isSummitted: true } : t))
    
    // 准备跳转数据
    const totalMs = getTaskTotalTime(item.id)
    setCelebration({
      title: item.title,
      timeStr: formatHM(totalMs)
    })
    
    // 跳转到 MainQuest
    setSelectedMainQuestId(item.parentId)
    setScrollToSideQuestId(item.id)
    setView('mainquest')
  }

  useEffect(() => {
    if (view === 'mainquest' && !selectedMainQuestId) {
      const first = tasks.find(t => t.type === '主线')
      if (first) setSelectedMainQuestId(first.id)
    }
  }, [view, tasks, selectedMainQuestId])

  useEffect(() => {
    if (view === 'mainquest' && scrollToSideQuestId) {
      const el = document.getElementById(`side-quest-${scrollToSideQuestId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        setScrollToSideQuestId(null)
      }
    }
  }, [view, scrollToSideQuestId, selectedMainQuestId])

  const formatHM = (ms) => {
    if (!ms || ms < 0) return '00:00'
    const minutes = Math.floor(ms / 60000)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const getTaskTotalTime = (taskId) => {
    // 1. 从当前活跃任务中找到子任务 ID
    const activeChildren = tasks.filter(t => String(t.parentId) === String(taskId) && t.type === '日常')
    const activeChildIds = activeChildren.map(c => c.id)

    // 2. 从日志中找到曾属于该支线的任务 ID（通过 parentId 字段）
    // 只要日志中有一条记录表明某 taskId 的 parentId 是当前支线，该 taskId 的所有日志都应计入
    const archivedChildIds = logs
      .filter(l => String(l.parentId) === String(taskId))
      .map(l => l.taskId)
    
    // 合并所有子任务 ID（去重）
    const allChildIds = [...new Set([...activeChildIds, ...archivedChildIds])]

    // 3. 统计这些子任务的 logs 总时长
    let totalMs = logs
      .filter(l => allChildIds.includes(l.taskId))
      .reduce((acc, curr) => acc + (curr.elapsedMs || 0), 0)
    
    // 4. 如果当前正在进行的任务属于该支线（的子任务），也加上当前时长
    if (activeTaskId && startTime) {
      const currentRunning = tasks.find(t => t.id === activeTaskId)
      // 检查 currentRunning 是否在我们的子任务列表中
      // 注意：currentRunning 肯定在 tasks 里，所以它应该已经被 activeChildren 捕获
      // 除非 currentRunning 是个新加的且还没产生 log？
      // 只要它的 parentId 匹配，它就在 activeChildIds 里
      if (currentRunning && String(currentRunning.parentId) === String(taskId) && currentRunning.type === '日常') {
        totalMs += (now - startTime)
      }
    }

    return totalMs
  }

  const achieveRoutine = () => {
    // 达成日常副本：结算并销毁
    const endTime = Date.now()
    try {
      const raw = localStorage.getItem('lifehud.logs')
      const logs = raw ? JSON.parse(raw) : []
      const newLog = {
        taskId: activeTaskId,
        parentId: currentTask?.parentId, // 记录 parentId 以便销毁后追溯
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
        moneyDelta: Number(moneyDelta) || 0,
        hasGlitch: currentTask?.hasGlitch || false,
        glitchResponse,
        hasEcho: currentTask?.hasEcho || false,
        echoResponse
      }
      logs.push(newLog)
      localStorage.setItem('lifehud.logs', JSON.stringify(logs))
      setLogs(logs.sort((a,b) => (b.endTime||0) - (a.endTime||0)))
    } catch {}

    // 从 tasks 中移除
    setTasks(prev => prev.filter(t => t.id !== activeTaskId))

    setActiveTaskId(null)
    setStartTime(null)
    setIsSettling(false)
    setBodyState(null)
    setWisdomType('')
    setWisdomQuote('')
    setCharisma('')
    setMoods([])
    setMoneyDelta('')
    setGlitchTriggered(false)
    setGlitchText('')
    setGlitchResponse('')
    setEchoData(null)
    setEchoResponse('')
    setShowEchoOverlay(false)
    setDivergeMode(false)
    setDivergeTask('')
  }

  const confirmArchive = () => {
    const endTime = Date.now()
    try {
      const raw = localStorage.getItem('lifehud.logs')
      const logs = raw ? JSON.parse(raw) : []
      const newLog = {
        taskId: activeTaskId,
        parentId: currentTask?.parentId, // 记录 parentId
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
        moneyDelta: Number(moneyDelta) || 0,
        hasGlitch: currentTask?.hasGlitch || false,
        glitchResponse,
        hasEcho: currentTask?.hasEcho || false,
        echoResponse
      }
      logs.push(newLog)
      localStorage.setItem('lifehud.logs', JSON.stringify(logs))
      setLogs(logs.sort((a,b) => (b.endTime||0) - (a.endTime||0)))
    } catch {}
    
    // 如果是日常副本，结算后重置为待启动（实现循环）
    if (currentTask && currentTask.type === '日常') {
      setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, status: '待启动', hasGlitch: false, hasEcho: false } : t))
    }

    setActiveTaskId(null)
    setStartTime(null)
    setIsSettling(false)
    setBodyState(null)
    setWisdomType('')
    setWisdomQuote('')
    setCharisma('')
    setMoods([])
    setMoneyDelta('')
    setGlitchTriggered(false)
    setGlitchText('')
    setGlitchResponse('')
    setEchoData(null)
    setEchoResponse('')
    setShowEchoOverlay(false)
    setDivergeMode(false)
    setDivergeTask('')
  }

  const [echoData, setEchoData] = useState(null)
  const [showEchoOverlay, setShowEchoOverlay] = useState(false)
  const [echoResponse, setEchoResponse] = useState('')

  useEffect(() => {
    if (!activeTaskId || isSettling || divergeMode) return
    const checkId = setInterval(() => {
      const durationMin = (Date.now() - startTime) / 60000
      const entropyHigh = entropy > 85
      if (durationMin > 90 || entropyHigh) {
        const t = divergePool[Math.floor(Math.random() * divergePool.length)]
        setDivergeTask(t)
        setDivergeMode(true)
      }
    }, 10000)
    return () => clearInterval(checkId)
  }, [activeTaskId, startTime, entropy, isSettling, divergeMode])

  useEffect(() => {
    if (!activeTaskId || isSettling || divergeMode) return
    const minuteId = setInterval(() => {
      const hit = Math.random() < 0.1
      if (hit) {
        let cmd = ''
        let logsArr = []
        try {
          const raw = localStorage.getItem('lifehud.logs')
          logsArr = raw ? JSON.parse(raw) : []
        } catch {}

        if (logsArr.length >= 3 && Math.random() < 0.3) {
          const wisdoms = logsArr.filter(l => l.wisdomQuote && l.wisdomQuote.trim())
          if (wisdoms.length > 0) {
            const pick = wisdoms[Math.floor(Math.random() * wisdoms.length)]
            const d = new Date(pick.endTime)
            const Y = d.getFullYear()
            const M = String(d.getMonth()+1).padStart(2,'0')
            const D = String(d.getDate()).padStart(2,'0')
            const dateStr = `${Y}-${M}-${D}`
            
            setEchoData({ date: dateStr, quote: pick.wisdomQuote })
            setShowEchoOverlay(true)
            setTimeout(() => setShowEchoOverlay(false), 10000)
            setTasks(prev => prev.map(it => it.id === activeTaskId ? { ...it, hasEcho: true } : it))
            return 
          }
        }
        
        cmd = glitchPool[Math.floor(Math.random() * glitchPool.length)]
        setGlitchTriggered(true)
        setGlitchText(cmd)
        setTasks(prev => prev.map(it => it.id === activeTaskId ? { ...it, hasGlitch: true } : it))
      }
    }, 60000)
    return () => clearInterval(minuteId)
  }, [activeTaskId, isSettling])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('lifehud.logs')
      const arr = raw ? JSON.parse(raw) : []
      arr.sort((a,b) => (b.endTime||0) - (a.endTime||0))
      setLogs(arr)
    } catch {
      setLogs([])
    }
  }, [view, isSettling])

  const resolveDiverge = () => {
    // 降低熵值 40% (模拟) -> 实际上是记录一次纠偏，下次计算熵值时会重新计算
    // 这里我们直接修改 logs，插入一条特殊的纠偏记录，从而影响后续的计算（或者简单地让 entropy 状态暂时减小，但最稳妥是影响计算源）
    // 为了简化，我们直接修改当前任务状态，并强制让下次 entropy 计算变低可能比较复杂。
    // 更好的方式：在 logs 里记录这次偏离完成。calculateEntropy 函数可以识别这种记录并给予“奖励”。
    
    // 我们约定：type='DIVERGE_FIX' 的记录会大幅降低计算出的熵值
    try {
      const raw = localStorage.getItem('lifehud.logs')
      const logs = raw ? JSON.parse(raw) : []
      logs.push({
        taskId: `diverge-${Date.now()}`,
        title: '路径纠偏',
        type: 'DIVERGE_FIX',
        endTime: Date.now(),
        divergeTask
      })
      localStorage.setItem('lifehud.logs', JSON.stringify(logs))
      
      // 强制刷新 logs 视图（如果需要）并重新计算 entropy
      const arr = logs
      arr.sort((a,b) => (b.endTime||0) - (a.endTime||0))
      setLogs(arr)
      
      // 手动触发一次熵值更新（虽然 useEffect 会监听 tasks，但 logs 变化也需要）
      // 我们可以把 logs 加入到 calculateEntropy 的依赖或者直接在这里调用
      // 简单起见，我们重新计算
      
      // 临时计算一下
      const last = arr.slice(0,5)
      // 如果包含 DIVERGE_FIX，我们给予奖励
      // 修改 calculateEntropy 逻辑会更好
    } catch {}

    setDivergeMode(false)
    setDivergeTask('')
  }

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
      const d = new Date()
      const Y = d.getFullYear()
      const M = String(d.getMonth()+1).padStart(2,'0')
      const D = String(d.getDate()).padStart(2,'0')
      const h = String(d.getHours()).padStart(2,'0')
      const m = String(d.getMinutes()).padStart(2,'0')
      const nowStr = `${Y}${M}${D}_${h}${m}`

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

  const sealed = entropy > 70
  return (
    <div className="min-h-screen" style={{ filter: `saturate(${1 - entropy / 100})` }}>
      <div className="max-w-2xl mx-auto p-4">
        <header className="py-4">
          <div className="font-mono text-sm tracking-tight">
            [ TERMINAL v1.0 - LIFE_NAVIGATOR ]
          </div>
          <div className="border-b border-slate-700 mt-2" />
        </header>
        {entropy > 90 && (
          <div
            className="fixed inset-0 pointer-events-none z-50"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 2px), repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 2px)',
              opacity: 0.15
            }}
          />
        )}
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
          <button
            onClick={() => setView('mainquest')}
            className={`text-xs rounded-md px-3 py-1 flex items-center gap-1 ${view==='mainquest' ? 'bg-slate-800 text-slate-200 ring-1 ring-cyan-500' : 'bg-slate-900 text-slate-400 ring-1 ring-slate-700'}`}
          >
            <span>MainQuest</span>
          </button>
        </div>
        {view==='terminal' && currentTask ? (
          <section className="mt-16 flex flex-col items-center text-center gap-8">
            <div className="text-2xl sm:text-3xl text-slate-200">
              TARGET: <span className="font-semibold">[ {currentTask.title} ]</span>
            </div>
            <div className={`font-mono text-3xl sm:text-4xl ${glitchTriggered ? 'text-fuchsia-300 animate-pulse' : (currentTask.hasEcho ? 'text-slate-100 animate-pulse' : 'text-slate-100')}`}>
              ELAPSED: {elapsed}
            </div>
            {glitchTriggered && glitchText && (
              <div className="bg-fuchsia-500/10 text-fuchsia-300 rounded-md px-3 py-2 text-sm font-semibold">
                {glitchText}
              </div>
            )}
            {showEchoOverlay && echoData && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-none">
                <div className="text-center p-6 animate-pulse">
                  <div className="text-cyan-400 text-sm font-mono mb-4">[ 时空回响：你在 {echoData.date} 曾觉察到 ]</div>
                  <div className="text-2xl sm:text-3xl font-serif italic text-slate-100">
                    「{echoData.quote}」
                  </div>
                </div>
              </div>
            )}
            
            {divergeMode && (
              <div className="fixed inset-0 z-50 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-pulse" style={{ background: 'linear-gradient(135deg, #450a0a 0%, #2a0a0a 100%)' }}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #ef4444 0%, transparent 70%)', animation: 'pulse 4s infinite' }}></div>
                <div className="relative z-10">
                  <div className="text-red-500 font-mono text-xl mb-4">[ 警告：意识僵死 / ENTROPY CRITICAL ]</div>
                  <div className="text-red-200 text-3xl font-bold mb-8">系统强制执行偏离协议</div>
                  <div className="max-w-xl bg-red-900/20 border-2 border-red-500/50 rounded-lg p-6 mb-8 mx-auto">
                    <div className="text-red-300 text-lg">{divergeTask}</div>
                  </div>
                  <button
                    onClick={resolveDiverge}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-md shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                  >
                    已完成偏离
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={endTask}
              className={`mt-8 border-2 border-amber-500 text-amber-400 rounded-md px-5 py-3 ${divergeMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-500/10'}`}
            >
              结束任务并结算感知
            </button>
            {currentTask.type === '日常' && !divergeMode && (
              <button
                onClick={achieveRoutine}
                className="mt-4 border-2 border-cyan-500 text-cyan-400 rounded-md px-5 py-2 hover:bg-cyan-500/10 text-sm"
              >
                已达成副本 (销毁)
              </button>
            )}
            {isSettling && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="max-w-2xl w-full mx-4 border border-slate-700 rounded-lg bg-slate-900/80 p-6 max-h-[80vh] overflow-y-auto">
                  <div className="text-slate-200 font-mono text-sm mb-4">[ 结算档案 ]</div>
                  {currentTask?.hasGlitch && (
                    <div className="border border-fuchsia-500/40 rounded-md p-3 mb-3">
                      <div className="text-fuchsia-300 text-sm mb-2">[ 系统监测到视域闪变，你是否察觉并响应？ ]</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setGlitchResponse('观察到了并执行')}
                          className={`px-3 py-1 text-xs rounded-md ${glitchResponse==='观察到了并执行' ? 'bg-fuchsia-600/20 text-fuchsia-200 ring-2 ring-fuchsia-400' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'}`}
                        >
                          A. 观察到了并执行
                        </button>
                        <button
                          onClick={() => setGlitchResponse('观察到了但忽略')}
                          className={`px-3 py-1 text-xs rounded-md ${glitchResponse==='观察到了但忽略' ? 'bg-fuchsia-600/20 text-fuchsia-200 ring-2 ring-fuchsia-400' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'}`}
                        >
                          B. 观察到了但忽略
                        </button>
                        <button
                          onClick={() => setGlitchResponse('全然未觉察')}
                          className={`px-3 py-1 text-xs rounded-md ${glitchResponse==='全然未觉察' ? 'bg-fuchsia-600/20 text-fuchsia-200 ring-2 ring-fuchsia-400' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'}`}
                        >
                          C. 全然未觉察
                        </button>
                      </div>
                    </div>
                  )}
                  {currentTask?.hasEcho && (
                    <div className="border border-cyan-500/40 rounded-md p-3 mb-3">
                      <div className="text-cyan-300 text-sm mb-2">[ 历史回响校准 ]</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEchoResponse('正在践行')}
                          className={`px-3 py-1 text-xs rounded-md ${echoResponse==='正在践行' ? 'bg-cyan-600/20 text-cyan-200 ring-2 ring-cyan-400' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'}`}
                        >
                          正在践行
                        </button>
                        <button
                          onClick={() => setEchoResponse('已然背离')}
                          className={`px-3 py-1 text-xs rounded-md ${echoResponse==='已然背离' ? 'bg-cyan-600/20 text-cyan-200 ring-2 ring-cyan-400' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'}`}
                        >
                          已然背离
                        </button>
                        <button
                          onClick={() => setEchoResponse('有了新诠释')}
                          className={`px-3 py-1 text-xs rounded-md ${echoResponse==='有了新诠释' ? 'bg-cyan-600/20 text-cyan-200 ring-2 ring-cyan-400' : 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'}`}
                        >
                          有了新诠释
                        </button>
                      </div>
                    </div>
                  )}
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
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-emerald-300">[ 需求得到满足 ]</div>
                        {sealed && <div className="text-[11px] text-slate-400">[ 视域受限 ]</div>}
                      </div>
                      <div className="max-h-52 overflow-auto flex flex-wrap gap-2">
                            {['兴奋','喜悦','欣喜','甜蜜','精力充沛','兴高采烈','感激','感动','乐观','自信','振作','振奋','开心','高兴','快乐','愉快','幸福','陶醉','满足','欣慰','心旷神怡','喜出望外','平静','自在','舒适','放松','踏实','安全','温暖','放心','无忧无虑'].map(w => {
                              const active = moods.includes(w)
                              return (
                                <button
                                  key={w}
                              onClick={() => sealed ? null : setMoods(prev => active ? prev.filter(x=>x!==w) : [...prev,w])}
                              className={`px-2 py-1 rounded-md text-xs ${sealed ? 'bg-slate-800 text-slate-400 ring-1 ring-slate-700 cursor-not-allowed' : (active ? 'ring-2 ring-cyan-400 animate-pulse bg-emerald-900 text-emerald-200' : 'ring-1 ring-slate-700 bg-emerald-950 text-emerald-300')}`}
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
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="任务名称"
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
                {type !== '主线' && (
                  <select
                    value={parentId}
                    onChange={e => setParentId(e.target.value)}
                    className="bg-slate-900 text-slate-300 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-600 max-w-[150px]"
                  >
                    <option value="">关联上级任务</option>
                    {tasks
                      .filter(t => (type === '支线' ? t.type === '主线' : t.type === '支线'))
                      .map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))
                    }
                  </select>
                )}
                <div className="ml-auto text-xs text-slate-400 font-mono whitespace-nowrap">
                  ENTROPY: {String(entropy).padStart(2,'0')}%
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="任务详情 (可选)"
                  className="flex-1 bg-slate-900 text-slate-300 placeholder-slate-500 border border-slate-700/60 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-600"
                />
                <button
                  onClick={onAdd}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-md px-4 py-2 whitespace-nowrap"
                >
                  录入
                </button>
              </div>
            </div>
 
            <div className="border border-slate-800 rounded-md">
              <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-800">
                看板
              </div>
              {tasks.filter(t => t.status === '待启动').length ? (
                <ul className="divide-y divide-slate-800">
                  {tasks.filter(t => t.status === '待启动').map(item => (
                    <li key={item.id} className="px-3 py-3 flex items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">[ {item.type} ]</span>
                        {item.type === '日常' && <span className="text-xs text-cyan-500 font-bold">∞</span>}
                        {item.type === '支线' && (
                          <span className="text-xs text-emerald-500 font-mono">
                            ⌛ {formatHM(getTaskTotalTime(item.id))}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-slate-200 truncate">{item.title}</span>
                        {item.description && (
                          <span className="text-xs text-slate-500 truncate" title={item.description}>
                            {item.description}
                          </span>
                        )}
                      </div>
                      </div>
                      {item.type === '日常' ? (
                        <button
                          onClick={() => startTask(item.id)}
                          className="bg-cyan-600 hover:bg-cyan-500 text-slate-900 rounded-md px-3 py-1 text-sm"
                        >
                          启动
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          {item.type === '支线' && !item.isSummitted && (
                            <button
                              onClick={() => onAchieveSideQuest(item)}
                              className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 border border-emerald-600 rounded-md px-3 py-1 text-sm"
                            >
                              达成
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (item.type === '主线') {
                                setSelectedMainQuestId(item.id)
                                setView('mainquest')
                              } else if (item.type === '支线') {
                                setSelectedMainQuestId(item.parentId)
                                setScrollToSideQuestId(item.id)
                                setView('mainquest')
                              }
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-md px-3 py-1 text-sm"
                          >
                            跳转
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-4 text-sm text-slate-500">[ 暂无待处理视域 ]</div>
              )}
            </div>
          </section>
        ) : view === 'mainquest' ? (
          <div className="mt-4 min-h-[60vh] bg-slate-900/30 rounded-lg relative overflow-hidden flex flex-col">
            <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-10">
              <div className="text-2xl font-serif italic text-slate-200/40 tracking-widest">
                踏上取经路比取得真经更重要
              </div>
            </div>
            
            <div className="p-6 pt-24 relative z-20 flex-1 flex flex-col">
              <div className="max-w-md mx-auto w-full mb-8">
                <select 
                  className="w-full bg-slate-800/80 text-slate-200 border border-slate-700 rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  value={selectedMainQuestId}
                  onChange={e => setSelectedMainQuestId(e.target.value)}
                >
                  <option value="">选择主线剧情...</option>
                  {tasks.filter(t => t.type === '主线').map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              
              {selectedMainQuestId && (
                <div className="flex-1 overflow-x-auto overflow-y-hidden pt-12 pb-4 flex items-end gap-2 px-12 min-h-[300px]">
                  <svg className="h-0 w-0 absolute">
                    <defs>
                      <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#06b6d4', stopOpacity:0.8}} />
                        <stop offset="100%" style={{stopColor:'#06b6d4', stopOpacity:0}} />
                      </linearGradient>
                      <linearGradient id="grad-amber" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#f59e0b', stopOpacity:0.8}} />
                        <stop offset="100%" style={{stopColor:'#f59e0b', stopOpacity:0}} />
                      </linearGradient>
                      <linearGradient id="grad-slate" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#475569', stopOpacity:0.6}} />
                        <stop offset="100%" style={{stopColor:'#475569', stopOpacity:0}} />
                      </linearGradient>
                    </defs>
                  </svg>
                  {tasks
                    .filter(t => String(t.parentId) === String(selectedMainQuestId) && t.type === '支线')
                    .map((t, idx) => {
                      const totalMs = getTaskTotalTime(t.id)
                      const altitude = Math.floor(totalMs / 60000)
                      const isSummitted = t.isSummitted
                      // 检查该支线下是否有正在进行的任务
                      const isActive = activeTaskId && tasks.find(sub => sub.id === activeTaskId && sub.parentId === t.id)
                      
                      const width = 200
                      const height = Math.min(300, Math.max(50, altitude * 2)) // 最小高度50，最大300
                      
                      // 生成山体路径 (基于ID的伪随机)
                      const seed = t.id
                      const prng = (s) => {
                        let x = Math.sin(s) * 10000
                        return x - Math.floor(x)
                      }
                      
                      // 简单的崎岖路径: 5个点
                      const p1 = [0, 300]
                      const p2 = [width * 0.25, 300 - height * (0.3 + prng(seed)*0.2)]
                      const p3 = [width * 0.5, 300 - height] // 峰顶
                      const p4 = [width * 0.75, 300 - height * (0.4 + prng(seed+1)*0.2)]
                      const p5 = [width, 300]
                      
                      const d = `M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]} L ${p4[0]} ${p4[1]} L ${p5[0]} ${p5[1]} Z`
                      
                      return (
                        <div key={t.id} id={`side-quest-${t.id}`} className="relative group shrink-0" style={{ width, height: 320 }}>
                          <svg width={width} height={320} className="overflow-visible">
                            <path 
                              d={d} 
                              fill={`url(#grad-${isSummitted ? 'amber' : (isActive ? 'cyan' : 'slate')})`}
                              stroke={isSummitted ? '#f59e0b' : (isActive ? '#06b6d4' : '#475569')}
                              strokeWidth="2"
                              className="transition-all duration-1000 ease-in-out"
                              style={{ 
                                filter: isActive ? 'drop-shadow(0 0 10px rgba(6,182,212,0.5))' : 'none',
                                transformOrigin: 'bottom',
                                transform: isActive ? 'scaleY(1.02)' : 'scaleY(1)' // 简单的呼吸效果
                              }}
                            />
                            {isSummitted && (
                              <g transform={`translate(${width/2 - 10}, ${300 - height - 30})`}>
                                <path d="M5 0 L15 5 L5 10 V25" stroke="#f59e0b" strokeWidth="2" fill="#fbbf24" />
                              </g>
                            )}
                          </svg>
                          
                          {/* 悬浮显示海拔 */}
                          <div 
                            className="absolute left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{ top: 300 - height - 10, transform: 'translateY(-100%)' }}
                          >
                            <div className="bg-slate-900/80 text-slate-200 px-2 py-1 rounded text-xs border border-slate-700 font-mono">
                              {formatHM(totalMs)}
                            </div>
                          </div>
                          
                          {/* 底部名称 */}
                          <div className="absolute bottom-0 left-0 right-0 text-center pb-2">
                            <div className="text-xs text-slate-400 truncate px-2 font-mono">
                              {t.title}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  }
                  {tasks.filter(t => String(t.parentId) === String(selectedMainQuestId) && t.type === '支线').length === 0 && (
                     <div className="w-full text-center text-slate-500 py-20">
                       [ 该主线暂无已探明的支线领域 ]
                     </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 装饰性背景元素 */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>

            {/* 达成庆贺弹窗 */}
            {celebration && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                <div className="text-center p-8 border-2 border-amber-500/50 bg-slate-900 rounded-lg shadow-[0_0_50px_rgba(245,158,11,0.3)] max-w-lg mx-4">
                  <div className="text-amber-500 font-mono text-sm mb-4 tracking-widest">[ 支线领域已完全征服 ]</div>
                  <div className="text-3xl font-bold text-slate-100 mb-2">{celebration.title}</div>
                  <div className="text-amber-400 font-mono text-xl mb-6">总耗时: {celebration.timeStr}</div>
                  <div className="text-slate-300 italic font-serif text-lg mb-8 leading-relaxed">
                    “享受一会成功的快乐吧，<br/>不要着急继续攀登。”
                  </div>
                  <button
                    onClick={() => setCelebration(null)}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold py-2 px-8 rounded-md transition-colors"
                  >
                    铭记此刻
                  </button>
                </div>
              </div>
            )}
          </div>
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
                        <div className="flex items-center gap-2">
                          {lg.hasGlitch ? <span className="text-xs text-fuchsia-400">⚡</span> : null}
                          {lg.type === 'DIVERGE_FIX' ? <span className="text-[10px] bg-red-900/50 text-red-300 px-1 rounded border border-red-800">路径纠偏</span> : null}
                          <div className="text-xs text-slate-500">
                            {formatDateTime(lg.startTime)} <span className="mx-1 opacity-50">/</span> {formatElapsed(lg.elapsedMs)}
                          </div>
                        </div>
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
