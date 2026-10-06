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

No hay cuentas ni anuncios. El progreso se guarda en el
navegador (localStorage).

## Las palabras

En `public/words/es/` hay dos listas por longitud:

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
  las palabras, así que del «CARGANDO» se pasa directo al tablero, sin parpadeos.
- **La tipografía se sirve desde aquí.** Nunito sin Google Fonts, recortada a dos pesos (600 y 900) y al
  alfabeto latino: unos 12 KB por peso. Se regenera con `scripts/build-fonts.sh`.
- **Comprobar una palabra es instantáneo.** Los intentos válidos se cargan en un `Set`, que se consulta
  sin recorrer la lista. La lista de 7 letras tiene casi 50.000 palabras.

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
- Variable de entorno: `PNPM_VERSION=12.8.1`. La versión de Node la coge de `.node-version`.

`public/_headers` deja las listas en caché un día y el JS y el CSS (llevan hash en el nombre) y las fuentes, un año.

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
- La mecánica está inspirada en Wordle, de Josh Wardle. Wordle es una marca de The New York Times
  Company; INFINIDLE es un proyecto personal sin ninguna relación con ellos.

## Licencia

El código está bajo licencia [MIT](LICENSE). Las listas de palabras de `public/words/` y la tipografía
de `public/fonts/` se derivan de los proyectos de terceros citados arriba y mantienen sus propias
licencias.
