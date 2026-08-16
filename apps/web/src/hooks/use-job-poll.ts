import { useEffect, useRef } from 'react'
import { fetchImportJob, type ImportJob } from '../lib/api'

type Options = {
  job: ImportJob | null
  onProgress: (job: ImportJob) => void
  onFinished: (job: ImportJob) => void
  onRequestFailed: (message: string) => void
}

export const useJobPoll = ({
  job,
  onProgress,
  onFinished,
  onRequestFailed,
}: Options) => {
  const onProgressRef = useRef(onProgress)
  const onFinishedRef = useRef(onFinished)
  const onRequestFailedRef = useRef(onRequestFailed)
  onProgressRef.current = onProgress
  onFinishedRef.current = onFinished
  onRequestFailedRef.current = onRequestFailed

  useEffect(() => {
    if (!job || job.status === 'done' || job.status === 'error') return

    let cancelled = false
    const tick = async () => {
      try {
        const latest = await fetchImportJob(job.id)
        if (cancelled) return
        onProgressRef.current(latest)
        if (latest.status === 'done' || latest.status === 'error') {
          onFinishedRef.current(latest)
        }
      } catch (error) {
        if (!cancelled) {
          onRequestFailedRef.current(
            error instanceof Error ? error.message : 'Import failed',
          )
        }
      }
    }

    const intervalId = window.setInterval(() => {
      void tick()
    }, 1200)
    void tick()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [job])
}
