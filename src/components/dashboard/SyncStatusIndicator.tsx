'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

interface SyncJob {
  id: string
  status: 'running' | 'completed' | 'failed'
  syncType: string
  recordsSynced: number
  recordsFailed: number
  durationMs: number | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

interface SyncStatusIndicatorProps {
  onSyncComplete?: () => void
}

export default function SyncStatusIndicator({ onSyncComplete }: SyncStatusIndicatorProps) {
  const [syncJob, setSyncJob] = useState<SyncJob | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sync/status')
      const data = await response.json()

      if (data.success && data.job) {
        setSyncJob(data.job)
        setIsVisible(true)

        // If running, continue polling
        if (data.job.status === 'running') {
          return true // Continue polling
        }

        // If completed or failed, show for a few seconds then hide
        if (data.job.status === 'completed') {
          onSyncComplete?.()
          setTimeout(() => setIsVisible(false), 5000)
        } else if (data.job.status === 'failed') {
          setTimeout(() => setIsVisible(false), 10000)
        }
      }
    } catch (err) {
      console.error('Error checking sync status:', err)
      setError(err instanceof Error ? err.message : 'Failed to check status')
    }
    return false
  }, [onSyncComplete])

  // Initial check and setup polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null

    const startPolling = async () => {
      const shouldContinue = await checkSyncStatus()

      if (shouldContinue) {
        // Poll every 2 seconds while sync is running
        pollInterval = setInterval(async () => {
          const stillRunning = await checkSyncStatus()
          if (!stillRunning && pollInterval) {
            clearInterval(pollInterval)
          }
        }, 2000)
      }
    }

    startPolling()

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [checkSyncStatus])

  // Start a new sync
  const startSync = async () => {
    try {
      setError(null)
      const response = await fetch('/api/sync/start', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        setSyncJob({
          id: data.jobId,
          status: 'running',
          syncType: 'full',
          recordsSynced: 0,
          recordsFailed: 0,
          durationMs: null,
          errorMessage: null,
          startedAt: new Date().toISOString(),
          completedAt: null
        })
        setIsVisible(true)

        // Start polling
        const pollInterval = setInterval(async () => {
          const stillRunning = await checkSyncStatus()
          if (!stillRunning) {
            clearInterval(pollInterval)
          }
        }, 2000)
      } else {
        setError(data.error || 'Failed to start sync')
      }
    } catch (err) {
      console.error('Error starting sync:', err)
      setError(err instanceof Error ? err.message : 'Failed to start sync')
    }
  }

  if (!isVisible && !syncJob) {
    return null
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  const getStatusColor = () => {
    if (!syncJob) return STARBUCKS.primaryGreen
    switch (syncJob.status) {
      case 'running': return STARBUCKS.gold
      case 'completed': return STARBUCKS.primaryGreen
      case 'failed': return '#DC2626'
      default: return STARBUCKS.primaryGreen
    }
  }

  const getStatusIcon = () => {
    if (!syncJob) return <RefreshCw className="w-4 h-4" />
    switch (syncJob.status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      default: return <RefreshCw className="w-4 h-4" />
    }
  }

  const getStatusText = () => {
    if (!syncJob) return 'No sync'
    switch (syncJob.status) {
      case 'running': return 'Syncing your data...'
      case 'completed': return 'Sync completed!'
      case 'failed': return 'Sync failed'
      default: return 'Unknown status'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div
        className={`rounded-xl shadow-lg overflow-hidden transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundColor: STARBUCKS.white,
          border: `1px solid ${STARBUCKS.lightGreen}`
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-2 flex items-center gap-2 text-white"
          style={{ backgroundColor: getStatusColor() }}
        >
          {getStatusIcon()}
          <span className="text-sm font-semibold">{getStatusText()}</span>
          {syncJob?.status === 'running' && (
            <button
              onClick={() => setIsVisible(false)}
              className="ml-auto text-white/80 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {syncJob?.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: STARBUCKS.primaryGreen }}>Records synced</span>
                <span className="font-semibold" style={{ color: STARBUCKS.darkGreen }}>{syncJob.recordsSynced}</span>
              </div>
              <div className="w-full rounded-full h-1.5" style={{ backgroundColor: STARBUCKS.lightGreen }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: STARBUCKS.gold,
                    width: `${Math.min(100, (syncJob.recordsSynced / 500) * 100)}%`
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>
                This may take a few minutes...
              </p>
            </div>
          )}

          {syncJob?.status === 'completed' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: STARBUCKS.primaryGreen }}>Records synced</span>
                <span className="font-semibold" style={{ color: STARBUCKS.primaryGreen }}>{syncJob.recordsSynced}</span>
              </div>
              {syncJob.durationMs && (
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: STARBUCKS.primaryGreen }}>Duration</span>
                  <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{formatDuration(syncJob.durationMs)}</span>
                </div>
              )}
            </div>
          )}

          {syncJob?.status === 'failed' && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{syncJob.errorMessage || 'Unknown error'}</p>
              <button
                onClick={startSync}
                className="text-sm font-medium hover:opacity-80"
                style={{ color: STARBUCKS.primaryGreen }}
              >
                Try again
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
