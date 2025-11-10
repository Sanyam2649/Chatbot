import { NextResponse } from "next/server";
import { deleteVectorsByUserId } from "@/lib/vector-store";
import { getPineconeIndex } from "@/lib/vectorDB";

export async function POST(request) {
  try {
    try {
      await getPineconeIndex();
    } catch (error) {
      return NextResponse.json(
        { 
          error: "Vector database unavailable",
          details: error.message,
          suggestion: "Please check your Pinecone configuration"
        },
        { status: 500 }
      );
    }

    // Parse userId from body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId in request body" },
        { status: 400 }
      );
    }

    // Delete all vectors for this user
    const deleteResult = await deleteVectorsByUserId(userId);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error || "Failed to delete user vectors" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: deleteResult.message,
      details: deleteResult.response || {}
    });

  } catch (error) {
    console.error("❌ Error in POST /delete-user-vectors:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
