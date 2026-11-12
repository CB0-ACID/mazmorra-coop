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
   - Enemigos por tiers: ácaro, limo y murciélago (T1), embestidor y artillero (T2), gólem y divisor (T3), guardián del piso (T4). En el código: `mite`, `slime`, `bat`, `charger`, `shooter`, `golem`, `splitter` y `boss` (ver el glosario). El murciélago está desactivado de momento (sin enemigos voladores): su código sigue, pero no aparece en mazmorra ni en asedio.
   - **Guardianes** (`BOSS`, `BOSS_AI_BY_KIND`, `e.kind`): uno por acto en un ciclo de cuatro pisos (nombres de *El príncipe Ígor* desde el 2026-11-10; ver «Lore y trama»): piso 1 **Príncipe Galitski** (`cannon`, antes Guardián Cañonero), piso 2 **Kan Kónchak** (`ram`, antes Ariete del Bosque), piso 3 el **dúo Vladímir y Konchakovna** (`colossus` + `maiden`, ver abajo) y piso 4 **Ígor, Dragón del Eclipse** (`dragon`, antes Dragón de la Catedral; guardián final del ciclo); luego se repite. Los ataques de cada uno no cambian con el nombre (Galitski = el antiguo Cañonero, etc.). Reglas comunes: tienen frente y espalda (cara y arma hacia `e.dir`, que gira con velocidad limitada, así que rodearlos sirve); sus ataques salen por delante desde un punto visible (boca del cañón, cuernos, puños); todo se prepara con aviso en el suelo y la dirección se fija poco antes de golpear; tras cada ataque quedan quietos (ventana para castigar); y tienen un ataque en área alrededor, muy telegrafiado, cuyo peso sube cuanto más los rodeáis o más pegados estáis (`bossFlank`, `bossAreaWeight`). Cañonero: abanico apuntado, barrido de lado a lado y Estallido (anillo con huecos). Ariete: embestida en línea hasta el muro (si choca queda atontado 1,8 s; con rabia encadena dos), cornada en abanico y pisotón. Coloso: martillazo en cono, grieta que avanza en línea y terremoto alrededor. Con rabia (<50 % de vida, o en lamento) contorno rojo, más rápidos y combos (`bossRage`).
   - **Dúo del piso 3** (`DUO`, `isDuoDepth`, `e.duoMate`, `duoLinked`, 2026-11-10): **Vladímir, hijo de Ígor** (el antiguo Coloso, ahora con casco cónico dorado de la Rus) y **Konchakovna, hija del kan** (`BOSS.maiden`, `BOSS_AI_BY_KIND.maiden`) salen juntos; cada uno con una parte de la vida de un guardián normal (`DUO.share`: 62 % y 48 %). **Hilo rojo**: mientras están a menos de `DUO.linkR` (300) el uno del otro, los dos reciben el 45 % del daño de vida y estamina (también en ejecuciones); se ve como un hilo rojo que late entre ellos y, separados, como dos cabos rotos. **Lamento**: si cae uno, el otro entra en rabia hasta el final y se mueve un 20 % más rápido (`e.grief`). Konchakovna es ligera y rápida, mantiene la distancia y vuelve junto a Vladímir si la separan; ataques: **Danza de velos** (abanico ancho delante, aviso en el suelo), **Giro** (carril corto que recorre girando y daña al tocar; con rabia encadena dos) y **Cavatina** (área si la rodeáis: anillo de notas lentas con huecos; con rabia canta dos veces). Daños en `ENEMY_DMG.boss` (`veil`, `note`, `spin`). Abajo salen dos barras con nombres cortos y el estado («hilo rojo» o «lamento») (`drawBossBar`).
   - **Dragón de la Catedral** (guardián final, `BOSS.dragon`, `dragonSky`, `drawBossAir`): **Rayo de energía** (una esfera crece en la boca sobre la línea del disparo y el área se marca en el suelo hasta el muro; la dirección se fija 0,6 s antes; con rabia arrastra el rayo hacia ti), **Rayos del cielo** (2 o 3 áreas juntas sobre un jugador que caen una tras otra; con rabia, sobre dos jugadores) **Pisotón** (si alguien está muy cerca: área marcada alrededor con ondas de aviso; al soltarlo, una onda se expande desde el cuerpo, daña y empuja hacia fuera a quien alcanza) y **Vuelo** (despega y sale de la pantalla; mientras vuela no se le puede golpear, `e.sky` y `spawnT` alto; una sombra con contorno violeta marca su posición; hace 2 pasadas de bombardeo, 3 con rabia, con la línea y las bombas marcadas en el suelo, y cae en picado sobre un jugador con daño en área; al aterrizar se queda 1,8 s quieto). Su música es la pista `final`. Al vencerlo: «¡El sol ha sido devorado! Cae el telón». Pendiente: la forma humana de Ígor antes del Dragón.
   - **Refuerzos del guardián** (`BOSS_ADDS`, `updateBossAdds`): en la sala del guardián entran enemigos de tier 1 y 2 (mitad y mitad) a los 15 s y luego cada 28 s (22 s con rabia): 2 con 1 o 2 jugadores, 4 con 3 o 4 (el «1 + IA» cuenta como uno). Con un jugador no entra otro grupo hasta acabar con el anterior (el reloj se para mientras quede alguno vivo). Con varios, los grupos pueden solaparse hasta 6 refuerzos vivos (`maxMulti`). Aparecen lejos de los jugadores y del guardián, y al caer el guardián se deshacen.
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
   - **Música sintetizada** (`MUSIC_DEF`, sin archivos), arreglo orquestal y dinámico de la «Danza deslizante de las doncellas» de las Danzas polovtsianas de Borodin («Stranger in Paradise»): `menu` (sección central de la danza), `calm` (explorar: tema lento en menor, celesta, drones y reverberación), `fight` (Re menor, 128 BPM, estilo combate de FTL: arpegio de sintetizador con eco, bajo a corcheas, batería electrónica y lead con el tema; secciones A tema → B octava arriba con metales → C puente en secuencia; capas orquestales por intensidad y tiempo de pelea; el crescendo lento anterior queda comentado), `boss` (guardianes salvo el Dragón: la «Danza general» de las danzas en 3/4, el coro de hombres «¡Canta gloria al kan!» con notas de la partitura —temas `KHAN_A`, `KHAN_B`, crescendo coral `KHAN_E` y subida cromática `KHAN_CLIMB`—; compases de 12 semicorcheas con `bar: 12`; instrumentos `chorus` y `swell`; timbal en la quinta `V`; la versión en Do menor anterior queda comentada), `final` (Dragón: Re menor a 170 BPM, el tema martilleado con coro, metales y ostinato de cuerdas, ritmo 3+3+2 en graves y metales, al estilo del tema de Fatalis; capa «peak» con <60 % de vida o mientras vuela), codas `room` y `boss_win` (cierran lentas en La mayor y la exploración entra por debajo del acorde final; las fanfarrias anteriores quedan comentadas). Instrumentos sintetizados en `INST`, reverberación por convolución. `musicMix` reacciona en tiempo real: capas drive/peak por enemigos vivos, fases del guardián (<50 % coro; <25 % medio tono arriba y más rápido) y poca vida (<35 %: latido, filtro y tempo). Las composiciones anteriores quedan comentadas; se ajusta en la pestaña **Sonido**.
   - **Efectos por acción** (2026-11-08): cada acción tiene su sonido sintetizado. El catálogo `SND` (trazos de tono `SN_T` y ruido `SN_N`, con retardo opcional) se reproduce con `playSnd(nombre, gap, retardo)`, que limita la frecuencia de cada sonido. Las tablas asignan sonidos a movimientos (`SFX_MOVE`), habilidades (`SFX_ABILITY`), estados de enemigo (`SFX_STATE`, avisada por `enemyCue` en cada paso, así cubre a todos los enemigos y jefes) y ataques del guardián (`BOSS_FX_SND`). Los menús suenan en `menuInput` (`menuSfx`); los «flush» que solo actualizan los flancos usan `menuInput(dev, true)` y son silenciosos. Para añadir un sonido: crear la entrada en `SND` y, si corresponde, en su tabla. Con `?debug`, `MZ.sfx` expone `SND` y `playSnd` para probarlos.
   - **Ajustes de sonido** (`AUD`, localStorage `mz-audio`): interruptor y volumen (pasos del 10 %, curva cuadrática) para el sonido general, la música y los efectos. Cadena de audio: efectos → `sfxNode`, música → `musicNode`, ambos → `master`. M activa o silencia todo.
   - **Navegación de menús** (2026-11-08): el menú principal tiene tres filas — modo (Mazmorra · Asedio), jugadores (1, 2, 3, 4, 1 + IA) y accesos (Controles y sonido · Dev Options) —; ↑ ↓ cambian de fila, ← → de opción y golpe confirma. Árbol: Jugadores → Elige personaje → partida (Pausa → Controles y sonido); Dev Options → Selección de nivel, Diario de ideas, Test de mandos (página aparte con «Volver al juego» y Esc) y APK. Regla común en todas las subpantallas: botón «‹ Volver» arriba a la izquierda (apartado del botón de pantalla completa en el móvil, `backBtnRect`) y Esc o Movimiento (B) vuelven a la pantalla anterior con el foco donde estaba. Pie común con `drawMenuHint`. «Abandonar y volver al menú» de la pausa pide una segunda pulsación. Con `?debug`, `MZ.ui` expone los rectángulos de los menús y el estado de la navegación para las pruebas del recorrido.
   - **Acceso directo a guardianes** (Dev Options, fila 3, 2026-11-10; `devBoss`, `DEV_BOSSES`, `drawBosses`): elige Desactivado, Galitski, Kónchak, el dúo o Ígor-Dragón; la próxima partida empieza directamente en la sala del guardián de ese piso (`newRun`). Tiene prioridad sobre la selección de nivel; tras vencerlo, el portal lleva al piso siguiente como siempre. Las partidas con esta opción solo pueden ser de prueba (`runLogBlock`).
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
- **Mapa continuo** (77 × 21 casillas; cada zona de unas 24 × 19 útiles, algo más que la pantalla, que enseña unas 21 × 13; reducido desde 121 × 29 por rendimiento): Muralla oeste, Patio de armas y Muralla este en un solo mapa, unidas por pasos de 5 casillas en los muros interiores; se va andando de una a otra y la cámara de grupo lo recorre como en la mazmorra. Las **piedras de paso** son atajos (cada muralla tiene una cerca de su brecha, y el patio una hacia cada muralla). Todos los enemigos usan siempre la IA normal. [Antes cada zona era una sala aparte y solo se cambiaba con las piedras; esa versión queda comentada como [RETIRADO].]
- **Enemigos tipo minion de moba**: cada incursión entra por la brecha de una muralla, en la bifurcación se reparte entre los objetivos (al azar ponderado: prefieren los dañados y sin defensores) y, al destruir su objetivo, los supervivientes cruzan andando el paso hacia el patio (al entrar cuenta como fuga) y atacan la Puerta. Si un jugador está cerca o les pega, se desvían a por él, con correa. Portaestandarte (élite con bandera desde la oleada 2): acelera a su escuadra y, si cae, la desmoraliza y da oro.
- **Objetivos**: torres de vigía (disparan flechas), almacén (da oro cada 10 s), polvorín (ballestas y torres +40 % de daño; explota al caer) y la Puerta (si cae, se pierde). Bajo el 50 % pueden arder y perder vida hasta que alguien apague el fuego.
- **Oro compartido**: bajas, portaestandartes, escaramuzas, fin de oleada y túneles sellados. Se gasta en reparar (canalizado junto al objetivo), reconstruir ruinas (80) y construir trampas en ranuras fijas: pinchos (30), ballesta (50) y brasero (40).
- **Mantenimiento**: pinchos con cargas (rearmar), ballestas con virotes y braseros con leña; virotes y leña son «pertrechos» que se cogen en la armería del patio o en la caja de cada muralla y se llevan encima.
- **Estabilidad del frente** (0-100): baja al perder objetivos y con cada enemigo que llega al patio; sube al ganar escaramuzas (aniquilar una incursión entera sin que nadie llegue al patio), al sellar túneles y al acabar oleadas. A cero, retirada (derrota).
- **Contingencias contra la acumulación de enemigos** (rendimiento y legibilidad, constantes en `SG` y `SG_PLAN`):
  - Tope de enemigos vivos a la vez: 12 + 2 por jugador humano extra (`maxAlive`, `maxAliveP`). Al llegar, los refuerzos esperan: el reloj de apariciones (`spawnClock`) se para y el reloj del asedio dice «Refuerzos en espera». Los túneles de zapadores también esperan.
  - Tope de tier 3 vivos: 1 + 0,5 por jugador extra (`maxT3`, `maxT3P`).
  - Cada incursión entra en escuadras de 3 (medio segundo entre enemigos, 3 s entre escuadras).
  - Incursiones separadas en el tiempo: plan por oleada en `SG_PLAN` (2 incursiones en la oleada 1, 3 en la 2 y 3, 4 en la 4 y 5, separadas unos 20 s).
  - Menos enemigos por incursión: portaestandarte e tier 3 en incursiones alternas. Con 2 jugadores, la oleada 5 trae 35 enemigos en total (antes unos 70).
