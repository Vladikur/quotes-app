import 'server-only'
import { openai } from './openai-client'

export async function embedString(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  return response.data[0].embedding
}
