import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface User {
  id: string
  email: string
  name: string
}

// 简化的认证函数，用于演示
export async function verifyToken(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 为了演示，返回一个模拟用户
      return {
        id: 'demo-user-id',
        email: 'demo@example.com',
        name: '演示用户'
      }
    }

    const token = authHeader.substring(7)
    
    // 简化的token验证，实际应用中应该使用JWT
    if (token === 'demo-token') {
      return {
        id: 'demo-user-id',
        email: 'demo@example.com',
        name: '演示用户'
      }
    }
    
    return null
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function generateToken(user: User): string {
  // 简化的token生成，实际应用中应该使用JWT
  return 'demo-token'
}