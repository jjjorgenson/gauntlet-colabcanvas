import OpenAI from 'openai'

// SECURITY: Verify OpenAI API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set')
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    // Define OpenAI functions for canvas operations
    const functions = [
      {
        name: 'createShape',
        description: 'Create a new shape (rectangle or circle) on the canvas',
        parameters: {
          type: 'object',
          properties: {
            shape: {
              type: 'string',
              enum: ['rectangle', 'circle'],
              description: 'Type of shape to create'
            },
            color: {
              type: 'string',
              description: 'Color of the shape in hex format (e.g., #ff0000)'
            },
            x: {
              type: 'number',
              description: 'X position on canvas (0-5000)'
            },
            y: {
              type: 'number',
              description: 'Y position on canvas (0-5000)'
            },
            width: {
              type: 'number',
              description: 'Width of the shape'
            },
            height: {
              type: 'number',
              description: 'Height of the shape'
            }
          },
          required: ['shape', 'color', 'x', 'y', 'width', 'height']
        }
      },
      {
        name: 'createText',
        description: 'Create a text element on the canvas',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Text content to display'
            },
            x: {
              type: 'number',
              description: 'X position on canvas (0-5000)'
            },
            y: {
              type: 'number',
              description: 'Y position on canvas (0-5000)'
            },
            width: {
              type: 'number',
              description: 'Width of the text box'
            },
            height: {
              type: 'number',
              description: 'Height of the text box'
            },
            fontSize: {
              type: 'number',
              description: 'Font size in pixels'
            }
          },
          required: ['content', 'x', 'y', 'width', 'height']
        }
      },
      {
        name: 'moveShape',
        description: 'Move an existing shape to a new position',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'ID of the shape to move'
            },
            x: {
              type: 'number',
              description: 'New X position'
            },
            y: {
              type: 'number',
              description: 'New Y position'
            }
          },
          required: ['shapeId', 'x', 'y']
        }
      },
      {
        name: 'resizeShape',
        description: 'Resize an existing shape',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'ID of the shape to resize'
            },
            width: {
              type: 'number',
              description: 'New width'
            },
            height: {
              type: 'number',
              description: 'New height'
            }
          },
          required: ['shapeId', 'width', 'height']
        }
      },
      {
        name: 'arrangeShapes',
        description: 'Arrange multiple shapes in a pattern',
        parameters: {
          type: 'object',
          properties: {
            shapeIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of shape IDs to arrange'
            },
            pattern: {
              type: 'string',
              enum: ['horizontal_row', 'vertical_column', 'grid'],
              description: 'Arrangement pattern'
            },
            spacing: {
              type: 'number',
              description: 'Spacing between shapes in pixels'
            }
          },
          required: ['shapeIds', 'pattern']
        }
      }
    ]

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a canvas command assistant. Parse user commands and call the appropriate functions to accomplish the task.

Available colors: red (#ff0000), blue (#0000ff), green (#00ff00), yellow (#ffff00), purple (#800080), black (#000000), white (#ffffff)

Current canvas context:
${canvasContext ? JSON.stringify(canvasContext, null, 2) : 'No canvas context provided'}

Position keywords:
- "center" → x: 2500, y: 2500 (canvas center)
- "top left" → x: 0, y: 0
- "top right" → x: 4500, y: 0
- "bottom left" → x: 0, y: 4500
- "bottom right" → x: 4500, y: 4500

Default positions: x: 0, y: 0 (top-left corner for visibility)
Default sizes: width: 300, height: 300 (large for debugging)

For references like "it", "that", "the one I just made":
- Look at commandHistory to understand what was created recently
- Use the most recent shape that matches the description
- If multiple shapes match, prefer the most recently created one

Special commands:
- "create login form" → Create a complete login form with username/password fields and button
- "add 3 blue circles" → Create multiple shapes with spacing

Always call the appropriate functions to accomplish the user's request.`
        },
        {
          role: 'user',
          content: command
        }
      ],
      functions: functions,
      function_call: 'auto',
      temperature: 0.1
    })

    const message = response.choices[0].message
    const actions = []

    // Process function calls
    if (message.function_call) {
      const functionName = message.function_call.name
      const functionArgs = JSON.parse(message.function_call.arguments)

      // Convert function calls to action format expected by frontend
      switch (functionName) {
        case 'createShape':
          actions.push({
            type: 'create_shape',
            shape: functionArgs.shape,
            color: functionArgs.color,
            x: functionArgs.x,
            y: functionArgs.y,
            width: functionArgs.width,
            height: functionArgs.height
          })
          break

        case 'createText':
          actions.push({
            type: 'create_text',
            content: functionArgs.content,
            x: functionArgs.x,
            y: functionArgs.y,
            width: functionArgs.width,
            height: functionArgs.height,
            font_size: functionArgs.fontSize || 16
          })
          break

        case 'moveShape':
          actions.push({
            type: 'move_shape',
            shapeId: functionArgs.shapeId,
            x: functionArgs.x,
            y: functionArgs.y
          })
          break

        case 'resizeShape':
          actions.push({
            type: 'resize_shape',
            shapeId: functionArgs.shapeId,
            width: functionArgs.width,
            height: functionArgs.height
          })
          break

        case 'arrangeShapes':
          actions.push({
            type: 'arrange_shapes',
            shapeIds: functionArgs.shapeIds,
            pattern: functionArgs.pattern,
            spacing: functionArgs.spacing || 50
          })
          break
      }
    }

    // Handle multiple function calls (for complex commands)
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        switch (functionName) {
          case 'createShape':
            actions.push({
              type: 'create_shape',
              shape: functionArgs.shape,
              color: functionArgs.color,
              x: functionArgs.x,
              y: functionArgs.y,
              width: functionArgs.width,
              height: functionArgs.height
            })
            break

          case 'createText':
            actions.push({
              type: 'create_text',
              content: functionArgs.content,
              x: functionArgs.x,
              y: functionArgs.y,
              width: functionArgs.width,
              height: functionArgs.height,
              font_size: functionArgs.fontSize || 16
            })
            break

          case 'moveShape':
            actions.push({
              type: 'move_shape',
              shapeId: functionArgs.shapeId,
              x: functionArgs.x,
              y: functionArgs.y
            })
            break

          case 'resizeShape':
            actions.push({
              type: 'resize_shape',
              shapeId: functionArgs.shapeId,
              width: functionArgs.width,
              height: functionArgs.height
            })
            break

          case 'arrangeShapes':
            actions.push({
              type: 'arrange_shapes',
              shapeIds: functionArgs.shapeIds,
              pattern: functionArgs.pattern,
              spacing: functionArgs.spacing || 50
            })
            break
        }
      }
    }

    return res.status(200).json({ 
      actions: actions,
      command: command,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return res.status(500).json({ 
      error: 'Failed to process command with OpenAI',
      details: error.message
    })
  }
}