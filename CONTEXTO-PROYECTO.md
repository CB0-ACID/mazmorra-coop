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
   - 8 personajes en 4 roles: Ceniza (tanque defensor), Musgo (tanque mago), Escarcha (ágil, escarcha), Coral (ágil, demoledora: lanzagranadas), Brasa (brawler ejecutor), Ámbar (brawler ninja), Marea (tirador, rebote), Ciruela (tirador, torreta).
   - Enemigos por tiers: ácaro, limo y murciélago (T1), embestidor y artillero (T2), gólem y divisor (T3), guardián del piso (T4). En el código: `mite`, `slime`, `bat`, `charger`, `shooter`, `golem`, `splitter` y `boss` (ver el glosario).
   - Sistemas: vida y estamina de enemigos, aturdimiento y ejecuciones, levantar enemigos por los aires y mantenerlos arriba (malabar aéreo), bloqueo con bloqueo perfecto, hitstop/hitstun, búfer de entrada, rescate de compañeros caídos (fantasma si se agota el tiempo), aliado IA, habilidades 1 y 2 y ataques cargados.
   - Entradas: Teclado A, Teclado B, táctil y hasta 4 mandos (Gamepad API). Menú de pausa con guía de controles y modo de prueba.
   - Controles configurables: «Controles y sonido» en el menú principal (fila de accesos, abajo) y en la pausa. Asigna teclas a Teclado A/B y botones a los mandos; las asignaciones se guardan en el navegador (localStorage, clave `mz-binds`). Si una tecla ya es de otra acción, se intercambian. Esc siempre pausa y cancela. El ratón del Teclado A (clic y rueda) y el táctil son fijos.
   - Vida y estamina de los enemigos en puntos directos en `ENEMY` (desde el 2026-11-08 ya incluyen el antiguo ×4,4 de vida y ×2 de estamina). Escalado por piso y jugadores en `ENEMY_SCALE`: cada jugador humano extra suma un 50 % de vida (`multiHp`) para premiar combinar (levantar, rematar en el aire, ejecutar). El modo «1 + IA» cuenta como un jugador. Élites en `ELITE`.
   - Vida en puntos con barra (ya no en corazones; 1 corazón antiguo = 20 puntos): tanques 160, medios 100, ágiles 60. Cada ataque enemigo tiene su daño propio en ENEMY_DMG, con una entrada por ataque y sin «touch» genérico (élites × `ELITE.dmg` = +30 %); el daño al tocar sale de `CONTACT_ATTACK`; curaciones en HEAL (corazón recogido +40, al bajar de piso +40), Puño ejecutor +20 y rescate a 40. El corazón queda como símbolo de curación. Números flotantes de daño y curación y barrita sobre la cabeza al recibir daño.
   - Al recibir daño (constante HURT): hitstop de 0,05 s, hitstun de 0,2 s (0,35 s si el golpe quita 28 o más; tanques ×0,6, ágiles ×1,1) sin control y con empuje, interrumpe ataques, cargas y habilidades; después 1 s de invulnerabilidad desde el impacto con parpadeo que se acelera en el último cuarto. Al levantarse tras caer, 1,5 s. Las esquivas siguen siendo invulnerables pero ya no parpadean.
   - Fijado automático de los cuerpo a cuerpo (tanques y brawlers): al moverte, fijan al enemigo más cercano dentro del cono hacia el que miras, y al golpear dan un paso de entrada que cierra el hueco. Se ajusta con la constante AIM.
   - Mira automática de los personajes a distancia (sin fijar a mano): apunta al enemigo que tienes delante (prioriza a los que están en el aire) y, mientras disparas, se queda pegada aunque huyas, para disparar hacia atrás; con stick derecho o ratón solo hace de imán suave. Se ajusta con la constante AIM_R.
   - Iconos de habilidad a color (`drawAbilityIcon`): cada icono usa tonos derivados del color del personaje (`iconTones`: base, claro, oscuro y brillo) con contorno oscuro; casillas del marcador de 18 px.
   - Brasa y Ámbar saltan en vez de esquivar (moveType 'jump', constantes en JUMP): salto en la dirección del movimiento; si saltas hacia un enemigo en el aire te enganchas a él, lo mantienes flotando con golpes básicos (sin cargados ni habilidades, salvo la Caída Izuna de Ámbar, que sí se puede lanzar desde el aire) y puedes ejecutarlo en el aire si está aturdido.
   - **Furia de Ámbar** (constante `FURY`): barra bajo la vida que se llena con el daño que hace (y +8 por ejecución); tras 2,5 s sin pegar se vacía. Llena, entra 6,5 s en modo furia: humo, tinte naranja, +30 % de velocidad, golpes más seguidos y rápidos y salto que recarga antes; caer la apaga. En furia cambian sus habilidades (salen listas al entrar): **Garra taladro** (1, se lanza girando 300 px, atrapa y arrastra a los que toca con golpes cada 0,06 s y al final los lanza; al guardián solo lo atraviesa; recarga 2,2 s) e **Izuna de furia** (2, agarra al enemigo más cercano aunque no esté en el aire, salvo al guardián; suben juntos girando, caen en picado y la onda lanza a los de alrededor; recarga 2,5 s). El daño se atribuye con `furyBy` (jugador que se está actualizando).
   - Brasa: combo Directo, Cruzado y Ráfaga volcánica (5 puñetazos, no lanza); su golpe cargado es el Uppercut del dragón (avanza con un gancho de fuego que lanza en un rectángulo delante; constantes en CHARGED.uppercut).
   - Puño ejecutor (Brasa): salta solo al enemigo ejecutable más cercano (tier 1 o aturdido) o, si no hay, al más cercano, dentro de AB.reaper.range; sin objetivo no se puede usar.
   - Poder del dragón (Brasa, AB.dragon): el nivel 1 se recarga solo (regen); los niveles 2 y 3 necesitan cargas de ejecuciones. Nv1 bola de fuego, Nv2 dragón chino que gira alrededor, Nv3 forma de dragón que se teletransporta a 4 enemigos (repite si hay menos) con un kanji 火 en cada impacto.
   - Quemadura (BURN): estado con temporizador; cualquier daño de fuego (fireHit/applyBurn) lo reinicia.
   - Ranura de movimiento modular (`MOVES`): cada personaje elige `moveType` y cada tipo define nombre, descripción, icono y comportamiento (`start`/`update`, o `hold` para mantener). Tipos actuales: `dash` (Esquiva), `stride` (Zancada, Ceniza), `teleport` (Musgo), `jump` (Salto, Brasa y Ámbar) y `block` (Guardia, sin uso ahora).
   - Ranura de ataque cargado (`chargedSlot`): golpe cargado de cada cuerpo a cuerpo; en los tiradores, su disparo cargado o, si no cargan, su fuego continuo. Todos con icono propio.
   - El marcador muestra por jugador: movimiento, habilidad 1 y habilidad 2. El panel de selección lista ataque, carga, movimiento y habilidades con su icono.
   - Selección de personaje: con toque o ratón es en dos pasos, tocar un personaje (lo señala) y pulsar **Confirmar** abajo; si con eso estáis todos, empieza la partida, y si no el botón pasa a **Empezar** cuando el resto confirme. Con teclado o mando, golpe confirma y golpe otra vez (o Start) empieza. Ficha a la izquierda: cabecera con estadísticas, las dos habilidades en tarjetas grandes (recarga y requisito de uso en `ABILITY_NEEDS`) y debajo ataque, cargado y movimiento. Cartas de personaje en 2 columnas × 4 filas, una familia por fila.
   - Controles táctiles: botonera en arco alrededor de Atacar (tamaño en `--A`), con el icono de cada habilidad y la recarga en el propio botón. El botón de Atacar es contextual (`attackContext`): muestra el golpe especial tras moverte (`specialSlots`) con un halo, y mientras cargas el icono del cargado (`chargedSlot`) con un sector que se llena.
   - Golpes especiales con icono (`specialSlots`): tras moverte, avanzando hacia el fijado y retrocediendo, sacados del `meleeKit` de cada personaje; Marea tiene «Vaciar el tambor» y Ciruela «Misil teledirigido» tras moverse. La gatling de Ciruela coge velocidad al mantener el disparo (de 0,3 s a 0,11 s entre balas en 1,5 s) y se sobrecalienta (bloqueada 1,6 s); la Sobrecarga duplica la cadencia (tope 0,07 s) y hace que cada bala caliente 4 veces menos (`AB.gatling`, `gatlingFire`). Los iconos se componen con un gesto (giro, carrera, estocada, ascendente) y el arma del estilo (`sp_<gesto>_<arma>`). Se muestran en la ficha de selección, en la sección «Golpes especiales».
   - Marcador en partida (`drawHUD`, `HUD_UI`): se dibuja a escala 1 y se amplía con `hudS` = `cssPerUnit` / escala del lienzo (entre 1 y 1,8), para que en el móvil los iconos midan unos 26 px reales y el texto no baje de 12 px; con muchos jugadores se reduce para que quepa. `HUD` (alto) es variable. Casillas de 26 con los segundos de recarga dentro; vida verde que pasa a rojo y parpadea al 20 % (`hpColor`); al quedar lista una habilidad 1 o 2 de 1,5 s o más suena un aviso suave (`SFX.ready`, más grave la 1) y la casilla destella (`watchReady`).
   - **Confirmar en partida = botón de fijar/apuntar** (`INTERACTS`): con algo al alcance, ese botón hace la acción en vez de fijar y aparece un aviso «[botón] acción» sobre el jugador (en táctil, el botón Fijar se ilumina). Acciones: cruzar el portal, subir a la espalda de Ceniza con el escudo alzado (los humanos ya no se suben solos; el aliado IA sí) y bajar de ella (también con el movimiento), y cargar a la espalda la torreta de Ciruela (cualquier jugador; se suelta **manteniendo** Fijar, así que pulsarlo sigue fijando). A cuestas, la torreta sigue al portador, dispara, cura con Sobrecarga y gasta su tiempo, pero no recibe daño ni para balas; si el portador cae, se queda en el suelo (`carriedBy`, `pickTurret`, `dropTurret`). El portal antiguo (clic junto a él y golpear) queda comentado.
   - Las constantes de balance están agrupadas al principio del script (ENEMY, ENEMY_SCALE, ELITE, TIER_RULES, ENEMY_DMG, DMG, AB, CHARGED, BASE_STATS, REVIVE…). Ver «Convenciones del código».
   - **Salas más grandes que la pantalla y cámara de grupo** (estilo Hades): cada sala tiene su tamaño (`ROOM_SIZES`: inicio 21×15, tesoro 17×13, guardián 29×21, normales entre 25×21 y 35×15). La cámara sigue al centro del grupo y se aleja lo justo para que quepan todos hasta `CAM.zMin` (zoom con límite del laboratorio); llegado a ese zoom, quien está en un extremo no puede alejarse más (`leash`). Flechas en el borde para compañeros y enemigos fuera de la vista. Las puertas miden 3 casillas.
   - **Generación de salas**: forma rectangular, en cruz u octogonal (esquinas macizas) y relleno simétrico de pilares sueltos, rejilla de columnas, grupos de rocas, murete con huecos o columnata. Los pasillos centrales hacia las puertas siempre quedan libres y lo que no se alcanza desde el centro se rellena. Las oleadas aparecen cerca del grupo.
   - **Vista tres cuartos reforzada** (`VIEW`): el suelo se aplasta en vertical (`squash` 0.78) y los muros levantan `wallH` píxeles con cara frontal y sombra al pie; el muro de abajo va recortado para no tapar. Con `squash: 1` se vuelve a la vista cenital. Técnica: la lógica sigue en coordenadas de mundo; al dibujar, lo que va pegado al suelo (zonas, avisos, previsualizaciones) se pinta con el lienzo aplastado y lo que está de pie se pinta con sus «y» proyectadas un instante (`projectOn`/`projectOff`). Para guardar en un efecto un punto a cierta altura se usa `upY(y, altura)`.
   - Saltos y lanzamientos: sombra que encoge con la altura, marca de aterrizaje y línea de altura también para los personajes que saltan.
   - Pruebas automáticas: con `?debug` en la URL existe `window.MZ` (estado, `enterRoom`, `roomCleared`).
   - **Música sintetizada** (`MUSIC_DEF`, sin archivos), arreglo orquestal y dinámico de la «Danza deslizante de las doncellas» de las Danzas polovtsianas de Borodin («Stranger in Paradise»): `menu` (sección central de la danza), `calm` (explorar: tema lento en menor, celesta, drones y reverberación), `fight` (Re menor, 128 BPM, estilo combate de FTL: arpegio de sintetizador con eco, bajo a corcheas, batería electrónica y lead con el tema; secciones A tema → B octava arriba con metales → C puente en secuencia; capas orquestales por intensidad y tiempo de pelea; el crescendo lento anterior queda comentado), `boss` (Do menor armónica), codas `room` y `boss_win` (cierran lentas en La mayor y la exploración entra por debajo del acorde final; las fanfarrias anteriores quedan comentadas). Instrumentos sintetizados en `INST`, reverberación por convolución. `musicMix` reacciona en tiempo real: capas drive/peak por enemigos vivos, fases del guardián (<50 % coro; <25 % medio tono arriba y más rápido) y poca vida (<35 %: latido, filtro y tempo). Las composiciones anteriores quedan comentadas; se ajusta en la pestaña **Sonido**.
   - **Ajustes de sonido** (`AUD`, localStorage `mz-audio`): interruptor y volumen (pasos del 10 %, curva cuadrática) para el sonido general, la música y los efectos. Cadena de audio: efectos → `sfxNode`, música → `musicNode`, ambos → `master`. M activa o silencia todo.
   - **Navegación de menús** (2026-11-08): el menú principal tiene tres filas — modo (Mazmorra · Asedio), jugadores (1, 2, 3, 4, 1 + IA) y accesos (Controles y sonido · Dev Options) —; ↑ ↓ cambian de fila, ← → de opción y golpe confirma. Árbol: Jugadores → Elige personaje → partida (Pausa → Controles y sonido); Dev Options → Selección de nivel, Diario de ideas, Test de mandos (página aparte con «Volver al juego» y Esc) y APK. Regla común en todas las subpantallas: botón «‹ Volver» arriba a la izquierda (apartado del botón de pantalla completa en el móvil, `backBtnRect`) y Esc o Movimiento (B) vuelven a la pantalla anterior con el foco donde estaba. Pie común con `drawMenuHint`. «Abandonar y volver al menú» de la pausa pide una segunda pulsación. Con `?debug`, `MZ.ui` expone los rectángulos de los menús y el estado de la navegación para las pruebas del recorrido.
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

