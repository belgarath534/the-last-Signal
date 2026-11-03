// Items, documents, recordings and objectives for Chapter 1.

export const items = {
  police_radio: {
    name: 'Police radio',
    description: 'Your shoulder radio, tuned to dispatch. Your call sign is Unit 14.',
  },
  flashlight: {
    name: 'Flashlight',
    description: 'A heavy police-issue flashlight. Fresh batteries.',
  },
  facility_radio: {
    name: 'Facility radio',
    description:
      'A handheld radio from the facility’s own system. Someone inside the building is on the other end.',
  },
  override_card: {
    name: 'Red override card',
    description: 'A red maintenance keycard. Printed on the back: OVERRIDE. NOT FOR ROUTINE USE.',
  },
};

export const documents = {
  doc_dispatch_notes: {
    title: 'Dispatch call notes',
    text: [
      'Call received 7:52 PM. Repeating signal on emergency band, source triangulated to the research facility on the north road. Pattern: three short tones, one long. No voice. No response to hails.',
      'Facility listed as closed. No keyholder on file.',
      'Unit 14 to respond and investigate. Your own handwriting underneath, pressed hard into the paper: You know this place.',
    ],
  },
  doc_visitor_log: {
    title: 'Visitor log',
    text: [
      'Most of the page is water-damaged. The last legible entries:',
      'Board delegation, six visitors. Signed in 9:10 AM. Signed out 6:45 PM.',
      'Technician, contractor badge. Signed in 11:30 AM. Signed out 4:05 PM.',
      'Dr. E. Carter. Signed in 8:40 PM. Reason for visit: Meeting, Robotics. Signed out: blank.',
      'There are no entries after that one.',
    ],
  },
  doc_directory: {
    title: 'Building directory',
    text: [
      'Ground floor: Reception. Security. Administration. Robotics Division, Director’s Office.',
      'Sublevel 1: Laboratories. Medical Ward. Storage.',
      'Sublevel 2: Restricted. Authorized personnel only.',
      'Someone has peeled the letters off the Sublevel 2 line and pressed them back on in the wrong order.',
    ],
  },
  doc_security_log: {
    title: 'Security logbook, final entries',
    text: [
      'Board order: power to sublevels to be cut at the end of the night shift. Do not restore without written authorization.',
      'Robotics director’s access revoked effective today. He is not to be admitted to the building. If he arrives, call the number on the board, not the police.',
      'Noises from Sublevel 2 again. Told to log it and leave it.',
      'Last entry, different handwriting, barely legible: They said everyone was out. Somebody is still talking on the radio.',
    ],
  },
  doc_reassignment_memo: {
    title: 'Memo from the Project Board',
    text: [
      'To all staff.',
      'Effective immediately, the Director of Robotics is relieved of all duties. Ongoing work under his supervision is transferred to the Project Board.',
      'Prototype 001 is to remain in storage, inactive, until further notice. No staff are to attempt activation.',
      'Questions about these changes are not to be directed to the former director.',
    ],
  },
  doc_proposal: {
    title: 'Project proposal: a helpful humanoid assistant',
    text: [
      'Submitted by Daniel, Director of Robotics.',
      'We have built machines that are strong and machines that are fast. I want to build one that is kind. A humanoid assistant that can help someone stand up after a fall, carry groceries up the stairs, sit with a patient through a long night, and know when to be quiet.',
      'Everything in this design begins with the hands. A hand that can hold a cup without breaking it can also hold a hand.',
      'A note in the margin, in different handwriting: Daniel, the hands section is beautiful. Do not let the board cut it. E.',
    ],
    onRead: [{ setFlag: 'knows_daniel_name' }],
  },
  doc_override_note: {
    title: 'Note taped to the override card',
    text: [
      'For the elevator, if the board locks everyone out again. Do not tell them this exists.',
      'If anyone asks, you never had it. M.',
    ],
  },
};

export const recordings = {
  rec_emily_voicemail: {
    title: 'Answering machine tape',
    text: [
      'Woman’s voice: Daniel, it’s me. Pick up if you’re there. Something is wrong. They’ve moved your files downstairs, all of them, and nobody will tell me why.',
      'I’m going to come in tonight and find out. Call me back. Please.',
      'End of message.',
    ],
    onRead: [{ setFlag: 'knows_daniel_name' }],
  },
};

export const objectives = {
  find_signal: { text: 'Find the source of the signal.' },
  restore_power: { text: 'Restore emergency power from the security office.' },
  find_way_down: { text: 'Find a way down to the lower levels.' },
};