- **Eventos semialeatorios** (desde la oleada 2): lluvia de fuego en la zona del grupo (solo la zona techada es segura) y zapadores (un túnel junto a un objetivo del que salen enemigos hasta que se apuntala; con varios jugadores hacen falta dos a la vez).
- **Mejoras entre oleadas** (provisionales): se elige una de tres (muros reforzados, oro, reparar más rápido, virotes de acero, vigor, brasas eternas, moral, carpinteros).
- **Viajar es una votación**: todos los jugadores humanos en pie tienen que ir a la piedra de paso y pulsar Fijar («Viajar»); el grupo avanza cuando confirma el último (los caídos y el aliado IA van con él). Encima de la piedra se ve «Listos n/m» con un punto por jugador; alejarse o volver a pulsar cancela.
- **Zona perdida**: cuando caen todos los objetivos de una muralla, queda perdida (no se puede reconquistar). Su paso al patio baja un rastrillo para los jugadores: quien esté dentro puede salir andando o por la piedra de paso, pero ya no se puede volver a entrar; los enemigos sí lo cruzan. Sus trampas desaparecen, no se puede construir ni reconstruir y la piedra del patio que lleva allí sale tachada.
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
- **Simulador de equilibrio** (`tools/sim`): carga el juego en Node y juega con un bot por personaje (niveles experto y medio); `run.js` mide encuentros, guardianes y partidas completas, `whatif.js` prueba cambios sin tocar el juego, `analyze.py` y `report.py` generan el informe.
- **Banco de pruebas**: con `?debug` en la URL; las comprobaciones de balance comparan una huella numérica (vida y estamina por piso y jugadores, daño de cada golpe y disparo a cada enemigo, reglas por tier) y simulaciones deterministas con cuatro aliados IA en mazmorra y asedio.