## Modo Asedio (prototipo, desde noviembre de 2026)
- Se elige en el menú principal en la primera fila (**Mazmorra** · **Asedio**, se cambia con ← →, clic o toque). Después se eligen jugadores y personajes como siempre.
- Objetivo: defender la fortaleza contra oleadas. Diseño completo en tres fases (murallas, puerta, torre); el prototipo tiene solo la **fase 1: murallas exteriores**, 5 oleadas (unos 5 minutos; la partida completa apunta a 15).
- **Zonas separadas** (cada una es una sala propia, para no pintar más de una a la vez): Muralla oeste, Patio de armas y Muralla este. Se viaja entre ellas con las **piedras de paso** (todo el grupo a la vez). Las zonas fuera de la vista se simulan de forma sencilla: los enemigos avanzan en línea recta y golpean objetivos, y trampas y torres siguen disparando.
- **Enemigos tipo minion de moba**: cada incursión entra por la brecha de una muralla, en la bifurcación se reparte entre los objetivos (al azar ponderado: prefieren los dañados y sin defensores) y, al destruir su objetivo, los supervivientes salen hacia el patio y atacan la Puerta. Si un jugador está cerca o les pega, se desvían a por él, con correa. Portaestandarte (élite con bandera desde la oleada 2): acelera a su escuadra y, si cae, la desmoraliza y da oro.
- **Objetivos**: torres de vigía (disparan flechas), almacén (da oro cada 10 s), polvorín (ballestas y torres +40 % de daño; explota al caer) y la Puerta (si cae, se pierde). Bajo el 50 % pueden arder y perder vida hasta que alguien apague el fuego.
- **Oro compartido**: bajas, portaestandartes, escaramuzas, fin de oleada y túneles sellados. Se gasta en reparar (canalizado junto al objetivo), reconstruir ruinas (80) y construir trampas en ranuras fijas: pinchos (30), ballesta (50) y brasero (40).
- **Mantenimiento**: pinchos con cargas (rearmar), ballestas con virotes y braseros con leña; virotes y leña son «pertrechos» que se cogen en la armería del patio o en la caja de cada muralla y se llevan encima.
- **Estabilidad del frente** (0-100): baja al perder objetivos y con cada enemigo que llega al patio; sube al ganar escaramuzas (aniquilar una incursión entera sin que nadie llegue al patio), al sellar túneles y al acabar oleadas. A cero, retirada (derrota).
- **Eventos semialeatorios** (desde la oleada 2): lluvia de fuego en la zona del grupo (solo la zona techada es segura) y zapadores (un túnel junto a un objetivo del que salen enemigos hasta que se apuntala; con varios jugadores hacen falta dos a la vez).
- **Mejoras entre oleadas** (provisionales): se elige una de tres (muros reforzados, oro, reparar más rápido, virotes de acero, vigor, brasas eternas, moral, carpinteros).
- **Viajar es una votación**: todos los jugadores humanos en pie tienen que ir a la piedra de paso y pulsar Fijar («Viajar»); el grupo avanza cuando confirma el último (los caídos y el aliado IA van con él). Encima de la piedra se ve «Listos n/m» con un punto por jugador; alejarse o volver a pulsar cancela.
- **Zona perdida**: cuando caen todos los objetivos de una muralla, queda perdida y cerrada (aviso para retirarse al patio). Sus trampas desaparecen, no se puede construir ni reconstruir y la piedra del patio que lleva allí sale tachada. Las incursiones que entran por ella van directas al patio.
- **Mapas y cámara como en la mazmorra**: murallas de 45 × 25 y patio de 41 × 29 casillas (más grandes que la pantalla, también en el móvil apaisado), con esquinas en diagonal y rocas; la cámara de grupo los recorre. Cada muralla tiene dos piedras de paso (una cerca de la brecha) para no cruzar el mapa con los personajes lentos.
- **Reloj del asedio** (arriba en el centro): en la preparación, cuenta atrás grande hasta la siguiente oleada con barra y pitidos en los últimos 5 s; en la oleada, tiempo, enemigos vivos y por dónde y en cuántos segundos entra la próxima incursión. Los eventos avisan con su propia cuenta atrás. El panel del asedio se amplía con la escala del marcador (legible en el móvil).
- **Sonido del oro** (`sgGold`): moneda al ganar y tintineo descendente al gastar (al reparar, espaciado). Todo cambio de oro pasa por `sgGold`.
- Todo se hace con el botón de **Fijar** (confirmar): construir, reparar, coger pertrechos, recargar, viajar, apuntalar y tocar el cuerno para empezar la oleada antes.
- Código: bloque «Modo Asedio» al final del script (constantes en `SG` y `SG_TRAPS`, mejoras en `SG_UPGRADES`). Ganchos: `siegeSteer` en `updateEnemy`, `siegeUpdate` en `update`, dibujo en `drawGame` y entrada `siege` al principio de `INTERACTS`. Con `?debug`, `MZ.siege.quick([personajes])` arranca una partida de asedio de prueba.

