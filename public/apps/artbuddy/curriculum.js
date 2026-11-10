/* Local illustrated curriculum: no account or AI credits required. */
(function () {
  const path = d => `<path d="${d}"/>`;
  const circle = (x,y,r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  const ellipse = (x,y,rx,ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
  const levels = [
    { id:'kindergarten', label:'Kindergarten', focus:'Big shapes · playful lines · color', difficulty:0, lessons:['shape-garden','happy-creature'] },
    { id:'middle', label:'Middle School', focus:'Patterns · form · visual stories', difficulty:2, lessons:['pattern-leaf','comic-panel'] },
    { id:'high', label:'High School', focus:'Perspective · values · composition', difficulty:3, lessons:['perspective-room','value-study'] },
    { id:'adult', label:'Adult', focus:'Observation · contour · still life', difficulty:3, lessons:['contour-mug','still-life'] }
  ];
  const make = (id,name,emoji,cat,tech,steps,challenge) => ({ id,name,emoji,cat,keys:[name.toLowerCase(),id.replace(/-/g,' '),tech[0].toLowerCase()],shapes:['line','curve','circle'],tech,pal:{c1:'var(--teal)',c2:'var(--yellow)',c3:'var(--pink)'},bg:'',colors:'',guide:'',shade:'',vars:[challenge.prompt], steps:steps.map(([t,say,d])=>({tier:1,t,say,d})),challenge });
  const lessons = [
    make('shape-garden','Shape Garden','🌷','flowers',['Shape building','Combine big circles and long lines into flowers.'],[
      ['Round middle','Make one big circle. It can be wobbly!',circle(200,130,28)],
      ['Flower petals','Put five circles around your first circle.',circle(200,68,30)+circle(258,112,30)+circle(236,174,30)+circle(164,174,30)+circle(142,112,30)],
      ['Long stem','Draw one long line down from your flower.',path('M200 200 Q185 270 200 350')],
      ['Two leaves','Draw a leaf on each side. Add a line for the ground.',path('M193 275 Q125 230 120 280 Q155 305 193 275 M197 310 Q265 265 280 315 Q245 340 197 310 M60 355 H340')]
    ],{name:'Silly Shape Garden',prompt:'Invent three flowers using circles, triangles or squares. Give each flower a different color.',checks:['Three flowers','Two different shapes','My favorite colors']}),
    make('happy-creature','Happy Creature','👾','cartoon',['Creative shapes','A made-up creature can look any way you imagine.'],[
      ['Big body','Draw a big soft oval for your creature.',ellipse(200,225,100,110)],
      ['Funny eyes','Draw two circles. Put a little dot in each one.',circle(160,190,22)+circle(240,190,22)+circle(160,190,5)+circle(240,190,5)],
      ['Happy smile','Draw a smile with one curved line.',path('M155 245 Q200 290 245 245')],
      ['Arms and feet','Add two arms and two feet. Choose silly shapes!',path('M105 225 Q50 200 60 270 M295 225 Q350 200 340 270 M150 320 L130 355 H185 M250 320 L270 355 H215')]
    ],{name:'Creature Mix-up',prompt:'Invent a friendly creature with three eyes, patterned arms and a name only you know.',checks:['Three eyes','A repeating pattern','A friendly expression']}),
    make('pattern-leaf','Pattern Leaf','🍃','trees',['Pattern & symmetry','Repeat marks on each side of a curved leaf vein.'],[
      ['Leaf silhouette','Join two sweeping curves at pointed ends.',path('M95 320 Q65 120 305 65 Q340 260 95 320 Z')],
      ['Central vein','Draw a curved vein from base to tip.',path('M95 320 Q180 195 305 65')],
      ['Branching veins','Make smaller veins branch from the center.',path('M135 265 L100 210 M170 220 L115 145 M210 175 L180 105 M135 265 L215 295 M170 220 L275 245 M210 175 L305 180')],
      ['Repeating texture','Repeat short marks inside one section; change their spacing.',path('M140 155 L150 175 M153 150 L163 170 M168 145 L178 165 M215 225 L225 245 M230 220 L240 240 M245 215 L255 235')]
    ],{name:'Nature Pattern Remix',prompt:'Draw two different leaves. Fill one with repeating lines and the other with a pattern you invent.',checks:['Two leaf silhouettes','Two contrasting patterns','Veins connect to a center']}),
    make('comic-panel','Comic Moment','💬','cartoon',['Visual storytelling','Expression and placement can tell a story in one panel.'],[
      ['Frame the scene','Leave a margin and draw a rectangular panel.',path('M45 45 H355 V355 H45 Z')],
      ['Place a character','Use a circle and simple body below it; leave space above.',circle(170,190,40)+path('M145 230 L130 290 H210 L195 230 M130 265 L95 280 M210 265 L245 240 M150 290 L140 330 M190 290 L210 330')],
      ['Expression','Use raised brows and an open mouth to show surprise.',path('M145 167 L160 160 M180 160 L195 167')+circle(155,182,4)+circle(185,182,4)+ellipse(170,210,8,12)],
      ['Speech and setting','Draw a speech balloon with a tail toward the speaker, then a ground line.',path('M240 70 Q330 65 325 115 Q325 140 265 135 L240 160 L250 132 Q210 120 220 90 Z M55 335 H345')]
    ],{name:'Unexpected Visitor',prompt:'Draw a one-panel comic about an unexpected friendly visitor. Use expression, a setting and a short speech balloon.',checks:['Clear facial expression','A setting clue','Speech belongs to a character']}),
    make('perspective-room','One-point Room','🏛️','houses',['One-point perspective','Depth edges meet at one vanishing point; verticals stay vertical.'],[
      ['Back wall','Draw the rectangular back wall of a room.',path('M135 125 H265 V245 H135 Z')],
      ['Room corners','Connect each wall corner to the matching page corner. Their extended lines meet at the central vanishing point.',path('M135 125 L35 25 M265 125 L365 25 M135 245 L35 345 M265 245 L365 345')],
      ['Floor tiles','Make floor depth lines aim at the center of the back wall. Stop them at the wall.',path('M175 245 L120 345 M225 245 L280 345 M200 245 V345 M65 315 H335 M95 285 H305 M118 262 H282')],
      ['Window plane','Keep window uprights vertical; angle its top and bottom along the wall’s depth direction.',path('M65 108 L113 143 V215 L65 244 Z M88 125 V229 M65 176 L113 179')]
    ],{name:'Design a Studio',prompt:'Create a one-point studio interior. Add a window and floor tiles, then invent an object for the back wall.',checks:['Depth lines share a vanishing point','Vertical edges stay vertical','Near tiles look larger']}),
    make('value-study','Five-value Sphere','⚫','techniques',['Value & light','Use a consistent light direction and five distinct values.'],[
      ['Sphere outline','Draw a circle and a ground line. Imagine light from the upper left.',circle(190,185,95)+path('M45 305 H355')],
      ['Cast shadow','Place a flattened shadow below the sphere, stretching away from the light.',ellipse(235,298,115,15)],
      ['Middle and dark values','Hatch along the lower-right side. Closely spaced marks make darker values.',path('M250 135 L275 165 M245 160 L283 200 M230 195 L278 240 M210 230 L253 268 M245 210 L269 237 M237 223 L260 250 M229 237 L248 258')],
      ['Protect the highlight','Leave the upper-left highlight light. Make a five-value strip below, from paper-white to dark.',path('M55 340 H345 V370 H55 Z M113 340 V370 M171 340 V370 M229 340 V370 M287 340 V370 M130 345 L150 365 M180 345 L200 365 M195 345 L215 365 M238 345 L258 365 M248 345 L268 365 M258 345 L278 365 M290 345 L310 365 M300 345 L320 365 M310 345 L330 365 M320 345 L340 365')]
    ],{name:'Light Direction Switch',prompt:'Redraw the sphere with light from the upper right. Move the highlight, dark side and cast shadow consistently.',checks:['Five distinguishable values','Highlight faces the light','Cast shadow falls away from light']}),
    make('contour-mug','Observed Mug','☕','food',['Contour observation','Look at a real mug; compare widths and curves before adding detail.'],[
      ['Rim ellipse','Observe the rim. Draw a wide ellipse, not a pointed oval.',ellipse(180,110,90,25)],
      ['Body contour','Draw side contours down from the rim, then a curved bottom.',path('M90 110 L100 285 Q180 320 260 285 L270 110')],
      ['Handle and negative space','Draw the handle outside the body and a smaller opening inside it.',path('M270 135 Q355 120 350 200 Q345 270 263 260 M269 162 Q325 145 320 200 Q315 235 265 230')],
      ['Inner rim and surface','Add the inner rim and a grounded shadow; keep contour weight light on the lit side.',ellipse(180,110,75,16)+ellipse(210,325,120,15)]
    ],{name:'Three-view Mug Study',prompt:'Draw the same mug from three viewpoints. Compare the rim ellipses and the negative space inside each handle.',checks:['Three viewpoints','Ellipses change with viewpoint','Handle openings observed']}),
    make('still-life','Still-life Composition','🍐','food',['Composition & proportion','Compare objects as a group and use overlap to establish depth.'],[
      ['Arrange big forms','Draw a tall bottle next to a smaller fruit; compare their heights.',path('M120 65 H160 V130 Q185 145 185 185 V295 H95 V185 Q95 145 120 130 Z')+ellipse(260,267,55,45)],
      ['Observed details','Add bottle neck rings and a fruit stem without losing the larger forms.',path('M120 82 H160 M100 195 H180 M100 265 H180 M260 225 Q253 205 270 200')],
      ['Ground the group','Use a table edge and flattened cast shadows to connect the objects.',path('M35 330 H365')+ellipse(147,310,75,12)+ellipse(282,315,65,10)],
      ['Value relationships','Choose upper-left light. Add hatching to the right side of each object; leave highlights.',path('M165 155 L178 175 M162 180 L178 200 M162 210 L178 230 M162 240 L178 260 M162 270 L178 290 M285 240 L305 260 M278 258 L305 285 M265 278 L287 303')]
    ],{name:'Everyday Object Ensemble',prompt:'Arrange three household objects. Sketch their shared proportions and negative spaces, then use a limited three-color palette.',checks:['Three observed objects','Intentional overlap or spacing','Consistent light direction']})
  ];
  function getLevel(id) { return levels.find(l=>l.id===id) || levels[0]; }
  const api = { levels, lessons, getLevel, lessonsFor:id=>lessons.filter(l=>getLevel(id).lessons.includes(l.id)) };
  if (typeof window !== 'undefined') { window.ART_CURRICULUM = api; if (window.LESSONS) window.LESSONS.push(...lessons); }
  if (typeof module !== 'undefined') module.exports = api;
})();