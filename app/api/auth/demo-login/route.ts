import { NextRequest, NextResponse } from "next/server"
import { generateToken, getDemoUser } from "@/lib/auth"

// POST /api/auth/demo-login - 演示登录
export async function POST(request: NextRequest) {
  try {
    const user = getDemoUser()
    const token = generateToken(user)

    return NextResponse.json({
      success: true,
      data: {
        token,
        user
      }
    })
  } catch (error) {
    console.error("Demo login error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "登录失败" } },
      { status: 500 }
    )
  }
}