## Laboratorio: pantalla partida para 4 (mecánica 9)
- `laboratorio-coop.html#split4`: hasta cuatro jugadores en un mapa grande. Se agrupan por distancia con histéresis (juntos hasta 640 px, se unen a menos de 440) y cada grupo tiene su vista: entera, mitades, mitad + dos cuartos o 2×2. J1 y J2 con teclado (o J2 con IA), J3 y J4 con los mandos 3 y 4 o la IA; cualquier mando conectado manda sobre su jugador. Opción «siempre 2×2» para medir el peor caso; el marcador enseña los ms de dibujo.

## Convenciones del código (desde el 2026-11-08)
- **Nada se borra**: al modificar o quitar habilidades, ataques o valores, la versión anterior queda comentada justo encima con la etiqueta `[RETIRADO aaaa-mm-dd] motivo` (las retiradas antiguas llevan `[RETIRADO]` sin fecha). Un bloque grande retirado puede ir al final del archivo, en «Código retirado, comentado y sin efecto».
- **Fórmula de daño única** (`DMG`, con la fórmula escrita encima): todo el daño está en PV, la misma unidad que la vida de `ENEMY`. Golpe = `ch.melee × golpe.dmg × DMG.melee`; habilidad = valor de `AB` × `DMG.ability`; disparo normal con `DMG.shotGround` (0,36) o `DMG.shotAir` (0,84), y a enemigos con estamina la vida × `DMG.shotHpVsSta`. Aturdido × `DMG.stunned`; caída tras lanzamiento `DMG.fallHp` y `DMG.fallSta`. Sustituye a `MELEE_MUL`, `SHOT_MUL`, `AIR_SHOT_MUL`, `SHOT_GROUND_MUL`, `ABILITY_MUL`, `STUN_DMG_MUL`, `FALL_HP`, `FALL_STA`.
- **Reglas por tier en una tabla** (`TIER_RULES`, función `tierRule(e)`): ventana de levantar e interrumpir (`launchSta`: tier 1-2 siempre, tier 3 al 50 %, guardián al 25 %), empuje recibido, duración del aturdimiento, extra de daño aturdido, estamina de los disparos y probabilidad de soltar corazón. Las funciones `enVentana`, `levantable`, `guardianLevantable`, `launchable` e `interruptible` leen de ahí.
- **Daño enemigo sin huecos**: `edmg(e, ataque)` avisa en la consola (una vez, con `warnOnce`) si falta una entrada en `ENEMY_DMG`, y usa `DMG_FALLBACK` (20) para no romper la partida.
- **Nombres en código = nombres del glosario**: familias de personaje `tanque`, `agil`, `brawler`, `tirador` (antes `grande` y `golpe`). El guardián conserva el identificador interno `boss` (tipo de enemigo, tipo de sala y pistas de música).
- **Banco de pruebas**: con `?debug` en la URL; las comprobaciones de balance comparan una huella numérica (vida y estamina por piso y jugadores, daño de cada golpe y disparo a cada enemigo, reglas por tier) y simulaciones deterministas con cuatro aliados IA en mazmorra y asedio.

