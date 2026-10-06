# INFINIDLE

Adivina palabras en español en seis intentos, sin tener que esperar a mañana para la siguiente.

Me gustan mucho los juegos de adivinar la palabra del día, pero una al día se me queda corta. INFINIDLE
es lo mismo sin ese límite: aciertas (o fallas), pulsas «Siguiente palabra» y a por otra. Así todo el
rato que quieras.

## Qué cambia respecto a la palabra del día

- **Palabras sin fin.** Cada partida elige una palabra al azar de una lista de unas 2.000 por modo, así que
  es difícil que se repita.
- **5, 6 o 7 letras.** Cada modo guarda su propia partida y sus estadísticas, y puedes cambiar de uno a
  otro sin perder nada.
- **Intentos a tu gusto.** Seis por defecto, como siempre, pero se pueden poner entre 4 y 10.
- **Español de verdad.** La Ñ es una letra más del teclado. Las tildes no cuentan en el tablero (escribes
  ARBOL), pero al terminar ves la palabra bien escrita, «árbol», con un enlace a su definición en la RAE.
- **Corregir una letra suelta.** Puedes tocar cualquier casilla de la fila que estás escribiendo y
  cambiar solo esa letra. Si no tienes clara una posición, pon una X provisional y vuelve luego a ella;
  no hace falta borrar todo lo que va detrás.
- **Se aceptan conjugaciones y plurales como intento.** Lo que tienes que adivinar son palabras
  normales (sustantivos, adjetivos, infinitivos…), pero para probar letras vale cualquier palabra que
  exista: CANTÉIS, ÁRBOLES, TUVIERA…

