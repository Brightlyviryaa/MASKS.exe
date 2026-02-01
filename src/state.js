/**
 * Constants used throughout the game
 */
export const COLORS = {
    GOLD: 0xd4af37,
    HUNGER_PURPLE: 0xff00ff,
    BLACK: 0x000000,
    WHITE: 0xffffff,
    DARK_GRAY: 0x333333,
    LIGHT_GRAY: 0x444444
};

export const FADE_DURATION = {
    FAST: 500,
    NORMAL: 800,
    SLOW: 1000
};

export const TEXT_STYLES = {
    TITLE: {
        fontSize: '28px',
        color: '#d4af37',
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic'
    },
    BODY: {
        fontSize: '18px',
        color: '#cccccc',
        fontFamily: 'Georgia, serif',
        wordWrap: { width: 700 },
        lineSpacing: 10
    },
    BUTTON: {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Georgia, serif'
    }
};

// ============================================
// PERSISTENT STORAGE (survives page reload)
// ============================================
const STORAGE_KEY = 'maskexe_save';

function getDefaultPersistent() {
    return {
        has_played_before: false,
        play_count: 0,
        masks_used: [], // Legacy: array of mask names used
        completed_masks: {
            joy: false,
            rage: false,
            sorrow: false,
            truth: false,
            silence: false,
            hunger: false
        },
        hunger_unlocked: false,
        script_deleted_once: false // Set when T0_SCRIPT_BREAK_EARLY ending occurs
    };
}

function loadPersistentData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to handle missing keys from older saves
            const defaults = getDefaultPersistent();
            return {
                ...defaults,
                ...parsed,
                completed_masks: { ...defaults.completed_masks, ...parsed.completed_masks }
            };
        }
    } catch (e) {
        console.warn('Failed to load persistent data:', e);
    }
    return getDefaultPersistent();
}

function savePersistentData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save persistent data:', e);
    }
}

// ============================================
// SESSION FLAGS (reset per run / page reload)
// ============================================
function getDefaultSessionFlags() {
    return {
        // Joy
        joy_eg: false,
        joy_questioned: false,
        joy_removed: false,
        joy_idle_eg: false,
        joy_completed: false,
        // Rage
        rage_fought: false,
        rage_refused: false,
        rage_attacked: false,
        rage_hint: false,
        rage_completed: false,
        // Sorrow
        sorrow_photo_seen: false,
        sorrow_closed_eyes: false,
        sorrow_idle_eg: false,
        sorrow_completed: false,
        // Truth
        truth_code_seen: false,
        truth_name_checked: false,
        truth_dev_room: false,
        truth_idle_eg: false,
        truth_completed: false,
        // Silence
        silence_failed: false,
        silence_idle_eg: false,
        silence_completed: false,
        // General
        name_lost: false,
        hunger_unlocked: false, // Session unlock state (also persisted separately)
        hunger_completed: false,
        ending: null, // 'A1', 'A2', 'B1', 'B2', 'C', 'A_generic', 'B_generic'
        ending_glitch: false,
        final_eg: false,
        replay_memory: false,
        // --- NEW: Final Arc flags ---
        last_mask: 'none', // 'joy' | 'rage' | 'sorrow' | 'truth' | 'silence' | 'none'
        final_choice: null, // 'wear' | 'destroy' | 'give'
        ending_committed: false // Guard against double incrementPlayCount
    };
}

