# Flujo de trabajo acordado

El usuario pidió que cada cambio solicitado en esta biblioteca quede directamente en GitHub (`gamexel/tgi`). Implementar el cambio en este repositorio, realizar las comprobaciones pertinentes y hacer commit y push a `main` dentro de la misma tarea.

La aplicación es HTML, CSS y JavaScript estáticos. Debe seguir funcionando al abrir `index.html` localmente, con todos los recursos incluidos en la carpeta.

Conservar las referencias de los resúmenes a sus fuentes y la correspondencia entre texto e imágenes. No inventar contenido faltante ni respuestas de preguntas sin una clave explícita en el material.

La app se publica en `https://tgix.netlify.app` (sitio Netlify `tgix`, ID `7d5feb15-b0ce-4472-a8bf-dbdcd96da16e`) desde `main`. Antes de subir cambios de la app, ejecutar `npm run build` y las comprobaciones pertinentes; incluir los iconos y `offline-manifest.js` generados en el commit. La carpeta publicada es `dist/` y no se versiona. Verificar que el despliegue de Netlify termine correctamente después del push.