No hay cuentas, ni anuncios, ni cookies. El progreso se guarda en tu navegador (localStorage). También
recojo algunas estadísticas anónimas de cómo se juega para mejorarlo ([más abajo](#estadísticas-de-uso)
te cuento cuáles).

## Las palabras

En `src/words/es/` hay dos listas por longitud:

| Letras | Soluciones | Intentos válidos |
| ------ | ---------: | ---------------: |
| 5      |      1.846 |           11.152 |
| 6      |      2.171 |           25.868 |
| 7      |      2.472 |           49.812 |

Las soluciones salen de cruzar los lemas del diccionario de la RAE con la frecuencia de uso real en
español (corpus de subtítulos): solo entran las palabras que se usan con cierta frecuencia. De ahí se
quitan nombres propios, imperativos tipo «mirad» y extranjerismos como «crack» o «show». La lista de
intentos válidos es mucho más grande porque incluye todas las formas flexionadas.

Todo eso lo hace `scripts/build-words.mjs`, que descarga las fuentes, las limpia y genera los ficheros.
La app no procesa nada, solo lee el resultado:

```bash
pnpm words          # regenera las listas (usa la caché de scripts/.cache)
pnpm words --fresh  # vuelve a descargar las fuentes
```

El filtro automático no es perfecto. Si sale alguna solución que no debería, se añade a
`scripts/blocklist.txt` y se regenera; seguirá valiendo como intento, pero ya no saldrá como palabra a
adivinar.

## Cómo está hecho

React y Vite, sin backend: el resultado de `pnpm build` son ficheros estáticos, pensados para Cloudflare
Pages. Algunas decisiones para que cargue rápido incluso con mala cobertura:

- **Solo se descarga la lista del modo en el que juegas.** Si empiezas en 5 letras, no se pide nada de
  las de 6 ni de 7 (la de 7 son unos 125 KB comprimidos). Al cambiar de modo aparece un «CARGANDO» y
  la lista se queda en memoria para la próxima vez.
- **El «CARGANDO» de arranque va dentro del HTML.** Se pinta en cuanto llega la página, sin esperar al
  CSS, a React ni a la tipografía. En móvil se dobla en un cuadrado (CAR / GAN / DO∞).
- **Las listas se piden a la vez que React.** Un script pequeño en el `<head>` mira qué modo tenías
  guardado y lanza la descarga antes de que llegue el JavaScript de la app. React no se monta hasta tener
  las palabras, así que del «CARGANDO» se pasa directo al tablero, sin parpadeos. Las listas llevan hash
  en el nombre, como el JS; `vite.config.js` pone sus direcciones en ese script al construir.
- **La tipografía se sirve desde aquí.** Nunito sin Google Fonts, recortada a dos pesos (600 y 900) y al
  alfabeto latino: unos 12 KB por peso. Se regenera con `scripts/build-fonts.sh`.
- **Comprobar una palabra es instantáneo.** Los intentos válidos se cargan en un `Set`, que se consulta
  sin recorrer la lista. La lista de 7 letras tiene casi 50.000 palabras.

## Sin conexión

El juego se puede instalar desde el navegador («Instalar» en Chrome/Edge/Android, «Añadir a pantalla de
inicio» en iPhone) y funciona sin Internet. Hace falta abrirlo una vez con conexión.

- `src/sw.js` es el service worker. No se empaqueta con la app: al terminar `pnpm build`, un plugin de
  `vite.config.js` lo copia a `dist/sw.js` con la lista de todo lo que hay que guardar (página, JS, CSS,
  fuentes y las listas de los tres modos) y una versión, que es un hash del contenido de todo ello.
- La página va primero a la red (con un límite de 3 segundos) y, sin red, se sirve la guardada. Todo lo
  demás sale de la caché.
- Al desplegar, cualquier cambio cambia `sw.js`. Al abrir el juego con conexión, el navegador lo nota,
  descarga todo de nuevo y borra la versión anterior. No hay que hacer nada a mano.
- Los iconos de `public/icons/` se generan desde el logo con `scripts/build-icons.sh`.

## Estadísticas de uso

INFINIDLE es un proyecto personal: no lleva publicidad, no gano dinero con él y no vendo ni le paso
datos a nadie. Aun así, me encantaría saber cómo se juega para seguir mejorándolo: qué palabras se
atascan, cuáles echáis en falta en la lista, si se prefieren 5, 6 o 7 letras… Los datos van a mi propia
instancia de [Umami](https://umami.is), una herramienta de estadísticas pensada para respetar la
privacidad, y solo los uso para mejorar el juego.

La primera vez que entras te pregunto si me dejas reconocer cuándo vuelves. Si me dices que sí, tu
navegador guarda un identificador aleatorio que no dice nada de ti: me sirve para saber que la misma
persona ha vuelto otro día, pero no quién eres. **Si me dices que no, juegas exactamente igual** y las
estadísticas se envían sin identificador: no sé si eres la misma persona de otro día. Puedes cambiar de
opinión cuando quieras en Ajustes: si lo desactivas, el identificador se borra y deja de enviarse.

Si dices que no, te lo volveré a preguntar dentro de una semana, por si cambias de idea. Si dices que
sí, no te pregunto más hasta dentro de dos años.

Con cada visita, Umami ve lo mismo que cualquier web: navegador, sistema, tamaño de pantalla, idioma,
de qué web vienes y el país o ciudad aproximados (los saca de la IP, pero la IP no se guarda). Además,
desde el juego se envía esto:

| Evento              | Cuándo                              | Datos                                                                                                                                                |
| ------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partida`           | Al terminar una partida             | Letras, intentos máximos y usados, si se ganó, la palabra, hora local y día de la semana, nº de partida en la visita, si se corrigió una casilla, si está instalada |
| `palabra_rechazada` | Un intento que no está en la lista  | Letras y la palabra (las más repetidas son candidatas a añadirse a `valid.txt`)                                                                     |
| `cambio_letras`     | Al cambiar de modo                  | De qué longitud a cuál                                                                                                                               |
| `compartir`         | Al compartir el resultado           | Si fue con el menú del móvil o copiando, letras y resultado                                                                                         |
| `rae`               | Al abrir la definición en la RAE    | Letras                                                                                                                                               |

Si aceptaste pero algo en tu navegador bloquea las estadísticas, al terminar una partida te lo comento
con un aviso discreto, como mucho una vez por semana. El juego funciona igual.

### Por dentro

- `vite.config.js` pasa la configuración de Umami al código solo si existe la variable de entorno
  `UMAMI_WEBSITE_ID`. Sin ella (pruebas, forks) no hay estadísticas ni se pregunta nada. Tampoco fuera
  del dominio de producción (el de `SITE_URL`): ni en local ni en las vistas previas.
- `src/lib/analytics.js` guarda la respuesta en `infinidle:v1:consent` (`{ granted, at, id }`). El
  rechazo vale 7 días, sin identificador. La aceptación vale 24 meses, con un `crypto.randomUUID()` que
  se manda a Umami como [Distinct ID](https://docs.umami.is/docs/distinct-ids) (hace falta Umami 2.18
  o superior). Al renovarla se mantiene el mismo identificador.
- El aviso no se puede cerrar sin responder, y «Aceptar» y «Rechazar» tienen el mismo tamaño y aspecto.
- El script se carga en cuanto hay respuesta, sea cual sea; hasta entonces no se envía nada. Va con
  `data-auto-track="false"`, para que la primera visita ya lleve el identificador si se aceptó.
- Si se retira el permiso sin recargar, el script de Umami no permite borrar el identificador que ya
  tiene, así que `umamiBeforeSend` (`data-before-send`) lo quita de cada envío mientras no haya permiso. Por eso los eventos se mandan siempre desde el código, no con atributos
  `data-umami-event`.
- Para no contar tus propias partidas, en la consola del navegador del dominio de producción:
  `localStorage.setItem('umami.disabled', 1)`.

## Desarrollo

Hace falta Node 24 y pnpm:

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # genera dist/
pnpm lint
```

`pnpm-workspace.yaml` tiene `minimumReleaseAge` a una semana: pnpm no instala ninguna versión de un
paquete publicada hace menos de siete días. Es una pequeña defensa contra paquetes comprometidos, que
suelen detectarse y retirarse en las primeras horas.

## Despliegue en Cloudflare Pages

- Framework preset: ninguno (o Vite)
- Build command: `pnpm build`
- Build output directory: `dist`
- Variables de entorno: `PNPM_VERSION=12.8.1` (la versión de Node la coge de `.node-version`) y, si se
  quieren estadísticas de uso (con aviso de consentimiento), `UMAMI_WEBSITE_ID` con el ID del sitio en Umami. Por defecto se usa Umami
  Cloud; para otra instancia, `UMAMI_SCRIPT_URL` (dirección completa del script) y, si los eventos van a
  otro sitio, `UMAMI_HOST_URL`.

El sitio no se indexa: lleva `noindex` tanto en una etiqueta meta como en la cabecera `X-Robots-Tag`.
Las vistas previas al compartir (WhatsApp, Telegram, X…) usan `public/og.png`, que se genera desde
`scripts/og/og.html` con `scripts/build-og.sh`. Las etiquetas `og:*` necesitan la URL completa del
sitio; por defecto es `https://infinidle.juannicolas.eu` y se puede cambiar con la variable `SITE_URL`.

`public/_headers` deja en caché un año el JS, el CSS y las listas de palabras (llevan hash en el nombre) y las fuentes.
`sw.js` y el manifiesto no se cachean, para que las actualizaciones lleguen en cuanto se despliegan.

## Créditos

- Las listas de palabras se generan a partir de:
  - [JorgeDuenasLerin/diccionario-espanol-txt](https://github.com/JorgeDuenasLerin/diccionario-espanol-txt):
    palabras del diccionario de la RAE.
  - [words/an-array-of-spanish-words](https://github.com/words/an-array-of-spanish-words) (MIT): formas
    flexionadas.
  - [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords): frecuencias de uso,
    publicadas bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Tipografía [Nunito](https://github.com/googlefonts/nunito), bajo SIL Open Font License
  (`public/fonts/OFL.txt`).
- Tipografía [Caveat](https://github.com/googlefonts/caveat) para la firma de la imagen de vista previa,
  bajo SIL Open Font License (`scripts/og/fonts/OFL-Caveat.txt`). Solo se usa al generar `og.png`.
- La mecánica está inspirada en Wordle, de Josh Wardle. Wordle es una marca de The New York Times
  Company; INFINIDLE es un proyecto personal sin ninguna relación con ellos.

## Licencia

El código está bajo licencia [MIT](LICENSE). Las listas de palabras de `src/words/` y la tipografía
de `public/fonts/` se derivan de los proyectos de terceros citados arriba y mantienen sus propias
licencias.
