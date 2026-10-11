/* ===== Weitere Themen für Klasse 5/6 ===== */
import type { Topic } from './gen.js';
import { GEO_TOPICS } from './topics-geo.js';
import { ZAHL_TOPICS } from './topics-zahl.js';
import { BRUCH2_TOPICS } from './topics-bruch2.js';
import { RECHNEN_TOPICS } from './topics-rechnen.js';
import { MUSTER_TOPICS } from './topics-muster.js';

export const MORE: Topic[] = [...ZAHL_TOPICS, ...GEO_TOPICS, ...BRUCH2_TOPICS, ...RECHNEN_TOPICS, ...MUSTER_TOPICS];