## Criterios de equilibrio (desde el 2026-11-08)
Vara de medir para todas las decisiones de balance del proyecto. Se mide con el simulador (`tools/sim`) y se calibra con el registro de partidas reales.
- **La dificultad la pone el contenido, no el personaje.** Cada reto tiene su franja objetivo de éxito y todos los personajes deben caer dentro de ella. No se busca que «se pase más»: un 100 % de éxito es tan mala señal como un 0 %.
- **Franjas objetivo en solitario** (propuesta inicial, se recalibra con datos reales):

  | Reto | Bot experto | Bot medio |
  |---|---|---|
  | Sala normal | 95–100 % | 85–95 % |
  | Guardián de piso | 75–90 % | 50–70 % |
  | Partida completa (pisos 1-4) | 30–60 % | 5–25 % |

- **Diferencia entre personajes**: como mucho unos 15–20 puntos de éxito en cada reto (referencia: en Slay the Spire se considera desequilibrio una distancia de ~15 puntos entre personajes).
- **La habilidad debe contar**: el bot experto tiene que rendir claramente mejor que el medio con todos los personajes. Si rinden igual, el personaje no premia jugar bien; si la distancia es enorme, castiga demasiado a los nuevos.
- **El bot mide diferencias, no cifras absolutas**: su porcentaje no es el de una persona. Se calibra comparando con el registro de partidas reales (como hace King con sus bots de Candy Crush).
- **Roles en coop**: los melee (brawlers) pueden ser los que más daño hacen porque asumen más riesgo; los tiradores rompen la estamina y también pueden acercarse a rematar; los tanques aguantan. El riesgo tiene que verse en los datos (daño recibido), no solo en la intención.
- **Para facilitar, ayudar a quien falla** (estilo Modo Dios de Hades, ayuda creciente tras cada derrota) antes que subir a todos los personajes.
- Nada de dos juegos de estadísticas (solo y coop) por personaje: el número de jugadores se compensa con el escalado de los enemigos.

