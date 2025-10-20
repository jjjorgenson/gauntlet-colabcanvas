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
  console.log("========================================")
  console.log("🚨 API CALLED - YOU SHOULD SEE THIS!")
  console.log("========================================")
  
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

    console.log('🚀 API REQUEST RECEIVED:', {
      command,
      hasCanvasContext: !!canvasContext,
      timestamp: new Date().toISOString()
    })

    console.log('📝 COMMAND TEXT:', command)
    console.log('📊 CANVAS CONTEXT:', canvasContext)

    if (!command) {
      console.log('❌ ERROR: No command provided')
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
      },
      {
        name: 'deleteShape',
        description: 'Delete a shape from the canvas by ID or description',
        parameters: {
          type: 'object',
          properties: {
            shapeId: {
              type: 'string',
              description: 'ID of the shape to delete (if known)'
            },
            description: {
              type: 'string',
              description: 'Description of the shape to delete (e.g., "red circle", "blue rectangle", "text element")'
            }
          },
          required: []
        }
      }
    ]

    console.log('🤖 CALLING OPENAI API...')
    console.log('📋 AVAILABLE FUNCTIONS:', functions.map(f => ({
      name: f.name,
      description: f.description,
      requiredParams: f.parameters.required
    })))
    
    const requestPayload = {
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a canvas command assistant. Parse user commands and call the appropriate functions to accomplish the task.

CRITICAL: For complex commands, you MUST make MULTIPLE function calls in sequence to create all required elements. Use the tools array to call multiple functions in one response.

MANDATORY: When you see "create login form", you MUST call exactly 5 functions in parallel:
1. createText for "Username:" label
2. createShape for username input field  
3. createText for "Password:" label
4. createShape for password input field
5. createShape for login button

DO NOT stop after 1 function call. You must call ALL 5 functions for login form.

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

COMPLEX COMMAND EXAMPLES:
- "create login form" → MUST call 5 functions: createText("Username:"), createShape(username input), createText("Password:"), createShape(password input), createShape(button)
- "add 3 blue circles" → Call createShape 3 times with different positions
- "create navigation bar" → Call createShape for background, createText for each menu item

EXAMPLE: For "create login form", you should make exactly 5 tool calls:
1. createText with content="Username:", x=300, y=200
2. createShape with shape="rectangle", x=300, y=225, color="#f3f4f6"
3. createText with content="Password:", x=300, y=285
4. createShape with shape="rectangle", x=300, y=310, color="#f3f4f6"
5. createShape with shape="rectangle", x=300, y=370, color="#3b82f6"

LAYOUT GUIDELINES:
- Username label: x: 300, y: 200, width: 100, height: 20, font_size: 16
- Username input: x: 300, y: 225, width: 280, height: 40, color: #f3f4f6
- Password label: x: 300, y: 285, width: 100, height: 20, font_size: 16  
- Password input: x: 300, y: 310, width: 280, height: 40, color: #f3f4f6
- Login button: x: 300, y: 370, width: 280, height: 50, color: #3b82f6

You MUST call multiple functions for complex commands. Do not try to create everything in one function call.`
        },
        {
          role: 'user',
          content: command
        }
      ],
      tools: functions.map(func => ({
        type: 'function',
        function: func
      })),
      tool_choice: 'auto',
      parallel_tool_calls: true,
      temperature: 0.1,
      max_tokens: 4000
    }
    
    console.log('📤 OPENAI REQUEST PAYLOAD:', JSON.stringify(requestPayload, null, 2))
    
    // Call OpenAI with function calling
    const response = await openai.chat.completions.create(requestPayload)

    console.log('✅ OPENAI RESPONSE RECEIVED:', {
      hasMessage: !!response.choices[0]?.message,
      hasFunctionCall: !!response.choices[0]?.message?.function_call,
      hasToolCalls: !!response.choices[0]?.message?.tool_calls,
      toolCallsCount: response.choices[0]?.message?.tool_calls?.length || 0,
      functionCallName: response.choices[0]?.message?.function_call?.name,
      toolCallNames: response.choices[0]?.message?.tool_calls?.map(tc => tc.function.name),
      toolCallTypes: response.choices[0]?.message?.tool_calls?.map(tc => tc.type)
    })
    
    console.log('📥 OPENAI RAW RESPONSE:', JSON.stringify(response, null, 2))
    console.log('🔧 TOOL CALLS ARRAY:', response.choices[0]?.message?.tool_calls)

    const message = response.choices[0].message
    const actions = []

    console.log('🔍 PROCESSING OPENAI MESSAGE:', {
      hasFunctionCall: !!message.function_call,
      hasToolCalls: !!message.tool_calls,
      toolCallsLength: message.tool_calls?.length || 0
    })

    // Process function calls
    if (message.function_call) {
      const functionName = message.function_call.name
      const functionArgs = JSON.parse(message.function_call.arguments)

      console.log('📞 FUNCTION CALL DETECTED:', {
        functionName,
        functionArgs
      })
      
      console.log(`🔨 PROCESSING FUNCTION CALL: ${functionName}`)
      console.log(`📋 FUNCTION ARGUMENTS:`, JSON.stringify(functionArgs, null, 2))

      // Convert function calls to action format expected by frontend
      switch (functionName) {
        case 'createShape':
          const createShapeAction = {
            type: 'create_shape',
            shape: functionArgs.shape,
            color: functionArgs.color,
            x: functionArgs.x,
            y: functionArgs.y,
            width: functionArgs.width,
            height: functionArgs.height
          }
          actions.push(createShapeAction)
          console.log('✅ CREATED SHAPE ACTION:', createShapeAction)
          break

        case 'createText':
          const createTextAction = {
            type: 'create_text',
            content: functionArgs.content,
            x: functionArgs.x,
            y: functionArgs.y,
            width: functionArgs.width,
            height: functionArgs.height,
            font_size: functionArgs.fontSize || 16
          }
          actions.push(createTextAction)
          console.log('✅ CREATED TEXT ACTION:', createTextAction)
          break

        case 'moveShape':
          const moveShapeAction = {
            type: 'move_shape',
            shapeId: functionArgs.shapeId,
            x: functionArgs.x,
            y: functionArgs.y
          }
          actions.push(moveShapeAction)
          console.log('✅ CREATED MOVE ACTION:', moveShapeAction)
          break

        case 'resizeShape':
          const resizeShapeAction = {
            type: 'resize_shape',
            shapeId: functionArgs.shapeId,
            width: functionArgs.width,
            height: functionArgs.height
          }
          actions.push(resizeShapeAction)
          console.log('✅ CREATED RESIZE ACTION:', resizeShapeAction)
          break

        case 'arrangeShapes':
          const arrangeShapesAction = {
            type: 'arrange_shapes',
            shapeIds: functionArgs.shapeIds,
            pattern: functionArgs.pattern,
            spacing: functionArgs.spacing || 50
          }
          actions.push(arrangeShapesAction)
          console.log('✅ CREATED ARRANGE ACTION:', arrangeShapesAction)
          break

        case 'deleteShape':
          const deleteShapeAction = {
            type: 'delete_shape',
            shapeId: functionArgs.shapeId,
            description: functionArgs.description
          }
          actions.push(deleteShapeAction)
          console.log('✅ CREATED DELETE ACTION:', deleteShapeAction)
          break
      }
    }

    // Handle multiple function calls (for complex commands)
    if (message.tool_calls) {
      console.log('🔧 PROCESSING TOOL CALLS:', message.tool_calls.length)
      
      for (let i = 0; i < message.tool_calls.length; i++) {
        const toolCall = message.tool_calls[i]
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`📞 TOOL CALL ${i + 1}:`, {
          functionName,
          functionArgs
        })
        
        console.log(`🔨 PROCESSING TOOL CALL ${i + 1}: ${functionName}`)
        console.log(`📋 TOOL CALL ${i + 1} ARGUMENTS:`, JSON.stringify(functionArgs, null, 2))

        switch (functionName) {
          case 'createShape':
            const toolCreateShapeAction = {
              type: 'create_shape',
              shape: functionArgs.shape,
              color: functionArgs.color,
              x: functionArgs.x,
              y: functionArgs.y,
              width: functionArgs.width,
              height: functionArgs.height
            }
            actions.push(toolCreateShapeAction)
            console.log(`✅ TOOL CREATED SHAPE ACTION ${i + 1}:`, toolCreateShapeAction)
            break

          case 'createText':
            const toolCreateTextAction = {
              type: 'create_text',
              content: functionArgs.content,
              x: functionArgs.x,
              y: functionArgs.y,
              width: functionArgs.width,
              height: functionArgs.height,
              font_size: functionArgs.fontSize || 16
            }
            actions.push(toolCreateTextAction)
            console.log(`✅ TOOL CREATED TEXT ACTION ${i + 1}:`, toolCreateTextAction)
            break

          case 'moveShape':
            const toolMoveShapeAction = {
              type: 'move_shape',
              shapeId: functionArgs.shapeId,
              x: functionArgs.x,
              y: functionArgs.y
            }
            actions.push(toolMoveShapeAction)
            console.log(`✅ TOOL CREATED MOVE ACTION ${i + 1}:`, toolMoveShapeAction)
            break

          case 'resizeShape':
            const toolResizeShapeAction = {
              type: 'resize_shape',
              shapeId: functionArgs.shapeId,
              width: functionArgs.width,
              height: functionArgs.height
            }
            actions.push(toolResizeShapeAction)
            console.log(`✅ TOOL CREATED RESIZE ACTION ${i + 1}:`, toolResizeShapeAction)
            break

          case 'arrangeShapes':
            const toolArrangeShapesAction = {
              type: 'arrange_shapes',
              shapeIds: functionArgs.shapeIds,
              pattern: functionArgs.pattern,
              spacing: functionArgs.spacing || 50
            }
            actions.push(toolArrangeShapesAction)
            console.log(`✅ TOOL CREATED ARRANGE ACTION ${i + 1}:`, toolArrangeShapesAction)
            break

          case 'deleteShape':
            const toolDeleteShapeAction = {
              type: 'delete_shape',
              shapeId: functionArgs.shapeId,
              description: functionArgs.description
            }
            actions.push(toolDeleteShapeAction)
            console.log(`✅ TOOL CREATED DELETE ACTION ${i + 1}:`, toolDeleteShapeAction)
            break
        }
      }
    }

    console.log('🎯 FINAL ACTIONS TO RETURN:', {
      actionsCount: actions.length,
      actions: actions
    })
    
    console.log('📋 FINAL ACTIONS ARRAY:', JSON.stringify(actions, null, 2))
    console.log(`✅ TOTAL ACTIONS CREATED: ${actions.length}`)
    
    actions.forEach((action, index) => {
      console.log(`🎨 ACTION ${index + 1}:`, {
        type: action.type,
        ...action
      })
    })

    return res.status(200).json({ 
      actions: actions,
      command: command,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 OPENAI API ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return res.status(500).json({ 
      error: 'Failed to process command with OpenAI',
      details: error.message
    })
  }
}