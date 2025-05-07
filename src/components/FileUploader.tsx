"use client";
import { useUppyWithSupabase } from "@/hooks/useUppyWithSupabase";
import React, { useEffect } from "react";
import Dashboard from "@uppy/dashboard";

type Props = { flowId: string };

function FileUploader({ flowId }: Props) {
  const uppy = useUppyWithSupabase({
    bucketName: "test-bucket",
    flowId,
  });

  useEffect(() => {
    // Check if Dashboard plugin is already installed
    if (!uppy.getPlugin("Dashboard")) {
      uppy.use(Dashboard, {
        inline: true,
        target: "#drag-drop-area",
        showProgressDetails: true,
      });
    }

    // Cleanup function
  }, [uppy, flowId]); // Add uppy as dependency

  return <div id="drag-drop-area"></div>;
}

export default FileUploader;