## Filosofía de equilibrio (desde el 2026-11-10)
Cómo se diseña y se ajusta todo lo nuevo: enemigos, personajes y el futuro sistema de mejoras. Los «Criterios de equilibrio» dicen **cuánto**; esta filosofía dice **cómo**. Cualquier propuesta debe poder justificarse con estos principios.

**1. El bucle central manda: presión → estamina rota → aturdido → ejecución.** Todo se mide por cómo alimenta ese bucle. Un cambio que permita saltárselo (matar sin aturdir, aturdir sin riesgo, ejecutar sin acercarse) se rechaza aunque los números cuadren.

**2. Primero la esencia, después los números.** Cada personaje tiene una fantasía jugable (Ceniza bloquea y protege, Musgo levanta, Escarcha acumula frío y lo detona, Coral se calienta, Brasa arriesga cuerpo a cuerpo, Ámbar succiona y se enfurece, Marea y Ciruela controlan a distancia). Si un personaje queda fuera de su franja, se revisa antes si alguna habilidad contradice su esencia; solo después se tocan cifras.

**3. Riesgo = recompensa, y tiene que verse en los datos.** Más daño exige más exposición (daño recibido, distancia, ventanas de castigo). Las herramientas sin coste (spam de una habilidad, inmunidad gratis) se limitan con condiciones de uso (p. ej. el salto de Escarcha solo con congelados) o enfriamientos internos (curación del escudo de Ceniza).

**4. Todo ataque enemigo se avisa y se puede contestar.** La dificultad sube con densidad, combinación y ritmo, nunca quitando el aviso. Un enemigo nuevo necesita: aviso legible, una respuesta clara (esquivar, bloquear, interrumpir) y un papel en el bucle (cuánta estamina tiene, si se puede levantar, si castiga quedarse quieto).

**5. Escalado por jugadores: misma presión por cabeza, más tiempo en grupo.** No hay dos juegos de estadísticas; el número de jugadores lo compensan los enemigos. Objetivo: con N jugadores, cada uno recibe una presión parecida a la de jugar solo, y el guardián dura igual o más que en solitario (nunca menos). En grupo se rompe la estamina mucho más rápido y se reanima a los caídos, así que se escala sobre todo lo que el grupo abarata (estamina, valor de cada ejecución, refuerzos), no solo la vida. Valores vigentes (`ENEMY_SCALE`, `BOSS_ADD_COUNT`; n = jugadores humanos, «1 + IA» cuenta como uno):

  | Palanca | Solo | Por cada jugador extra |
  |---|---|---|
  | Vida (todos) | base | +50 % (`multiHp`) |
  | Estamina tiers 2-3 | base | +50 % (`multiSta`) |
  | Guardián: vida / estamina fija | base | +66 vida, +12 estamina (`hpPerPlayer`, `staPerPlayer`) |
  | Guardián: estamina | base | +80 % (`guardian.multiSta`) |
  | Guardián: vida por ejecución | 25 % | 25 % / (1 + 0,8 × (n − 1)): 14 %, 10 %, 8 % (`execDecay`) |
  | Guardián: recupera estamina aunque le golpeen | no | 4 % de su estamina por segundo y jugador extra (`regenPerPlayer`) |
  | Refuerzos del guardián por oleada | 2 | 3 / 4 / 5 con 2 / 3 / 4 jugadores |
  | Enemigos por sala | presupuesto `ENC` | crece con `np` en cada tier |

  | Guardián: a quién persigue | al jugador | en grupo cambia de objetivo cada 6–9 s (prefiere a quien no perseguía), aviso «¡A por ti!»; quien lo ejecuta se lleva su atención; la Provocación manda (`BOSS_AGGRO`) |
  | Levantar a un caído | 1,6 s, 12 s para desangrarse | cada caída del mismo jugador en la misma sala: +60 % de tiempo para levantarlo y −40 % de margen (`REVIVE.again`, `againBleed`); se reinicia al cambiar de sala |
  | Dúo (piso 3) | — | cada cuerpo escala como si hubiera la mitad de jugadores extra (`DUO.coopK` = 0,5: con 3 jugadores, como 2) y luego recibe su parte (`DUO.share`); cada uno tiene su propia atención. Con 3-4 jugadores duraba el doble que en solitario |
  | Reanimaciones | — (solo no hay) | el grupo comparte tantas por piso como jugadores (2 / 3 / 4; «1 + IA» = 2). Sin ninguna, el caído se queda en el suelo hasta vencer al guardián. Al caer el guardián se levantan todos gratis y al viajar al piso siguiente se reponen. Limpiar una sala normal ya no levanta a nadie. En el asedio no hay límite (`revivesLeft`, `revivePool`) |

  Referencias (2026-11-12): Monster Hunter sube la vida del monstruo en grupo (World: ~×2,6 con 2-4 jugadores, junto con los umbrales de derribo), no su daño, y reparte la amenaza con la «enemistad»: el monstruo cambia de objetivo. Además, las caídas del grupo son compartidas (3 por misión), así que más jugadores no da más vidas. Elden Ring sube la vida del jefe ×1,6–2,7 según invocados y apenas su daño. Nightreign encarece cada reanimación sucesiva (40 → 90 → 240 de daño para levantar). Risk of Rain 2 escala con un factor 1 + 0,3 × (n − 1) y la vida de los jefes con los jugadores vivos. De ahí: escalar vida y aguante pero no el daño, repartir la presión y que levantarse no sea gratis.

  Resultado con el bot experto (2026-11-10): el guardián del piso 4 pasó de 13–19 s a 24–57 s en grupo (antes duraba menos que en solitario), y el tiempo crece con el tamaño del grupo. El grupo sigue ganando casi siempre con el bot porque reanima; la tasa real se calibra con el registro de partidas.

