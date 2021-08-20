import { settings } from './settings';

import * as d3 from 'd3';
import { scalePow } from 'd3-scale';
import { Skill } from './model/Skill';

declare module 'd3' {
  export function autoType<R extends object, T extends string>(
    rawRow: d3.DSVRowString<T>,
    index: number,
    columns: T[]
  ): R | undefined | null;
}

export class Data {
  tree: Tree;

  async parseData(csvFile: string): Promise<void> {
    const skills = await d3.csv<Skill, string>(
      csvFile,
      (rawRow: d3.DSVRowString<string>, index: number, columns: string[]) =>
        Object.assign(new Skill(), d3.autoType(rawRow, index, columns))
    );

    this.tree = new Tree(skills);

    this.tree.nodeList = <Skill[]>Object.values(this.tree.skills);
  }
}

export interface Link {
  source: Skill;
  target: Skill;
  type?: string;
}

export class Tree {
  scale: d3.ScaleContinuousNumeric<number, number>;
  skills: { [id: string]: Skill } = {};
  links: Link[] = [];
  nodeList: Skill[] = [];
  series: Map<string, Skill[]> = new Map<string, Skill[]>();
  lanes: Map<number, Skill[]> = new Map<number, Skill[]>();
  skillRange: [number, number];

  constructor(skills: Skill[]) {
    const seriesNames = new Set(skills.map((s) => s.series));
    const seriesCount = seriesNames.size;

    this.skillRange = skills.reduce(
      (prev, curr) => [
        Math.min(prev[0], curr.start),
        Math.max(prev[1], curr.actualEnd),
      ],
      [skills[0].start, 0]
    );

    this.scale = scalePow()
      .domain([0, this.skillRange[1]])
      .range([settings.layout.centerRadius, settings.layout.width / 2])
      .exponent(0.5);

    for (const skill of skills) {
      skill.setRanges(this.scale);

      this.skills[skill.id] = skill;

      let series = this.series.get(skill.series);

      if (!series) {
        if (!skill.angle) {
          skill.angle = (360 / seriesCount) * this.series.size;
        }

        series = [];
        this.series.set(skill.series, series);
      } else if (!skill.angle) {
        skill.angle = series[0].angle;
      }

      this.addToLane(skill);

      series.push(skill);
    }

    this.addLinks();
  }

  addToLane(skill: Skill): void {
    // Available lanes, ordered by distance from target.
    const laneAngles = this.lanesAtRadius(skill.barRanges.total.start).sort(
      (a, b) => {
        let aDiff = Math.abs(a - skill.angle);
        let bDiff = Math.abs(b - skill.angle);

        if (aDiff == bDiff) {
          return a > b ? a : b;
        } else {
          return bDiff < aDiff ? b : a;
        }
      }
    );

    for (const angle of laneAngles) {
      let lane = this.lanes.get(angle);

      if (!lane) {
        lane = [];
        this.lanes.set(angle, lane);
      }

      if (
        !lane.length
        || lane[lane.length - 1].barRanges.total.end
          + settings.layout.skillMargin
          <= skill.barRanges.total.start
      ) {
        skill.angle = angle;
        lane.push(skill);

        console.log(`Added ${skill.id} to ${skill.angle}.`);
        return;
      }
    }

    console.warn(`Could not find an open lane for skill: ${skill}.`);
  }

  closest(needle: number, haystack: number[]) {
    return haystack.reduce((a, b) => {
      let aDiff = Math.abs(a - needle);
      let bDiff = Math.abs(b - needle);

      if (aDiff == bDiff) {
        return a > b ? a : b;
      } else {
        return bDiff < aDiff ? b : a;
      }
    });
  }

  lanesAtRadius(radius: number): number[] {
    const maxCount = Math.floor(
      (Math.PI * 2 * radius)
        / (settings.layout.skillWidth + settings.layout.skillMargin)
    );

    const ring = Math.max(
      0,
      Math.floor(Math.log2(maxCount) - Math.log2(settings.layout.initialCount))
    );

    const count = settings.layout.initialCount * Math.pow(2, ring);

    return Array(count)
      .fill(0)
      .map((v, i) => (i * 360) / count);
  }

  addLinks(): void {
    for (const skill of Object.values(this.skills)) {
      if (skill.prerequisites) {
        skill.parents = skill.prerequisites
          .split(',')
          .map((prereq) => this.skills[prereq]);

        for (const parent of skill.parents) {
          this.links.push({ source: parent, target: skill });
        }
      }
    }
  }
}
