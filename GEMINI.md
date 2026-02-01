# MASK.EXE Project Context

## Project Overview
**MASK.EXE** is a short interactive visual novel (~10 mins) exploring themes of identity and personas. It places the player in an empty theater, presenting them with various masks (Joy, Rage, Sorrow, Truth, Silence) that lead to different narrative branches and endings.

## Technology Stack
*   **Engine:** Phaser 3 (v3.70.0, loaded via CDN).
*   **Language:** Vanilla JavaScript (ES6+).
*   **Markup:** HTML5 Canvas.
*   **Styling:** Minimal CSS within `index.html`.
*   **Build System:** None (Run-in-browser).

## Setup & Running
This project is a static web application. No compilation is required.

### 1. Simple Run
Open `index.html` directly in a modern web browser.
*Note: Some browser security policies may block local file assets. If this happens, use a local server.*

### 2. Local Server (Recommended)
If you have Node.js or Python installed:

**Using Node.js (npx):**
```bash
npx http-server -p 8080
```

**Using Python:**
```bash
python3 -m http.server 8080
```
Then navigate to `http://localhost:8080` in your browser.

## Key Files & Structure
*   **`index.html`**: Entry point. Sets up the HTML structure, styles, and loads Phaser via CDN.
*   **`src/main.js`**: Contains the entire game logic, state management, and scene definitions.
    *   **`GameState`**: Global object tracking flags (e.g., `joy_eg`, `hunger_unlocked`).
    *   **`BaseScene`**: Parent class with helper methods like `createChoice()`.
    *   **Scenes**: Individual classes for each game state (e.g., `HubScene`, `JoyScene`, `EndingScene`).

## Development Conventions
*   **Code Organization**: Currently, all game logic resides in a single file (`src/main.js`). Future refactoring might split scenes into separate files.
*   **State Management**: Use the global `window.GameState` object to track persistence across scenes.
*   **Assets**: No external assets (images/audio) are currently used; visuals are generated programmatically using Phaser's primitives (shapes, text).
*   **Easter Eggs**: The code contains several hidden interactions (e.g., idle timers, specific input sequences) that trigger special flags or scenes.