**6. Roles que se necesitan, no que se suman.** En coop los tiradores rompen estamina, los melee rematan y hacen el daño, los tanques sostienen y protegen. Una habilidad que hace bien el trabajo de otro rol sin coste se recorta; una que potencia al compañero (cubrir con el escudo, levantar para rematar en el aire, detonar el frío de otro) se premia.

**7. Mejoras (sistema futuro): más formas de jugar, no solo más números.**
- Preferir mejoras **horizontales** (cambian cómo funciona una habilidad, añaden sinergias con el bucle o con el compañero) a las **verticales** (+X % de daño). Las verticales, pequeñas y con techo.
- Cada mejora refuerza la esencia del personaje o abre una variante de ella; ninguna la contradice (un tirador no se vuelve tanque).
- Ninguna mejora obligatoria: si una se coge casi siempre o un personaje no gana sin ella, se recorta o se integra en la base.
- Las mejoras no pueden saltarse el bucle central (p. ej. no aturdir sin vaciar la estamina) ni quitar avisos.
- El gap entre personajes también se mide **con mejoras**: la franja de 15–20 puntos se aplica a la partida completa con mejoras elegidas al azar y con las mejores.
- Las mejoras de grupo (que afectan a aliados) escalan con el número de jugadores igual que los enemigos, para que el coop no se rompa.
- La ayuda a quien falla (estilo Modo Dios) es aparte de las mejoras y es opcional.

**8. Proceso para cualquier cambio.** Hipótesis ligada a un principio → **ofrecer** la simulación (solo con ambos niveles de bot; coop con un conjunto pequeño de composiciones; ablación si se toca una habilidad) y ejecutarla solo si el usuario lo pide: el testeo de cambios lo decide él, no se lanza por sistema → aplicar dejando lo anterior comentado con `[RETIRADO fecha]` → actualizar textos y tutoriales → calibrar con el registro de partidas reales. Si se testea, comprobar que en solitario (n = 1) no cambia nada cuando el cambio era solo de grupo.

### Cambios de equilibrio del 2026-11-12 (tanques y personajes de distancia)
- Tanques (Ceniza, Musgo): +20 % de daño cuerpo a cuerpo (`melee` 2,4) y sus golpes rompen un 50 % más de estamina (`meleeSta` 1,5). Motivo: hacían la mitad de daño, las salas les duraban el doble y morían por desgaste.
- Ceniza: con el escudo en alto, las zonas del suelo que no para de frente le hacen la mitad (`SHIELD_ZONE_MUL`); si lo acaba de alzar (ventana del bloqueo perfecto), nada.
- Musgo: las Enredaderas cortan el ataque que preparaban los enemigos (no sale al soltarse) y también el del guardián, al que no enredan.
- Brasa: el Puño ejecutor cura 10 PV (antes 20).
- Personajes de distancia: murciélagos y tiradores van a por el jugador de distancia más cercano (`HUNTERS`); el murciélago cae en picado, con aviso en el suelo, sobre quien está lejos (`BAT_DIVE`); todos los guardianes lanzan una lluvia avisada sobre quien pasa más de 2,5 s a más de 380 px (`BOSS_FAR`). Se decidió no bajarles el daño: no pegan más que el resto, les sobra seguridad.
- Descartado: que ejecutar cure a los tanques.

## Registro de partidas (desde el 2026-11-08)
- Al confirmar los personajes se elige **Partida real** (se registra) o **Partida de prueba** (no se registra). «Reintentar» mantiene la elección; «Cambiar de personaje» vuelve a preguntar.
- Solo cuentan partidas reales que empiezan en el piso 1 sin herramientas de Dev (piso inicial distinto, autosalto, `?debug`) y que terminan en **derrota** (cae el grupo) o **victoria** (cae el Dragón, fin del ciclo). Las abandonadas no se guardan. Asedio no se registra.
- Se guarda en `localStorage` (`mz-registro`), por dispositivo. Dev Options > Registro de partidas muestra el resumen por personaje y las últimas partidas, y permite copiar o descargar el JSON para analizarlo.
- Cada partida guarda: fecha, resultado, modo (solo, coop N, 1 + IA), semilla, duración, piso máximo, por jugador (personaje, control, daño recibido, caídas, ejecuciones, habilidades usadas, último golpe recibido), daño total hecho, bajas, ejecuciones, tiempo y daño recibido de cada sala y de cada guardián, y dónde cayó el grupo.

## Lore y trama (desde el 2026-11-10)
Documento de diseño: nada de este apartado está implementado todavía salvo lo que se indique. Sirve de referencia para la estética de la versión 2D (la que se trabaja habitualmente) y para el prototipo 3D.

**Fuente.** La banda sonora sale de las Danzas polovtsianas, el número de baile del acto II de *El príncipe Ígor* (Borodin; inacabada a su muerte en 1887, completada por Rimski-Kórsakov y Glazunov, estreno en 1890). La ópera adapta el *Cantar de las huestes de Ígor* (siglo XII). Argumento resumido: Ígor parte contra los polovtsianos (nómadas de la estepa) pese a que un eclipse de sol lo anuncia como mal presagio; en su ausencia, el príncipe Galitski se emborracha y conspira en Putivl mientras Yaroslavna, la esposa de Ígor, lo llora desde las murallas; Ígor cae prisionero del kan Kónchak, que le ofrece la libertad a cambio de no volver a atacarle (Ígor se niega) y lo agasaja con las danzas; Vladímir, el hijo de Ígor, se enamora de Konchakovna, la hija del kan, y se queda con ella; Ígor escapa con ayuda de Ovlur y vuelve a una Putivl arrasada. Las danzas se hicieron famosas en París en 1909 con una compañía de ballet rusa.

