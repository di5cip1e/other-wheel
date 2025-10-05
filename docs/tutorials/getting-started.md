# Getting Started Tutorial

Welcome to the Wheel within a Wheel game! This interactive tutorial will guide you through all the basic features and help you create your first custom game.

## Tutorial Overview

This tutorial is divided into several lessons:

1. **Basic Spinning** - Learn the fundamental gameplay
2. **Understanding Physics** - How the wheels interact
3. **Creating Your First Game** - Use the editor
4. **Multiplayer Setup** - Play with friends
5. **Advanced Features** - Explore all capabilities

## Lesson 1: Basic Spinning

### What You'll Learn
- How to start a spin
- Using the power meter
- Understanding results

### Step-by-Step Instructions

#### Step 1: Load the Tutorial Game
1. Click "Start Tutorial" from the main menu
2. You'll see a simple two-wheel setup:
   - **Outer Wheel**: 6 colored wedges with numbers
   - **Inner Wheel**: 4 multiplier wedges (×1, ×2, ×3, ×5)

#### Step 2: Your First Spin
1. Click the **"Start Spin"** button
2. Watch the power meter oscillate up and down
3. Click **"Stop"** when the power bar is around 50%
4. Observe how both wheels spin and gradually slow down

**What Happened?**
- Your power selection (50%) determined the initial spinning speed
- The outer wheel spun independently
- The inner wheel received some of the outer wheel's motion through the "clutch"
- Both wheels slowed down due to friction

#### Step 3: Understanding Results
After the wheels stop, you'll see:
- **Outer Result**: The wedge the outer wheel landed on
- **Inner Result**: The wedge the inner wheel landed on
- **Combined Result**: Your final outcome (outer × inner multiplier)

**Try This:**
- Spin again with different power levels (10%, 75%, 100%)
- Notice how power affects spin duration and final position
- Higher power = longer spin, but not necessarily better results!

### Power Meter Tips
- **Low Power (0-30%)**: Short, controlled spins
- **Medium Power (30-70%)**: Balanced spins with good momentum
- **High Power (70-100%)**: Long, dramatic spins

**Practice Exercise:**
Try to land on the "5" wedge on the outer wheel. Experiment with different power levels to see what works best.

## Lesson 2: Understanding Physics

### What You'll Learn
- How the clutch mechanism works
- The role of friction
- Why timing matters

### The Clutch System

The inner wheel doesn't spin independently - it's connected to the outer wheel through a "clutch":

#### Clutch Ratio Explained
- **0.0 (No Clutch)**: Inner wheel doesn't move at all
- **0.5 (Medium Clutch)**: Inner wheel gets half the outer wheel's torque
- **1.0 (Full Clutch)**: Inner wheel moves exactly with the outer wheel

**Interactive Demo:**
1. Go to "Settings" → "Physics Demo"
2. Adjust the clutch ratio slider
3. Spin and observe how it affects the inner wheel

### Friction Effects

Both wheels have friction that slows them down:

- **Higher Friction**: Wheels stop faster
- **Lower Friction**: Wheels spin longer
- **Different Friction**: Wheels can stop at different times

**Experiment:**
1. Try the "Low Friction" preset (wheels spin for a long time)
2. Try the "High Friction" preset (wheels stop quickly)
3. Notice how this affects your strategy

### Physics Strategy Tips

1. **Predictable Results**: Lower power + higher friction = more predictable outcomes
2. **Dramatic Spins**: Higher power + lower friction = exciting, unpredictable results
3. **Clutch Control**: Higher clutch ratio = inner wheel follows outer wheel more closely

## Lesson 3: Creating Your First Game

### What You'll Learn
- Using the game editor
- Customizing wheels and wedges
- Setting up basic rules

### Opening the Editor

1. From the main menu, click **"Create Game"**
2. You'll see the editor interface with several tabs:
   - **Wheels**: Design your wheels
   - **Rules**: Set win conditions
   - **Players**: Configure multiplayer
   - **Settings**: Adjust game options

### Designing Your Wheels

