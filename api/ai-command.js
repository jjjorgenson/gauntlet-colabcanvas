import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
  // Enable CORS for localhost:5173
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { command } = req.body

    if (!command) {
      return res.status(400).json({ error: 'Command is required' })
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a helpful AI assistant. The user said: "${command}". Please respond with a helpful message.`
        }
      ]
    })

    const claudeResponse = response.content[0]
    if (claudeResponse.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return res.status(200).json({ 
      response: claudeResponse.text,
      command: command,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Claude API error:', error)
    return res.status(500).json({ 
      error: 'Failed to process command with Claude',
      details: error.message
    })
  }
}