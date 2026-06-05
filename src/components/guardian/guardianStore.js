// Guardian Widget 客户端状态 (zustand v5)
import { create } from 'zustand'
import { sendGuardianMessage, fetchGuardianProfile, fetchGuardianState } from './guardianApi'

let seq = 0
const mid = () => `g${++seq}_${Date.now()}`

export const useGuardianStore = create((set, get) => ({
  widgetMode: 'collapsed',   // collapsed|expanded|checkin|prayer|devotion|reflection
  chatMode: 'companion',     // companion|comfort|prayer|devotion|reflection|idol-monitor|growth
  spriteState: 'idle',       // idle|listening|comforting|praying|celebrating|resting
  sending: false,
  messages: [
    { id: mid(), role: 'assistant', content: '你好，我是你的属灵守护者 🌱 今天心里还好吗？', mode: 'companion' },
  ],
  profile: null,             // { name, formStage, stageZh, stageEmoji, stageProgress }
  stateView: null,           // { currentMood, spiritualState, faithLevel, hopeLevel, loveLevel }
  lastEmotion: null,

  setWidgetMode: (m) => set({ widgetMode: m }),
  setChatMode: (m) => set({ chatMode: m }),

  sendMessage: async (text) => {
    const { chatMode, messages, sending } = get()
    const trimmed = (text || '').trim()
    if (!trimmed || sending) return
    set({
      sending: true,
      spriteState: 'listening',
      messages: [...messages, { id: mid(), role: 'user', content: trimmed, mode: chatMode }],
    })
    try {
      const data = await sendGuardianMessage(trimmed, chatMode)
      set((s) => ({
        messages: [...s.messages, {
          id: mid(), role: 'assistant',
          content: data.reply || '（守护者沉默了一下……请再试一次）', mode: chatMode,
        }],
        spriteState: data.spriteState || 'idle',
        lastEmotion: data.detectedEmotion || null,
      }))
      get().refresh()
    } catch (err) {
      set((s) => ({
        messages: [...s.messages, {
          id: mid(), role: 'assistant',
          content: err.message === 'Not authenticated' ? '请先登录，我才能记住我们的对话。' : '网络好像断开了，等下再试试好吗？',
          mode: chatMode,
        }],
        spriteState: 'idle',
      }))
    } finally {
      set({ sending: false })
    }
  },

  refresh: async () => {
    try {
      const [p, s] = await Promise.all([fetchGuardianProfile(), fetchGuardianState()])
      set({
        profile: {
          name: p.profile.name,
          formStage: p.profile.formStage,
          stageZh: p.stageInfo.zh,
          stageEmoji: p.stageInfo.emoji,
          stageProgress: p.stageProgress,
        },
        stateView: {
          currentMood: s.state.currentMood,
          spiritualState: s.state.spiritualState,
          faithLevel: s.latestCheckIn?.faithLevel ?? 5,
          hopeLevel: s.latestCheckIn?.hopeLevel ?? 5,
          loveLevel: s.latestCheckIn?.loveLevel ?? 5,
        },
      })
    } catch {
      /* 未登录或网络失败时保持现状 */
    }
  },
}))
