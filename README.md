# Masking

## Overview

Masking is a game where you navigate through life's challenges by thoughtfully managing your energy levels.

## What is masking

[oxford-review.com article](https://oxford-review.com/the-oxford-review-dei-diversity-equity-and-inclusion-dictionary/masking-neurodiversity-definition-and-explanation/)

**Masking (Neurodiversity) – Definition and Explanation**  
What Is Masking (Neurodiversity)? Definition, Explanation, and Example
Masking (Neurodiversity) is a term gaining increasing attention in Diversity, Equity, and Inclusion (DEI) conversations. As workplaces and educational environments strive to become more inclusive, understanding the unique experiences of neurodivergent individuals is essential. One of the most critical yet often misunderstood aspects of neurodivergent life is masking.

**Definition**:  
Masking, in the context of neurodiversity, refers to the act of suppressing or camouflaging natural behaviors, thoughts, or responses in order to conform to neurotypical social expectations. Neurodivergent individuals, such as those with autism, ADHD, dyslexia, or other neurological differences, may engage in masking to avoid judgment, fit in socially, or prevent discrimination.

Masking can involve mimicking social cues, forcing eye contact, hiding stimming behaviors, rehearsing conversations, or pretending to understand things when they don’t. It is often subconscious and habitual, particularly when someone has been masking for many years.

**Why Do People Mask?**  
Neurodivergent individuals mask for many reasons:

- Social acceptance: To avoid being seen as “different” or “awkward”
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
Consider Sarah, a young professional with undiagnosed autism. At work, Sarah forces herself to maintain eye contact during meetings, carefully scripts small talk, and mimics the social behavior of her colleagues. She often skips lunch to avoid the sensory overload of the office cafeteria and laughs along in conversations she doesn’t understand, just to appear “normal.”

By the end of each workday, Sarah feels completely drained. Over time, she begins to experience anxiety and depression but doesn’t realise it’s connected to her constant effort to mask her natural self.

This is a classic case of masking (neurodiversity): adapting to neurotypical norms at the expense of one’s mental health and authenticity.

**Masking and DEI: Why It Matters**:  
In DEI initiatives, acknowledging the phenomenon of masking is essential for creating truly inclusive spaces. When organisations recognise the invisible labor neurodivergent people undertake just to appear “typical,” they can begin to:

- Promote neurodiversity training for all staff
- Normalise accommodations and sensory-friendly practices
- Encourage open conversations about neurodivergent experiences
- Create spaces where people feel safe to unmask

> **Inclusion isn’t just about welcoming different people — it’s about allowing them to be different without penalty.**

**Conclusion**:  
Masking (neurodiversity) is a complex, deeply personal survival strategy that many neurodivergent individuals employ. While it can be useful in the short term, long-term masking often leads to mental health challenges and identity struggles.

Understanding masking is critical for anyone committed to DEI. By raising awareness and creating environments where people feel safe to be themselves, we take one more step toward a more equitable and inclusive world.

## Design Guidelines

- Single-player game
- Side-scrolling real-time with pause
- Scene-based, reactive situational challenges
- Each scene has a unique set of challenges and rewards
  - Work in general
    - Work must get done at a sufficient level to meet deadlines
    - Must organize tasks and projects to stay on track and to leave rest gaps for recovery
    - Cumulative contiguous time in meetings and work has an increasing energy cost
    - May strategically skip meetings or tasks to leave rest gaps for recovery instead
    - May take sick-days to recover from energy depletion
    - Decision-making is a major energy cost and may be the single largest energy cost of all
  - Work from home specifically
    - Must mask to protect energy levels during online meetings
    - Must break for lunch manually and break to recover between meetings
    - Pet cat and dog interactions soothe and replenish energy levels
    - Working from home enables a greater degree of autonomy and flexibility in work scheduling and rest breaks
  - Work from office
    - Lunch breaks are scheduled for you automatically and gets to chat with colleagues to recover energy levels (if social masking is active)
    - Interruptions by colleagues may replenish or drain energy levels depending on the nature of the interruption, the current mood and masking state and always at the cost of work progress
    - Working from office is conducive to consistent rhythm of work and rest because of group lunch and breaks and less decisions to make about what to do next

## Gameplay

### General

- Uses a 24-hour clock
- Optional tutorial Sunday
  - Starts in the player character's home (simple cut-out of a house with a bed, a table with a laptop and a chair, small kitchenette, a cat and a dog, food bowls on the floor and a door to outside to the right)
  - Day starts on a Sunday morning at 09:00
  - Shows controls and explain elements of the game in a simple and easy to understand sequence
    - Move left and right indicated as gently pulsating red arrows with "A" and "D" inside them respectively on either side of the player character who is in the middle
      - Movement tutorial arrows disappear after the player has moved a few steps
    - Pulsating red arrow pointing at the kitchen counter with "E" inside it to indicate that the player should move over to it and press "E" to prepare and eat breakfast
      - Eating breakfast tutorial arrow disappears after the player has eaten breakfast
    - Pulsating red arrow pointing at the laptop with "E" inside it to indicate that the player should move over to it and press "E" to open the laptop
      - The arrow clears off and the laptop screen appears with a list of things the player can do on the laptop (check email, check calendar, check tasks, play solitaire (fun and relaxing for the player character and the player))
      - Opening the email reveals that there is a single new message from your cat reminding you to buy his favorite food and telling on the dog for chewing on the cat's favorite toy
    - The tutorial can be ended by either walking to the door on the right and pressing "E" to take your pets for a walk or by pressing the ESC button to open the menu and selecting "End tutorial" or by over to the bed and pressing "E" to sleep until the next day
- ESC always closes the current top-most UI layer (e.g., from email to laptop to gameplay). This is shown as a permanent UI element ESC button in the top left corner of the screen with a relevant context text, e.g., "Close email" or "Close laptop" or "Menu" (when in gameplay) or "Back to game" (when in menu)
- All interactable objects will show the "E" key as a UI element when the player is close enough to it (approximately 1 meter in-game) as a gray button with the relevant key and context text. Menus and interactable screens (e.g., laptop and everything in it) can be navigated using WASD or arrow keys, gamepad or mouse. Using mouse to hover on elements shows the mouse cursor as a hand for interactions, speech bubble for talking to characters, walking stick figure for walking, etc.
- The control scheme used last takes precedence over the others in the UI elements and tips. (If controller is used, tutorial or gameplay won't show keyboard controls in tips or UI elements and vice versa)

### Graphical style and animations

- 2D hand-drawn
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

## Development

### Tools

**Game Engine**: Phaser 3
Phaser is a (mostly) 2D game engine. Phaser accommodates quick project setup and development cycles without the need for a bespoke toolchain. Language for the project is **TypeScript**.

**Build Tool**: Bun

Bun is a fast, modern runtime and package manager for JavaScript and TypeScript.

**Version Control**: Git

### Engine Design Philosophies

#### Modularity & Extensibility

The core of the game engine must allow for modularity and extensibility by allowing the developers to add new rooms, characters, items, mechanism, interactions, behaviors, rules, etc. without having to modify the core engine, preferably, at all.

#### Scripting

Scenes, characters and interactions are scripted separately and intuitively in YAML. One script per entity. Can defer to other scripts.

Scene scripts:

- Name, hotspots and their interactions, scene transitions or modular windows
- List of event scripts that can trigger and their special conditions

NPC scripts:

- Name, location, behavior (reference to separate reusable behavior script), interactions with player, dialogue trees, conditional events, etc.

Management script:

- Read by game state manager
- Can be updated forcing a reread without restarting game
- Gameplay loop
- Base rules
- Scene transitions (reference to scene transition map script)
