import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import pdf from "pdf-parse";

// Helper to initialize GoogleGenAI client
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please check your config.");
  }
  return new GoogleGenAI({ apiKey });
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string;
    const file = formData.get("file") as File | null;

    // Validate parameters
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: 'message'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try initializing Google Gen AI client
    let ai;
    try {
      ai = getClient();
    } catch (configError: any) {
      return new Response(
        JSON.stringify({ error: configError.message || "API key configuration missing." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract text from the binary file or fall back to empty
    let documentContent = "";
    if (file) {
      try {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const options = {
            pagerender: function(pageData: any) {
              return pageData.getTextContent().then(function(textContent: any) {
                return textContent.items.map((item: any) => item.str).join(' ');
              });
            }
          };

          // Pass options as the second argument to pdf-parse to run worker inline
          const data = await pdf(buffer, options);
          documentContent = data.text || "";
        } else {
          // Extract text for txt, md, docx and other text-based files
          documentContent = await file.text();
        }
      } catch (parseError: any) {
        return new Response(
          JSON.stringify({ error: `Failed to parse file content: ${parseError?.message || parseError}` }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Context-enhanced instruction prompt
    const contextPrompt = `You are a professional Smart Document Assistant.
You have access to the following document content as your reference. Please answer the user's question accurately using this context.
If the answer cannot be determined or inferred from the document, tell the user that the information is not present in the document content, but provide a general answer based on your knowledge if possible.

Document Reference Content:
===
${documentContent || "(No document content has been uploaded or provided.)"}
===

User Question:
${message}`;

    // Call the Gemini-2.5-flash model synchronously
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: contextPrompt }],
        },
      ],
    });

    const responseText = response.text || "No response text was generated.";

    // Return the generated text as a clean JSON payload
    return new Response(
      JSON.stringify({ text: responseText }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
