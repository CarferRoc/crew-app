# Crew Meets - App Quedadas de Coches

App premium en React Native para la gestión de crews privadas y quedadas de coches.

## Stack Tecnológico
- **Framework**: React Native (TypeScript)
- **Estado**: Zustand
- **Navegación**: React Navigation (Tabs + Native Stacks)
- **Tema**: Custom Design System (Tokens de color, tipografía y sombras)

## Reglas de Puntuación
- **Personales**:
    - Unirse a un evento: **+1 punto**
    - Canjear vales: **Resta el coste del vale**
- **Crew**:
    - Crear un evento: **+10 puntos**
    - Ganar una batalla (Admin): **+50 puntos**

## Cómo correr el proyecto
1. `npm install`
2. `npx react-native run-android` o `npx react-native run-ios`

## Estructura de Carpetas
- `/src/models`: Tipados TS.
- `/src/theme`: Sistema de diseño.
- `/src/store`: Lógica de estado con Zustand.
- `/src/components`: UI modular y reutilizable.
- `/src/navigation`: Configuración de rutas.
- `/src/screens`: Pantallas principales.
