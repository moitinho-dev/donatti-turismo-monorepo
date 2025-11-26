import { Redis } from "@upstash/redis"

// Initialize Redis client with error handling
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
})

// Redis keys
export const REDIS_KEYS = {
  PROMOS: "lemonde:promos",
  USERS: "lemonde:users",
  USER_SESSIONS: "lemonde:user_sessions",
  LAYOUTS: "lemonde:layouts",
  LAYOUT_SETTINGS: "lemonde:layout_settings",
}

// Initialize Redis with default data if needed
export async function initializeRedis() {
  try {
    // Check if keys exist
    const promosExists = await redis.exists(REDIS_KEYS.PROMOS)
    const usersExists = await redis.exists(REDIS_KEYS.USERS)
    const sessionsExists = await redis.exists(REDIS_KEYS.USER_SESSIONS)

    // Initialize with empty arrays if not exists
    if (!promosExists) {
      await redis.set(REDIS_KEYS.PROMOS, [])
      console.log("Redis initialized with empty promos array")
    }

    if (!usersExists) {
      // Create default admin user
      const defaultAdmin = {
        id: "admin-default",
        email: "admin@donatti.com",
        name: "Administrador",
        password: "lemonde123", // In production, this should be hashed
        role: "admin",
        createdAt: new Date().toISOString(),
        active: true,
      }

      // Create default agent user
      const defaultAgent = {
        id: "agent-default",
        email: "agente@donatti.com",
        name: "Agente de Turismo",
        password: "lemonde123", // In production, this should be hashed
        role: "agent",
        createdAt: new Date().toISOString(),
        active: true,
      }

      await redis.set(REDIS_KEYS.USERS, [defaultAdmin, defaultAgent])
      console.log("Redis initialized with default users")
    }

    if (!sessionsExists) {
      await redis.set(REDIS_KEYS.USER_SESSIONS, [])
      console.log("Redis initialized with empty sessions array")
    }

    return true
  } catch (error) {
    console.error("Error initializing Redis:", error)
    return false
  }
}

