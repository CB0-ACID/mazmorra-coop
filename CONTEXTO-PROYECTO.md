# Proyecto: Mazmorra cooperativa (videojuego HTML)

Pega este documento como instrucciones del proyecto (o como primer mensaje) en la nueva cuenta y sube los dos archivos HTML como archivos del proyecto.

## Qué es
Videojuego de navegador en HTML: acción cooperativa con vista semicenital (tres cuartos), de sala en sala con encuentros aleatorios estilo roguelike, multijugador local para hasta 4 personas a la vez.

## Decisiones tomadas
- Multijugador **local** (no online): una sola pantalla, todos en la misma sala; las puertas se abren al limpiar la sala.
- Se empezó con un prototipo mínimo con formas gráficas simples (sin sprites).
- Todo está en un único archivo HTML con Canvas 2D programado a mano, sin motor.
- Flujo de trabajo: pedir ajustes y features en el chat, publicar como artifact y probar al momento en el móvil.

## Archivos
1. **mazmorra-coop.html**: el prototipo jugable (≈257 kB).
   - 8 personajes en 4 roles: Ceniza (tanque defensor), Musgo (tanque mago), Escarcha (ágil, escarcha), Coral (ágil, ráfaga), Brasa (brawler ejecutor), Ámbar (brawler ninja), Marea (tirador, rebote), Ciruela (tirador, torreta).
   - Enemigos por tiers: mite y slime (T1), charger y shooter (T2), golem y splitter (T3), guardián del piso (T4).
   - Sistemas: vida y estamina de enemigos, aturdimiento y ejecuciones, lanzar enemigos por los aires y rematarlos (juggle), bloqueo con bloqueo perfecto, hitstop/hitstun, búfer de entrada, rescate de compañeros caídos (fantasma si se agota el tiempo), aliado IA, habilidades 1 y 2 y ataques cargados.
   - Entradas: Teclado A, Teclado B, táctil y hasta 4 mandos (Gamepad API). Menú de pausa con guía de controles y modo de prueba.
   - Ajustes recientes: enemigos con ×4,4 de vida y ×2 de estamina; en partidas con varios humanos, cada jugador extra suma un 50 % de vida a los enemigos (MULTI_HP_MUL = 0.5) para premiar combos (lanzar, rematar en el aire, ejecutar). El modo «1 + IA» cuenta como un jugador.
   - Vida en puntos con barra (ya no en corazones; 1 corazón antiguo = 20 puntos): tanques 160, medios 100, ágiles 60. Cada ataque enemigo tiene su daño propio en ENEMY_DMG (élites +30 %); curaciones en HEAL (corazón recogido +40, al bajar de piso +40), Puño ejecutor +20 y rescate a 40. El corazón queda como símbolo de curación. Números flotantes de daño y curación y barrita sobre la cabeza al recibir daño.
   - Fijado automático de los cuerpo a cuerpo (tanques y brawlers): al moverte, fijan al enemigo más cercano dentro del cono hacia el que miras, y al golpear dan un paso de entrada que cierra el hueco. Se ajusta con la constante AIM.
   - Iconos de habilidad a color (`drawAbilityIcon`): cada icono usa tonos derivados del color del personaje (`iconTones`: base, claro, oscuro y brillo) con contorno oscuro; casillas del marcador de 18 px.
   - Brasa y Ámbar saltan en vez de esquivar (moveType 'jump', constantes en JUMP): salto en la dirección del movimiento; si saltas hacia un enemigo en el aire te enganchas a él, lo mantienes flotando con golpes básicos (sin cargados ni habilidades, salvo la Caída Izuna de Ámbar, que sí se puede lanzar desde el aire) y puedes ejecutarlo en el aire si está aturdido.
   - Ranura de movimiento modular (`MOVES`): cada personaje elige `moveType` y cada tipo define nombre, descripción, icono y comportamiento (`start`/`update`, o `hold` para mantener). Tipos actuales: `dash` (Esquiva), `stride` (Zancada, Ceniza), `teleport` (Musgo), `jump` (Salto, Brasa y Ámbar) y `block` (Guardia, sin uso ahora).
   - Ranura de ataque cargado (`chargedSlot`): golpe cargado de cada cuerpo a cuerpo; en los tiradores, su disparo cargado o, si no cargan, su fuego continuo. Todos con icono propio.
   - El marcador muestra por jugador: movimiento, habilidad 1 y habilidad 2. El panel de selección lista ataque, carga, movimiento y habilidades con su icono.
   - Selección de personaje: con toque o ratón es en dos pasos, tocar un personaje (lo señala) y pulsar **Confirmar** abajo; si con eso estáis todos, empieza la partida, y si no el botón pasa a **Empezar** cuando el resto confirme. Con teclado o mando, golpe confirma y golpe otra vez (o Start) empieza. Ficha a la izquierda: cabecera con estadísticas, las dos habilidades en tarjetas grandes (recarga y requisito de uso en `ABILITY_NEEDS`) y debajo ataque, cargado y movimiento. Cartas de personaje en 2 columnas × 4 filas, una familia por fila.
   - Controles táctiles: botonera en arco alrededor de Atacar (tamaño en `--A`), con el icono de cada habilidad y la recarga en el propio botón.
   - Las constantes de balance están agrupadas al principio del script (ENEMY, AB, CHARGED, BASE_STATS, REVIVE…).
2. **laboratorio-coop.html**: banco de pruebas con 8 mecánicas coop jugables (levantar al caído, cuerda de energía, congelar y romper, placas simultáneas, escudo y tirador, lanzar al compañero, cámara compartida, golpe sincronizado), con notas de diseño de cada una.

## Siguiente paso que se estaba valorando
- Seguir en web pero con más estructura: **Phaser 3** (recomendado), primero dentro de un solo HTML cargado desde CDN para mantener el flujo rápido de probar en el móvil; cuando el archivo pese demasiado, pasar a **Claude Code** con un proyecto Vite + TypeScript conectado a GitHub y desplegado en GitHub Pages/Netlify/Vercel.
- Alternativa considerada: Godot (editor visual, exporta a web).
- Para 4 jugadores locales hacen falta mandos (el teclado compartido da para 2). En el móvil se pueden emparejar mandos Bluetooth.
- Pendiente de decidir: portar el laboratorio a Phaser o arrancar directamente con una primera sala jugable.

## Flujo de trabajo actual (desde noviembre de 2026)
- Repositorio: https://github.com/CB0-ACID/mazmorra-coop (rama main).
- Publicado con GitHub Pages en https://cb0-acid.github.io/mazmorra-coop/ (index.html enlaza al juego y al laboratorio).
- Los cambios se piden en el chat de Claude; Claude edita los archivos, hace commit y push a main, y la web se actualiza en uno o dos minutos.
