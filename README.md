# QuePlan 📍

Aplicación móvil para explorar lugares de interés, crear planes de visita y conectar usuarios con negocios locales.

## Tecnologías

- **React Native** con Expo
- **TypeScript**
- **Supabase** (base de datos y autenticación)
- **React Navigation** (navegación entre pantallas)
- **Expo Secure Store** (sesión persistente)
- **React Native Maps** (mapa interactivo)
- **Google Maps API** (proveedor del mapa)
- **EAS Build** (compilación para dispositivos físicos)

## Requisitos previos

- Node.js instalado
- Expo Go instalado en tu dispositivo móvil (versión 57)(esto puede que ya no se utilice)
- Cuenta en Supabase
- Cuenta en Expo
- API Key de Google Maps


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
GOOGLE_MAPS_API_KEY=tu-api-key-de-google-maps

6. Instala el development build en tu celular Android

   Descarga e instala el APK desde este link:
   https://expo.dev/accounts/cristian2403/projects/queplan/builds/22e84329-f047-40b2-924d-68b677dba8c3

7. Ejecuta el proyecto
```bash
npx expo start --dev-client
```

8. Escanea el QR con la app QuePlan instalada en tu celular

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

## Ramas

- **main** — código estable y probado
- **dev** — rama de desarrollo principal
- **feature/map** — integración de Google Maps, mapa interactivo y módulo de lugares


## Base de datos

El proyecto usa Supabase con las siguientes tablas:

- **usuarios** — registro e inicio de sesión
- **negocios** — negocios registrados en la plataforma
- **lugares** — puntos de interés en el mapa
- **servicios** — servicios ofrecidos por cada lugar
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