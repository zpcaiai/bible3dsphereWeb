import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import RealtimeRoot from '../realtime/RealtimeRoot'
import VoiceRoomPage from '../VoiceRoomPage'
import realtimeStore from '../realtime/realtimeStore'
import { addRemoteLine, clearNotes, getTranscript } from '../realtime/callNotes'

describe('Slice 3: Post-Call AI Minutes & Missed-Call Voicemail', () => {
  beforeEach(() => {
    clearNotes()
    realtimeStore._setState({ incomingCall: null, activeCall: null })
  })

  it('opens MinutesModal automatically when a 1-on-1 call in RealtimeRoot ends with transcript notes', async () => {
    render(<RealtimeRoot user={{ email: 'peter@example.com', nickname: '彼得' }} />)

    act(() => {
      realtimeStore._setState({
        activeCall: {
          creds: { url: 'wss://test.livekit.cloud', token: 'tok-123', room: 'r1' },
          title: '约翰弟兄',
          outgoing: false,
          peer: 'john@example.com',
        },
      })
      addRemoteLine('约翰弟兄', '请为我们小组下周的福音茶会和病患探访同心代祷。')
    })

    // End the call
    act(() => {
      realtimeStore.endCall()
    })

    await waitFor(() => {
      expect(screen.getByText(/聚会纪要/)).toBeTruthy()
      expect(screen.getByText(/约翰弟兄：请为我们小组下周的福音茶会和病患探访同心代祷。/)).toBeTruthy()
    })

    // Close MinutesModal and verify notes are cleared
    fireEvent.click(screen.getByText('完成'))
    expect(getTranscript()).toBe('')
  })

  it('opens VoicemailModal when an outgoing 1-on-1 call in RealtimeRoot is declined/unanswered', async () => {
    render(<RealtimeRoot user={{ email: 'peter@example.com', nickname: '彼得' }} />)

    act(() => {
      realtimeStore._setState({
        activeCall: {
          creds: { url: 'wss://test.livekit.cloud', token: 'tok-456', room: 'r2' },
          title: '马利亚姐妹',
          outgoing: true,
          peer: 'mary@example.com',
        },
      })
    })

    // Simulate peer declining / unanswered timeout
    act(() => {
      realtimeStore._handle({ type: 'call_decline', from: 'mary@example.com', room: 'r2' })
    })

    await waitFor(() => {
      expect(screen.getByText(/马利亚姐妹/)).toBeTruthy()
      expect(screen.getByText(/对方未接听/)).toBeTruthy()
    })

    // Close VoicemailModal
    fireEvent.click(screen.getByText('×'))
  })

  it('opens MinutesModal from VoiceRoomPage to review transcript and generate prayer items', async () => {
    addRemoteLine('保罗', '求主赐给慕道班学员饥渴慕义的心，坚固家庭祭坛。')
    render(<VoiceRoomPage user={{ email: 'paul@example.com', nickname: '保罗' }} token="tok-test" onBack={() => {}} />)

    const minutesBtn = screen.getByTestId('voice-room-minutes-btn')
    fireEvent.click(minutesBtn)

    await waitFor(() => {
      expect(screen.getByText(/聚会纪要/)).toBeTruthy()
      expect(screen.getByText(/保罗：求主赐给慕道班学员饥渴慕义的心，坚固家庭祭坛。/)).toBeTruthy()
    })
  })
})
