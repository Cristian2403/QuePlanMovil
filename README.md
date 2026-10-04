# QuePlan 📍

Aplicación móvil para explorar lugares de interés, crear planes de visita y conectar usuarios con negocios locales.

## Tecnologías

- **React Native** con Expo
- **TypeScript**
- **Supabase** (base de datos y autenticación)
- **React Navigation** (navegación entre pantallas)

## Requisitos previos

- Node.js instalado
- Expo Go instalado en tu dispositivo móvil
- Cuenta en Supabase

## Instalación

1. Clona el repositorio
```bash
git clone https://github.com/Cristian2403/QuePlanMovil.git
```

2. Entra a la carpeta del proyecto
```bash
cd QuePlan
```

3. Instala las dependencias
```bash
npm install
```

4. Crea el archivo `.env` basándote en `.env.example`
```bash
cp .env.example .env
```

5. Agrega tus credenciales de Supabase en el archivo `.env`
EXPO_PUBLIC_SUPABASE_URL=tu-url-de-supabase
EXPO_PUBLIC_SUPABASE_KEY=tu-api-key


6. Ejecuta el proyecto
```bash
npx expo start
```

7. Escanea el código QR con Expo Go desde tu dispositivo

## Estructura del proyecto

QuePlan/
├── assets/ # Imágenes y recursos
├── components/ # Componentes reutilizables
├── screens/ # Pantallas de la app
├── navigation/ # Configuración de navegación
├── lib/ # Configuración de Supabase
├── types/ # Tipos de TypeScript
├── App.tsx # Punto de entrada
└── app.config.js # Configuración de Expo


## Base de datos

El proyecto usa Supabase con las siguientes tablas:

- **usuarios** — registro e inicio de sesión
- **negocios** — negocios registrados en la plataforma
- **lugares** — puntos de interés en el mapa
- **planes** — planes de visita creados por los usuarios
- **plan_lugares** — lugares asociados a cada plan
- **favoritos** — lugares guardados por los usuarios
- **resenas** — reseñas de los lugares
- **notificaciones** — notificaciones del sistema
- **foros** — foros de discusión
- **comentarios_foro** — comentarios en los foros

## Equipo

- Cristian Correa Henao
- Hanna García Guerra