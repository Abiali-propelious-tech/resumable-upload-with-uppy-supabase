import { supabase } from "@/lib/supabase";
import axios from "axios";
import { useEffect, useState } from "react";
import { Tus, Uppy } from "uppy";

/**
 * Custom hook for configuring Uppy with Supabase authentication and TUS resumable uploads
 * @param {Object} options - Configuration options for the Uppy instance.
 * @param {string} options.bucketName - The bucket name in Supabase where files are stored.
 * @returns {Object} uppy - Uppy instance with configured upload settings.
 */
export const useUppyWithSupabase = ({
  bucketName = "test-bucket",
  flowId = null,
}: {
  bucketName?: string;
  flowId?: string | null;
}) => {
  // Initialize Uppy instance only once
  const [uppy] = useState(() => new Uppy());

  // Initialize Supabase client with project URL and anon key
  useEffect(() => {
    console.log("🚀 ~ flowId:", flowId);
    const initializeUppy = async () => {
      // Retrieve the current user's session for authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();
      uppy
        .use(Tus, {
          // endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${session?.user.id}/`, // Supabase TUS endpoint
          endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000], // Retry delays for resumable uploads
          headers: {
            authorization: `Bearer ${session?.access_token}`, // User session access token
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", // API key for Supabase
          },
          uploadDataDuringCreation: true, // Send metadata with file chunks
          removeFingerprintOnSuccess: true, // Remove fingerprint after successful upload
          chunkSize: 6 * 1024 * 1024, // Chunk size for TUS uploads (6MB)
          allowedMetaFields: [
            "bucketName",
            "objectName",
            "contentType",
            "cacheControl",
          ], // Metadata fields allowed for the upload
          onError: (error) => console.error("Upload error:", error), // Error handling for uploads
        })
        .on("file-added", (file) => {
          // Attach metadata to each file, including bucket name and content type
          file.meta = {
            ...file.meta,
            bucketName, // Bucket specified by the user of the hook
            objectName: `${session?.user.id}/${flowId}/${file.name}`, // Use file name as object name
            contentType: file.type, // Set content type based on file MIME type
          };
        })
        // ...existing code...
        .on("upload-success", async (file, response) => {
          try {
            // Get current session for auth token
            const {
              data: { session },
            } = await supabase.auth.getSession();

            // Prepare metadata payload
            const fileMetadata = {
              flow_id: flowId,
              file_name: file?.name,
              file_type: file?.type,
              file_size: file?.size,
            };

            // Call metadata upload API
            const result = await axios.post(
              "http://localhost:8000/api/v1/files/upload-file-metadata",
              fileMetadata,
              {
                headers: {
                  Authorization: `Bearer ${session?.access_token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            console.log("File metadata uploaded:", result.data);
          } catch (error) {
            console.error("Error uploading file metadata:", error);
          }
        });
      // ...existing code...
    };
    // Initialize Uppy with Supabase settings
    initializeUppy();
  }, [uppy, bucketName, supabase, flowId]);
  // Return the configured Uppy instance
  return uppy;
};
