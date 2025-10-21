# 🎨 Architecture Diagram Viewer - User Guide

## New Interactive Features

### Control Panel
Each diagram now has a control panel at the top with these buttons:

```
┌──────────────────────────────────────────────────────────┐
│  Diagram Title                                           │
│  🔍+ | 🔍- | ↺ | ⛶ | ⛶ | 📥 PNG                         │
└──────────────────────────────────────────────────────────┘
```

### Button Functions

| Button | Name | Function | Shortcut |
|--------|------|----------|----------|
| 🔍+ | Zoom In | Increase size by 20% | Mouse wheel up |
| 🔍- | Zoom Out | Decrease size by 20% | Mouse wheel down |
| ↺ | Reset | Return to 100% zoom | - |
| ⛶ | Fit to Screen | Auto-scale to 90% | - |
| ⛶ | Fullscreen | Toggle fullscreen mode | - |
| 📥 PNG | Export PNG | Download as image | - |

## 🖱️ Mouse Controls

### Zoom with Mouse Wheel
- **Scroll Up**: Zoom in
- **Scroll Down**: Zoom out
- **Range**: 50% to 300%

### Pan with Click & Drag
1. Click and hold left mouse button on diagram
2. Drag to reposition the diagram
3. Release to stop panning
4. Works in both normal and fullscreen modes

## 📥 Exporting Diagrams

### Export as PNG
1. Click the **📥 PNG** button
2. Wait for processing (button shows ⏳)
3. File automatically downloads
4. Filename format: `{diagram-type}-diagram.png`

### Export Quality
- **Resolution**: 2x pixel ratio (high DPI)
- **Background**: Dark theme preserved
- **Format**: PNG with transparency support
- **Quality**: Maximum (1.0)

## 🖥️ Fullscreen Mode

### Entering Fullscreen
1. Click the fullscreen button (⛶)
2. Diagram expands to fill entire screen
3. All controls remain accessible
4. Better for detailed viewing

### Exiting Fullscreen
- Click the exit button (⤓) 
- Or press the same button again

## 💡 Tips & Tricks

### Best Practices
1. **For Small Diagrams**: Use zoom in (🔍+) for details
2. **For Large Diagrams**: Start with "Fit to Screen" (⛶)
3. **For Presentations**: Use fullscreen mode + zoom controls
4. **For Sharing**: Export as PNG for easy sharing

### Keyboard-Free Navigation
All features work with mouse only:
- Zoom: Mouse wheel
- Pan: Click and drag
- Reset: Click reset button
- Export: Click export button

### Visual Feedback
- **Cursor Changes**: 
  - Normal: 👋 Grab cursor
  - Dragging: ✊ Grabbing cursor
  - Hovering button: 👆 Pointer cursor

- **Button States**:
  - Default: Subtle purple/green background
  - Hover: Brighter with slight lift
  - Active: Pressed down effect
  - Disabled: Dimmed with no-drop cursor

## 🎯 Common Use Cases

### 1. Viewing Complex Diagrams
```
1. Click "Fit to Screen" to see full diagram
2. Use mouse wheel to zoom in on areas of interest
3. Click and drag to explore different sections
4. Click "Reset" to return to starting view
```

### 2. Presenting Architecture
```
1. Click fullscreen button
2. Zoom in on specific components
3. Pan to show relationships
4. Use reset between sections
```

### 3. Documenting Design
```
1. Position diagram at desired view
2. Click "📥 PNG" button
3. Include exported image in documentation
4. Share with team members
```

### 4. Comparing Diagrams
```
1. Keep multiple browser tabs open
2. Zoom to same level on each
3. Switch between tabs
4. Export for side-by-side comparison
```

## ⚠️ Troubleshooting

### Diagram Not Rendering?
- Check if mermaid syntax is valid
- Look for error message in diagram area
- Try refreshing the page

### Export Not Working?
- Ensure popup blocker isn't active
- Check browser console for errors
- Try a different browser if issue persists

### Zoom/Pan Not Smooth?
- Close other resource-heavy tabs
- Disable browser extensions temporarily
- Try a different browser for better performance

### Fullscreen Issues?
- Check if browser allows fullscreen
- Try F11 for browser fullscreen first
- Ensure no browser restrictions

## 🌟 Pro Tips

1. **Quick Reset**: Double-click to reset (coming soon)
2. **Smooth Zoom**: Use mouse wheel for precise control
3. **Export Multiple**: Export each diagram separately for complete documentation
4. **Presentation Mode**: Use fullscreen + zoom for live demos
5. **Quality Check**: Zoom in before exporting to verify details

## 📊 Technical Specs

### Zoom Levels
- Minimum: 50% (0.5x)
- Default: 100% (1.0x)
- Maximum: 300% (3.0x)
- Increment: 20% per click

### Pan Limits
- Unlimited pan in all directions
- Smooth transition when releasing
- No bounds checking (free movement)

### Export Settings
- Format: PNG
- Background: #0b1625 (dark blue)
- Quality: 100%
- Pixel Ratio: 2x (Retina)

## 🔄 Updates & Feedback

This is version 1.0 of the enhanced diagram viewer. 

Future features may include:
- Touch gesture support
- Keyboard shortcuts
- Multiple export formats
- Diagram annotations
- Comparison mode

For issues or suggestions, please contact the development team.
