# Console Filtering for AI Debugging

## Quick Console Filter Setup

### Method 1: Browser Console Filter
1. Open browser console (F12)
2. Click the filter icon (🔍) in console
3. Type: `🤖` or `🎯` or `⚡` to see only AI-related logs

### Method 2: Console Commands
Run these in the browser console to filter:

```javascript
// Show only AI logs
console.clear()
console.log('🔍 AI Debug Mode - Filtering for AI logs only')

// Filter function
const originalLog = console.log
console.log = function(...args) {
  const message = args.join(' ')
  if (message.includes('🤖') || message.includes('🎯') || message.includes('⚡') || 
      message.includes('📊') || message.includes('🎨') || message.includes('⌨️')) {
    originalLog.apply(console, args)
  }
}
```

### Method 3: Clear Console Before Testing
```javascript
console.clear()
console.log('🧹 Console cleared - ready for AI testing')
```

## What Each Emoji Means:
- 🤖 AICommandBar component logs
- ⌨️ Keyboard shortcut logs  
- 🚀 Command submission logs
- ✅ API response logs
- ⚡ Action execution logs
- 🎯 Main command processing logs
- 🔧 Action processing logs
- 🎨 Shape creation logs
- 📊 Shapes summary logs
- 🎯 AI shape rendering logs

## Testing Steps:
1. Clear console: `console.clear()`
2. Run AI command: "create red circle"
3. Look for emoji-prefixed logs only
4. Check for 🎯 AI SHAPE RENDERING logs
