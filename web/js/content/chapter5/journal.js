// Items, documents and objectives for Chapter 5.

export const items = {
  bolt_cutters: { name: 'Bolt cutters', description: 'Heavy, long-handled bolt cutters from the storage tool crate.' },
  emily_badge: {
    name: 'Emily’s lanyard',
    description: 'Her old staff lanyard, the one she wears in the photo in Daniel’s office. DR. E. CARTER. ROBOTICS. She asked you to give it to Daniel.',
  },
};

export const documents = {
  doc_isolation_order: {
    title: 'Isolation order',
    text: [
      'By order of the Project Board. Recipient frame to be relocated to Isolation, east stairwell, following the incident.',
      'Restraints to remain engaged at all times. Network access limited to facility audio only.',
      'Door code set to the subject’s own heartbeat pattern. Somebody on the Board thought that was funny.',
      'Access from Sublevel 1: maintenance override on the elevator, door-open and B1 together, five seconds.',
    ],
  },
  doc_padlock_tag: {
    title: 'Tag on the stairwell padlock',
    text: ['PROPERTY OF THE PROJECT BOARD. DO NOT REMOVE.', 'On the back, a date in marker. It is less than a month old.'],
  },
};

export const recordings = {};

export const objectives = {
  find_isolation: { text: 'Find out where the board put the rest of Daniel.' },
  go_up: { text: 'Get the elevator on Sublevel 1 to take you up to the surface.' },
  get_cutters: { text: 'Find something to cut the chain on the surface stairwell door. Storage might have tools.' },
};