## Glosario
Término canónico en **negrita**; entre paréntesis, el anglicismo o la palabra que se usaba y el identificador en el código. En la interfaz y en los documentos se usa siempre el término canónico.

### Partida y estructura
- **Roguelite** (anglicismo aceptado): juego de partidas cortas con salas aleatorias en el que se empieza de cero cada vez. «Roguelike» es el género de origen, más estricto.
- **Cooperativo** («coop»): todos los jugadores contra la máquina en la misma pantalla.
- **Partida** («run»): de la selección de personajes a la derrota o al abandono.
- **Piso** (`floor`, `depth`): conjunto de salas que termina con el guardián y un portal al piso siguiente.
- **Sala** (`room`): espacio con puertas; se cierra hasta limpiarla. Tipos: inicio, normal, tesoro y guardián (`'boss'`).
- **Encuentro** (`makeEncounter`): los enemigos de una sala, elegidos con un **presupuesto** (`cost` de cada enemigo) que crece con la distancia, el piso y los jugadores. Puede llegar en dos **oleadas**.
- **Portal**: salida tras vencer al guardián.
- **Modo Mazmorra / Modo Asedio**: los dos modos del menú principal.

### Combate básico
- **Golpe** (ataque cuerpo a cuerpo, `melee`): ataque básico de tanques y brawlers. Cada personaje tiene su **juego de golpes** (`meleeKit`).
- **Combo**: cadena de tres golpes seguidos; el tercero es el **remate de combo** (`finisher`).
- **Golpe tras movimiento** (`afterMove`), **golpe adelantado** (`toward`) y **golpe de retirada / ascendente** (`away`): variantes según lo que hagas justo antes. Juntos son los **golpes especiales** (`specialSlots`).
- **Golpe cargado / disparo cargado** (`chargedMelee`, `charge`): mantener el ataque para cargar; nivel de carga de 0 a 1.
- **Disparo** (`shot`): ataque básico de ágiles y tiradores. **Impacto instantáneo** («hitscan»): llega sin viajar. **Proyectil** (`projectile`): viaja por la sala.
- **Habilidad 1 y habilidad 2** (`pri`, `sec`): habilidades propias de cada personaje; **habilidad alternativa** (`secAlt`) cuando una cambia según el estado.
- **Movimiento** (antes «dash», `moveType`): esquiva, zancada, teletransporte, salto, voltereta o guardia según el personaje.
- **Recarga** («cooldown», `cd`): tiempo hasta poder repetir una acción.
- **Fijar** («lock-on», `lockOn`, `target`): elegir el enemigo al que se dirigen golpes y disparos. **Fijado automático** (`AIM`) en cuerpo a cuerpo y **mira automática** (`AIM_R`) a distancia.
- **Fallo** («whiff»): golpe que no toca a nadie; se muestra «Fallo».
- **Empuje** («knockback», `kb`): desplazamiento que provoca un impacto.
- **Congelado al acertar** («hitstop»): pausa de unas centésimas al conectar un golpe, para dar peso.
- **Aturdimiento por impacto** («hitstun»): tiempo sin control tras recibir un golpe. No confundir con **aturdido** (estado por estamina).
- **Búfer de entrada** (`BUFFER`): una pulsación se recuerda 0,25 s y sale en cuanto se puede.
- **Invulnerabilidad** («i-frames», `inv`): tiempo en el que no se recibe daño (esquivas, tras recibir daño, al levantarse).
- **Bloqueo** y **bloqueo perfecto** («parry», `BLOCK_PERFECT`): parar un ataque; si es justo a tiempo, además interrumpe al enemigo.
- **Puntos de vida, PV** (`hp`): unidad única de vida y daño para jugadores y enemigos.
- **Estamina** (`sta`): segunda barra de los enemigos de tier 2 en adelante; al vaciarla quedan **aturdidos**.

