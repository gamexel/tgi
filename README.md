# TGI · Tu curso, a mano

App de consulta del curso de tracto genital inferior, adaptada a celulares y disponible como web app instalable y como biblioteca de carpeta.

**Abrir la app: [tgix.netlify.app](https://tgix.netlify.app)**

## Instalar en el celular

- **Android:** abrí la app en Chrome, tocá **Instalar app** y seguí la indicación del navegador.
- **iPhone/iPad:** abrila en Safari → **Compartir** → **Agregar a pantalla de inicio**. Activá **Abrir como app web** si aparece.
- **Computadora:** usá la opción de instalación de Chrome, Edge o Safari cuando esté disponible.

La barra inferior da acceso a Inicio, Repaso, Preguntas, Imágenes y Guardados. Los temas tienen enlaces directos, el botón Atrás vuelve a la vista anterior y el visor permite ampliar las imágenes y recorrerlas deslizando horizontalmente.

## Usar sin conexión

Al abrir la web con internet, TGI prepara los resúmenes, las preguntas, el buscador y la interfaz para uso offline. El estado se confirma en **Instalar app / Mi app**.

En esa misma pantalla, **Descargar biblioteca completa** guarda las 1.629 imágenes y los 65 archivos de texto: unos **205 MB**. La descarga muestra progreso, se puede pausar y continúa desde los archivos que ya están guardados, incluso después de volver a abrir TGI. Las imágenes consultadas online también se guardan cuando hay espacio.

Mantené la app abierta durante la descarga. Los favoritos y las descargas son propios de cada navegador/dispositivo. El navegador puede liberar almacenamiento; al borrar sus datos también se eliminan. Una nueva versión muestra **Actualizar** y conserva la descarga de imágenes si el material no cambió.

## Abrir la biblioteca

1. Descargá **TGI-portatil.zip** desde [Releases](https://github.com/gamexel/tgi/releases/latest).
2. Extraé el ZIP completo.
3. Abrí `TGI/index.html` en Chrome, Edge, Firefox o Safari.

También podés clonar este repositorio o descargarlo desde **Code → Download ZIP** y abrir el `index.html` de la raíz. Mantené todos los archivos y carpetas juntos.

## Consulta rápida

- Buscador en resúmenes, notas y texto reconocido de las imágenes.
- Filtros por módulo, tema y tipo de contenido.
- Fichas compactas con enlaces a sus capturas de origen.
- Visor de imágenes con ampliación y navegación por el tema.
- Preguntas del curso con respuestas desplegables cuando la captura contiene una clave textual explícita.
- Favoritos guardados en el navegador e impresión de resúmenes.

Usá `/` o `Ctrl+K` para buscar. No hacen falta tildes; reconoce equivalencias como HPV/VPH, HIV/VIH y biopsia/BX. Probá `HSIL márgenes`, `Nugent` o `liquen clobetasol`.

## Material incluido

| Módulo | Temas | Fichas | Imágenes | Preguntas |
| --- | ---: | ---: | ---: | ---: |
| 1 | 7 | 36 | 121 | 10 |
| 2 | 9 | 40 | 127 | 0 |
| 3 | 20 | 99 | 509 | 38 |
| 4 | 18 | 92 | 561 | 26 |
| 5 | 11 | 59 | 311 | 23 |
| **Total** | **65** | **326** | **1.629** | **97** |

Se conservan 508 notas escritas y texto reconocido en 1.549 imágenes. Las otras 80 imágenes se pueden consultar visualmente por tema. Hay 27 preguntas con clave textual explícita.

La página **Gonorrea** del módulo 2 solo contiene el título en el bloc original y está señalada como vacía. Los otros 64 temas contienen material. Los conteos están registrados en [cobertura.json](cobertura.json).

## Fidelidad a las clases

Los resúmenes sintetizan el material aportado y conservan referencias a sus fuentes. El OCR puede contener errores; cotejá cifras, dosis, tablas y flechas con la captura. Se señalan diferencias internas detectadas entre clases. Las opciones de las preguntas no son todas afirmaciones correctas y las respuestas restantes no se han inventado.

## Archivos

- `index.html`, `estilos.css`, `movil.css`, `app.js`, `busqueda.js`: interfaz y buscador local.
- `manifest.webmanifest`, `iconos/`, `pwa.js`, `sw.js`: instalación, descarga y modo offline.
- `offline-manifest.js`: inventario y versiones generados por el build; incluido para conservar la versión de carpeta.
- `datos/`: contenido de los cinco módulos.
- `imagenes/`: capturas optimizadas.
- `textos/`: apuntes extraídos en texto plano.
- `LEEME.txt`: instrucciones de uso y portabilidad.

La aplicación no carga recursos externos. La versión de carpeta no necesita servidor. Los favoritos quedan en cada navegador y no se transfieren al compartir la carpeta.

## Desarrollo y Netlify

Requiere Node.js 22 o superior. La app publicada no tiene dependencias de ejecución.

```sh
npm ci
npm run build
npm test
npm run preview
```

El build genera los iconos PNG a partir del SVG, calcula versiones del contenido y copia **todos los recursos de consulta** a `dist/`. No publica archivos de desarrollo ni credenciales. `netlify.toml` define `npm run build`, `dist/` y las cabeceras de actualización de la PWA.

Las pruebas comprueban integridad del material y sus referencias, buscador, navegación móvil, favoritos, manifiesto de instalación, tamaños de 320 a 1280 px, descargas con pausa/reanudación, recarga offline y apertura por `file://`. Usan Chrome instalado; `TGI_BROWSER=chromium` permite usar el navegador de Playwright tras `npx playwright install chromium`.

Repositorio de publicación: `gamexel/tgi`, rama `main`. Netlify: `tgix` (ID `7d5feb15-b0ce-4472-a8bf-dbdcd96da16e`). Para un despliegue manual del build comprobado: `netlify deploy --site 7d5feb15-b0ce-4472-a8bf-dbdcd96da16e --prod --dir dist --no-build`.