#### Step 1: Customize the Outer Wheel
1. Click on the **"Wheels"** tab
2. Select the outer wheel
3. Try these modifications:
   - **Add a wedge**: Click the "+" button
   - **Edit a wedge**: Click on any wedge
   - **Change colors**: Use the color picker
   - **Modify labels**: Type new text (keep it short!)

#### Step 2: Adjust Wedge Weights
Weights control probability, not visual size:

1. Click on a wedge to edit it
2. Change the **"Weight"** value
3. Notice the probability indicator shows the actual chance
4. **Example**: Weight 2 = twice as likely as Weight 1

**Try This:**
- Make one wedge very rare (weight 0.1)
- Make another very common (weight 5)
- Spin several times to see the difference

#### Step 3: Customize the Inner Wheel
1. Select the inner wheel
2. Add different multipliers or effects
3. Experiment with different clutch ratios

### Adding Media to Wedges

Make your game more engaging with images and videos:

#### Adding Images
1. Edit a wedge
2. Click **"Add Media"** → **"Image"**
3. Either upload a file or enter a URL
4. Add descriptive alt text

#### Adding Videos
1. Choose **"Video"** instead of image
2. Upload a short video (under 10 seconds recommended)
3. Videos will play when the wedge is selected

**Media Tips:**
- Keep files small for better performance
- Use web-friendly formats (JPG, PNG for images; MP4 for videos)
- Always add alt text for accessibility

### Setting Up Basic Rules

Rules determine what happens when certain combinations occur:

#### Creating a Win Condition
1. Go to the **"Rules"** tab
2. Click **"Add Rule"**
3. Choose **"Combination"** rule type
4. Set conditions:
   - Outer wheel lands on "JACKPOT"
   - Inner wheel lands on "×5"
5. Set outcome: "You win the game!"

#### Other Rule Types
- **Specific Wedge**: Trigger on any single wedge
- **Score Threshold**: Win when reaching a certain score
- **Elimination**: Lose when landing on specific wedges

### Testing Your Game

1. Click **"Test Game"** to try your creation
2. Make adjustments based on how it plays
3. Use **"Reset"** to start over if needed

**Design Tips:**
- Start simple and add complexity gradually
- Test frequently to ensure balance
- Consider the player experience - is it fun?

## Lesson 4: Multiplayer Setup

### What You'll Learn
- Adding multiple players
- Turn-based gameplay
- Score tracking

### Setting Up Players

1. In the editor, go to the **"Players"** tab
2. Click **"Add Player"** for each person (2-8 players supported)
3. Enter names and optionally add avatar images
4. Set the turn order (or use random)

### Multiplayer Game Modes

#### Round-Based Mode
- Each player gets the same number of turns
- Highest total score wins
- Good for fair, structured games

#### Score Target Mode
- First player to reach the target wins
- Creates exciting race dynamics
- Can lead to comeback victories

#### Elimination Mode
- Players eliminated by landing on specific wedges
- Last player standing wins
- High tension and drama

### Hot-Seat Gameplay

The game is designed for "hot-seat" multiplayer (one device, multiple players):

1. **Turn Indicator**: Shows whose turn it is
2. **Pass Device**: Hand the device to the current player
3. **Automatic Advancement**: Game moves to next player after each turn
4. **Score Tracking**: Individual and total scores displayed

### Multiplayer Strategy

- **Balanced Wheels**: Ensure all players have fair chances
- **Clear Rules**: Make sure everyone understands win conditions
- **Appropriate Length**: Consider attention spans (5-15 minutes typical)

## Lesson 5: Advanced Features

### What You'll Learn
- Preset management
- Themes and customization
- Accessibility features
- Performance optimization

### Working with Presets

#### Saving Your Creations
1. After creating a game, click **"Save Preset"**
2. Enter a descriptive name and description
3. Add tags for easy searching
4. Set difficulty and player count information

#### Sharing Presets
1. Select a saved preset
2. Click **"Export"** to download a JSON file
3. Share the file with friends via email, messaging, etc.
4. Others can **"Import"** your preset to play

#### Preset Categories
Organize your presets:
- **My Creations**: Your original games
- **Favorites**: Presets you've starred
- **Downloaded**: Imported from others
- **Built-in**: Example presets included with the game

### Themes and Customization

