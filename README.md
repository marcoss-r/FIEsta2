# FIEsta 2 🍒

Colección de juegos de fiesta por turnos para jugar **pasándose un solo móvil**.
Hermana de [FIEsta](../DescriptIA) (misma arquitectura y enfoque), con juegos
nuevos y estética roja.

**Los cinco juegos:** Verdad o Reto · Quién es más… · Dos mentiras y una verdad ·
El Impostor · Preguntas incómodas.

## Estado

🚧 **Sin empezar.** Solo existe la planificación.

## Por dónde empezar

Lee **[`md/PLAN_DESARROLLO.md`](md/PLAN_DESARROLLO.md)**: es la fuente de la
verdad del proyecto (qué se construye, qué se reutiliza de la app original, la
paleta, la arquitectura, las decisiones cerradas y las fases de desarrollo).

Después, cada juego tendrá su propio plan en `md/` (los escribe la Fase 1).

## Cómo abrir el proyecto (cuando exista código)

Basta con abrir `index.html` en el navegador. Si el navegador se queja al cargar
los `data/*.js`, sirve la carpeta con un servidor local:

```bash
npx serve .
```

## Tecnología

HTML + CSS + JavaScript **vanilla**: sin frameworks, sin dependencias, sin paso
de compilación. PWA instalable y jugable sin conexión. Se publica en GitHub Pages.
