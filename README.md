# TGI · Biblioteca de consulta

Apuntes del curso de tracto genital inferior organizados en una biblioteca HTML que funciona sin internet, sin OneNote y sin instalación.

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

- `index.html`, `estilos.css`, `app.js`, `busqueda.js`: interfaz y buscador local.
- `datos/`: contenido de los cinco módulos.
- `imagenes/`: capturas optimizadas.
- `textos/`: apuntes extraídos en texto plano.
- `LEEME.txt`: instrucciones de uso y portabilidad.

La aplicación no carga recursos externos ni necesita servidor. Los favoritos quedan en cada navegador y no se transfieren al compartir la carpeta.
