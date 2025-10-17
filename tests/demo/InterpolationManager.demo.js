/**
 * InterpolationManager Demo Script
 * 
 * This script demonstrates the InterpolationManager functionality
 * with realistic mock data scenarios.
 * 
 * Run with: node tests/demo/InterpolationManager.demo.js
 */

import InterpolationManager from '../../src/utils/InterpolationManager.js'

// Mock performance.now for consistent timing
let mockTime = 0
const originalPerformanceNow = performance.now
performance.now = () => mockTime

// Mock requestAnimationFrame for Node.js environment
if (typeof requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16) // ~60fps
  }
}

if (typeof cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function simulateCursorMovement() {
  console.log('\n🎯 Simulating Cursor Movement...')
  
  // Add cursor target
  InterpolationManager.addTarget(
    'demo_cursor',
    'cursor',
    { x: 0, y: 0 },
    { x: 200, y: 150 },
    100,
    'easeOut'
  )
  
  // Simulate cursor movement over time
  for (let i = 0; i <= 100; i += 10) {
    mockTime = i
    
    const position = InterpolationManager.getPosition('demo_cursor')
    if (position) {
      console.log(`Time: ${i}ms - Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`)
    }
    
    await sleep(50) // Visual delay
  }
  
  console.log('✅ Cursor movement simulation complete')
}

async function simulateShapeAnimation() {
  console.log('\n🔷 Simulating Shape Animation...')
  
  // Add shape target with bounce effect
  InterpolationManager.addTarget(
    'demo_shape',
    'shape',
    { x: 100, y: 100 },
    { x: 300, y: 200 },
    200,
    'easeOutBounce'
  )
  
  // Simulate shape animation
  for (let i = 0; i <= 200; i += 20) {
    mockTime = i
    
    const position = InterpolationManager.getPosition('demo_shape')
    if (position) {
      console.log(`Time: ${i}ms - Shape Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`)
    }
    
    await sleep(100) // Visual delay
  }
  
  console.log('✅ Shape animation simulation complete')
}

async function simulateMultiUserCollaboration() {
  console.log('\n👥 Simulating Multi-User Collaboration...')
  
  // Add multiple user cursors
  const users = [
    { id: 'alice', color: '#FF6B6B', start: { x: 0, y: 0 }, end: { x: 150, y: 100 } },
    { id: 'bob', color: '#4ECDC4', start: { x: 200, y: 0 }, end: { x: 350, y: 100 } },
    { id: 'charlie', color: '#45B7D1', start: { x: 0, y: 200 }, end: { x: 150, y: 300 } }
  ]
  
  users.forEach(user => {
    InterpolationManager.addTarget(
      `cursor_${user.id}`,
      'cursor',
      user.start,
      user.end,
      150,
      'easeOut',
      'collaborators',
      1
    )
  })
  
  // Simulate collaborative movement
  for (let i = 0; i <= 150; i += 15) {
    mockTime = i
    
    const positions = InterpolationManager.getAllActivePositions()
    console.log(`Time: ${i}ms - Active Cursors: ${positions.size}`)
    
    for (const [id, pos] of positions) {
      const user = users.find(u => `cursor_${u.id}` === id)
      if (user) {
        console.log(`  ${user.id}: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`)
      }
    }
    
    await sleep(80) // Visual delay
  }
  
  console.log('✅ Multi-user collaboration simulation complete')
}

async function simulateGroupManagement() {
  console.log('\n📊 Simulating Group Management...')
  
  // Add targets to different groups
  InterpolationManager.addTarget('ui_element1', 'shape', { x: 0, y: 0 }, { x: 100, y: 100 }, 100, 'easeOut', 'ui_elements', 1)
  InterpolationManager.addTarget('ui_element2', 'shape', { x: 200, y: 0 }, { x: 300, y: 100 }, 100, 'easeOut', 'ui_elements', 1)
  InterpolationManager.addTarget('background1', 'shape', { x: 0, y: 200 }, { x: 100, y: 300 }, 200, 'easeOut', 'background', 0)
  
  console.log('Initial state:')
  let stats = InterpolationManager.getStats()
  console.log(`  Total targets: ${stats.totalTargets}`)
  console.log(`  Active targets: ${stats.activeTargets}`)
  console.log(`  Groups: ${stats.groupCount}`)
  console.log(`  Group stats:`, stats.groupStats)
  
  // Pause UI elements group
  console.log('\nPausing UI elements group...')
  const pausedCount = InterpolationManager.pauseGroup('ui_elements')
  console.log(`Paused ${pausedCount} targets`)
  
  stats = InterpolationManager.getStats()
  console.log(`  Active targets: ${stats.activeTargets}`)
  console.log(`  UI elements active: ${stats.groupStats.ui_elements.active}`)
  
  // Resume UI elements group
  console.log('\nResuming UI elements group...')
  const resumedCount = InterpolationManager.resumeGroup('ui_elements')
  console.log(`Resumed ${resumedCount} targets`)
  
  stats = InterpolationManager.getStats()
  console.log(`  Active targets: ${stats.activeTargets}`)
  console.log(`  UI elements active: ${stats.groupStats.ui_elements.active}`)
  
  console.log('✅ Group management simulation complete')
}

async function simulatePerformanceTest() {
  console.log('\n⚡ Simulating Performance Test...')
  
  const startTime = Date.now()
  
  // Add many targets
  const targetCount = 100
  for (let i = 0; i < targetCount; i++) {
    InterpolationManager.addTarget(
      `perf_target_${i}`,
      i % 2 === 0 ? 'cursor' : 'shape',
      { x: Math.random() * 1000, y: Math.random() * 1000 },
      { x: Math.random() * 1000, y: Math.random() * 1000 },
      100 + Math.random() * 100,
      'easeOut',
      `group_${i % 10}`,
      Math.floor(Math.random() * 5)
    )
  }
  
  const addTime = Date.now() - startTime
  console.log(`Added ${targetCount} targets in ${addTime}ms`)
  
  // Simulate animation
  const animationStart = Date.now()
  for (let i = 0; i <= 200; i += 20) {
    mockTime = i
    
    const positions = InterpolationManager.getAllActivePositions()
    const stats = InterpolationManager.getStats()
    
    if (i % 100 === 0) {
      console.log(`Time: ${i}ms - Active: ${positions.size}/${stats.totalTargets} targets`)
    }
  }
  
  const animationTime = Date.now() - animationStart
  console.log(`Animation simulation completed in ${animationTime}ms`)
  
  // Final statistics
  const finalStats = InterpolationManager.getStats()
  console.log('\nFinal Statistics:')
  console.log(`  Total targets: ${finalStats.totalTargets}`)
  console.log(`  Active targets: ${finalStats.activeTargets}`)
  console.log(`  Groups: ${finalStats.groupCount}`)
  console.log(`  Priority distribution:`, finalStats.priorityStats)
  
  console.log('✅ Performance test complete')
}

async function runDemo() {
  console.log('🚀 InterpolationManager Demo Starting...\n')
  
  try {
    await simulateCursorMovement()
    await simulateShapeAnimation()
    await simulateMultiUserCollaboration()
    await simulateGroupManagement()
    await simulatePerformanceTest()
    
    console.log('\n🎉 All demos completed successfully!')
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
  } finally {
    // Cleanup
    InterpolationManager.clear()
    performance.now = originalPerformanceNow
  }
}

// Run the demo
runDemo()