### Premisa
- **Una compañía de bailarines de principios del siglo XX**, sin concretar compañía, ciudad ni año. Los personajes jugables son intérpretes de esa compañía.
- **Todo es una función de teatro.** Los diseños mezclados de los personajes (ninja, dragón chino, torreta, escudo…) son **disfraces** de la función; los pisos son **decorados**; los enemigos, figurantes y bailarines de la obra. Así se justifica que convivan estéticas distintas.
- **El ciclo de reseteo.** La función está atrapada en un bucle: cada run es una representación. Si cae el grupo, **cae el telón** y la función vuelve a empezar; si vencen, el eclipse se completa, el sol es devorado y la función también vuelve a empezar. No hay salida «normal»: el bucle es el mundo.

### El eclipse: núcleo visual y narrativo
- Es el presagio del prólogo de la ópera y el centro de todo: abre cada función, avanza con la run y la cierra.
- En el folclore eslavo una bestia devoraba el sol durante los eclipses. Esa bestia es el **Dragón**, y el Dragón es **Ígor transformado**.
- **Lectura narrativa:** Ígor ignoró el presagio y rechazó el pacto de Kónchak; su obstinación alimenta el eclipse. Por eso es el villano final: no un monstruo ajeno, sino el protagonista de la obra devorado por su propio orgullo.
- **Lectura visual (propuesta):** un disco solar que se va tapando piso a piso (en el menú, en el banner de cada piso y en un indicador pequeño del marcador); la luz de las salas baja de tono y las sombras se alargan con cada piso; en el piso 4, totalidad: cielo negro, corona blanca y dorada alrededor del disco. Paleta: corona dorada y blanca, violeta del Dragón (`#b48cff`, ya en `BOSS.dragon.energy`) y siluetas oscuras con el acento de color de cada personaje (como en el prototipo 3D).
- **Regla de legibilidad:** la oscuridad nunca tapa los avisos de ataque ni las barras; los telegrafiados siguen siendo igual de visibles en todos los pisos.

### Guardianes: asignación de nombres
Cuatro nombres de la ópera para los guardianes existentes, más Ígor como guardián final nuevo con dos formas.

| Piso | Decorado (bioma actual → lectura) | Guardián actual → personaje | Encaje |
|---|---|---|---|
| 1 | Mazmorra → bodegas y salones de Putivl en fiesta | Cañonero → **Príncipe Galitski** | Cañón de salvas de su juerga; el Estallido son fuegos artificiales. Refuerzos: su drúzhina y juerguistas. |
| 2 | Bosque otoñal → linde de la estepa y campamento polovtsiano | Ariete → **Kan Kónchak** | Embestida de jinete nómada; cornada y pisotón de caballo. Refuerzos: bailarines polovtsianos (las danzas son su pelea). |
| 3 | Gruta acuática → orilla del río Kayala de noche | Coloso → **Vladímir, hijo de Ígor** | Príncipe joven con armadura pesada: martillazo, grieta y terremoto. **Konchakovna** a su lado (ver abajo). |
| 4 | Catedral gótica → catedral y murallas de Putivl bajo el eclipse | Nuevo: **Ígor** (forma humana) → **Dragón** (el Dragón de la Catedral actual pasa a ser su segunda forma) | Al derrotar a Ígor, el eclipse llega a la totalidad, se transforma y empieza la pelea del Dragón con su música `final`. Al caer el Dragón, devora el sol y la función vuelve a empezar. |

- **Konchakovna — decidido e implementado (2026-11-10): dúo en el piso 3** con Vladímir. Son amantes: el hilo rojo los protege mientras están cerca, así que el grupo tiene que separarlos (mecánica coop); si cae uno, el otro entra en lamento. Detalles en «Archivos > Guardianes».
- **Nombres en el juego (2026-11-10):** guardianes y pisos ya renombrados en el código (`BOSS.*.name`, `THEMES.*.name` y `THEMES.*.act`); los nombres anteriores quedan comentados. Pisos: **Putivl en fiesta** (Acto I), **Estepa polovtsiana** (Acto II), **Río Kayala** (Acto III) y **Catedral de Putivl** (Acto IV). Al vencer a un guardián: «Fin del Acto N».
- **Ígor, forma humana (propuesta).** Príncipe con casco cónico dorado, capa roja y escudo almendrado. Duelista que recapitula el ciclo: en cada tramo de vida usa la idea de un guardián anterior (salva de Galitski, embestida de Kónchak, golpe al suelo de Vladímir), siempre con frente, arma visible y aviso como el resto de guardianes. Música: la pista `boss`; la transformación da paso a `final`.

### Esquema de progresión de la trama y los niveles
| Momento | Dónde | Eclipse | Qué pasa en la trama | Temática visual | Música |
|---|---|---|---|---|---|
| Prólogo | Menú principal | Empieza | La compañía se prepara; el sol comienza a oscurecerse | Telón, candilejas, disco solar con la primera mordida | `menu` |
| Acto I · Piso 1 | Putivl: bodegas y salones | 25 % | Ígor ha partido; Galitski gobierna borracho | Interior cálido, velas, tapices rojos; drúzhina rus | `calm` / `fight` / `boss` |
| Entreacto | Bambalinas | — | Yaroslavna lamenta desde las murallas | Entre cajas de atrezo y focos | coda `boss_win` |
| Acto II · Piso 2 | Estepa y campamento | 50 % | Ígor prisionero; la oferta de Kónchak; las danzas | Tiendas rojas, ocres, atardecer; babas de piedra | ídem |
| Entreacto | Bambalinas | — | Ovlur prepara la huida | | |
| Acto III · Piso 3 | Río Kayala de noche | 75 % | Vladímir elige quedarse con Konchakovna | Agua oscura, luna tapada, reflejos | ídem |
| Entreacto | Bambalinas | — | Ígor escapa y vuelve a casa | | |
| Acto IV · Piso 4 | Catedral y murallas de Putivl | 100 % (totalidad) | Ígor regresa, consumido por el eclipse: se convierte en el Dragón | Cielo negro, corona solar, vitrales violetas | `boss` → `final` |
| Epílogo | — | El sol es devorado | Cae el telón y la función vuelve a empezar (Función n.º + 1) | Oscuridad total y telón que se alza | coda → `menu` |

