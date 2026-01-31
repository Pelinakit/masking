# Masking

A Sims-inspired game about neurodivergent experiences in remote work.

## Overview

Masking is a game where you navigate through life's challenges by thoughtfully managing your energy levels. You play as a cat navigating a world of dogs in a remote work setting — a metaphor for the neurodivergent experience of trying to fit in.

## Tech Stack

- **Engine**: Phaser 3
- **Language**: TypeScript
- **Runtime**: Bun
- **Bundler**: Vite
- **Data Format**: YAML narrative scripts

## Architecture

Four-layer architecture:
- `src/core/` - Engine foundation (Phaser lifecycle management)
- `src/game/` - Game logic systems (state, stats, progression)
- `src/scripting/` - YAML interpretation (dialogue parser, effects)
- `src/presentation/` - Phaser scenes and UI components

## Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Type check
bun run type-check
```

## Project Structure

```
masking/
├── src/
│   ├── core/           # Engine foundation
│   ├── game/           # Game logic systems
│   ├── scripting/      # YAML interpretation
│   └── presentation/   # Phaser scenes & UI
├── data/               # YAML game content
│   └── stories/        # Narrative scripts
├── assets/             # Game assets
│   ├── sprites/
│   ├── backgrounds/
│   └── audio/
└── index.html          # Entry point
```

## Accessibility

- CVD-friendly color palette
- WCAG-AA compliance
- Responsive design (mobile + desktop)
- Skippable tutorial
- Comic Relief font (Comic Sans alternative)

---

## Theme & Setting

**You are a cat in a dog's world.**

The player character is a cat working remotely in an office job where everyone else is a dog. This serves as a visual metaphor for neurodivergence:

- **Cats** = Neurodivergent individuals (the player)
- **Dogs** = Neurotypical coworkers (various breeds represent different personality types)
- **Boss** = Chihuahua (small but yappy and demanding)
- **Other coworkers** = Different dog breeds matching their personalities (e.g., golden retrievers as kind but overly enthusiastic)

The visual style is a **Sims-inspired parody** — think single-screen room view with stat bars, similar UI language, possibly even Comic Sans-adjacent fonts for that authentic Sims 2 vibe.

## What is masking

[oxford-review.com article](https://oxford-review.com/the-oxford-review-dei-diversity-equity-and-inclusion-dictionary/masking-neurodiversity-definition-and-explanation/)

**Masking (Neurodiversity) – Definition and Explanation**
What Is Masking (Neurodiversity)? Definition, Explanation, and Example
Masking (Neurodiversity) is a term gaining increasing attention in Diversity, Equity, and Inclusion (DEI) conversations. As workplaces and educational environments strive to become more inclusive, understanding the unique experiences of neurodivergent individuals is essential. One of the most critical yet often misunderstood aspects of neurodivergent life is masking.

**Definition**:
Masking, in the context of neurodiversity, refers to the act of suppressing or camouflaging natural behaviors, thoughts, or responses in order to conform to neurotypical social expectations. Neurodivergent individuals, such as those with autism, ADHD, dyslexia, or other neurological differences, may engage in masking to avoid judgment, fit in socially, or prevent discrimination.

Masking can involve mimicking social cues, forcing eye contact, hiding stimming behaviors, rehearsing conversations, or pretending to understand things when they don't. It is often subconscious and habitual, particularly when someone has been masking for many years.

**Why Do People Mask?**
Neurodivergent individuals mask for many reasons:

- Social acceptance: To avoid being seen as "different" or "awkward"
- Safety: To prevent bullying, discrimination, or exclusion
- Employment: To maintain a professional image in workplaces that lack neuroinclusive practices
- Internalised stigma: Due to societal norms that label neurodivergent traits as undesirable
- While masking may help people navigate certain social or professional settings in the short term, it often comes at a high cost.

**The Impact of Masking on Mental Health**
Engaging in masking (neurodiversity) can lead to significant emotional and psychological consequences. Common effects include:

**Exhaustion or burnout from constant self-monitoring**
Anxiety and depression, often exacerbated by the suppression of authentic behavior
Loss of identity, as individuals disconnect from their true selves
Delayed diagnosis, especially in women and nonbinary people who may mask more effectively
Research has shown that prolonged masking can lead to autistic burnout, a state of extreme mental and physical fatigue specific to neurodivergent people.

**Example**:
Consider Sarah, a young professional with undiagnosed autism. At work, Sarah forces herself to maintain eye contact during meetings, carefully scripts small talk, and mimics the social behavior of her colleagues. She often skips lunch to avoid the sensory overload of the office cafeteria and laughs along in conversations she doesn't understand, just to appear "normal."

By the end of each workday, Sarah feels completely drained. Over time, she begins to experience anxiety and depression but doesn't realise it's connected to her constant effort to mask her natural self.

This is a classic case of masking (neurodiversity): adapting to neurotypical norms at the expense of one's mental health and authenticity.

**Masking and DEI: Why It Matters**:
In DEI initiatives, acknowledging the phenomenon of masking is essential for creating truly inclusive spaces. When organisations recognise the invisible labor neurodivergent people undertake just to appear "typical," they can begin to:

- Promote neurodiversity training for all staff
- Normalise accommodations and sensory-friendly practices
- Encourage open conversations about neurodivergent experiences
- Create spaces where people feel safe to unmask

> **Inclusion isn't just about welcoming different people — it's about allowing them to be different without penalty.**

**Conclusion**:
Masking (neurodiversity) is a complex, deeply personal survival strategy that many neurodivergent individuals employ. While it can be useful in the short term, long-term masking often leads to mental health challenges and identity struggles.

Understanding masking is critical for anyone committed to DEI. By raising awareness and creating environments where people feel safe to be themselves, we take one more step toward a more equitable and inclusive world.

## Design Guidelines

- Single-player game
- **Single-screen room view** (Sims-style), real-time with pause
- Scene-based, reactive situational challenges
- **Remote work only** (scope decision — office expansion possible post-jam)

### Stats / Bars

The player must manage multiple stats throughout the day:

| Stat | Description |
|------|-------------|
| **Energy** | Core resource. Depleted by work, meetings, decisions. Restored by rest, naps, food. |
| **Stress** | Accumulates from tasks, deadlines, social interactions. High stress = bad outcomes. |
| **Hunger** | Must eat to maintain other stats. Can order Catdora (costs money, adds stress). |
| **Happiness** | Affected by activities, interactions, success/failure. Low happiness = lower energy recovery. |
| **Social Anxiety** | Spikes during meetings, calls, and interactions. Some positive interactions also raise it (e.g., flirting). |

### Work Challenges

- Work must get done at a sufficient level to meet deadlines
- Each day, **3-5 random tasks** are assigned (roguelike potential for difficulty scaling)
- Cumulative contiguous time in meetings and work has an increasing energy cost
- May strategically skip meetings or tasks to leave rest gaps for recovery
- May take sick-days to recover from energy depletion
- Decision-making is a major energy cost and may be the single largest energy cost of all

### Remote Work Dynamics

- Must mask to protect energy levels during online meetings (Zoomie calls = "battle scenes")
- Must break for lunch manually and break to recover between meetings
- Mid-work naps are possible (a perk of working from home!)
- Working from home enables autonomy and flexibility in work scheduling and rest breaks

## Masks (Battle Stances)

Masks function like **battle stances** in RPGs — different modes for different social situations. Each mask has different energy costs and effectiveness depending on context:

| Mask | Use Case | Energy Cost |
|------|----------|-------------|
| **Meeting Participant** | Online meetings, listening mode | Low |
| **Presenter** | Presentations, leading discussions | High |
| **Casual Colleague** | Chatting with coworkers | Medium |
| **Careful Subordinate** | Talking to the boss | Medium-High |
| **Professional Client-Facer** | Customer/client interactions | Very High |

Wearing the wrong mask for a situation causes additional stress and energy drain. Wearing no mask in professional situations has consequences but may be necessary when energy is critically low.

## Gameplay

### General

- Uses a 24-hour clock
- Optional tutorial Sunday
  - Starts in the player character's home (single-screen room with: bed, desk with laptop, kitchenette, cozy rug/mat, door to outside)
  - Day starts on a Sunday morning at 09:00
  - Shows controls and explains elements of the game in a simple and easy to understand sequence
    - Move left and right indicated as gently pulsating arrows with "A" and "D" inside them respectively on either side of the player character (a cat) who is in the middle
      - Movement tutorial arrows disappear after the player has moved a few steps
    - Pulsating arrow pointing at the kitchen counter with "E" inside it to indicate that the player should move over to it and press "E" to prepare and eat breakfast
      - Eating breakfast tutorial arrow disappears after the player has eaten breakfast
    - Pulsating arrow pointing at the laptop with "E" inside it to indicate that the player should move over to it and press "E" to open the laptop
      - The arrow clears off and the laptop screen appears with options (see Laptop section below)
    - The tutorial can be ended by walking to the door or going to bed to sleep until Monday
- ESC always closes the current top-most UI layer (e.g., from email to laptop to gameplay). This is shown as a permanent UI element ESC button in the top left corner of the screen with a relevant context text, e.g., "Close email" or "Close laptop" or "Menu" (when in gameplay) or "Back to game" (when in menu)
- All interactable objects will show the "E" key as a UI element when the player is close enough to it (approximately 1 meter in-game) as a gray button with the relevant key and context text. Menus and interactable screens (e.g., laptop and everything in it) can be navigated using WASD or arrow keys, gamepad or mouse. Using mouse to hover on elements shows the mouse cursor as a hand for interactions, speech bubble for talking to characters, walking stick figure for walking, etc.
- The control scheme used last takes precedence over the others in the UI elements and tips. (If controller is used, tutorial or gameplay won't show keyboard controls in tips or UI elements and vice versa)

### Laptop

The laptop is the central hub for work and distractions. Opens as a separate screen overlay.

**Work Functions:**

- **Email** — Check messages from boss, coworkers, clients
- **Calendar** — View scheduled meetings and deadlines
- **Tasks** — Today's work tasks that need completing
- **Zoom Calls** — Initiates "battle scene" meetings

**Personal Functions:**

- **Catdora** — Food delivery app. Costs money but saves time/energy. Ordering adds stress (spending anxiety!)
- **Chat** — Message coworkers. Potential romance subplot with a coworker (flirting = happiness +50, social anxiety +50)
- **Solitaire** — Relaxing mini-game, restores small amount of happiness
- **Hidden mini-game** — Like Chrome's dinosaur game when there's no internet. Easter egg for players to discover

### Zoom Calls ("Battle Scenes")

When joining a meeting, the view zooms to show:

- The player character (cat) in their video feed box
- Other participants (dogs) in their boxes
- Current mask selection
- Active stat bars

The player must:

- Choose appropriate mask for the meeting type
- Manage energy/stress during the call
- Potentially present, respond to questions, or just survive

### Social Interactions

**Coworkers:**

- Can chat via laptop during work
- Different dog breeds = different personalities and interaction dynamics
- One coworker may flirt with the player (romance subplot potential)

**Boss (Chihuahua):**

- Demanding, expects responsiveness
- Requires "Careful Subordinate" mask
- High stress interactions

### Characters

**Player Character:** A cat. Neurodivergent, works remotely, trying to survive the workweek.

**NPCs (all dogs?):**

| Character | Breed | Role | Notes |
|-----------|-------|------|-------|
| Boss | Chihuahua | Manager | Small but demanding, yappy |
| Coworker A | Golden Retriever | Colleague | Overly enthusiastic, all-over-the-place |
| Coworker B | TBD | Colleague | Potential romance interest |
| Customer Service | TBD | Support role | |
| Client | TBD | Complex multi-phase task giver | |

*More characters to be defined as scripting progresses.*

### Room Layout (Home)

Single-screen view containing:

- **Bed** — Sleep to end day, recover stats overnight
- **Desk + Laptop** — Central work hub
- **Kitchenette** — Prepare food (cheaper than Catdora, costs time/energy)
- **Cozy mat/rug** — Rest spot? Nap location?
- **Door** — Exit (future expansion potential)

Hotspots are defined with coordinates for click/interaction zones.

### Graphical style and animations

- 2D hand-drawn
- **Sims-inspired parody aesthetic** — UI bars, room view, possibly Comic Sans-adjacent fonts
- Low amount of animation frames (1-3 frames per animation)
- Simple, clear, accessible and recognizable graphics
- Supports CVD and low-vision players

#### CVD guidelines

> Designing for Color Vision Deficiency (CVD), or color blindness, requires moving beyond a "color-only" approach to ensure digital products are usable for everyone. Approximately 1 in 12 men and 1 in 200 women have some form of CVD. Best practices focus on providing redundant, high-contrast, and clearly labeled visual information.
Here are the key best practices for CVD-friendly UI design:

1. **Never Use Color as the Only Indicator**
The most critical rule is to provide multiple ways to understand information.
Forms & Errors: Instead of just highlighting a required field in red, use a red outline plus a warning icon and a descriptive text label.
Data Visualization: In charts, graphs, and maps, supplement colors with, textures, patterns, or direct labels to distinguish data points.
States: Use icons (like a checkmark or an 'X') or text to indicate success or failure, not just green or red colors.

2. **Prioritize Contrast Over Color**
For users with CVD, the contrast between colors is often more important than the hue itself.
High-Contrast Ratios: Ensure text and interactive elements meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text/components).
Lightness Differences: Avoid placing colors of similar lightness next to each other (e.g., green and red, or light blue and pink).
Safe Combinations: When using colors for differentiation, rely on high-contrast pairs like blue and yellow, or dark blue and orange.

3. **Use Texture and Pattern**
Patterns can make information distinguishable even in grayscale.
Line Styles: Use solid, dashed, and dotted lines to differentiate paths on graphs.
Patterns in Graphs: Use distinct patterns (e.g., stripes, dots, cross-hatching) to differentiate segments in pie charts or bars, particularly if the colors are similar in value.

4. **Provide Textual Support**
Ensure all information is understandable through text.
Direct Labeling: Instead of a color-coded legend, label graph elements directly.
Link Styling: Underline hyperlinks in text; don't rely solely on color to distinguish them.
Product Details: In e-commerce, explicitly list the color name rather than relying on a small color swatch.

5. **Test Your Designs**
Actively test for CVD throughout the design process.
Grayscale Test: View your UI in black and white to check for sufficient contrast and clarity.
Simulation Tools: Use tools like Color Oracle, Coblis (Color Blindness Simulator), or browser extensions to view designs as they would appear to users with Protanopia, Deuteranopia, or Tritanopia.

6. **Offer Customization**
Allow users to adapt the UI to their needs.
Themes: Provide high-contrast, dark, or specifically designed color-blind friendly themes.
Pattern Toggle: Allow users to toggle patterns on or off in charts.
Summary of Dangerous Combinations to Avoid
Red and Green
Yellow and Purple
Blue and Purple
Red and Black

## Development Philosophy

### Modularity & Extensibility

The core of the game engine must allow for modularity and extensibility by allowing the developers to add new rooms, characters, items, mechanism, interactions, behaviors, rules, etc. without having to modify the core engine, preferably, at all.

### Scripting

Scenes, characters and interactions are scripted separately and intuitively in YAML. One script per entity. Can defer to other scripts.

**Scene scripts:**

- Name, hotspots and their interactions, scene transitions or modular windows
- List of event scripts that can trigger and their special conditions

Example concept:

```yaml
# home.yaml
name: "Player home"
hotspots:
  - id: bed
    coords: [x1, y1, x2, y2]  # bounding box
    action: sleep_script
  - id: laptop
    coords: [x1, y1, x2, y2]
    action: open_laptop
  - id: kitchen
    coords: [x1, y1, x2, y2]
    action: prepare_food
```

**NPC scripts:**

- Name, species, role, location, behavior, interactions with player, dialogue trees, likes/dislikes, conditional events

Example concept:

```yaml
# dog.yaml
name: "Steve-dog"
species: "dog"
breed: "golden retriever"
role: "colleague"
interactions:
  - chat_casual
  - chat_work
likes:
  - "coffee"
  - "weekend"
  - "teamwork"
dislikes:
  - "silence"
  - "solo work"
animation_frames: "golden_retriever_spritesheet.png"
```

**Management script:**

- Read by game state manager
- Can be updated forcing a reread without restarting game
- Gameplay loop
- Base rules
- Scene transitions (reference to scene transition map script)