### Estados y reglas de los enemigos
- **Tier** (`tier`, 1-4): categoría de amenaza. Tier 1 en manada y sin estamina; tier 2 estándar; tier 3 amenazas con habilidades; tier 4 el guardián.
- **Guardián** («boss», «jefe»; `type: 'boss'`): enemigo final de cada piso. En la interfaz y en los documentos siempre «guardián».
- **Élite** (`elite`): tier 2 reforzado con borde dorado (`ELITE`).
- **Aviso** (telegrafiado, `attackWarn`): «!» y preparación visible antes de cada ataque que hace daño.
- **Interrumpir** (`interruptHit`): cortar el ataque que el enemigo prepara. Tier 1-2 siempre; tier 3 y guardián solo en su ventana de levantar.
- **Levantar** (lanzar por los aires, «launch», `tryLaunch`): mandar a un enemigo al aire. **Lanzador** («launcher», `launcher: true`) es el golpe o habilidad que levanta. Ojo: `shotMode: 'launcher'` es el lanzagranadas de Coral y no tiene que ver.
- **Levantable** (`levantable`, `guardianLevantable`): enemigo dentro de su **ventana de levantar** (`TIER_RULES.launchSta`); su barra de estamina se pinta en cian y el guardián muestra un icono de viento.
- **En el aire** (`airborne`): enemigo levantado; cae despacio y, al tocar suelo, sufre la **caída** (`DMG.fallHp`, `DMG.fallSta`).
- **Aéreo** (`aerial(e)`): enemigo en el aire, lanzado (`airborne`) o volador (`flying`). Es el criterio para el salto de Brasa y Ámbar, la Caída Izuna y la altura de los golpes.
- **Malabar aéreo** («juggle», `JUGGLE_VZ`): mantener a un enemigo en el aire a golpes o disparos.
- **Aturdido** («stun», `stunT`): estado al vaciar la estamina; recibe más daño (`DMG.stunned`) y se le puede **ejecutar**.
- **Ejecutar** («execute», `executeEnemy`): acabar de golpe con un enemigo aturdido en el suelo pulsando el ataque a su lado (o en el aire, enganchado con el salto). El Puño ejecutor de Brasa también ejecuta a los tier 1. Carga recursos de algunos personajes (furia de Ámbar, Poder del dragón de Brasa).
- **Remate**: palabra reservada para el último golpe de un combo (`finisher`); para acabar con un aturdido se dice **ejecutar**.
- **Contacto** (`isHot`, `CONTACT_ATTACK`): daño por tocar al enemigo. Solo durante la embestida avisada del ácaro y del embestidor, y siempre con el guardián.
- **Volador** (`fly`, `flying`): el murciélago; vuela a su altura (`flyZ`) y no aterriza al caer. Mientras vuela solo le dañan los ataques a distancia, los golpes de quien salta, los ataques que lanzan por los aires y la Caída Izuna; el golpe normal desde el suelo avisa «Salta o lánzalo».
- **Quemadura** (`BURN`), **congelado** (`frozenT`), **ralentizado** (`slowT`), **enredado** (`rootT`): estados alterados.

