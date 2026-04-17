# BAV Builder Scan-in (React Native)

Scaffold only. The builder scan-in app from Section 12 of `SPEC.md` will be initialised as an Expo Fabric project.

Planned screens:
- Login (JWT in SecureStore)
- Queue (builder's `build_queue`)
- Scan-in (CPU - GPU - RAM - Storage - PSU - Motherboard, camera + Bluetooth scanner)
- QC checklist (with photo capture)
- Profile

Shared code comes from `@bav/lib` and `@bav/ui` (tailwind preset is NativeWind-compatible).

Bootstrap (not yet run):

```bash
cd apps/mobile
pnpm create expo-app . --template expo-template-blank-typescript
pnpm add nativewind react-native-reanimated @tanstack/react-query zustand zod
pnpm add -D tailwindcss@^3.4 @types/react
```
