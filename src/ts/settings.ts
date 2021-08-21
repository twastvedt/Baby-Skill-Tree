interface IconDetails {
  license: string;
  source: string;
  author: string;
  notes?: string;
}

export const settings = {
  dataPath:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vT1vy5dt1_l8HA4YzuLgVlxHk9PKBoixjhq2nienetjJx9RhxKt8WYYmyG6kWaFsh6hQqKlDjoVY0d1/pub?gid=0&single=true&output=csv',
  layout: {
    minSkillLength: 45,
    centerRadius: 10,
    width: 1000,
    skillWidth: 20,
    skillMargin: 4,
    initialCount: 4,
  },
  rings: {
    lastYearly: 24,
    lastQuarterly: 48,
  },
  text: {
    margin: 4,
    size: 10,
  },
  icons: new Map<string, IconDetails>([
    [
      'standing',
      {
        license: 'https://creativecommons.org/licenses/by/4.0/',
        source: 'fontawesome.io',
        author: 'Dave Gandy',
      },
    ],
    [
      'breastFeeding',
      {
        license: 'https://creativecommons.org/licenses/by/4.0/',
        source: 'https://github.com/hfg-gmuend/openmoji',
        author: 'OpenMoji',
        notes: 'Removed fill color from original.',
      },
    ],
  ]),
};
