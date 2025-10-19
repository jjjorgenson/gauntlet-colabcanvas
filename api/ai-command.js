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
      const { command, canvasContext } = req.body

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
- move_shape: Move existing shapes (requires shapeId)
- resize_shape: Resize existing shapes (requires shapeId)
- create_text: Create text elements
- arrange_shapes: Arrange multiple shapes (requires shapeIds array)

Available shapes: rectangle, circle, text
Available colors: red (#ff0000), blue (#0000ff), green (#00ff00), yellow (#ffff00), purple (#800080), black (#000000), white (#ffffff)

Current canvas context:
${canvasContext ? JSON.stringify(canvasContext, null, 2) : 'No canvas context provided'}

Command patterns to handle:
- "create [color] [shape]" → create_shape action
- "add [number] [shapes]" → multiple create_shape actions (position them with 50px spacing)
- "create text saying [content]" → create_text action
- "move [description] to [position]" → move_shape action (find shape by description, use shapeId)
- "make [description] bigger/smaller" → resize_shape action (find shape by description, use shapeId)
- "arrange [shapes] in [pattern]" → arrange_shapes action (use shapeIds array)
- "create login form" → create multiple elements with proper form layout

SPECIAL LAYOUTS:

Login Form Layout (for "create login form"):
- Start position: x: 300, y: 200
- Elements in order:
  1. Text "Username:" at x: 300, y: 200 (16px font)
  2. Rectangle input at x: 300, y: 225 (width: 280, height: 40, color: #f3f4f6)
  3. Text "Password:" at x: 300, y: 285 (16px font)  
  4. Rectangle input at x: 300, y: 310 (width: 280, height: 40, color: #f3f4f6)
  5. Rectangle button at x: 300, y: 370 (width: 280, height: 50, color: #3b82f6)
- Vertical spacing: 20px between elements
- Input fields: light gray (#f3f4f6), button: blue (#3b82f6)

IMPORTANT: For references like "it", "that", "the one I just made":
- Look at commandHistory to understand what was created recently
- Use the most recent shape that matches the description
- If multiple shapes match, prefer the most recently created one

Position keywords:
- "center" → x: 2500, y: 2500 (canvas center)
- "top left" → x: 0, y: 0
- "top right" → x: 4500, y: 0
- "bottom left" → x: 0, y: 4500
- "bottom right" → x: 4500, y: 4500

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

For moving shapes:
{
  "actions": [
    {
      "type": "move_shape",
      "shapeId": "uuid-of-shape",
      "x": 2500,
      "y": 2500
    }
  ]
}

For resizing shapes:
{
  "actions": [
    {
      "type": "resize_shape",
      "shapeId": "uuid-of-shape",
      "width": 400,
      "height": 400
    }
  ]
}

For arranging shapes:
{
  "actions": [
    {
      "type": "arrange_shapes",
      "shapeIds": ["uuid1", "uuid2", "uuid3"],
      "pattern": "horizontal_row",
      "spacing": 50
    }
  ]
}

For login form (create login form):
{
  "actions": [
    {
      "type": "create_text",
      "content": "Username:",
      "x": 300,
      "y": 200,
      "width": 100,
      "height": 20,
      "font_size": 16
    },
    {
      "type": "create_shape",
      "shape": "rectangle",
      "color": "#f3f4f6",
      "x": 300,
      "y": 225,
      "width": 280,
      "height": 40
    },
    {
      "type": "create_text",
      "content": "Password:",
      "x": 300,
      "y": 285,
      "width": 100,
      "height": 20,
      "font_size": 16
    },
    {
      "type": "create_shape",
      "shape": "rectangle",
      "color": "#f3f4f6",
      "x": 300,
      "y": 310,
      "width": 280,
      "height": 40
    },
    {
      "type": "create_shape",
      "shape": "rectangle",
      "color": "#3b82f6",
      "x": 300,
      "y": 370,
      "width": 280,
      "height": 50
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