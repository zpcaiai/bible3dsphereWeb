import { BIBLE_MAPS } from './data/bibleMapsData.js';
import { writeFileSync } from 'fs';
writeFileSync('/sessions/upbeat-zealous-dirac/mnt/outputs/bm/bible_maps.json', JSON.stringify(BIBLE_MAPS, null, 0));
console.log('maps:', BIBLE_MAPS.length, BIBLE_MAPS.map(m=>m.id).join(','));
