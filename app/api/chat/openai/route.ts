import { ChatSettings } from "@/types"
import { OpenAIStream, StreamingTextResponse } from "ai"
import { ServerRuntime } from "next"
import OpenAI from "openai"
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

export const runtime: ServerRuntime = "edge"

// CORS Handler for OPTIONS method
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow all origins (can restrict if needed)
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

// POST method to handle chat requests
export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    // Initialize OpenAI with the API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "", // Ensure the key is set in Vercel environment variables
    })

    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
      messages: messages as ChatCompletionCreateParamsBase["messages"],
      temperature: chatSettings.temperature,
      max_tokens:
        chatSettings.model === "gpt-4-vision-preview" ||
        chatSettings.model === "gpt-4o"
          ? 4096
          : null,
      stream: true,
    })

    // Return streamed response
    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream, {
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow CORS from all origins
      },
    })
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    // Handle specific error messages
    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your environment variables."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your environment variables."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow CORS from all origins
      },
    })
  }
}

