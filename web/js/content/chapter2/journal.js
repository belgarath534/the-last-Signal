// Items, documents, recordings and objectives for Chapter 2.

const cell = {
  name: 'Power cell',
  description: 'A heavy portable power cell, the kind the facility uses for emergency equipment. Charged.',
};

export const items = {
  power_cell_a: cell,
  power_cell_b: cell,
  power_cell_c: cell,
};

export const documents = {
  doc_preservation_log: {
    title: 'Preservation log, Capsule 3',
    text: [
      'Occupant: Carter, E., Dr.',
      'Reason for preservation: interference with a Project Board directive. Attempted access to sealed Sublevel 2 records.',
      'Authorized by Board resolution. Revival: not authorized. Review date: left blank.',
      'Capsule backup power: maintenance overdue. Maintenance overdue. Maintenance overdue.',
      'Appended note: Transfer subject D. All records sealed at Sublevel 2.',
    ],
  },
  doc_case_label: {
    title: 'Label inside the metal case',
    text: [
      'TRANSFER. SECONDARY.',
      'Destination: scratched out, hard enough to tear the label.',
      'The foam is cut for something small and rectangular. It is empty.',
    ],
  },
  doc_revival_protocol: {
    title: 'Revival protocol, Capsule 3 (draft, unsigned)',
    text: [
      'Patient must be stabilized in the medical ward before any revival attempt.',
      'Revival requires authorization codes held at Sublevel 2.',
      'Expect confusion on waking. Speak calmly. Familiar voices help.',
      'Someone has underlined the last line twice.',
    ],
  },
};

export const recordings = {
  rec_transfer_log: {
    title: 'Recorder in the transfer suite',
    text: [
      'First voice: Board resolution fourteen is on file. Consent is not required.',
      'Second voice: He’s awake. He’s asking for Emily.',
      'First voice: Sedate him. Begin the transfer.',
      'Second voice: Neural map at sixty percent. Eighty. The body’s heart rate is dropping.',
      'First voice: Keep going. The body doesn’t matter now.',
      'A long tone. Then the second voice, quieter: Transfer complete. Is it... is it talking?',
      'First voice: Turn it off. Turn it off.',
      'The recording ends.',
    ],
  },
};

export const objectives = {
  retrieve_records: { text: 'Find the records terminal in the preservation lab.' },
  save_emily: { text: 'Get Emily to the medical ward.' },
  power_ward: { text: 'Get power to the medical ward door. It takes a power cell.' },
  keep_emily_alive: { text: 'Keep Emily alive: check on her in the ward, and keep her power up with power cells.' },
};
