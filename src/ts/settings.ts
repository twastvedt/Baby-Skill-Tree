export interface IconDetails {
  license: string;
  source: string;
  notes?: string;
}

export const settings = {
  dataPath:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vT1vy5dt1_l8HA4YzuLgVlxHk9PKBoixjhq2nienetjJx9RhxKt8WYYmyG6kWaFsh6hQqKlDjoVY0d1/pub?gid=0&single=true&output=csv',
  layout: {
    minSkillLength: 45,
    centerRadius: 12,
    width: 1000,
    skillWidth: 20,
    skillMargin: 2,
    initialCount: 4,
  },
  rings: {
    lastMonthly: 24,
    lastQuarterly: 48,
  },
  icons: new Map<string, IconDetails>([
    [
      'standing',
      {
        license: 'https://creativecommons.org/licenses/by/4.0/',
        source: '<a href="fontawesome.io">Dave Gandy</a>',
      },
    ],
    [
      'breastFeeding',
      {
        license: 'Public Domain',
        source:
          '<a href="https://thenounproject.com/edward">Edward Boatman from Noun Project</a>',
        notes: 'Removed fill color from original.',
      },
    ],
    [
      'crawling',
      {
        license: 'Creative Commons',
        source:
          '<a href="https://thenounproject.com/budhishakti17">Ragal Kartidev from Noun Project</a>',
      },
    ],
    [
      'smiling',
      {
        license:
          '<a href="https://www.freepikcompany.com/legal?&_ga=2.246028932.1853393565.1629660833-2034462439.1629502450#nav-flaticon">Flaticon</a>',
        source:
          '<a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>',
      },
    ],
  ]),
};
