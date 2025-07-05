import { checkApiKey, getServerProfile } from "@lib/server/server-chat-helpers";
import { ServerRuntime } from "next";
import OpenAI from "openai";

export const runtime: ServerRuntime = "edge";

export async function GET() {
  try {
    // Get profile to retrieve API key
    const profile = await getServerProfile();

    // Check if the API key is valid
    checkApiKey(profile.openai_api_key, "OpenAI");

    // Initialize OpenAI with the API key and organization ID
    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id,
    });

    // Fetch assistant data
    const myAssistants = await openai.beta.assistants.list({
      limit: 100,
    });

    // Return response with assistant data
    return new Response(
      JSON.stringify({ assistants: myAssistants.data }),
      { status: 200 }
    );
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred";
    const errorCode = error.status || 500;

    return new Response(
      JSON.stringify({ message: errorMessage }),
      { status: errorCode }
    );
  }
}
