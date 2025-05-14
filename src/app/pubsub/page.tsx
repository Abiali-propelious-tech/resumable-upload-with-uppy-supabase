"use client";

import { useEffect, useState } from "react";

type JobStatusData = {
  status: "queued" | "started" | "in_progress" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
};

const JobTracker = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [manualJobId, setManualJobId] = useState<string>("");
  const [status, setStatus] = useState<JobStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startJob = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}queue/trigger-demo-task`,
        {
          method: "POST",
        }
      );
      const data = await response.json();
      if (data.job_id) {
        setJobId(data.job_id);
        setError(null);
      } else {
        setError("Failed to get job ID");
      }
    } catch (err) {
      console.error("Error starting job:", err);
      setError("Failed to start job");
    }
  };

  const startTrackingJob = () => {
    if (manualJobId.trim()) {
      setJobId(manualJobId.trim());
      setStatus(null); // clear previous result
      setError(null);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}queue/job-status-stream/${jobId}`,
      { withCredentials: true }
    );

    const handleStatus = (rawEvent: MessageEvent | string) => {
      const message = typeof rawEvent === "string" ? rawEvent : rawEvent.data;

      const dataLine = message
        .split("\n")
        .find((line: any) => line.startsWith("data: "));

      if (!dataLine) return;

      try {
        const json = JSON.parse(dataLine.replace("data: ", ""));
        setStatus(json);

        if (json.status === "completed" || json.status === "failed") {
          eventSource.close();
        }
      } catch (err) {
        console.error(
          "Error parsing data line:",
          err,
          "Raw dataLine:",
          dataLine
        );
      }
    };

    const handleError = () => {
      console.error("EventSource connection error");
      setError("Connection to server lost");
      eventSource.close();
    };

    eventSource.addEventListener("message", handleStatus);
    eventSource.addEventListener("error", handleError);

    return () => {
      eventSource.removeEventListener("message", handleStatus);
      eventSource.removeEventListener("error", handleError);
      eventSource.close();
    };
  }, [jobId]);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Job Demo</h1>

      <button
        onClick={startJob}
        disabled={!!jobId}
        style={{ padding: "0.5rem 1rem", marginBottom: "1rem" }}
      >
        Start Job
      </button>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Enter Job ID to track"
          value={manualJobId}
          onChange={(e) => setManualJobId(e.target.value)}
          style={{ padding: "0.5rem", marginRight: "0.5rem", width: "70%" }}
        />
        <button onClick={startTrackingJob} style={{ padding: "0.5rem 1rem" }}>
          Track Job
        </button>
      </div>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {status && (
        <div style={{ marginTop: "1rem" }}>
          <p>
            Status: <strong>{status.status}</strong>
          </p>

          {status.progress !== undefined && (
            <p>Progress: {Math.round(status.progress)}%</p>
          )}

          {status.result && (
            <p style={{ color: "green" }}>
              Result: {JSON.stringify(status.result)}
            </p>
          )}

          {status.error && (
            <p style={{ color: "red" }}>Error: {status.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default JobTracker;
