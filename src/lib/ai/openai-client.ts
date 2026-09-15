import 'server-only'
import OpenAI from 'openai'

const globalForOpenAi = globalThis as unknown as { openai?: OpenAI }

export const openai =
  globalForOpenAi.openai ??
  new OpenAI({
    apiKey: process.env.CHAT_GPT_API_KEY,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForOpenAi.openai = openai
}
