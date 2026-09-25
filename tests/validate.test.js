import { describe, it, expect } from 'vitest';
import { validate, SA_NOTICE } from '../scripts/validate.mjs';

function baseDB() {
  return {
    eras: [
      { id: 'a', name: 'A', hanzi: '甲', start: -100, end: 0, color: '#fff', capital: 'X', capitalXY: [1, 2], shape: 'sq', oneLiner: 'test' },
      { id: 'b', name: 'B', hanzi: '乙', start: 0, end: null, color: '#000', capital: 'Y', capitalXY: [3, 4], shape: 'sq', oneLiner: 'test2' },
    ],
    events: [
      { id: 'e1', title: 'T1', hanzi: '甲', pinyin: 'jiǎ', year: -50, era: 'a', category: 'tech', icon: 'x', body: ['p1'], whyItMatters: 'w', xy: [1, 2], related: [] },
      { id: 'e2', title: 'T2', hanzi: '乙', pinyin: 'yǐ', year: 10, era: 'b', category: 'war', icon: 'y', body: ['p2'], whyItMatters: 'w2', xy: [3, 4], related: ['e1'] },
    ],
    tour: [{ event: 'e1', title: 'Stop1', text: 'text1' }],
    shapes: { sq: [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1] },
    world: { a: 'meanwhile a', b: 'meanwhile b' },
  };
}

const clone = (db) => JSON.parse(JSON.stringify(db));

describe('validate: base fixture is valid', () => {
  it('returns no errors', () => {
    expect(validate(baseDB())).toEqual([]);
  });
});

describe('validate: each rule has a failing fixture', () => {
  it('rejects a missing required field', () => {
    const db = clone(baseDB());
    delete db.events[0].whyItMatters;
    expect(validate(db).some((e) => e.includes('whyItMatters'))).toBe(true);
  });

  it('rejects an unknown category', () => {
    const db = clone(baseDB());
    db.events[0].category = 'bogus';
    expect(validate(db).some((e) => e.includes('category'))).toBe(true);
  });

  it('rejects an event whose era id does not exist', () => {
    const db = clone(baseDB());
    db.events[0].era = 'zzz';
    expect(validate(db).some((e) => e.includes("era 'zzz'"))).toBe(true);
  });

  it('rejects an event year outside its era range', () => {
    const db = clone(baseDB());
    db.events[0].year = 9999;
    expect(validate(db).some((e) => e.includes('outside era'))).toBe(true);
  });

  it('allows a documented historical exception outside its era range', () => {
    const db = clone(baseDB());
    db.events[0].id = 'redcliffs';
    db.events[0].year = 9999;
    db.tour[0].event = 'redcliffs';
    expect(validate(db).some((e) => e.includes('outside era'))).toBe(false);
  });

  it('rejects a dangling related id', () => {
    const db = clone(baseDB());
    db.events[0].related = ['nope'];
    expect(validate(db).some((e) => e.includes("related id 'nope'"))).toBe(true);
  });

  it('rejects a duplicate era id', () => {
    const db = clone(baseDB());
    db.eras[1].id = 'a';
    expect(validate(db).some((e) => e.includes('duplicate era id'))).toBe(true);
  });

  it('rejects a duplicate event id', () => {
    const db = clone(baseDB());
    db.events[1].id = 'e1';
    expect(validate(db).some((e) => e.includes('duplicate event id'))).toBe(true);
  });

  it("rejects '<' in a content string", () => {
    const db = clone(baseDB());
    db.events[0].title = 'Bad <script>';
    expect(validate(db).some((e) => e.includes("contains '<'"))).toBe(true);
  });

  it('rejects a tour stop whose event id does not resolve', () => {
    const db = clone(baseDB());
    db.tour[0].event = 'missing';
    expect(validate(db).some((e) => e.includes("event id 'missing'"))).toBe(true);
  });

  it('rejects an era shape id that does not exist in map-shapes.json', () => {
    const db = clone(baseDB());
    db.eras[0].shape = 'nope';
    expect(validate(db).some((e) => e.includes("shape 'nope' not found"))).toBe(true);
  });

  it('rejects a shape that is not 16 numbers', () => {
    const db = clone(baseDB());
    db.shapes.sq = [0, 0, 1, 0];
    expect(validate(db).some((e) => e.includes('16 numbers'))).toBe(true);
  });

  it('rejects a last era whose end is not null', () => {
    const db = clone(baseDB());
    db.eras[1].end = 2026;
    expect(validate(db).some((e) => e.includes('end: null'))).toBe(true);
  });

  it('rejects a non-last era whose end is null', () => {
    const db = clone(baseDB());
    db.eras[0].end = null;
    expect(validate(db).some((e) => e.includes('end must be an int'))).toBe(true);
  });

  it('rejects an era with no world.json entry', () => {
    const db = clone(baseDB());
    delete db.world.a;
    expect(validate(db).some((e) => e.includes('missing world.json entry'))).toBe(true);
  });

  it('rejects a CC BY-SA manifest image when About is missing the ShareAlike notice', () => {
    const db = clone(baseDB());
    db.images = { x: { license: 'CC BY-SA 4.0' } };
    db.aboutSrc = 'About page with no notice';
    expect(validate(db).some((e) => e.includes(SA_NOTICE))).toBe(true);
  });

  it('allows a CC BY-SA manifest image when About carries the ShareAlike notice', () => {
    const db = clone(baseDB());
    db.images = { x: { license: 'CC BY-SA 4.0' } };
    db.aboutSrc = `About page mentions ${SA_NOTICE} right here`;
    expect(validate(db).some((e) => e.includes(SA_NOTICE))).toBe(false);
  });
});

