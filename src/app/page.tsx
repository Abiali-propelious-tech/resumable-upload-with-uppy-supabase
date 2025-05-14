"use client";
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import FileUploader from "@/components/FileUploader";
function App() {
  const [flowId, setFlowId] = useState<string | null>(null);

  const generateFlow = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.error("User is not signed in");
        return;
      }

      const response = await axios.get(
        "http://localhost:8000/api/v1/flow/generate-flow",
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      setFlowId(response.data.data[0].id);
    } catch (error) {
      console.error("Error generating flow:", error);
      throw error;
    }
  };

  const signIn = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({
      email: "abiali.doctor@propelius.tech",
      password: "@newPassword123",
    });
  }, []);

  return (
    <>
      <button onClick={signIn}>Sign in</button>
      <br />
      <button onClick={generateFlow}>Generate Flow</button>
      <h1
        style={{
          color: "white",
        }}
      >
        {flowId}
      </h1>
      <br></br>
      {flowId && <FileUploader key={flowId} flowId={flowId} />}
    </>
  );
}
export default App;
