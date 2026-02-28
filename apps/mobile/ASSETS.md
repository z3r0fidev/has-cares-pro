# Required App Store Assets

These image files must be placed in `apps/mobile/assets/` before running an EAS build.
The `assets/` directory is intentionally absent from the repository because binary assets
are tracked separately (or generated from design source). Create each file according to
the spec below and commit it before triggering a production build.

## icon.png
- Dimensions: 1024 x 1024 px
- Format: PNG (no alpha / transparency — App Store requirement)
- Design: Brand gold (#F5BE00) background with white "CE" monogram centered
- Used by: iOS home screen icon, App Store listing thumbnail

## splash.png
- Dimensions: 1284 x 2778 px (iPhone 14 Pro Max resolution)
- Format: PNG
- Design: White (#ffffff) background with horizontally centered CareEquity wordmark
  in brand gold (#F5BE00); safe zone 320 px from each edge
- Used by: Launch / splash screen on both iOS and Android

## adaptive-icon.png
- Dimensions: 1024 x 1024 px
- Format: PNG with alpha channel (foreground layer only)
- Design: White "CE" monogram on transparent background; the gold background
  (#F5BE00) is supplied separately via `android.adaptiveIcon.backgroundColor`
  in app.json, so do NOT paint the background here
- Used by: Android adaptive icon foreground layer

## notification-icon.png
- Dimensions: 96 x 96 px
- Format: PNG, white silhouette on transparent background
  (Android notification icons must be monochrome white)
- Design: Small "CE" lettermark or stethoscope outline in white
- Used by: Android push-notification tray icon (expo-notifications plugin)

## Tooling Notes
- Figma / Sketch source files should live in `design/assets/` (not committed here)
- To export from Figma: Frame > Export > PNG @3x for splash, @1x for icons
- After placing files, verify with: `npx expo-doctor` (checks asset dimensions)
- EAS Build will fail with a clear error message if any required asset is missing
