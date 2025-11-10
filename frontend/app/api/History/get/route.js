import { connectToDatabase } from "@/lib/mongoDB";
import chatSession from "@/models/chatSession";
import { NextResponse } from "next/server";


// GET /api/chat/history?userId=<USER_ID>
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const sessions = await chatSession.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No chat history found for this user",
        sessions: [],
      });
    }

    const formatted = sessions.map((session) => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      totalMessages: session.messages.length,
      messagesPreview: session.messages.slice(-3),
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      sessions: formatted,
    });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch chat history",
      },
      { status: 500 }
    );
  }
}
