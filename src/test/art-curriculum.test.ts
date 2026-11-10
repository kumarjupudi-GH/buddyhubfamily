import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire(import.meta.url);
const curriculum = require('../../public/apps/artbuddy/curriculum.js');
describe('ArtBuddy learning levels', () => {
  for (const [id, lessons] of Object.entries({ kindergarten:['shape-garden','happy-creature'], middle:['pattern-leaf','comic-panel'], high:['perspective-room','value-study'], adult:['contour-mug','still-life'] })) {
    it(`provides distinct ${id} tutorials and challenges`, () => {
      expect(curriculum.lessonsFor(id).map((l: {id:string})=>l.id)).toEqual(lessons);
      for (const l of curriculum.lessonsFor(id)) {
        expect(l.steps.length).toBe(4);
        expect(l.steps.every((s: {tier:number;d:string})=>s.tier===1 && s.d.length>0)).toBe(true);
        expect(l.challenge.checks.length).toBe(3);
      }
    });
  }
  it('defaults an unknown learning level to kindergarten',()=>expect(curriculum.getLevel('missing').id).toBe('kindergarten'));
});