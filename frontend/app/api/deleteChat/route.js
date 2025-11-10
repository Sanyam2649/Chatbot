import { deleteChatSession } from "@/lib/vector-store";

export async function POST(request) {
  try {
    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, error: "sessionId and userId are required" },
        { status: 400 }
      );
    }

    const result = await deleteChatSession(sessionId, userId);

    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || "Failed to delete session memory" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      response: result.response ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ /api/chat/clear-session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}