import { Pool } from "pg"

// 数据库连接池
class DatabaseService {
  private static instance: DatabaseService
  private pool: Pool

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "email_app",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "password",
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // 监听连接事件
    this.pool.on("connect", () => {
      console.log("Database connected")
    })

    this.pool.on("error", (err) => {
      console.error("Database connection error:", err)
    })
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  public getPool(): Pool {
    return this.pool
  }

  // 执行查询
  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log("Executed query", { text, duration, rows: result.rowCount })
      return result
    } catch (error) {
      console.error("Database query error:", { text, params, error })
      throw error
    }
  }

  // 事务执行
  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query("BEGIN")
      const result = await callback(client)
      await client.query("COMMIT")
      return result
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  // 关闭连接池
  public async close(): Promise<void> {
    await this.pool.end()
  }
}

export default DatabaseService
