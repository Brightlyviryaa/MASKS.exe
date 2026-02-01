# Phaser 3 Best Practices

## Project Structure

### File Organization
```
project/
├── index.html          # Entry point
├── src/
│   ├── main.js         # Game config dan scene registry
│   ├── scenes/         # Individual scene files (jika perlu split)
│   └── utils/          # Helper functions
└── assets/             # Images, audio, fonts
```

### Scene Management
- Gunakan `Phaser.Scene` untuk setiap screen/level
- Pisahkan logic dengan method: `preload()`, `create()`, `update()`
- Gunakan `this.scene.start('SceneKey')` untuk transition
- Gunakan `this.scene.pause()`/`resume()` untuk pause menu

## Performance Optimization

### Object Pooling
```javascript
// Buat pool untuk objects yang sering spawn/despawn
this.bulletPool = this.add.group({
  classType: Bullet,
  maxSize: 100,
  runChildUpdate: true
});
```

### Asset Management
- Preload semua assets di `preload()`
- Gunakan texture atlas untuk sprites
- Compress images (WebP preferred)
- Lazy load audio jika perlu

### Rendering
- Hindari creating objects di `update()` loop
- Gunakan `setVisible(false)` daripada `destroy()` untuk temporary hide
- Matikan physics bodies yang tidak aktif
- Limit particle count

## Code Patterns

### Scene Lifecycle
```javascript
class MyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MyScene' });
  }

  preload() {
    // Load assets
  }

  create() {
    // Setup game objects
    // Register event listeners
  }

  update(time, delta) {
    // Game loop logic
  }
  
  shutdown() {
    // Cleanup event listeners
  }
}
```

### State Management
```javascript
// Gunakan data manager untuk state antar scene
this.scene.get('SceneA').data.set('score', 100);
this.scene.get('SceneB').data.get('score');

// Atau global registry
this.registry.set('highScore', 1000);
```

### Input Handling
```javascript
// Keyboard
this.cursors = this.input.keyboard.createCursorKeys();

// Mouse/Touch
this.input.on('pointerdown', (pointer) => {
  // Handle click
});

// Event cleanup di shutdown()
this.events.on('shutdown', () => {
  this.input.off('pointerdown');
});
```

## Memory Management

### Cleanup
```javascript
shutdown() {
  // Hapus event listeners
  this.events.off('update');
  
  // Hapus timers
  this.time.removeAllEvents();
  
  // Hapus tweens
  this.tweens.killAll();
}
```

### Texture Management
```javascript
// Unload textures yang tidak perlu
this.textures.remove('unusedTexture');
```

## Common Pitfalls

### ❌ Jangan
- Create new objects di `update()` loop
- Gunakan `setInterval`/`setTimeout`, pakai `this.time.delayedCall()`
- Lupa cleanup event listeners
- Load assets di `create()`

### ✅ Do
- Object pooling untuk frequently created/destroyed objects
- Gunakan `this.time.delayedCall()` untuk delays
- Cleanup di `shutdown()`
- Preload semua assets

## Debugging

### Performance Monitoring
```javascript
// FPS counter
this.game.loop.targetFps = 60;

// Debug graphics
this.physics.world.createDebugGraphic();
```

### Console Logging
```javascript
console.log('Scene:', this.scene.key);
console.log('Objects:', this.children.length);
```

## Mobile Optimization

### Touch Input
```javascript
this.input.addPointer(2); // Support multi-touch
```

### Resolution
```javascript
// Responsive scaling
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

## Resources

- [Phaser 3 Docs](https://docs.phaser.io/)
- [Phaser Examples](https://labs.phaser.io/)
- [Phaser Discourse](https://phaser.discourse.group/)
