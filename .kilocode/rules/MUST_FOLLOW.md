# MASK.EXE - KiloCode Rules

## Project Context
MASK.EXE adalah visual novel interaktif (~10 menit) tentang identitas dan persona. Player di teater kosong pilih topeng (Joy, Rage, Sorrow, Truth, Silence, Hunger) yang mengarah ke cabang narasi berbeda.

## Tech Stack
- Phaser 3 (v3.70.0 via CDN)
- Vanilla JavaScript (ES6+)
- Single file: src/main.js
- State: window.GameState

## Aturan Penting

### 1. Jangan Over-Engineering
- Semua logic di src/main.js
- Tidak perlu split file kecuali benar-benar perlu
- Tidak perlu build system, bundler, atau framework tambahan
- Keep it simple

### 2. State Management
- Gunakan window.GameState untuk flags
- Flags: joy_eg, rage_refused, name_lost, hunger_unlocked
- Persistensi pakai localStorage jika perlu

### 3. Scene Structure
- Extend Phaser.Scene
- preload(), create(), update()
- Gunakan BaseScene untuk helper methods

### 4. Assets
- Programmatic visuals (shapes, text) preferred
- Minimal external assets
- Phaser primitives untuk UI

### 5. Easter Eggs
- Idle timers (10s, 30s)
- Input sequences (KENNEY)
- Hidden flags

### 6. Code Style
- ES6+ (const, let, arrow functions)
- JSDoc untuk functions
- Console.log untuk debug (boleh)

### 7. Jangan Buat
- ❌ README panjang lebar
- ❌ Dokumentasi berlebihan
- ❌ Test files (kecuali diminta)
- ❌ CI/CD config
- ❌ Linting config
- ❌ package.json (kecuali butuh dependency)

### 8. Fokus
- Game logic
- Scene transitions
- Choice branching
- Ending conditions
