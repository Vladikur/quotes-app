import 'server-only'
import { openai } from './openai-client'
import { STRUCTURE_QUOTES_PROMPT } from './structure-quotes-prompt'

function stripCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
}

export async function structureQuotesText(rawText: string): Promise<unknown> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    max_tokens: 16000,
    messages: [
      {
        role: 'system',
        content:
          'Ты помощник, который строго следует инструкции пользователя и отвечает исключительно валидным JSON без markdown-разметки, кодовых блоков и комментариев.',
      },
      {
        role: 'user',
        content: `${STRUCTURE_QUOTES_PROMPT}${rawText}`,
      },
    ],
  })

  const content = response.choices[0]?.message.content ?? ''

  return JSON.parse(stripCodeFence(content))
}
