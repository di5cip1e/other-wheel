# Wheel within a Wheel - User Guide

Welcome to the Wheel within a Wheel game! This comprehensive guide will help you get started and make the most of all the game's features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Gameplay](#basic-gameplay)
3. [Game Editor](#game-editor)
4. [Multiplayer Mode](#multiplayer-mode)
5. [Presets and Sharing](#presets-and-sharing)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### System Requirements

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Minimum screen resolution: 800x600
- Recommended: 1920x1080 or higher for best experience

### First Launch

1. Open the game in your web browser
2. You'll see the main menu with options to:
   - **Play Now**: Start with default settings
   - **Create Game**: Customize your game
   - **Load Preset**: Use a saved configuration
   - **Tutorial**: Learn the basics

### Quick Start

Click "Play Now" to jump right in with a simple two-wheel setup:
- **Outer Wheel**: 8 wedges with various prizes
- **Inner Wheel**: 4 multiplier wedges
- **Single Player**: Just you vs. the wheels

## Basic Gameplay

### How to Spin

1. **Power Selection**: Click "Start Spin" to begin the power meter
2. **Timing**: Watch the oscillating power bar and click "Stop" when you want to capture that power level
3. **Physics**: The wheels will spin based on your selected power, with realistic physics simulation
4. **Results**: Both wheels will eventually stop, showing your selected wedges

### Understanding the Wheels

#### Outer Wheel (Main Wheel)
- Contains the primary prizes or outcomes
- Spins independently based on your power selection
- Larger radius means more momentum

#### Inner Wheel (Bonus Wheel)
- Connected to the outer wheel through a "clutch" mechanism
- Receives torque from the outer wheel based on the clutch ratio
- Often contains multipliers or bonus effects

### Power Meter System

The power meter is your primary control mechanism:

- **Low Power (0-30%)**: Gentle spin, predictable results
- **Medium Power (30-70%)**: Balanced spin with good momentum
- **High Power (70-100%)**: Powerful spin with longer duration

**Pro Tip**: Higher power doesn't always mean better results - sometimes precision matters more than power!

### Physics Simulation

The game uses realistic physics:

- **Friction**: Wheels gradually slow down due to friction
- **Clutch Mechanics**: Inner wheel receives torque from outer wheel
- **Momentum**: Heavier wheels (more wedges) have more momentum
- **Deterministic**: Same power + same seed = same result

## Game Editor

### Accessing the Editor

1. From the main menu, click "Create Game"
2. Or during gameplay, click the "Edit" button
3. The editor opens with tabs for different customization options

### Wheel Configuration

#### Adding/Removing Wedges

1. **Add Wedge**: Click the "+" button on the wheel
2. **Remove Wedge**: Click the "×" button on any wedge
3. **Reorder**: Drag wedges to rearrange them

#### Wedge Properties

Each wedge can be customized:

- **Label**: Text displayed on the wedge (max 20 characters)
- **Weight**: Probability weight (higher = more likely to be selected)
- **Color**: Visual appearance (color picker or hex code)
- **Media**: Optional image or video content

#### Wheel Physics

Adjust the physical properties:

- **Friction Coefficient**: How quickly the wheel slows down (0.01-0.1)
- **Clutch Ratio**: How much torque transfers to inner wheel (0.0-1.0)
- **Radius**: Visual size of the wheel (affects momentum)

### Media Support

#### Adding Images

1. Click "Add Media" on a wedge
2. Choose "Image" type
3. Either:
   - **Upload**: Select a file from your device (JPG, PNG, GIF)
   - **URL**: Enter a web address for an online image
4. Add alt text for accessibility

#### Adding Videos

1. Choose "Video" type
2. Upload or link to video file (MP4, WebM)
3. Videos will auto-play when the wedge is selected
4. Keep videos short (under 10 seconds) for best experience

#### Media Guidelines

- **Image Size**: Recommended 400x400 pixels or smaller
- **File Size**: Keep under 2MB for good performance
- **Format**: Use web-optimized formats (JPG for photos, PNG for graphics)
- **Accessibility**: Always provide alt text descriptions

### Rule System

Create custom win/loss conditions:

#### Basic Rules

- **Specific Wedge**: Win if a particular wedge is selected
- **Combination**: Win if both wheels land on specific wedges
- **Score Threshold**: Win when reaching a certain score
- **Streak**: Win after consecutive successful spins

#### Advanced Rules

- **Conditional**: "If outer wheel shows X, then inner wheel must show Y"
- **Probability**: "Win if rare event (under 5% chance) occurs"
- **Elimination**: "Lose if landing on elimination wedge"

### Validation and Testing

The editor includes built-in validation:

- **Weight Distribution**: Visual indicator of actual vs. apparent probabilities
- **Physics Check**: Ensures stable simulation parameters
- **Media Validation**: Verifies all media loads correctly
- **Rule Conflicts**: Detects contradictory rules

## Multiplayer Mode

### Setting Up Players

1. In the editor, go to "Players" tab
2. Click "Add Player" (supports 2-8 players)
3. Enter player names and optional avatar images
4. Set turn order (or use random)

### Hot-Seat Gameplay

Players take turns on the same device:

1. **Turn Indicator**: Clear display of whose turn it is
2. **Pass Device**: Hand the device to the current player
3. **Individual Results**: Each player's results are tracked separately
4. **Score Tracking**: Running totals for all players

### Game Modes

#### Round-Based
- Set number of rounds (e.g., 5 rounds each)
- Highest total score wins
- Good for quick games

#### Score Target
- First to reach target score wins
- Creates tension as players get close
- Can lead to comeback victories

#### Elimination
- Players eliminated by landing on specific wedges
- Last player standing wins
- High-stakes excitement

### Turn Management

The game automatically handles:

- **Player Rotation**: Advances to next player after each turn
- **Score Tracking**: Maintains individual and total scores
- **Game State**: Saves progress in case of interruption
- **Winner Detection**: Automatically declares winner when conditions are met

## Presets and Sharing

### Saving Presets

1. After creating your game, click "Save Preset"
2. Enter a name and description
3. Add tags for easy searching
4. Choose difficulty level and player count
5. Preset is saved to your browser's local storage

### Loading Presets

1. From main menu, click "Load Preset"
2. Browse your saved presets
3. Preview preset details before loading
4. Click "Load" to start the game

### Sharing Presets

#### Export
1. Select a preset and click "Export"
2. Downloads a JSON file to your device
3. Share this file with friends via email, messaging, etc.

#### Import
1. Click "Import Preset"
2. Select a JSON file from your device
3. Preset is added to your collection
4. Validation ensures the preset is safe and functional

### Preset Categories

The game includes several built-in preset categories:

#### Classic Games
- **Fortune Wheel**: Traditional prize wheel
- **Truth or Dare**: Party game variant
- **Decision Maker**: Help choose between options

#### Educational
- **Math Facts**: Practice multiplication tables
- **Geography**: Countries and capitals
- **History**: Important dates and events

#### Party Games
- **Drinking Games**: Adult party entertainment
- **Ice Breakers**: Get-to-know-you activities
- **Team Building**: Corporate event games

#### Custom Templates
- **Blank Templates**: Starting points for your own creations
- **Themed Templates**: Holiday, sports, movie themes

## Advanced Features

### Themes and Customization

#### Visual Themes
- **Classic**: Traditional carnival wheel appearance
- **Modern**: Clean, minimalist design
- **Neon**: Bright, colorful cyberpunk style
- **Retro**: Vintage game show aesthetic

#### Audio Themes
- **Carnival**: Classic carnival sounds
- **Casino**: Slot machine and casino ambiance
- **Arcade**: Retro video game sounds
- **Silent**: No sound effects

#### Custom Themes
Create your own themes by customizing:
- Color schemes
- Font choices
- Sound effects
- Animation styles

### Accessibility Features

#### Visual Accessibility
- **High Contrast**: Enhanced visibility for low vision
- **Large Text**: Increased font sizes
- **Color Blind Support**: Alternative color schemes
- **Reduced Motion**: Minimized animations for motion sensitivity

#### Motor Accessibility
- **Keyboard Navigation**: Full game playable with keyboard only
- **Large Touch Targets**: Bigger buttons for easier tapping
- **Adjustable Timing**: Slower power meter for timing difficulties
- **Voice Commands**: Basic voice control (where supported)

#### Cognitive Accessibility
- **Simple Mode**: Reduced complexity interface
- **Clear Instructions**: Step-by-step guidance
- **Confirmation Dialogs**: Prevent accidental actions
- **Progress Indicators**: Clear feedback on game state

### Performance Optimization

#### Graphics Settings
- **Quality Level**: Adjust rendering quality for performance
- **Frame Rate Limit**: Cap FPS to save battery on mobile
- **Particle Effects**: Enable/disable visual effects
- **Anti-Aliasing**: Smooth edges (may impact performance)

#### Memory Management
- **Media Caching**: Control how media is loaded and stored
- **Preset Limit**: Maximum number of saved presets
- **History Cleanup**: Automatic cleanup of old game data

### Developer Features

#### Debug Mode
Enable advanced debugging (for developers):
- **Physics Visualization**: See force vectors and collision boundaries
- **Performance Metrics**: Real-time FPS and memory usage
- **State Inspector**: View internal game state
- **Console Logging**: Detailed operation logs

#### API Access
For advanced users and developers:
- **Game State API**: Programmatic access to game state
- **Event Hooks**: Custom code execution on game events
- **Plugin System**: Extend functionality with custom plugins

## Troubleshooting

### Common Issues

#### Game Won't Load
1. **Check Browser**: Ensure you're using a supported browser
2. **Clear Cache**: Refresh the page or clear browser cache
3. **JavaScript**: Verify JavaScript is enabled
4. **Extensions**: Disable ad blockers or other extensions temporarily

#### Poor Performance
1. **Close Other Tabs**: Free up browser memory
2. **Lower Quality**: Reduce graphics settings
3. **Update Browser**: Ensure you have the latest version
4. **Hardware**: Check if your device meets minimum requirements

#### Audio Issues
1. **Browser Permissions**: Allow audio playback
2. **Volume Settings**: Check system and browser volume
3. **Audio Format**: Some browsers don't support all audio formats
4. **Autoplay Policy**: Some browsers block autoplay audio

#### Preset Problems
1. **Storage Full**: Clear old presets to make space
2. **Corrupted Data**: Try importing/exporting to fix corruption
3. **Version Compatibility**: Older presets may need updating
4. **File Format**: Ensure imported files are valid JSON

### Error Messages

#### "Physics Simulation Error"
- **Cause**: Invalid wheel configuration or extreme values
- **Solution**: Reset wheel physics to default values
- **Prevention**: Use the editor's validation tools

#### "Media Load Failed"
- **Cause**: Image/video file couldn't be loaded
- **Solution**: Check file format and internet connection
- **Prevention**: Use supported formats and test media before saving

#### "Storage Quota Exceeded"
- **Cause**: Too many presets or large media files
- **Solution**: Delete unused presets or reduce media file sizes
- **Prevention**: Regular cleanup and optimize media

### Getting Help

#### In-Game Help
- **Tutorial**: Interactive guide to all features
- **Tooltips**: Hover over elements for quick help
- **Context Help**: Relevant help based on current screen

#### Community Support
- **User Forums**: Connect with other players
- **Video Tutorials**: Step-by-step video guides
- **FAQ**: Frequently asked questions and answers

#### Technical Support
- **Bug Reports**: Report issues for developer attention
- **Feature Requests**: Suggest new features
- **Documentation**: Comprehensive technical documentation

### Best Practices

#### Game Design
1. **Balance**: Ensure fair probability distributions
2. **Clarity**: Use clear, readable labels
3. **Testing**: Test your games thoroughly before sharing
4. **Accessibility**: Consider all types of players

#### Performance
1. **Media Size**: Keep images and videos reasonably sized
2. **Wedge Count**: Too many wedges can impact performance
3. **Complex Rules**: Overly complex rules may slow down the game
4. **Regular Cleanup**: Periodically clean up old presets and data

#### Sharing
1. **Documentation**: Include instructions with shared presets
2. **Testing**: Verify presets work on different devices
3. **Appropriate Content**: Ensure content is appropriate for intended audience
4. **Attribution**: Credit sources for media and ideas

---

## Quick Reference

### Keyboard Shortcuts
- **Space**: Start/Stop power meter
- **Enter**: Confirm selections
- **Esc**: Cancel/Go back
- **Tab**: Navigate between elements
- **Arrow Keys**: Navigate menus

### Default Settings
- **Friction**: 0.02 (outer), 0.03 (inner)
- **Clutch Ratio**: 0.5
- **Power Range**: 0-100%
- **Frame Rate**: 60 FPS target

### File Formats
- **Images**: JPG, PNG, GIF, WebP
- **Videos**: MP4, WebM
- **Presets**: JSON
- **Audio**: MP3, WAV, OGG

### Limits
- **Players**: 2-8
- **Wedges per Wheel**: 2-50
- **Preset Storage**: 100 presets max
- **Media File Size**: 5MB max per file

---

*For more detailed information, see the [Developer Documentation](../developer-guide/README.md) or visit our [online help center](https://example.com/help).*