### Enemigos (nombre de diseño → identificador)
- **Ácaro** → `mite` (tier 1, embestida avisada) · **Limo** → `slime` (tier 1, escupitajo) · **Murciélago** → `bat` (tier 1, volador, onda de sonido)
- **Embestidor** → `charger` (tier 2, embestida y zarpazo) · **Artillero** → `shooter` (tier 2, disparos)
- **Gólem** → `golem` (tier 3, salto y pisotón) · **Divisor** → `splitter` (tier 3, se teletransporta, siembra bombas y se divide al morir)
- **Guardián** → `boss` (tier 4)

### Personajes y roles
- **Rol** (`role`, visible como «Familia · Especialidad», p. ej. «Tanque · Mago»): Tanque (`tanque`), Ágil (`agil`), Brawler (`brawler`) y Tirador (`tirador`).
- **Brawler** (anglicismo que se mantiene como nombre de rol): luchador cuerpo a cuerpo a puñetazos o garras, que salta en vez de esquivar. Brasa y Ámbar.
- **Tanque**: personaje grande y lento con mucha vida que protege al grupo. Ceniza y Musgo.
- **Ágil**: personaje pequeño y rápido con poca vida. Escarcha y Coral.
- **Tirador**: personaje a distancia con disparo contundente. Marea y Ciruela.
- **Peso** (`WEIGHT`: pesado, medio, ligero): cómo arranca, frena, gira y encaja empujones.
- **Calor / sobrecalentamiento** (`heat`, `overheat`): recurso de la gatling de Ciruela; lleno, bloquea el arma.
- **Furia** (`FURY`): barra y modo especial de Ámbar.
- **Valoraciones** (`RATINGS`): daño, técnica y apoyo de 1 a 5, estimadas a mano.