### Ideas que unen jugabilidad y trama (propuestas)
**Economía y tienda**
- **Moneda: Destellos** (luz robada al sol). Caen de los enemigos como chispas doradas; en la interfaz, un pequeño sol.
- **Tienda: la Guardarropía**, atendida por **Skula y Yeroshka**, los dos músicos desertores de la ópera (dúo cómico que cambia de bando según le conviene). Su surtido cambia según el piso: objetos rus en Putivl, polovtsianos en la estepa y el río.
- Dos tipos de artículo: **Vestuario** (piezas pasivas para toda la run: máscaras, tocados, cascos, fajines; refuerzan la idea de disfraz) y **Atrezo** (consumibles de un uso).
- **Sala del tesoro → Camerino**: cofre con Destellos y una pieza de Vestuario gratis o un mostrador pequeño de la Guardarropía; espejo de camerino para cambiar una mejora por otra.

**Mejoras entre salas y entre pisos**
- **Ovación:** al limpiar ciertas salas, el público aplaude y se elige 1 de 3 **bises** (mejoras pequeñas). Frecuencia por decidir.
- **Entreacto** entre pisos (bambalinas): la curación que ya existe al bajar de piso, la Guardarropía y el **Lamento de Yaroslavna**: elegir una bendición entre las tres fuerzas que ella invoca en el poema, **Viento** (levantar, aéreo y movilidad; enlaza con el icono de viento del guardián), **Sol** (daño, quemadura y luz contra el eclipse) o **Río** (curación, rescate y vida).
- **La oferta de Kónchak:** antes del guardián del piso 2, aceptar el pacto (ventaja fuerte con una maldición para el resto de la run) o rechazarlo como Ígor.
- **Ovlur:** sala secreta o atajo; ofrece saltarse una sala o rescatar a un caído a cambio de Destellos.

**El eclipse como mecánica**
- Indicador del eclipse en el marcador que avanza por piso.
- Candelabros o antorchas que se pueden encender en las salas oscuras a cambio de un pequeño bonus (sin tapar nunca los avisos).
- **Funciones:** cada ciclo completado sube el número de función (dificultad creciente, al estilo del Calor de Hades) y desbloquea Vestuario nuevo como aspecto de los personajes.

**Enemigos y escena**
- Refuerzos de Kónchak como bailarines polovtsianos (reaprovecha `BOSS_ADDS`).
- **Babas de piedra** como tótems: potencian a los enemigos cercanos hasta que se rompen.
- Caer en combate: el personaje queda como **sombra a contraluz** (el fantasma actual).
- La idea del diario «boss de la party inversa» encaja como **los suplentes**: dobles oscuros de la compañía.

### Influencias visuales: cascos y vestuario de los enemigos
- **Rus de Kiev (drúzhina de Ígor y de Galitski):** casco cónico y apuntado con protector nasal y cota de malla colgando sobre el cuello y los hombros; acabados dorados o de hierro con remaches; escudo almendrado rojo; capas cortas.
- **Polovtsianos (cumanos):** casco alto con **máscara facial metálica** con rostro y bigote; penachos de crin; gorros de piel altos; caftanes cruzados; arcos cortos.
- **Babas de piedra polovtsianas:** estatuas de la estepa con gorro alto y las manos sujetando un cuenco a la altura del vientre; silueta de referencia para tótems y decorado del piso 2.
- **Por tier (propuesta):** tier 1 sin casco o con gorro de tela o piel; tier 2 casco cónico con nasal; tier 3 casco con máscara facial y cota de malla; élites con penacho; guardianes con casco o tocado ceremonial.
- **El casco como lectura del estado:** se agrieta con la estamina baja y salta al quedar levantable (refuerza la barra y el color cian sin sustituirlos).
- **Facciones por piso:** piso 1 rus; pisos 2 y 3 polovtsianos; piso 4 mezcla de ambos en sombra.
- Coherente con el prototipo 3D: siluetas oscuras con un acento de color, formas simples y reconocibles, texturas sencillas pero intensas.

### Menús como teatro (2026-11-10)
- **Escenario** (`drawStage`, `STAGE`, `drawCurtainCloth`, `drawEclipse`). **Telón del menú principal desactivado de momento (2026-11-10)**: la pantalla tardaba más en cargar, así que el menú principal vuelve a `drawMenuBg` y el telón queda comentado en `drawCount` para recuperarlo (posible mejora: pintarlo una vez en un lienzo aparte en vez de en cada fotograma). Diseño original: el menú principal tiene de fondo el **telón echado** (terciopelo rojo con pliegues que se mecen, costura central, foco y el emblema del eclipse bordado en dorado); los ocho personajes quedan delante, sobre la boca del escenario, con las candilejas bajo sus nombres, y los accesos y las ayudas abajo, en el foso. La selección de personaje tiene el **escenario abierto**: bambalina con flecos arriba, telón recogido a los lados con cordones dorados, suelo de tablas y candilejas sobre los paneles de jugador. Al empezar: «¡Arriba el telón!». El resto de pantallas siguen con `drawMenuBg`.
- `drawEclipse(x, y, R, k)` dibuja el sol con la luna delante (k = parte tapada) y la corona; queda listo para el indicador del eclipse.