// ============================================
// GLOBAL GAME STATE
// ============================================
export const GameState = {
    // Persistent data that survives page reload
    persistent: loadPersistentData(),

    // Session flags (reset on page reload)
    flags: getDefaultSessionFlags(),

    playerName: "Guest",
    hasSeenOpening: false,

    // ========================================
    // HELPER METHODS
    // ========================================

    /**
     * Check if this is a returning player
     */
    isReturningPlayer() {
        return this.persistent.has_played_before;
    },

    /**
     * Get playthrough count
     */
    getPlayCount() {
        return this.persistent.play_count;
    },

    /**
     * Check if a mask was used in previous playthrough (legacy array)
     */
    wasMaskUsed(maskName) {
        return this.persistent.masks_used.includes(maskName) ||
            this.persistent.completed_masks[maskName] === true;
    },

    /**
     * Increment play count - ONLY call once per ending, guarded by ending_committed
     */
    incrementPlayCount() {
        if (this.flags.ending_committed) {
            console.warn('incrementPlayCount blocked: ending already committed');
            return;
        }
        this.flags.ending_committed = true;
        this.persistent.play_count += 1;
        this.persistent.has_played_before = true;
        savePersistentData(this.persistent);
        console.log('Play count incremented to:', this.persistent.play_count);
    },

    /**
     * Sync session completed flags to persistent storage
     * Call after completing a mask scene
     */
    syncCompletedMasks() {
        if (this.flags.joy_completed) this.persistent.completed_masks.joy = true;
        if (this.flags.rage_completed) this.persistent.completed_masks.rage = true;
        if (this.flags.sorrow_completed) this.persistent.completed_masks.sorrow = true;
        if (this.flags.truth_completed) this.persistent.completed_masks.truth = true;
        if (this.flags.silence_completed) this.persistent.completed_masks.silence = true;
        if (this.flags.hunger_completed) this.persistent.completed_masks.hunger = true;

        // Also update legacy masks_used array
        const masks = ['joy', 'rage', 'sorrow', 'truth', 'silence', 'hunger'];
        masks.forEach(mask => {
            if (this.flags[`${mask}_completed`] && !this.persistent.masks_used.includes(mask)) {
                this.persistent.masks_used.push(mask);
            }
        });

        savePersistentData(this.persistent);
    },

    /**
     * Mark Hunger as unlocked (persistent)
     */
    unlockHunger() {
        this.flags.hunger_unlocked = true;
        this.persistent.hunger_unlocked = true;
        savePersistentData(this.persistent);
        console.log('Hunger mask unlocked!');
    },

    /**
     * Check if Hunger should be unlocked
     * Rule: Truth + Silence + at least 2 of (Joy, Rage, Sorrow)
     */
    shouldUnlockHunger() {
        // If already unlocked in persistent, return true
        if (this.persistent.hunger_unlocked) return true;

        const hasRequired = this.flags.truth_completed && this.flags.silence_completed;
        if (!hasRequired) return false;

        let mainMaskCount = 0;
        if (this.flags.joy_completed) mainMaskCount++;
        if (this.flags.rage_completed) mainMaskCount++;
        if (this.flags.sorrow_completed) mainMaskCount++;

        return mainMaskCount >= 2;
    },

    /**
     * Check if "Give Away" option should be enabled
     * Rule: Silence + Truth must be completed
     */
    canGiveAway() {
        return this.flags.silence_completed && this.flags.truth_completed;
    },

    /**
     * Resolve ending based on final_choice and last_mask
     * Returns ending ID: 'A1', 'A2', 'B1', 'B2', 'C', 'A_generic', 'B_generic'
     */
    resolveEnding() {
        const choice = this.flags.final_choice;
        const lastMask = this.flags.last_mask;

        if (choice === 'wear') {
            if (lastMask === 'joy') return 'A1'; // Eternal Smile
            if (lastMask === 'rage') return 'A2'; // Arena Loop
            return 'A_generic';
        }

        if (choice === 'destroy') {
            if (lastMask === 'truth') return 'B2'; // Script Breaker
            if (lastMask === 'sorrow') return 'B1'; // Forgotten Name
            return 'B_generic';
        }

        if (choice === 'give') {
            // This should only be callable if canGiveAway() is true
            return 'C'; // True Release
        }

        console.warn('resolveEnding: unknown choice', choice);
        return 'A_generic';
    },

    /**
     * Reset session state for a new run
     * @param {boolean} keepMemory - If true, keeps completed_masks for "Replay with Memory"
     */
    resetRunState(keepMemory = false) {
        // Reset session flags
        this.flags = getDefaultSessionFlags();
        this.hasSeenOpening = false;

        if (keepMemory) {
            // Restore persistent unlock state to session
            this.flags.hunger_unlocked = this.persistent.hunger_unlocked;
            this.flags.replay_memory = true;
        }

        console.log('Run state reset. Keep memory:', keepMemory);
    },

    /**
     * Commit an ending - single source of truth for all endings
     * @param {string} endingId - The ending ID (e.g., 'T0_SCRIPT_BREAK_EARLY', 'A1', 'B2', etc.)
     * This handles: play count increment, mask sync, and stores last ending
     */
    commitEnding(endingId) {
        if (this.flags.ending_committed) {
            console.warn('commitEnding blocked: ending already committed');
            return false;
        }

        console.log('Committing ending:', endingId);

        // Set ending flag
        this.flags.ending = endingId;
        this.flags.ending_committed = true;

        // Store last ending ID in persistent
        this.persistent.last_ending_id = endingId;

        // Special handling for Script Deletion ending
        if (endingId === 'T0_SCRIPT_BREAK_EARLY') {
            this.persistent.script_deleted_once = true;
            console.log('Script deleted - theater enters improvisation mode');
        }

        // Sync completed masks
        this.syncCompletedMasks();

        // Increment play count
        this.persistent.play_count += 1;
        this.persistent.has_played_before = true;

        savePersistentData(this.persistent);
        console.log('Ending committed. Play count:', this.persistent.play_count);

        return true;
    },

    /**
     * Check if ending is a Script Break type (for auto-restart logic)
     */
    isScriptBreakEnding(endingId) {
        return endingId === 'T0_SCRIPT_BREAK_EARLY' || endingId === 'B2';
    },

    /**
     * Check if the script was ever deleted (T0 ending occurred)
     */
    isScriptDeleted() {
        return this.persistent.script_deleted_once === true;
    },

    /**
     * Mark game as completed - legacy method, now calls incrementPlayCount + syncCompletedMasks
     */
    markGameCompleted() {
        this.syncCompletedMasks();
        this.incrementPlayCount();
    },

    setFlag(name, value) {
        console.log(`Flag [${name}] set to ${value}`);
        this.flags[name] = value;
    },

    resetFlags() {
        this.flags = getDefaultSessionFlags();
    },

    /**
     * Clear all persistent data (for debugging)
     */
    clearPersistentData() {
        this.persistent = getDefaultPersistent();
        savePersistentData(this.persistent);
        console.log('Persistent data cleared');
    }
};

// Expose globally for debugging
window.GameState = GameState;
