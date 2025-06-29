import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface User {
  id: string
  email: string
  name: string
}

// JWT token 验证
export async function verifyToken(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// 临时的演示用户登录
export function getDemoUser(): User {
  return {
    id: 'demo-user-id',
    email: 'demo@example.com',
    name: '演示用户'
  }
}