### Jugadores, controles e interfaz
- **Caído** (`down`), **rescate** (`REVIVE`) y **fantasma** (`ghost`): un jugador sin vida queda caído; un compañero puede rescatarlo y, si se agota el tiempo, pasa a fantasma hasta la siguiente sala.
- **Aliado IA** (`npc`): compañero controlado por la máquina en el modo «1 + IA».
- **Marcador** («HUD», `drawHUD`): vida, recargas y recursos de cada jugador en pantalla.
- **Mando** («gamepad», `pad0`-`pad3`), **Teclado A / B** (`kb1`, `kb2`), **táctil** (`touch`), **modo mando** (`padmode`).
- **Tutorial previo**: pestañas Golpes, Habilidades y Estrategia antes de cada partida.
- **Laboratorio** (`laboratorio-coop.html`): banco de pruebas de mecánicas sueltas.

### Modo Asedio
- **Oleada** (`wave`), **incursión** (grupo que entra por una brecha), **escaramuza** (aniquilar una incursión sin que llegue al patio).
- **Zona** (Muralla oeste, Patio de armas, Muralla este) y **zona perdida** (cerrada para siempre).
- **Piedra de paso**: punto de viaje entre zonas por votación.
- **Objetivos**: torre de vigía, almacén, polvorín y Puerta. **Ranura** de trampa: pinchos, ballesta y brasero.
- **Pertrechos**: virotes y leña que se cargan encima. **Oro** compartido. **Estabilidad del frente** (0-100).
- **Portaestandarte**: élite con bandera que acelera a su escuadra. **Zapadores** y **lluvia de fuego**: eventos.
- **Mejoras entre oleadas** (`SG_UPGRADES`).

### Desarrollo
- **Retirado** (`[RETIRADO aaaa-mm-dd]`): código comentado y sin efecto que se conserva.
- **Huella numérica**: lista de valores calculados por el banco de pruebas para comprobar que un cambio no altera el balance.
- **Determinista**: simulación con números aleatorios fijados, que da siempre el mismo resultado.

