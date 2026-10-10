/* ===== Weitere Themen für Klasse 5/6 ===== */
import type { Topic } from './gen.js';
import { GEO_TOPICS } from './topics-geo.js';
import { ZAHL_TOPICS } from './topics-zahl.js';

export const MORE: Topic[] = [...ZAHL_TOPICS, ...GEO_TOPICS];
