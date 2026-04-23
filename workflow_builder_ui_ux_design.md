# Workflow Builder UI/UX Design

## Overview
The workflow builder is a drag-and-drop interface that allows users to create custom workflows with various step types. The UI should be intuitive and provide a rich set of configuration options for each step type.

## Main Components

### 1. Canvas Area
- Large central area where users drag and drop workflow steps
- Visual representation of the workflow with clear step indicators
- Ability to reorder steps by dragging them vertically
- Visual feedback when dragging steps

### 2. Step Palette (Left Sidebar)
- Categorized list of available step types:
  - **Basic Inputs**: Text, Number, Yes/No, Multiple Choice
  - **Media**: Photo, Video, Signature, Document Upload
  - **HORECA Specific**: Temperature, GPS Location, Timer, Barcode Scanner
  - **Logic**: Conditional Logic, Approval Steps
- Each step type has an icon and brief description
- Search functionality to quickly find step types

### 3. Properties Panel (Right Sidebar)
- Appears when a step is selected
- Context-sensitive controls based on the selected step type
- Configuration options for:
  - Label and description
  - Required field setting
  - Validation rules
  - AI verification settings
  - Role assignments
  - Conditional logic

### 4. Top Toolbar
- Save/Save As buttons
- Preview mode toggle
- Version management
- Import/Export options
- Undo/Redo functionality

## Step Configuration Forms

### Common Properties for All Steps
- **Label**: Display name for the step
- **Description**: Help text for users
- **Required**: Whether the step must be completed
- **Skippable**: Whether users can skip this step

### Type-Specific Properties

#### Text Input
- Placeholder text
- Validation pattern (email, phone, etc.)
- Character limits

#### Number Input
- Min/Max values
- Decimal places
- Units (e.g., °C, kg, L)

#### Photo Input
- Required GPS capture
- AI verification settings
- Required resolution
- Multiple photos allowed

#### Temperature Input
- Min/Max temperature range
- Unit (Celsius/Fahrenheit)
- AI verification for thermometer reading

#### Conditional Logic
- Condition expression builder
- Next step based on condition
- Default path if condition fails

## AI Verification Settings

For steps that support AI verification (mainly photos), the configuration includes:
- **Enable AI Verification**: Toggle to enable/disable
- **Verification Type**: OCR, Classification, Object Detection, etc.
- **AI Provider**: Moondream, OpenAI, Anthropic
- **Confidence Threshold**: Minimum confidence for auto-approval
- **Auto-fill Field**: Automatically populate another field with extracted value
- **Manual Review**: Require manual review if confidence is low

## Validation Rule Builder

A visual interface to create validation rules:
- **Condition**: When to apply the rule (e.g., "if field A > 10")
- **Validation Type**: Pass, Warning, Critical
- **Message**: Displayed to user when validation fails
- **Action**: Log, Alert, Block completion, Notify manager

## Preview Mode

- Simulated workflow execution environment
- Test all steps without saving
- Verify conditional logic works correctly
- Check AI verification behavior

## Responsive Design

- Works well on desktop and tablet devices
- Touch-friendly for mobile workflow execution
- Clear visual hierarchy with appropriate spacing

## User Experience Flow

1. User opens workflow builder
2. Selects a step type from the palette
3. Drags it to the canvas
4. Configures properties in the right panel
5. Repeats for additional steps
6. Sets up conditional logic if needed
7. Configures AI verification where appropriate
8. Saves and tests the workflow in preview mode
9. Publishes the workflow for use

## Visual Design

- Clean, modern interface with ample white space
- Consistent color scheme aligned with the rest of the application
- Clear visual indicators for required fields
- Intuitive icons for different step types
- Visual feedback for drag-and-drop operations
- Clear error states and validation messages