### Pendiente de decidir
- Forma humana de Ígor antes del Dragón (propuesta arriba).
- Nombre final de la moneda, de la tienda y de las mejoras (Destellos, Guardarropía, bises).
- Qué ideas del roadmap se prototipan primero.

## Roadmap de jugabilidad y trama (desde el 2026-11-10)
Ideas aprobadas como dirección, aún sin implementar salvo que se indique. Están ordenadas en fases por dependencia (cada fase se apoya en la anterior), no por fecha. Al implementar una, se marca aquí y se documenta en «Archivos».

**Fase 0 · Hecho (2026-11-10)**
- [x] Guardianes y pisos con los nombres de la ópera.
- [x] Dúo Vladímir y Konchakovna en el piso 3 (hilo rojo y lamento).
- [x] Menús como teatro: telón echado en el menú principal y escenario abierto en la selección.

**Fase 1 · El eclipse visible**
- [ ] Indicador del eclipse en el marcador y en el banner de cada piso (25 %, 50 %, 75 %, totalidad), con `drawEclipse`.
- [ ] Luz de las salas que baja de tono y sombras más largas con cada piso, sin tapar nunca avisos ni barras.
- [ ] Totalidad en el piso 4: cielo negro y corona.
- [ ] Forma humana de Ígor (duelista que recapitula a los guardianes) que se transforma en el Dragón.
- [ ] Epílogo del ciclo: el Dragón devora el sol, cae el telón y empieza la Función n.º + 1.

**Fase 2 · Economía y tienda**
- [ ] **Destellos**: moneda que sueltan los enemigos (chispas doradas; icono de sol pequeño).
- [ ] **La Guardarropía**: tienda atendida por **Skula y Yeroshka**; surtido distinto según el piso (rus en Putivl, polovtsiano en la estepa y el río).
- [ ] **Vestuario** (piezas pasivas para toda la run: máscaras, tocados, cascos, fajines) y **Atrezo** (consumibles de un uso).
- [ ] **Camerino** en lugar de la sala del tesoro: cofre con Destellos y una pieza de Vestuario o mostrador de la Guardarropía; espejo para cambiar una mejora por otra.

**Fase 3 · Mejoras entre salas y entre pisos**
- [ ] **Ovación**: al limpiar ciertas salas, elegir 1 de 3 **bises** (mejoras pequeñas). Frecuencia por decidir.
- [ ] **Entreacto** entre pisos (bambalinas): curación (la de bajar de piso), Guardarropía y **Lamento de Yaroslavna**: bendición de **Viento** (levantar, aéreo, movilidad), **Sol** (daño, quemadura, luz) o **Río** (curación, rescate, vida).
- [ ] Mejoras de grupo que escalan con el número de jugadores (ver «Filosofía de equilibrio»).

**Fase 4 · Decisiones de trama**
- [ ] **La oferta de Kónchak** antes del guardián del piso 2: pacto con ventaja fuerte y maldición, o rechazarlo como Ígor.
- [ ] **Ovlur**: sala secreta o atajo; saltarse una sala o rescatar a un caído a cambio de Destellos.

**Fase 5 · Enemigos y escena**
- [ ] Cascos y vestuario por tier y facción (ver «Influencias visuales»); el casco se agrieta con poca estamina y salta al quedar levantable.
- [ ] Refuerzos de Kónchak como bailarines polovtsianos.
- [ ] **Babas de piedra**: tótems que potencian a los enemigos cercanos hasta que se rompen.
- [ ] Caer en combate como **sombra a contraluz** (el fantasma actual).
- [ ] **Los suplentes**: la party inversa del diario de ideas como dobles oscuros de la compañía.

**Fase 6 · Meta-progresión**
- [ ] **Funciones**: cada ciclo completado sube el número de función (dificultad creciente, al estilo del Calor de Hades) y desbloquea Vestuario como aspecto de los personajes.
- [ ] Candelabros o antorchas en salas oscuras que se pueden encender a cambio de un pequeño bonus.

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
- **Contacto** (`isHot`, `CONTACT_ATTACK`): daño por tocar al enemigo. Solo durante la embestida avisada del ácaro, del embestidor y de Kónchak, y durante el giro de Konchakovna; los demás guardianes no dañan al tocarlos.
- **Volador** (`fly`, `flying`): el murciélago; vuela a su altura (`flyZ`) y no aterriza al caer. Mientras vuela solo le dañan los ataques a distancia, los golpes de quien salta, los ataques que lanzan por los aires y la Caída Izuna; el golpe normal desde el suelo avisa «Salta o lánzalo».
- **Quemadura** (`BURN`), **congelado** (`frozenT`), **ralentizado** (`slowT`), **enredado** (`rootT`): estados alterados.

### Enemigos (nombre de diseño → identificador)
- **Ácaro** → `mite` (tier 1, embestida avisada) · **Limo** → `slime` (tier 1, escupitajo) · **Murciélago** → `bat` (tier 1, volador, onda de sonido)
- **Embestidor** → `charger` (tier 2, embestida y zarpazo) · **Artillero** → `shooter` (tier 2, disparos)
- **Gólem** → `golem` (tier 3, salto y pisotón) · **Divisor** → `splitter` (tier 3, se teletransporta, siembra bombas y se divide al morir)
- **Guardián** → `boss` (tier 4); cada uno por `e.kind`: **Príncipe Galitski** → `cannon` · **Kan Kónchak** → `ram` · **Vladímir** → `colossus` · **Konchakovna** → `maiden` · **Ígor, Dragón del Eclipse** → `dragon`. **Dúo**: dos guardianes a la vez (piso 3). **Hilo rojo**: protección del dúo mientras están juntos. **Lamento**: rabia del que queda del dúo.

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

