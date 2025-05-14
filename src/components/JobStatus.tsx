"use client";

import { useEffect, useState } from "react";

interface JobStatusProps {
  jobId: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

type JobStatusData = {
  status: "queued" | "started" | "in_progress" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
};

const JobStatus = ({ jobId, onComplete, onError }: JobStatusProps) => {
  const [status, setStatus] = useState<JobStatusData | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}queue/job-status-stream/${jobId}`,
      { withCredentials: true }
    );

    const handleStatus = (event: MessageEvent) => {
      try {
        const data: JobStatusData = JSON.parse(event.data);
        setStatus(data);

        if (data.status === "completed" && onComplete) {
          onComplete(data.result);
          eventSource.close();
        }

        if (data.status === "failed") {
          if (onError) onError(data.error || "Job failed");
          eventSource.close();
        }
      } catch (err) {
        console.error("Error parsing status event:", err);
      }
    };

    const handleError = (event: MessageEvent) => {
      console.error("EventSource error:", event);
      if (onError) onError("Connection error");
      eventSource.close();
    };

    eventSource.addEventListener("status", handleStatus);
    eventSource.addEventListener("error", handleError);

    return () => {
      eventSource.removeEventListener("status", handleStatus);
      eventSource.removeEventListener("error", handleError);
      eventSource.close();
    };
  }, [jobId, onComplete, onError]);

  return (
    <div className="status-container">
      {status && (
        <>
          <div className="status-row">
            Status:{" "}
            <span className={`status-badge ${status.status}`}>
              {status.status}
            </span>
          </div>

          {status.progress !== undefined && (
            <div className="progress-container">
              <div
                className="progress-bar"
                style={{ width: `${status.progress}%` }}
              >
                <span className="progress-text">
                  {Math.round(status.progress)}%
                </span>
              </div>
            </div>
          )}

          {status.error && (
            <div className="error-message">Error: {status.error}</div>
          )}

          {status.result && (
            <div className="result-message">
              Result: {String(status.result)}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .status-container {
          border: 1px solid #eaeaea;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .status-row {
          margin-bottom: 1rem;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .status-badge.queued {
          background: #f0f0f0;
          color: #666;
        }
        .status-badge.started {
          background: #e3f2fd;
          color: #1976d2;
        }
        .status-badge.in_progress {
          background: #fff3e0;
          color: #f57c00;
        }
        .status-badge.completed {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .status-badge.failed {
          background: #ffebee;
          color: #c62828;
        }

        .progress-container {
          background: #f5f5f5;
          border-radius: 4px;
          height: 20px;
          margin: 1rem 0;
          overflow: hidden;
        }

        .progress-bar {
          background: #0070f3;
          height: 100%;
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
        }

        .progress-text {
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .error-message {
          color: #c62828;
          margin-top: 1rem;
        }

        .result-message {
          color: #2e7d32;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default JobStatus;
