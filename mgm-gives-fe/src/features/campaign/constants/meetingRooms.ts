export type MeetingRoomGroup = {
  group: string;
  rooms: string[];
};

export const MEETING_ROOM_GROUPS: MeetingRoomGroup[] = [
  {
    group: 'Meetingrooms DA NANG QT',
    rooms: [
      'Meetingroom DA NANG QT 1st floor Blue',
      'Meetingroom DA NANG QT 2nd floor Green (round table)',
      'Meetingroom DA NANG QT 2nd floor Orange',
    ],
  },
  {
    group: 'Meetingrooms DA NANG PCT',
    rooms: [
      'Meetingroom DA NANG PCT 2nd floor back',
      'Meetingroom DA NANG PCT 2nd floor front',
      'Meetingroom DA NANG PCT 3rd floor',
      'Meetingroom DA NANG PCT 4th floor center',
      'Meetingroom DA NANG PCT 4th floor front',
      'Meetingroom DA NANG PCT 5th floor center',
      'Meetingroom DA NANG PCT 5th floor front',
      'Meetingroom DA NANG PCT Directors Room',
      'Meetingroom DA NANG PCT Kitchen',
    ],
  },
  {
    group: 'Meetingrooms HCMC',
    rooms: [
      'Meetingroom HCMC HBT 1st Floor Kitchen',
      'Meetingroom HCMC HBT 3rd Floor Big',
      'Meetingroom HCMC HBT 3rd Floor Small',
      'Meetingroom HCMC HBT 6th Floor Rooftop',
      'Meetingroom HCMC HBT Mezzanine Floor',
    ],
  },
];
