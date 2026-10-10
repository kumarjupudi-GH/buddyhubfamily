/* ArtBuddy lesson library.
 * Every lesson is drawn on a 400x400 SVG canvas.
 * Each step = [tier, title, instruction, svgFragment].
 *   tier 1 = Very Easy (core shapes only) ... tier 4 = Challenge Me (all details)
 * Colours use CSS variables --c1/--c2/--c3 so palettes can be swapped ("variations").
 */
(function () {
  // ---- tiny SVG helpers -------------------------------------------------
  const P = (d, x = '') => `<path d="${d}" ${x}/>`;
  const E = (cx, cy, rx, ry, x = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${x}/>`;
  const C = (cx, cy, r, x = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${x}/>`;
  const R = (x0, y0, w, h, rx = 0, x = '') => `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${rx}" ${x}/>`;
  const DOT = (cx, cy, r = 8) => C(cx, cy, r, 'class="dot"');
  const K = n => `fill="var(--c${n})"`;
  const F = c => `fill="${c}"`;
  const DASH = 'class="dash"';
  const SHADOW = 'fill="#1f2937" opacity=".15"';
  const STAR = (x, y, s = 1) => P(`M${x} ${y - 16 * s} L${x + 5 * s} ${y - 5 * s} L${x + 16 * s} ${y - 5 * s} L${x + 7 * s} ${y + 3 * s} L${x + 10 * s} ${y + 15 * s} L${x} ${y + 8 * s} L${x - 10 * s} ${y + 15 * s} L${x - 7 * s} ${y + 3 * s} L${x - 16 * s} ${y - 5 * s} L${x - 5 * s} ${y - 5 * s} Z`);

  const mk = d => Object.assign(d, {
    steps: d.steps.map(([tier, t, say, svg]) => ({ tier, t, say, d: svg })),
    guide: d.guide || '', bg: d.bg || '', shade: d.shade || ''
  });

  const L = [];

  // ---- ANIMALS ----------------------------------------------------------
  L.push(mk({
    id: 'tiger', name: 'Tiger', emoji: '🐯', cat: 'animals', level: 'Easy',
    keys: ['tiger', 'big cat'], shapes: ['oval', 'triangle', 'dot'],
    tech: ['Texture', 'Stripes are a pattern. Short curvy lines make fur look real!'],
    pal: { c1: '#ffa63d', c2: '#fff7e6', c3: '#ff8fa3' },
    palettes: [{ n: 'Snow tiger', c1: '#e8f1ff', c2: '#ffffff', c3: '#ffb3c6' }, { n: 'Blue tiger', c1: '#6ec5ff', c2: '#e6f6ff', c3: '#ff8fa3' }],
    vars: ['Give your tiger a crown 👑', 'Make a sleepy tiger 😴', 'Draw a tiger family 🐯🐯'],
    steps: [
      [1, 'Draw the Head', 'Draw a big oval for the tiger’s head.', E(200, 210, 125, 105)],
      [1, 'Add the Ears', 'Add two small triangles on top for ears.', P('M98 150 L86 76 L165 112') + P('M302 150 L314 76 L235 112')],
      [1, 'Add the Face', 'Two dots for eyes. A small triangle for the nose.', DOT(155, 200) + DOT(245, 200) + P('M184 232 L216 232 L200 250 Z')],
      [2, 'Mouth and Whiskers', 'Draw a happy mouth and long whiskers.', P('M200 250 L200 272 M200 272 Q180 292 158 274 M200 272 Q220 292 242 274') + P('M118 250 L58 240 M118 268 L58 276 M282 250 L342 240 M282 268 L342 276')],
      [3, 'Add Stripes', 'Add short curvy stripes. Every tiger has its own!', P('M200 108 L200 140 M165 112 L172 138 M235 112 L228 138') + P('M78 200 L108 205 M80 235 L110 232 M322 200 L292 205 M320 235 L290 232')],
      [4, 'Fluffy Details', 'Add pointy fur under the chin and inside the ears.', P('M108 140 L101 106 L136 124') + P('M292 140 L299 106 L264 124') + P('M150 300 L162 322 L180 308 L200 330 L220 308 L238 322 L250 300')]
    ],
    colors: P('M98 150 L86 76 L165 112 Z', K(1)) + P('M302 150 L314 76 L235 112 Z', K(1)) + E(200, 210, 125, 105, K(1)) + E(200, 268, 58, 38, K(2)) + P('M184 232 L216 232 L200 250 Z', K(3)),
    shade: P('M300 140 Q348 215 292 292 Q326 215 300 140 Z', SHADOW)
  }));

  L.push(mk({
    id: 'cat', name: 'Cat', emoji: '🐱', cat: 'animals', level: 'Easy',
    keys: ['cat', 'kitten', 'kitty'], shapes: ['circle', 'triangle', 'dot'],
    tech: ['Outlining', 'Draw lightly first, then go over the lines you like best.'],
    pal: { c1: '#f4a259', c2: '#fff3e0', c3: '#ffb3c1' },
    palettes: [{ n: 'Gray cat', c1: '#b9bfd0', c2: '#f4f5f9', c3: '#ffb3c1' }, { n: 'Black cat', c1: '#6b7280', c2: '#d1d5db', c3: '#ff8fa3' }],
    vars: ['Add a bow tie 🎀', 'Cat with a fish 🐟', 'Cat in a box 📦'],
    steps: [
      [1, 'Draw the Head', 'Draw a big round circle for the cat’s head.', C(200, 220, 105)],
      [1, 'Add the Ears', 'Add two pointy triangles on top.', P('M120 150 L108 68 L182 124') + P('M280 150 L292 68 L218 124')],
      [1, 'Add the Face', 'Two oval eyes and a tiny triangle nose.', E(160, 208, 10, 13, 'class="dot"') + E(240, 208, 10, 13, 'class="dot"') + P('M188 238 L212 238 L200 252 Z')],
      [2, 'Mouth and Whiskers', 'Draw a little “w” mouth and three whiskers on each side.', P('M200 252 Q186 276 168 264 M200 252 Q214 276 232 264') + P('M118 240 L60 228 M118 258 L58 262 M282 240 L340 228 M282 258 L342 262')],
      [3, 'Cat Stripes', 'Add stripes on the forehead and cheeks.', P('M200 118 L200 146 M178 122 L184 146 M222 122 L216 146') + P('M96 215 L120 220 M98 245 L122 242 M304 215 L280 220 M302 245 L278 242')],
      [4, 'Body and Tail', 'Add a round body and a long curly tail.', P('M130 318 Q100 385 160 390 L240 390 Q300 385 270 318') + P('M285 360 Q360 340 345 280 Q338 260 322 268')]
    ],
    colors: P('M130 318 Q100 385 160 390 L240 390 Q300 385 270 318 Z', K(1)) + P('M120 150 L108 68 L182 124 Z', K(1)) + P('M280 150 L292 68 L218 124 Z', K(1)) + C(200, 220, 105, K(1)) + P('M122 140 L114 94 L158 122 Z', K(3)) + P('M278 140 L286 94 L242 122 Z', K(3)) + E(200, 258, 42, 28, K(2)),
    shade: P('M290 150 Q330 225 275 318 Q312 225 290 150 Z', SHADOW)
  }));

  L.push(mk({
    id: 'dog', name: 'Dog', emoji: '🐶', cat: 'animals', level: 'Easy',
    keys: ['dog', 'puppy', 'doggy', 'pup'], shapes: ['circle', 'oval', 'dot'],
    tech: ['Proportions', 'The nose sits in the middle of the face. Ears hang from the sides.'],
    pal: { c1: '#e9b872', c2: '#a0673c', c3: '#fff1d6' },
    palettes: [{ n: 'Brown pup', c1: '#b9814a', c2: '#6b4423', c3: '#f5deb3' }, { n: 'Gray pup', c1: '#c7ccd8', c2: '#8b93a7', c3: '#f4f5f9' }],
    vars: ['Dog with a bone 🦴', 'Dog wearing glasses 🕶️', 'Dog with spots'],
    steps: [
      [1, 'Draw the Head', 'Draw a big circle for the head.', C(200, 210, 100)],
      [1, 'Floppy Ears', 'Draw two long floppy ears on the sides.', P('M110 160 Q55 170 65 260 Q100 270 120 220') + P('M290 160 Q345 170 335 260 Q300 270 280 220')],
      [1, 'Face and Nose', 'Draw an oval snout, two eye dots and a big nose.', E(200, 255, 48, 36) + DOT(160, 195, 9) + DOT(240, 195, 9) + E(200, 238, 16, 11, 'class="dot"')],
      [2, 'Mouth and Tongue', 'Add a smiley mouth and a tongue sticking out!', P('M200 249 L200 268 M200 268 Q180 288 162 272 M200 268 Q220 288 238 272') + P('M188 282 Q200 320 212 282 Z')],
      [3, 'Eyebrows and Spot', 'Add friendly eyebrows and a spot on one side.', P('M135 175 Q160 160 180 175 M220 175 Q240 160 265 175') + P('M230 118 Q272 120 264 162 Q236 168 230 118 Z')],
      [4, 'Collar', 'Add a collar with a round tag.', P('M130 300 Q200 335 270 300') + C(200, 332, 12)]
    ],
    colors: C(200, 210, 100, K(1)) + P('M110 160 Q55 170 65 260 Q100 270 120 220 Z', K(2)) + P('M290 160 Q345 170 335 260 Q300 270 280 220 Z', K(2)) + E(200, 255, 48, 36, K(3)) + P('M188 282 Q200 320 212 282 Z', 'fill="#ff8fa3"'),
    shade: P('M285 150 Q330 215 280 290 Q312 215 285 150 Z', SHADOW)
  }));

  L.push(mk({
    id: 'fish', name: 'Fish', emoji: '🐟', cat: 'animals', level: 'Beginner',
    keys: ['fish', 'goldfish'], shapes: ['oval', 'triangle', 'circle'],
    tech: ['Lines & curves', 'Curvy lines make things look like they are moving in water.'],
    pal: { c1: '#4cc9f0', c2: '#ffd166', c3: '#ffffff' },
    bg: R(0, 0, 400, 400, 0, F('#e0f7ff')),
    palettes: [{ n: 'Goldfish', c1: '#ff9f43', c2: '#ffd166', c3: '#ffffff' }, { n: 'Pink fish', c1: '#ff8fb1', c2: '#ffd1e0', c3: '#ffffff' }],
    vars: ['Fish with stripes', 'A fish tank 🐠', 'Fish with a hat'],
    steps: [
      [1, 'Draw the Body', 'Draw a big oval for the fish’s body.', E(190, 200, 120, 75)],
      [1, 'Add the Tail', 'Add a triangle on the right for the tail.', P('M305 200 L375 145 L375 255 Z')],
      [1, 'Eye and Mouth', 'Draw a round eye with a dot inside, and a smile.', C(120, 180, 16) + DOT(120, 180, 7) + P('M72 205 Q90 217 102 206')],
      [2, 'Add Fins', 'Add a fin on top and a fin on the bottom.', P('M170 128 Q200 80 235 130') + P('M180 270 Q200 312 230 268')],
      [3, 'Scales and Gill', 'Draw little curvy scales and a curved gill line.', P('M160 195 Q175 210 190 195 M190 195 Q205 210 220 195 M175 225 Q190 240 205 225 M205 225 Q220 240 235 225') + P('M138 150 Q158 200 138 250')],
      [4, 'Bubbles', 'Add bubbles floating up!', C(60, 120, 12) + C(40, 85, 8) + C(75, 70, 6)]
    ],
    colors: P('M305 200 L375 145 L375 255 Z', K(2)) + E(190, 200, 120, 75, K(1)) + P('M170 128 Q200 80 235 130 Z', K(2)) + P('M180 270 Q200 312 230 268 Z', K(2)) + C(120, 180, 16, K(3)),
    shade: E(190, 255, 100, 16, SHADOW)
  }));

  L.push(mk({
    id: 'butterfly', name: 'Butterfly', emoji: '🦋', cat: 'animals', level: 'Medium',
    keys: ['butterfly', 'insect', 'moth', 'bug'], shapes: ['oval', 'curve', 'circle'],
    tech: ['Symmetry', 'Symmetry means both sides match, like a mirror! Copy the left side to the right.'],
    guide: P('M200 20 L200 380', 'class="dash"'),
    pal: { c1: '#ff8fb1', c2: '#ffd166', c3: '#7c4dff' },
    palettes: [{ n: 'Blue wings', c1: '#6ec5ff', c2: '#c9b6ff', c3: '#ff6b9d' }, { n: 'Sunny wings', c1: '#ffb703', c2: '#ff8c42', c3: '#7c4dff' }],
    vars: ['Wings with stripes', 'Butterfly on a flower 🌸', 'A rainbow butterfly 🌈'],
    steps: [
      [1, 'Draw the Body', 'Draw a long oval body and a little round head. The dotted line is the middle!', E(200, 205, 12, 80) + C(200, 112, 16)],
      [1, 'Left Top Wing', 'Draw a big wing on the left side.', P('M190 170 Q95 55 55 125 Q55 190 190 205 Z')],
      [1, 'Right Top Wing', 'Copy it on the right, like a mirror!', P('M210 170 Q305 55 345 125 Q345 190 210 205 Z')],
      [2, 'Bottom Wings', 'Add two smaller wings at the bottom. Make them match!', P('M190 210 Q105 225 100 305 Q140 335 190 240 Z') + P('M210 210 Q295 225 300 305 Q260 335 210 240 Z')],
      [3, 'Antennae and Dots', 'Add two curly antennae and round dots on the wings.', P('M194 98 Q180 60 158 48 M206 98 Q220 60 242 48') + C(110, 130, 16) + C(290, 130, 16) + C(135, 290, 12) + C(265, 290, 12)],
      [4, 'Wing Patterns', 'Add pattern lines to both wings. Mirror them!', P('M186 185 Q120 140 80 150 M186 195 Q130 185 75 175') + P('M214 185 Q280 140 320 150 M214 195 Q270 185 325 175')]
    ],
    colors: P('M190 170 Q95 55 55 125 Q55 190 190 205 Z', K(1)) + P('M210 170 Q305 55 345 125 Q345 190 210 205 Z', K(1)) + P('M190 210 Q105 225 100 305 Q140 335 190 240 Z', K(2)) + P('M210 210 Q295 225 300 305 Q260 335 210 240 Z', K(2)) + C(110, 130, 16, K(3)) + C(290, 130, 16, K(3)) + C(135, 290, 12, K(3)) + C(265, 290, 12, K(3)) + E(200, 205, 12, 80, F('#4b3b6b')),
    shade: ''
  }));

  // ---- BIRDS ------------------------------------------------------------
  L.push(mk({
    id: 'bird', name: 'Bird', emoji: '🐦', cat: 'birds', level: 'Easy',
    keys: ['bird', 'parrot', 'sparrow', 'birdie', 'chick'], shapes: ['circle', 'triangle', 'curve'],
    tech: ['Simple 3D forms', 'Round bodies look 3D when the wing and tail overlap them.'],
    pal: { c1: '#4ea8ff', c2: '#ffb703', c3: '#90e0ef' },
    palettes: [{ n: 'Red bird', c1: '#ff6b6b', c2: '#ffb703', c3: '#ffa6a6' }, { n: 'Green bird', c1: '#4cd964', c2: '#ffb703', c3: '#a8f0a8' }],
    vars: ['Bird in a nest', 'Bird singing 🎵', 'Two birds on a branch'],
    steps: [
      [1, 'Draw the Body', 'Draw a big circle for the body.', C(190, 220, 95)],
      [1, 'Add the Head', 'Draw a smaller circle on top, a little to the right.', C(270, 140, 50)],
      [1, 'Beak and Eye', 'Draw a small triangle beak and a dot for the eye.', P('M315 135 L360 150 L315 165') + DOT(285, 130)],
      [2, 'The Wing', 'Draw a wing shaped like a leaf on the body.', P('M140 220 Q190 170 230 235 Q190 270 140 220 Z')],
      [2, 'The Tail', 'Add three long lines for tail feathers.', P('M100 260 L40 290 M100 245 L35 255 M100 275 L55 320')],
      [3, 'Legs and Feet', 'Add two thin legs and little feet.', P('M170 312 L165 365 M215 312 L220 365') + P('M145 365 L190 365 M200 365 L245 365')],
      [4, 'Branch and Feathers', 'Draw a branch under the feet and feather lines on the wing.', P('M60 372 L340 372') + P('M170 215 L210 232 M165 235 L195 250')]
    ],
    colors: C(190, 220, 95, K(1)) + C(270, 140, 50, K(1)) + P('M315 135 L360 150 L315 165 Z', K(2)) + P('M140 220 Q190 170 230 235 Q190 270 140 220 Z', K(3)),
    shade: E(190, 300, 90, 20, SHADOW)
  }));

  // ---- PEOPLE -----------------------------------------------------------
  L.push(mk({
    id: 'kid', name: 'Friendly Kid', emoji: '🧒', cat: 'people', level: 'Easy',
    keys: ['person', 'kid', 'boy', 'girl', 'child', 'people', 'human', 'friend', 'man', 'woman'], shapes: ['circle', 'rectangle', 'line'],
    tech: ['Proportions', 'The head is about the same size as the body’s middle. Arms reach to the hips!'],
    pal: { c1: '#ffd2a8', c2: '#4ea8ff', c3: '#6b4423' },
    palettes: [{ n: 'Warm skin', c1: '#c68642', c2: '#ff6b6b', c3: '#2b2b3a' }, { n: 'Deep skin', c1: '#8d5524', c2: '#ffd166', c3: '#2b2b3a' }, { n: 'Light skin', c1: '#ffe0c7', c2: '#7ed957', c3: '#d9a441' }],
    vars: ['Add a hat or cap 🧢', 'Draw yourself!', 'Kid with a pet'],
    steps: [
      [1, 'Draw the Head', 'Draw a circle for the head.', C(200, 110, 60)],
      [1, 'Draw the Body', 'Draw a rectangle with round corners below.', R(150, 175, 100, 120, 20)],
      [1, 'Arms and Legs', 'Draw four straight lines for arms and legs.', P('M150 195 L95 265 M250 195 L305 265') + P('M175 295 L170 380 M225 295 L230 380')],
      [2, 'Add the Face', 'Two dots for eyes and a big smile!', DOT(180, 100) + DOT(220, 100) + P('M175 130 Q200 155 225 130')],
      [3, 'Add Hair', 'Draw hair on top of the head. Any style you like!', P('M142 100 Q150 45 200 48 Q250 45 258 100 Q235 70 200 75 Q165 70 142 100 Z')],
      [4, 'Hands and Shoes', 'Add round hands and flat shoes.', C(95, 270, 10) + C(305, 270, 10) + P('M150 380 L190 380 M210 380 L250 380')]
    ],
    colors: R(150, 175, 100, 120, 20, K(2)) + C(200, 110, 60, K(1)) + P('M142 100 Q150 45 200 48 Q250 45 258 100 Q235 70 200 75 Q165 70 142 100 Z', K(3)) + C(95, 270, 10, K(1)) + C(305, 270, 10, K(1)),
    shade: ''
  }));

  // ---- CARTOON ----------------------------------------------------------
  L.push(mk({
    id: 'robot', name: 'Robot', emoji: '🤖', cat: 'cartoon', level: 'Beginner',
    keys: ['robot', 'bot', 'android', 'cartoon', 'machine'], shapes: ['rectangle', 'circle', 'line'],
    tech: ['Outlining', 'Strong, straight outlines make a character easy to recognize.'],
    pal: { c1: '#a8b8d8', c2: '#ff6b6b', c3: '#ffe066' },
    palettes: [{ n: 'Green bot', c1: '#8fdc9a', c2: '#ff9f43', c3: '#fff3a3' }, { n: 'Pink bot', c1: '#ffb3d1', c2: '#7c4dff', c3: '#fff3a3' }],
    vars: ['Robot with a heart ❤️', 'Robot dog 🐕', 'A robot band 🎸'],
    steps: [
      [1, 'Draw the Head', 'Draw a rectangle with round corners.', R(120, 60, 160, 120, 20)],
      [1, 'Draw the Body', 'Draw a bigger rectangle under the head.', R(140, 200, 120, 130, 12)],
      [1, 'Robot Face', 'Two circle eyes and a straight mouth.', C(170, 115, 16) + C(230, 115, 16) + P('M165 150 L235 150')],
      [2, 'Antenna', 'Add a line and a ball on top of the head.', P('M200 60 L200 28') + C(200, 18, 9)],
      [2, 'Arms and Legs', 'Draw straight lines for arms and legs.', P('M140 225 L90 285 M260 225 L310 285') + P('M170 330 L170 375 M230 330 L230 375')],
      [3, 'Control Panel', 'Add two round buttons and a small rectangle.', C(175, 255, 10) + C(225, 255, 10) + R(165, 285, 70, 20, 4)],
      [4, 'Ear Bolts', 'Add two small rectangles on the sides of the head.', R(100, 100, 20, 40, 4) + R(280, 100, 20, 40, 4)]
    ],
    colors: R(120, 60, 160, 120, 20, K(1)) + R(140, 200, 120, 130, 12, K(1)) + C(170, 115, 16, K(3)) + C(230, 115, 16, K(3)) + C(175, 255, 10, K(2)) + C(225, 255, 10, K(2)) + C(200, 18, 9, K(2)),
    shade: R(255, 200, 12, 130, 6, 'fill="#1f2937" opacity=".14"') + R(268, 60, 12, 120, 6, 'fill="#1f2937" opacity=".14"')
  }));

  L.push(mk({
    id: 'snowman', name: 'Snowman', emoji: '⛄', cat: 'cartoon', level: 'Beginner',
    keys: ['snowman', 'snow', 'winter', 'frosty'], shapes: ['circle', 'triangle', 'dot'],
    tech: ['Basic shapes', 'Big shapes first, small shapes last. A snowman is just three circles!'],
    pal: { c1: '#ffffff', c2: '#374151', c3: '#ff8c42' },
    bg: R(0, 0, 400, 400, 0, F('#dff1ff')),
    palettes: [{ n: 'Cozy snowman', c1: '#ffffff', c2: '#ef4444', c3: '#ff8c42' }, { n: 'Pink snow', c1: '#ffeef6', c2: '#7c4dff', c3: '#ff8c42' }],
    vars: ['Snowman with a scarf 🧣', 'Snow family ⛄⛄', 'Snowman at the beach 🏖️'],
    steps: [
      [1, 'Big Circle', 'Draw a big circle at the bottom.', C(200, 300, 80)],
      [1, 'Middle Circle', 'Draw a medium circle on top of it.', C(200, 190, 58)],
      [1, 'Small Circle', 'Draw a small circle for the head.', C(200, 105, 40)],
      [2, 'Top Hat', 'Add a flat line and a tall rectangle for a hat.', P('M158 78 L242 78') + P('M175 78 L178 38 L222 38 L225 78')],
      [3, 'Face and Buttons', 'Draw dot eyes, a carrot nose, a dotty smile and buttons.', DOT(186, 98, 5) + DOT(214, 98, 5) + P('M200 108 L238 114 L200 121 Z') + DOT(180, 128, 3) + DOT(190, 134, 3) + DOT(210, 134, 3) + DOT(220, 128, 3) + DOT(200, 175, 6) + DOT(200, 200, 6) + DOT(200, 225, 6)],
      [4, 'Arms and Scarf', 'Add stick arms and a scarf.', P('M142 190 L70 150 L56 128 M70 150 L48 158') + P('M258 190 L330 150 L344 128 M330 150 L352 158') + P('M165 138 Q200 160 235 138')]
    ],
    colors: C(200, 300, 80, K(1)) + C(200, 190, 58, K(1)) + C(200, 105, 40, K(1)) + P('M175 78 L178 38 L222 38 L225 78 Z', K(2)) + R(158, 74, 84, 10, 5, K(2)) + P('M200 108 L238 114 L200 121 Z', K(3)),
    shade: P('M255 270 Q285 330 230 378 Q265 330 255 270 Z', 'fill="#6b7fa8" opacity=".25"')
  }));

  // ---- FLOWERS ----------------------------------------------------------
  L.push(mk({
    id: 'flower', name: 'Flower', emoji: '🌸', cat: 'flowers', level: 'Beginner',
    keys: ['flower', 'rose', 'daisy', 'sunflower', 'tulip', 'blossom'], shapes: ['circle', 'curve', 'line'],
    tech: ['Lines & curves', 'A curved stem makes a flower look alive!'],
    pal: { c1: '#ff8fb1', c2: '#ffd93d', c3: '#6fcf6f' },
    palettes: [{ n: 'Sunflower', c1: '#ffd93d', c2: '#8b5a2b', c3: '#6fcf6f' }, { n: 'Blue flower', c1: '#8fb8ff', c2: '#ffd93d', c3: '#6fcf6f' }, { n: 'Purple flower', c1: '#c9a3ff', c2: '#ffd93d', c3: '#6fcf6f' }],
    vars: ['A bunch of flowers 💐', 'Flower with a bee 🐝', 'A garden full of flowers'],
    steps: [
      [1, 'Draw the Center', 'Draw a small circle in the middle.', C(200, 130, 30)],
      [1, 'Add the Petals', 'Draw six round petals around the center.', C(200, 68, 30) + C(254, 99, 30) + C(254, 161, 30) + C(200, 192, 30) + C(146, 161, 30) + C(146, 99, 30)],
      [1, 'Stem and Leaves', 'Draw a long curvy stem with two leaves.', P('M200 222 Q188 300 200 390') + P('M197 290 Q140 250 120 290 Q150 315 197 290 Z') + P('M198 325 Q260 280 285 325 Q250 350 198 325 Z')],
      [2, 'Ground', 'Add the ground and some grass.', P('M70 390 L330 390') + P('M90 390 L96 365 M110 390 L108 372 M290 390 L284 366 M310 390 L312 372')],
      [3, 'Petal Lines', 'Add a short line inside each petal.', P('M200 100 L200 80 M240 108 L255 92 M240 152 L256 168 M200 160 L200 178 M160 152 L144 168 M160 108 L144 92')],
      [4, 'Seeds', 'Add little seed dots in the center.', DOT(190, 124, 3) + DOT(210, 124, 3) + DOT(200, 138, 3)]
    ],
    colors: C(200, 68, 30, K(1)) + C(254, 99, 30, K(1)) + C(254, 161, 30, K(1)) + C(200, 192, 30, K(1)) + C(146, 161, 30, K(1)) + C(146, 99, 30, K(1)) + C(200, 130, 30, K(2)) + P('M197 290 Q140 250 120 290 Q150 315 197 290 Z', K(3)) + P('M198 325 Q260 280 285 325 Q250 350 198 325 Z', K(3)),
    shade: ''
  }));

  // ---- TREES ------------------------------------------------------------
  L.push(mk({
    id: 'tree', name: 'Apple Tree', emoji: '🌳', cat: 'trees', level: 'Beginner',
    keys: ['tree', 'apple tree', 'forest', 'plant', 'oak'], shapes: ['rectangle', 'cloud', 'circle'],
    tech: ['Texture', 'Little lines on the trunk make it look rough like real bark.'],
    pal: { c1: '#5cc86f', c2: '#a0673c', c3: '#ef4444' },
    palettes: [{ n: 'Autumn tree', c1: '#ffa63d', c2: '#8b5a2b', c3: '#ef4444' }, { n: 'Pink blossom', c1: '#ffb3d1', c2: '#8b5a2b', c3: '#fff3a3' }],
    vars: ['Tree with a swing', 'Tree with a bird’s nest', 'A forest of trees 🌲'],
    steps: [
      [1, 'Draw the Trunk', 'Draw a tall shape that is a little wider at the bottom.', P('M175 390 L180 250 L220 250 L225 390')],
      [1, 'Fluffy Top', 'Draw a big bumpy cloud shape on top.', P('M130 250 Q80 240 90 190 Q70 130 130 110 Q150 50 210 70 Q270 50 295 110 Q340 140 315 195 Q335 250 275 250 Z')],
      [1, 'Branches', 'Draw three branches going up inside the leaves.', P('M200 250 L200 190 M200 215 L160 175 M200 215 L240 170')],
      [2, 'Ground', 'Add the ground and a few blades of grass.', P('M60 390 L340 390') + P('M85 390 L90 368 M110 390 L108 374 M295 390 L300 366 M318 390 L316 374')],
      [3, 'Apples', 'Add round apples in the leaves.', C(150, 150, 12) + C(250, 140, 12) + C(235, 210, 12) + C(160, 215, 12)],
      [4, 'Bark Lines', 'Add short lines on the trunk for bark.', P('M190 300 L192 335 M210 290 L208 325 M195 355 L196 380')]
    ],
    colors: P('M175 390 L180 250 L220 250 L225 390 Z', K(2)) + P('M130 250 Q80 240 90 190 Q70 130 130 110 Q150 50 210 70 Q270 50 295 110 Q340 140 315 195 Q335 250 275 250 Z', K(1)) + C(150, 150, 12, K(3)) + C(250, 140, 12, K(3)) + C(235, 210, 12, K(3)) + C(160, 215, 12, K(3)) + R(0, 388, 400, 12, 0, F('#7ed957')),
    shade: P('M285 120 Q335 200 285 248 Q320 190 285 120 Z', SHADOW)
  }));

  // ---- VEHICLES ---------------------------------------------------------
  L.push(mk({
    id: 'car', name: 'Car', emoji: '🚗', cat: 'vehicles', level: 'Easy',
    keys: ['car', 'auto', 'automobile', 'vehicle', 'taxi', 'truck'], shapes: ['rectangle', 'circle', 'line'],
    tech: ['Basic shapes', 'A car is a long rectangle, a trapezoid on top, and two circles.'],
    pal: { c1: '#ef4444', c2: '#cfeeff', c3: '#374151' },
    palettes: [{ n: 'Blue car', c1: '#3b82f6', c2: '#cfeeff', c3: '#374151' }, { n: 'Yellow taxi', c1: '#ffd93d', c2: '#cfeeff', c3: '#374151' }],
    vars: ['Add stripes and stickers', 'Draw a family road trip 🚗', 'A race car 🏁'],
    steps: [
      [1, 'Car Body', 'Draw a long rectangle with round corners.', R(50, 215, 310, 60, 15)],
      [1, 'Roof', 'Draw a roof shape on top, like a trapezoid.', P('M120 215 L155 150 L270 150 L305 215')],
      [1, 'Wheels', 'Draw two big circles for wheels.', C(115, 285, 35) + C(295, 285, 35)],
      [2, 'Windows', 'Draw two windows inside the roof.', P('M160 160 L140 208 L205 208 L205 160 Z') + P('M220 160 L220 208 L285 208 L265 160 Z')],
      [3, 'Lights and Hubcaps', 'Add a headlight, a back light and small circles in the wheels.', C(342, 238, 10) + R(52, 232, 10, 18, 3) + C(115, 285, 14) + C(295, 285, 14) + P('M212 215 L212 270')],
      [4, 'Road and Speed Lines', 'Draw the road and speed lines behind the car.', P('M10 325 L390 325') + P('M10 235 L38 235 M5 255 L33 255')]
    ],
    colors: R(0, 320, 400, 80, 0, F('#cbd5e1')) + R(50, 215, 310, 60, 15, K(1)) + P('M120 215 L155 150 L270 150 L305 215 Z', K(1)) + P('M160 160 L140 208 L205 208 L205 160 Z', K(2)) + P('M220 160 L220 208 L285 208 L265 160 Z', K(2)) + C(115, 285, 35, K(3)) + C(295, 285, 35, K(3)) + C(115, 285, 14, F('#e5e7eb')) + C(295, 285, 14, F('#e5e7eb')),
    shade: R(50, 255, 310, 20, 10, 'fill="#1f2937" opacity=".16"')
  }));

  // ---- HOUSES -----------------------------------------------------------
  L.push(mk({
    id: 'house', name: 'House', emoji: '🏠', cat: 'houses', level: 'Beginner',
    keys: ['house', 'home', 'cottage', 'building', 'hut'], shapes: ['square', 'triangle', 'rectangle'],
    tech: ['Basic shapes', 'A house is a square with a triangle roof. Add a rectangle door!'],
    pal: { c1: '#ffe0a3', c2: '#ef6b5b', c3: '#a0673c' },
    bg: R(0, 0, 400, 400, 0, F('#e3f4ff')) + R(0, 358, 400, 42, 0, F('#8fdc7a')),
    palettes: [{ n: 'Blue house', c1: '#a8d4ff', c2: '#7c4dff', c3: '#8b5a2b' }, { n: 'Pink house', c1: '#ffc9dc', c2: '#ef6b5b', c3: '#8b5a2b' }],
    vars: ['House with a garden 🌷', 'Treehouse', 'A whole street of houses'],
    steps: [
      [1, 'House Walls', 'Draw a big square for the walls.', R(100, 200, 200, 160)],
      [1, 'The Roof', 'Draw a big triangle on top.', P('M80 205 L200 100 L320 205 Z')],
      [1, 'The Door', 'Draw a tall rectangle for the door.', R(175, 270, 50, 90)],
      [2, 'Windows and Chimney', 'Add two square windows and a chimney.', R(120, 225, 40, 40) + R(240, 225, 40, 40) + P('M250 140 L250 90 L280 90 L280 165')],
      [3, 'Window Crosses', 'Add a cross in each window and a doorknob.', P('M140 225 L140 265 M120 245 L160 245 M260 225 L260 265 M240 245 L280 245') + DOT(215, 318, 4)],
      [4, 'Path and Sun', 'Draw a path to the door and a sunny sun.', P('M175 360 L145 395 M225 360 L255 395') + C(70, 60, 25)]
    ],
    colors: R(100, 200, 200, 160, 0, K(1)) + P('M80 205 L200 100 L320 205 Z', K(2)) + R(175, 270, 50, 90, 0, K(3)) + R(120, 225, 40, 40, 0, F('#bfe6ff')) + R(240, 225, 40, 40, 0, F('#bfe6ff')) + R(250, 90, 30, 75, 0, F('#a0673c')) + C(70, 60, 25, F('#ffd93d')),
    shade: R(100, 340, 200, 20, 0, 'fill="#1f2937" opacity=".12"')
  }));

  // ---- NATURE -----------------------------------------------------------
  L.push(mk({
    id: 'mountain', name: 'Mountains', emoji: '⛰️', cat: 'nature', level: 'Easy',
    keys: ['mountain', 'mountains', 'hill', 'scenery', 'landscape', 'nature', 'sun'], shapes: ['triangle', 'circle', 'curve'],
    tech: ['Light & shadow', 'The sun is on one side, so that side is lighter. The other side is darker.'],
    pal: { c1: '#7a8ba8', c2: '#9fb0cc', c3: '#cfeaff' },
    palettes: [{ n: 'Sunset', c1: '#9b6bb0', c2: '#c98ac9', c3: '#ffd0a8' }, { n: 'Green hills', c1: '#6bbf7a', c2: '#8fd69a', c3: '#cfeaff' }],
    vars: ['Mountains with a lake', 'Mountains at sunset 🌇', 'Add a campfire ⛺'],
    steps: [
      [1, 'Big Mountain', 'Draw a big triangle mountain.', P('M20 330 L160 120 L300 330')],
      [1, 'Second Mountain and Ground', 'Draw a smaller mountain and a flat ground line.', P('M250 255 L300 180 L385 330') + P('M0 330 L400 330')],
      [1, 'The Sun', 'Draw a big round sun in the sky.', C(330, 70, 35)],
      [2, 'Snowy Top', 'Add a zig-zag snow cap on the big mountain.', P('M128 168 L160 120 L192 168 L174 158 L160 172 L146 158 Z')],
      [3, 'Clouds', 'Add a fluffy cloud with a bumpy top.', P('M30 90 Q25 65 55 65 Q65 45 95 60 Q125 55 120 85 Q125 100 100 100 L45 100 Q25 100 30 90 Z')],
      [4, 'Trees and Birds', 'Add tiny triangle trees and birds shaped like “v”.', P('M40 330 L62 275 L84 330 M80 330 L100 285 L120 330') + P('M200 60 Q210 45 220 60 Q230 45 240 60 M240 90 Q248 78 256 90 Q264 78 272 90')]
    ],
    colors: R(0, 0, 400, 330, 0, K(3)) + R(0, 330, 400, 70, 0, F('#7ed957')) + C(330, 70, 35, F('#ffd93d')) + P('M250 255 L300 180 L385 330 L250 330 Z', K(2)) + P('M20 330 L160 120 L300 330 Z', K(1)) + P('M128 168 L160 120 L192 168 L174 158 L160 172 L146 158 Z', F('#ffffff')),
    shade: P('M160 120 L300 330 L200 330 Z', 'fill="#1f2937" opacity=".18"')
  }));

  L.push(mk({
    id: 'road', name: 'Long Road', emoji: '🛣️', cat: 'nature', level: 'Challenge',
    keys: ['road', 'perspective', 'highway', 'street', 'path', 'way'], shapes: ['line', 'circle', 'triangle'],
    tech: ['Perspective', 'Things far away look smaller. Lines go toward one dot on the horizon!'],
    pal: { c1: '#cbd5e1', c2: '#cfeaff', c3: '#8fdc7a' },
    palettes: [{ n: 'Desert road', c1: '#d6c2a0', c2: '#ffe9c2', c3: '#e8c27a' }, { n: 'Spring road', c1: '#cbd5e1', c2: '#d9f0ff', c3: '#a9e68c' }],
    vars: ['Road with a car 🚗', 'Road going to a castle', 'A curvy road'],
    steps: [
      [1, 'Road Lines', 'Draw two lines that meet at one dot in the middle.', P('M20 390 L200 160 M380 390 L200 160')],
      [1, 'The Horizon', 'Draw a flat line across the page where the road ends.', P('M0 160 L400 160')],
      [1, 'Road Dashes', 'Draw dashes down the middle. Make them smaller far away!', P('M200 385 L200 350 M200 330 L200 312 M200 296 L200 286 M200 276 L200 270')],
      [2, 'Trees on the Left', 'Draw 3 trees. The farther away, the smaller!', P('M55 300 L55 240') + C(55, 215, 38) + P('M105 240 L105 205') + C(105, 188, 24) + P('M145 205 L145 185') + C(145, 175, 14)],
      [3, 'Trees on the Right', 'Copy the trees on the right side.', P('M345 300 L345 240') + C(345, 215, 38) + P('M295 240 L295 205') + C(295, 188, 24) + P('M255 205 L255 185') + C(255, 175, 14)],
      [4, 'Mountains and Sun', 'Add far-away mountains and a sun.', P('M250 160 L325 90 L400 160') + C(90, 70, 28)]
    ],
    colors: R(0, 0, 400, 160, 0, K(2)) + R(0, 160, 400, 240, 0, K(3)) + P('M20 390 L200 160 L380 390 Z', K(1)) + C(55, 215, 38, F('#4caf50')) + C(105, 188, 24, F('#4caf50')) + C(145, 175, 14, F('#4caf50')) + C(345, 215, 38, F('#4caf50')) + C(295, 188, 24, F('#4caf50')) + C(255, 175, 14, F('#4caf50')) + P('M250 160 L325 90 L400 160 Z', F('#9fb0cc')) + C(90, 70, 28, F('#ffd93d')),
    shade: ''
  }));

  // ---- SPACE ------------------------------------------------------------
  L.push(mk({
    id: 'rocket', name: 'Rocket', emoji: '🚀', cat: 'space', level: 'Beginner',
    keys: ['rocket', 'spaceship', 'ship', 'space', 'astronaut'], shapes: ['oval', 'triangle', 'circle'],
    tech: ['Symmetry', 'Both sides of a rocket match. Draw the left fin, then copy the right.'],
    pal: { c1: '#ef6b6b', c2: '#4ea8ff', c3: '#e8e4ff' },
    palettes: [{ n: 'Green rocket', c1: '#4cd964', c2: '#ffd93d', c3: '#e8e4ff' }, { n: 'Purple rocket', c1: '#a78bfa', c2: '#ff8fb1', c3: '#e8e4ff' }],
    vars: ['Rocket flying to the Moon 🌙', 'Rocket with a flag', 'Rocket and aliens 👽'],
    steps: [
      [1, 'Rocket Body', 'Draw a tall shape with a pointy top.', P('M200 40 Q290 120 280 270 L120 270 Q110 120 200 40 Z')],
      [1, 'Fins', 'Add a triangle fin on each side.', P('M120 215 L65 290 L120 270') + P('M280 215 L335 290 L280 270')],
      [1, 'Window', 'Draw a round window.', C(200, 150, 35)],
      [2, 'Flame', 'Draw a big flame under the rocket.', P('M150 270 Q200 380 250 270')],
      [3, 'Stars', 'Fill the sky with stars!', STAR(70, 80) + STAR(330, 120) + STAR(60, 300, 0.8)],
      [4, 'Stripes and Planet', 'Add two stripes and a faraway planet with a ring.', P('M118 232 L282 232 M121 250 L279 250') + C(335, 60, 24) + E(335, 60, 42, 10)]
    ],
    colors: R(0, 0, 400, 400, 0, K(3)) + P('M150 270 Q200 380 250 270 Z', F('#ffb703')) + P('M120 215 L65 290 L120 270 Z', K(2)) + P('M280 215 L335 290 L280 270 Z', K(2)) + P('M200 40 Q290 120 280 270 L120 270 Q110 120 200 40 Z', K(1)) + C(200, 150, 35, F('#bfe6ff')) + C(335, 60, 24, F('#ffb36b')),
    shade: P('M240 70 Q290 130 280 270 L245 270 Q262 140 240 70 Z', 'fill="#1f2937" opacity=".14"')
  }));

  L.push(mk({
    id: 'planet', name: 'Ringed Planet', emoji: '🪐', cat: 'space', level: 'Easy',
    keys: ['planet', 'saturn', 'galaxy', 'star', 'moon'], shapes: ['circle', 'oval', 'curve'],
    tech: ['Simple 3D forms', 'A ring is a squished circle (an oval). It makes a flat circle look 3D.'],
    pal: { c1: '#ffb36b', c2: '#ff8fb1', c3: '#e8e4ff' },
    palettes: [{ n: 'Blue planet', c1: '#6ec5ff', c2: '#c9b6ff', c3: '#e8e4ff' }, { n: 'Green planet', c1: '#8fdc9a', c2: '#ffd93d', c3: '#e8e4ff' }],
    vars: ['Planet with moons', 'Draw a whole solar system', 'Alien on the planet 👽'],
    steps: [
      [1, 'Draw the Planet', 'Draw a big circle in the middle.', C(200, 200, 80)],
      [1, 'Draw the Ring', 'Draw a flat oval around the planet.', E(200, 200, 150, 38)],
      [1, 'Add Stars', 'Draw stars all around.', STAR(60, 70) + STAR(340, 330) + STAR(330, 80, 0.8)],
      [2, 'Planet Stripes', 'Add two curved stripes on the planet.', P('M135 165 Q200 190 265 165 M122 215 Q200 240 278 215')],
      [3, 'Tiny Moon', 'Add a small moon with two craters.', C(60, 320, 22) + C(52, 314, 4) + C(70, 328, 5)],
      [4, 'Comet', 'Add a comet with a long tail.', P('M330 150 L270 180 M345 170 L295 195') + C(340, 150, 10)]
    ],
    colors: R(0, 0, 400, 400, 0, K(3)) + C(200, 200, 80, K(1)) + E(200, 200, 150, 38, 'fill="none" stroke="var(--c2)" stroke-width="14"') + C(60, 320, 22, F('#d1d5db')),
    shade: P('M240 135 Q300 200 235 275 Q272 200 240 135 Z', 'fill="#1f2937" opacity=".16"')
  }));

  // ---- FOOD -------------------------------------------------------------
  L.push(mk({
    id: 'pizza', name: 'Pizza Slice', emoji: '🍕', cat: 'food', level: 'Beginner',
    keys: ['pizza', 'food', 'slice', 'cheese', 'snack'], shapes: ['triangle', 'circle', 'curve'],
    tech: ['Coloring', 'Color inside the lines, then add a darker color on the edges for yummy crust.'],
    pal: { c1: '#ffd166', c2: '#e9a45c', c3: '#e63946' },
    palettes: [{ n: 'Veggie pizza', c1: '#ffe08a', c2: '#e9a45c', c3: '#4caf50' }, { n: 'Extra cheese', c1: '#ffc83d', c2: '#d9892f', c3: '#ff8c42' }],
    vars: ['A whole pizza 🍕', 'Pizza with smiley face', 'Draw your favorite toppings'],
    steps: [
      [1, 'Pizza Triangle', 'Draw a big triangle with a curved top.', P('M200 370 L60 100 Q200 40 340 100 Z')],
      [1, 'The Crust', 'Draw a curved line near the top for the crust.', P('M70 128 Q200 70 330 128')],
      [1, 'Pepperoni', 'Draw three circles for pepperoni.', C(160, 185, 22) + C(245, 190, 22) + C(200, 270, 22)],
      [2, 'Melted Cheese', 'Let the cheese drip over the crust edge.', P('M120 150 Q124 185 142 175') + P('M270 160 Q268 195 252 188')],
      [3, 'Pepperoni Dots', 'Add small dots on each pepperoni.', DOT(154, 180, 3) + DOT(168, 192, 3) + DOT(240, 184, 3) + DOT(253, 196, 3) + DOT(195, 264, 3) + DOT(208, 276, 3)],
      [4, 'Olives and Steam', 'Add black olive rings and curly steam.', C(130, 230, 9) + C(285, 240, 9) + P('M170 34 Q152 20 170 6 M225 38 Q207 24 225 10')]
    ],
    colors: P('M200 370 L60 100 Q200 40 340 100 Z', K(1)) + P('M60 100 Q200 40 340 100 L330 128 Q200 70 70 128 Z', K(2)) + C(160, 185, 22, K(3)) + C(245, 190, 22, K(3)) + C(200, 270, 22, K(3)),
    shade: P('M200 370 L340 100 L300 112 Z', 'fill="#1f2937" opacity=".12"')
  }));

  // ---- FESTIVALS --------------------------------------------------------
  L.push(mk({
    id: 'diya', name: 'Diwali Diya', emoji: '🪔', cat: 'festivals', level: 'Easy',
    keys: ['diya', 'diwali', 'lamp', 'festival', 'light', 'deepavali', 'candle'], shapes: ['curve', 'oval', 'dot'],
    tech: ['Light & shadow', 'A glowing flame is the lightest part. Everything around it is a bit darker.'],
    pal: { c1: '#d9733b', c2: '#ffb703', c3: '#ffe066' },
    bg: R(0, 0, 400, 400, 0, F('#fff3d6')),
    palettes: [{ n: 'Blue diya', c1: '#4a7fd9', c2: '#ffb703', c3: '#ffe066' }, { n: 'Golden diya', c1: '#e0a82e', c2: '#ff8c42', c3: '#fff3a3' }],
    vars: ['Row of diyas 🪔🪔🪔', 'Diya with flower rangoli 🌼', 'Fireworks in the sky 🎆'],
    steps: [
      [1, 'The Bowl', 'Draw a wide bowl shape with a little spout.', P('M70 240 Q90 360 200 365 Q310 360 330 240 Z') + P('M325 245 Q365 240 375 205 Q340 215 322 236')],
      [1, 'The Flame', 'Draw a flame like a teardrop pointing up.', P('M200 240 Q150 170 200 90 Q250 170 200 240 Z')],
      [1, 'Inner Flame and Wick', 'Draw a smaller flame inside and a tiny wick.', P('M200 225 Q182 190 200 155 Q218 190 200 225 Z') + P('M200 240 L200 226')],
      [2, 'Bowl Dots', 'Add pretty dots along the bowl.', DOT(130, 285, 6) + DOT(165, 305, 6) + DOT(200, 312, 6) + DOT(235, 305, 6) + DOT(270, 285, 6)],
      [3, 'Sparkles', 'Add little sparkle lines around the flame.', P('M110 140 L130 150 M290 140 L270 150 M200 60 L200 40 M120 100 L140 110 M280 100 L260 110')],
      [4, 'Rangoli', 'Draw a pretty rangoli pattern on the floor.', P('M70 398 L330 398') + C(130, 385, 10) + C(200, 388, 10) + C(270, 385, 10)]
    ],
    colors: P('M200 240 Q150 170 200 90 Q250 170 200 240 Z', K(2)) + P('M200 225 Q182 190 200 155 Q218 190 200 225 Z', K(3)) + P('M70 240 Q90 360 200 365 Q310 360 330 240 Z', K(1)) + P('M325 245 Q365 240 375 205 Q340 215 322 236 Z', K(1)) + C(130, 385, 10, F('#ec4899')) + C(200, 388, 10, F('#3b82f6')) + C(270, 385, 10, F('#22c55e')),
    shade: P('M285 262 Q320 340 220 364 Q300 330 285 262 Z', 'fill="#1f2937" opacity=".18"')
  }));

  // ---- FANTASY ----------------------------------------------------------
  L.push(mk({
    id: 'castle', name: 'Magic Castle', emoji: '🏰', cat: 'fantasy', level: 'Easy',
    keys: ['castle', 'palace', 'fortress', 'fairy tale', 'fantasy', 'magic', 'tower', 'kingdom'], shapes: ['rectangle', 'triangle', 'curve'],
    tech: ['Symmetry', 'Castles are the same on the left and right. Count the windows on both sides!'],
    pal: { c1: '#cdb8ff', c2: '#7c4dff', c3: '#8b5a2b' },
    bg: R(0, 0, 400, 400, 0, F('#e6f3ff')) + R(0, 360, 400, 40, 0, F('#8fdc7a')),
    palettes: [{ n: 'Pink castle', c1: '#ffc9dc', c2: '#ff6b9d', c3: '#8b5a2b' }, { n: 'Golden castle', c1: '#ffe08a', c2: '#ef6b5b', c3: '#8b5a2b' }],
    vars: ['Castle with a dragon 🐉', 'Castle on a cloud ☁️', 'Draw your own kingdom'],
    steps: [
      [1, 'Castle Walls', 'Draw a big rectangle for the middle part.', R(110, 190, 180, 170)],
      [1, 'Two Towers', 'Draw a tall rectangle on each side.', R(70, 150, 60, 210) + R(270, 150, 60, 210)],
      [1, 'Pointy Roofs', 'Put a triangle roof on each tower.', P('M60 150 L100 70 L140 150 Z') + P('M260 150 L300 70 L340 150 Z')],
      [2, 'Door and Flags', 'Draw an arched door and flags on the roofs.', P('M175 360 L175 290 Q200 255 225 290 L225 360') + P('M100 70 L100 35 L130 45 L100 55') + P('M300 70 L300 35 L330 45 L300 55')],
      [3, 'Windows and Wall Tops', 'Add tall windows and bumps on top of the wall.', R(90, 190, 20, 35, 8) + R(290, 190, 20, 35, 8) + P('M130 190 L130 170 L150 170 L150 190 M170 190 L170 170 L190 170 L190 190 M210 190 L210 170 L230 170 L230 190 M250 190 L250 170 L270 170 L270 190')],
      [4, 'Magic Sky', 'Fill the sky with stars and a crescent moon.', STAR(40, 50, 0.9) + STAR(360, 40, 0.9) + STAR(210, 60, 0.7) + P('M215 85 Q190 105 215 135 Q180 130 175 105 Q180 80 215 85 Z')]
    ],
    colors: R(110, 190, 180, 170, 0, K(1)) + R(70, 150, 60, 210, 0, K(1)) + R(270, 150, 60, 210, 0, K(1)) + P('M60 150 L100 70 L140 150 Z', K(2)) + P('M260 150 L300 70 L340 150 Z', K(2)) + P('M175 360 L175 290 Q200 255 225 290 L225 360 Z', K(3)) + P('M100 70 L100 35 L130 45 L100 55 Z', F('#ff6b6b')) + P('M300 70 L300 35 L330 45 L300 55 Z', F('#ff6b6b')) + R(90, 190, 20, 35, 8, F('#ffe066')) + R(290, 190, 20, 35, 8, F('#ffe066')),
    shade: R(110, 340, 180, 20, 0, 'fill="#1f2937" opacity=".12"')
  }));

  // ---- TECHNIQUE LESSONS ------------------------------------------------
  L.push(mk({
    id: 'ball', name: 'Shaded Ball', emoji: '🔵', cat: 'techniques', level: 'Medium',
    keys: ['ball', 'sphere', 'shading', 'shadow', 'shade', 'circle'], shapes: ['circle', 'oval', 'line'],
    tech: ['Shading', 'Pick where the light comes from. Make the opposite side darker with lines!'],
    pal: { c1: '#5aa9ff', c2: '#ffffff', c3: '#ffffff' },
    palettes: [{ n: 'Red ball', c1: '#ff6b6b', c2: '#fff', c3: '#fff' }, { n: 'Green ball', c1: '#4cd964', c2: '#fff', c3: '#fff' }],
    vars: ['Shade an orange 🍊', 'Shade a moon 🌙', 'Shade a snowball'],
    steps: [
      [1, 'Draw a Circle', 'Draw a big, round circle.', C(200, 190, 110)],
      [1, 'Ground Shadow', 'Draw a flat oval underneath for the ground shadow.', E(215, 322, 115, 20, DASH)],
      [1, 'Where is the Light?', 'Draw a little sun in the top left. Light comes from there!', C(60, 60, 22) + P('M60 28 L60 12 M60 92 L60 108 M28 60 L12 60 M92 60 L108 60') + P('M84 84 L132 132 M132 132 L112 130 M132 132 L130 112')],
      [2, 'Light Shading', 'Draw short lines on the side away from the light.', P('M255 112 L300 160 M232 135 L296 205')],
      [3, 'Darker Shading', 'Add more lines at the bottom right. Darkest part is far from the light!', P('M230 255 L284 222 M245 275 L270 258 M262 150 L304 192')],
      [4, 'Shiny Spot', 'Leave a shiny spot near the light. Do not shade it!', E(150, 140, 20, 11, DASH)]
    ],
    colors: E(215, 322, 115, 20, SHADOW) + C(200, 190, 110, K(1)),
    shade: '<defs><clipPath id="ballc"><circle cx="200" cy="190" r="110"/></clipPath></defs><g clip-path="url(#ballc)"><path fill-rule="evenodd" fill="#1f2937" opacity=".3" d="M0 0H400V400H0Z M45 160 a125 125 0 1 0 250 0 a125 125 0 1 0 -250 0"/></g>' + E(150, 140, 20, 11, F('#ffffff') + ' opacity=".7"')
  }));

  L.push(mk({
    id: 'cube', name: 'Magic Cube', emoji: '🧊', cat: 'techniques', level: 'Medium',
    keys: ['cube', 'box', '3d', 'block', 'dice', 'square'], shapes: ['square', 'line', 'rectangle'],
    tech: ['Simple 3D forms', 'Draw one square, then another behind it, and connect the corners!'],
    pal: { c1: '#ff9f43', c2: '#ffd08a', c3: '#d97706' },
    palettes: [{ n: 'Blue cube', c1: '#5aa9ff', c2: '#a8d4ff', c3: '#2b6cb0' }, { n: 'Green cube', c1: '#4cd964', c2: '#a8f0a8', c3: '#2f9e4a' }],
    vars: ['A stack of cubes', 'A dice with dots 🎲', 'A gift box 🎁'],
    steps: [
      [1, 'Front Square', 'Draw a square. This is the front of the cube.', R(120, 190, 140, 140)],
      [1, 'The Top', 'Draw a slanted line up and across, then back down to make the top.', P('M120 190 L160 150 L300 150 L260 190')],
      [1, 'The Side', 'Draw the side with a line down and a slanted line back.', P('M300 150 L300 290 L260 330')],
      [2, 'Hidden Lines', 'Draw dotted lines for the back edges you can’t see.', P('M120 330 L160 290 L300 290 M160 290 L160 150', DASH)],
      [3, 'Side Shading', 'Draw slanted lines on the side to make it darker.', P('M265 200 L295 170 M265 235 L295 205 M265 270 L295 240 M265 305 L295 275')],
      [4, 'Cube Shadow', 'Draw a dotted shadow under the cube.', E(220, 346, 130, 14, DASH)]
    ],
    colors: E(220, 346, 130, 14, SHADOW) + R(120, 190, 140, 140, 0, K(1)) + P('M120 190 L160 150 L300 150 L260 190 Z', K(2)) + P('M260 190 L300 150 L300 290 L260 330 Z', K(3)),
    shade: ''
  }));

  // ---- categories & techniques -----------------------------------------
  window.CATEGORIES = [
    { id: 'animals', name: 'Animals', emoji: '🐯', color: '#ff9f43', alias: ['animal', 'pet', 'zoo'] },
    { id: 'birds', name: 'Birds', emoji: '🐦', color: '#4ea8ff', alias: ['bird'] },
    { id: 'people', name: 'People', emoji: '🧒', color: '#ff6b9d', alias: ['people', 'person', 'human'] },
    { id: 'cartoon', name: 'Cartoons', emoji: '🤖', color: '#8b5cf6', alias: ['cartoon', 'character'] },
    { id: 'flowers', name: 'Flowers', emoji: '🌸', color: '#ec4899', alias: ['flower', 'garden'] },
    { id: 'trees', name: 'Trees', emoji: '🌳', color: '#22c55e', alias: ['tree', 'forest'] },
    { id: 'vehicles', name: 'Vehicles', emoji: '🚗', color: '#ef4444', alias: ['vehicle', 'transport'] },
    { id: 'houses', name: 'Houses', emoji: '🏠', color: '#f59e0b', alias: ['house', 'home', 'building'] },
    { id: 'nature', name: 'Nature', emoji: '⛰️', color: '#14b8a6', alias: ['nature', 'outdoor', 'scenery', 'landscape'] },
    { id: 'space', name: 'Space', emoji: '🚀', color: '#6366f1', alias: ['space', 'galaxy'] },
    { id: 'food', name: 'Food', emoji: '🍕', color: '#f97316', alias: ['food', 'meal'] },
    { id: 'festivals', name: 'Festivals', emoji: '🪔', color: '#eab308', alias: ['festival', 'holiday', 'celebration'] },
    { id: 'fantasy', name: 'Fantasy', emoji: '🏰', color: '#a855f7', alias: ['fantasy', 'magical'] },
    { id: 'techniques', name: 'Tricks', emoji: '🎨', color: '#0ea5e9', alias: ['technique', 'trick', 'skill'] }
  ];

  window.TECHNIQUES = [
    { name: 'Basic shapes', emoji: '🔺', tip: 'Everything starts as circles, squares and triangles.', lesson: 'snowman' },
    { name: 'Lines & curves', emoji: '〰️', tip: 'Straight lines are strong. Curvy lines look alive.', lesson: 'flower' },
    { name: 'Proportions', emoji: '📏', tip: 'Compare sizes: how big is the head next to the body?', lesson: 'kid' },
    { name: 'Symmetry', emoji: '🦋', tip: 'Both sides match, like a mirror.', lesson: 'butterfly' },
    { name: 'Shading', emoji: '✏️', tip: 'Short lines side by side make a darker spot.', lesson: 'ball' },
    { name: 'Coloring', emoji: '🖍️', tip: 'Color in one direction and stay inside the lines.', lesson: 'pizza' },
    { name: 'Light & shadow', emoji: '☀️', tip: 'Light side, dark side, and a shadow on the ground.', lesson: 'mountain' },
    { name: 'Perspective', emoji: '🛣️', tip: 'Far away things are smaller. Lines meet at one dot.', lesson: 'road' },
    { name: 'Texture', emoji: '🐯', tip: 'Little marks make fur, bark and bumps look real.', lesson: 'tiger' },
    { name: 'Outlining', emoji: '🖊️', tip: 'Draw light first, then trace the best lines darker.', lesson: 'cat' },
    { name: 'Simple 3D forms', emoji: '🧊', tip: 'Draw a flat shape, then add depth with slanted lines.', lesson: 'cube' }
  ];

  window.LESSONS = L;
})();