describe('validate: fiction layer (rules 13–14)', () => {
  function fictionDB() {
    const db = clone(baseDB());
    db.events[0] = {
      ...db.events[0],
      category: 'fiction',
      wiki: 'https://en.wikipedia.org/wiki/The_Legend_of_the_Condor_Heroes',
      source: { work: 'W', workHanzi: '作', author: 'Jin Yong', published: '1957–59', medium: 'novel' },
    };
    return db;
  }

  it('accepts a complete fiction event', () => {
    expect(validate(fictionDB())).toEqual([]);
  });

  it('rejects fiction without a source', () => {
    const db = fictionDB();
    delete db.events[0].source;
    expect(validate(db).some((e) => e.includes("fiction needs a 'source'"))).toBe(true);
  });

  it('rejects a source missing a field', () => {
    const db = fictionDB();
    delete db.events[0].source.published;
    expect(validate(db).some((e) => e.includes('source.published missing'))).toBe(true);
  });

  it('rejects an unknown medium', () => {
    const db = fictionDB();
    db.events[0].source.medium = 'podcast';
    expect(validate(db).some((e) => e.includes("source.medium 'podcast'"))).toBe(true);
  });

  it('rejects fiction without a wiki link', () => {
    const db = fictionDB();
    delete db.events[0].wiki;
    expect(validate(db).some((e) => e.includes("fiction needs a 'wiki'"))).toBe(true);
  });

  it('rejects fiction that is also legendary', () => {
    const db = fictionDB();
    db.events[0].legendary = true;
    expect(validate(db).some((e) => e.includes('mutually exclusive'))).toBe(true);
  });

  it('rejects a source on a non-fiction event', () => {
    const db = fictionDB();
    db.events[1].source = db.events[0].source;
    expect(validate(db).some((e) => e.includes("only fiction events carry a 'source'"))).toBe(true);
  });

  it('rejects a wiki link that is not English Wikipedia', () => {
    const db = fictionDB();
    db.events[0].wiki = 'https://example.com/wiki/X';
    expect(validate(db).some((e) => e.includes('must be an https://en.wikipedia.org/wiki/ URL'))).toBe(true);
  });

  it('rejects a Wuxia Tour stop whose event id does not resolve', () => {
    const db = fictionDB();
    db.wuxiaTour = [{ event: 'missing', title: 't', text: 'x' }];
    expect(validate(db).some((e) => e.includes("tour-wuxia.json[0]: event id 'missing'"))).toBe(true);
  });
});
