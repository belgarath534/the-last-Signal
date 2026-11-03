// Which music plays where. Music sits quietly under everything (about half
// the music volume) so it never covers a screen reader, and can be turned
// off with the "Music while exploring" setting.

const OUTSIDE = ['patrol_car', 'front_gate'];
const SURFACE = ['reception', 'security_office', 'main_corridor', 'robotics_office', 'elevator_car'];
const UPSTAIRS_DARK = ['stairwell', 'isolation'];
const CITY = ['apartment', 'street', 'cafe', 'diner', 'emily_place', 'okafor_office'];
const SAD = ['holding_cell', 'interview_room', 'county_jail'];
const COURT = ['courtroom', 'court_hallway', 'evidence_room'];

export const EXPLORATION_MUSIC_LEVEL = 0.5;

export function pickMusic(state, room) {
  if (!state || !room) return null;
  const f = state.flags;
  const id = room.id;
  // Part Two finale: Voss is everywhere in the facility.
  if (f.p2c5_started && !f.voss_gone && (room.zone === 'sublevel' || room.zone === 'sublevel2')) return 'music-voss';
  // 001 is hunting you.
  if (state.stalker?.active && room.zone === 'sublevel') return 'music-hunt';
  if (OUTSIDE.includes(id)) return 'music-outside';
  if (SURFACE.includes(id)) return 'music-surface';
  if (UPSTAIRS_DARK.includes(id)) return 'music-isolation';
  if (CITY.includes(id)) return 'music-city';
  if (SAD.includes(id)) return 'music-sad';
  if (COURT.includes(id)) return 'music-trial';
  if (room.zone === 'sublevel') return 'music-sublevel1';
  if (room.zone === 'sublevel2') return 'music-sublevel2';
  return null;
}

// Music for an ending or chapter end.
export function endMusic(ended) {
  if (['romance', 'found_you', 'clean_line'].includes(ended?.ending)) return 'music-love';
  if (['lost', 'her_voice', 'scorched_wire'].includes(ended?.ending)) return 'music-sad';
  return 'music-descent';
}
