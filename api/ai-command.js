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

    // Call Claude API with command parsing prompt
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are a canvas command parser. Parse the user's command into structured actions.

Available action types:
- create_shape: Create new shapes
- move_shape: Move existing shapes
- resize_shape: Resize existing shapes
- create_text: Create text elements
- arrange_shapes: Arrange multiple shapes

Available shapes: rectangle, circle, text
Available colors: red (#ff0000), blue (#0000ff), green (#00ff00), yellow (#ffff00), purple (#800080), black (#000000), white (#ffffff)

Command patterns to handle:
- "create [color] [shape]" → create_shape action
- "add [number] [shapes]" → multiple create_shape actions
- "create text saying [content]" → create_text action
- "move [shape] to [position]" → move_shape action
- "resize [shape] to [size]" → resize_shape action

Default positions: x: 0, y: 0 (top-left corner for visibility)
Default sizes: width: 300, height: 300 (large for debugging)

User command: "${command}"

Respond with ONLY valid JSON in this exact format:

For shapes (rectangle, circle):
{
  "actions": [
    {
      "type": "create_shape",
      "shape": "circle",
      "color": "#ff0000",
      "x": 0,
      "y": 0,
      "width": 300,
      "height": 300
    }
  ]
}

For text:
{
  "actions": [
    {
      "type": "create_text",
      "content": "Hello World",
      "x": 0,
      "y": 0,
      "width": 300,
      "height": 300
    }
  ]
}

If command is unclear, return: {"actions": []}`
        }
      ]
    })

    const claudeResponse = response.content[0]
    if (claudeResponse.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse the JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(claudeResponse.text)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', claudeResponse.text)
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        rawResponse: claudeResponse.text
      })
    }

    return res.status(200).json({ 
      actions: parsedResponse.actions || [],
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