#### Applying Themes
1. Go to **"Settings"** → **"Appearance"**
2. Choose from built-in themes:
   - **Classic**: Traditional carnival look
   - **Modern**: Clean, minimalist design
   - **Neon**: Bright cyberpunk style
   - **Retro**: Vintage game show aesthetic

#### Audio Settings
1. **Sound Effects**: Enable/disable game sounds
2. **Volume Control**: Adjust audio levels
3. **Audio Themes**: Different sound packages

#### Custom Themes
Advanced users can create custom themes:
- Color schemes
- Font choices
- Sound effects
- Animation styles

### Accessibility Features

Make your games accessible to everyone:

#### Visual Accessibility
- **High Contrast**: Better visibility for low vision
- **Large Text**: Increased font sizes
- **Color Blind Support**: Alternative color schemes
- **Reduced Motion**: Minimize animations for motion sensitivity

#### Motor Accessibility
- **Keyboard Navigation**: Play entirely with keyboard
- **Large Touch Targets**: Easier tapping on mobile
- **Adjustable Timing**: Slower power meter for timing difficulties

#### Cognitive Accessibility
- **Simple Mode**: Reduced complexity interface
- **Clear Instructions**: Step-by-step guidance
- **Confirmation Dialogs**: Prevent accidental actions

### Performance Optimization

For the best experience:

#### Graphics Settings
- **Quality Level**: Adjust for your device's capabilities
- **Frame Rate**: Cap FPS to save battery on mobile
- **Effects**: Enable/disable visual effects based on performance

#### Memory Management
- **Preset Limit**: Don't save too many presets
- **Media Size**: Keep images and videos reasonably sized
- **Regular Cleanup**: Delete old, unused presets

## Practice Challenges

Now that you've completed the tutorial, try these challenges:

### Challenge 1: The Perfect Balance
Create a wheel where all wedges have exactly equal probability, but different visual sizes. Test it to verify the probability distribution.

### Challenge 2: The Elimination Game
Design a multiplayer game where players can be eliminated. Include both "safe" wedges and "elimination" wedges with appropriate probabilities.

### Challenge 3: The Media Showcase
Create a themed game using images or videos. Try a movie theme, sports theme, or educational theme with relevant media.

### Challenge 4: The Physics Experiment
Create two versions of the same game - one with high clutch ratio (0.9) and one with low clutch ratio (0.1). Compare how they play differently.

### Challenge 5: The Party Game
Design a game specifically for a party or social gathering. Include fun challenges, dares, or activities appropriate for your group.

## Troubleshooting Common Issues

### Game Won't Load
- Check that JavaScript is enabled in your browser
- Try refreshing the page
- Clear your browser cache if problems persist

### Poor Performance
- Lower the graphics quality in settings
- Close other browser tabs to free up memory
- Ensure your device meets the minimum requirements

### Preset Problems
- Verify imported presets are valid JSON files
- Check that you haven't exceeded the preset storage limit
- Try exporting and re-importing problematic presets

### Audio Issues
- Check that your browser allows audio playback
- Verify system and browser volume settings
- Some browsers block autoplay audio - click to enable

## Next Steps

Congratulations! You've completed the tutorial. Here's what to explore next:

1. **Browse Example Presets**: Try the built-in games for inspiration
2. **Join the Community**: Share your creations and get feedback
3. **Read the User Guide**: Detailed information on all features
4. **Experiment**: The best way to learn is by creating and playing

## Quick Reference Card

### Keyboard Shortcuts
- **Space**: Start/Stop power meter
- **Enter**: Confirm selections
- **Esc**: Cancel/Go back
- **Tab**: Navigate between elements

### Default Physics Values
- **Outer Wheel Friction**: 0.02
- **Inner Wheel Friction**: 0.03
- **Clutch Ratio**: 0.5
- **Target Frame Rate**: 60 FPS

### File Limits
- **Max Players**: 8
- **Max Wedges per Wheel**: 50
- **Max Media File Size**: 5MB
- **Max Stored Presets**: 100

---

**Need More Help?**
- Check the [User Guide](../user-guide/README.md) for detailed information
- Visit the [Developer Documentation](../developer-guide/README.md) for technical details
- Join our community forums for tips and shared presets

**Have Fun Creating!** 🎡