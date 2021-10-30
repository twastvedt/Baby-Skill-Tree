import { settings } from '../settings';

import * as d3 from 'd3';
import { scalePow } from 'd3-scale';
import { Skill } from './Skill';
import { Link } from './Link';

declare module 'd3' {
  export function autoType<R extends Record<string, unknown>, T extends string>(
    rawRow: d3.DSVRowString<T>,
    index: number,
    columns: T[]
  ): R | undefined | null;
}

export class Data {
  tree!: Tree;

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

export class Tree {
  scale: d3.ScaleContinuousNumeric<number, number>;
  skills: { [id: string]: Skill } = {};
  links: Link[] = [];
  nodeList: Skill[] = [];
  types: Map<string, Skill[]> = new Map<string, Skill[]>();
  lanes: Map<number, Skill[]> = new Map<number, Skill[]>();
  skillRange: [number, number];

  constructor(skills: Skill[]) {
    const sortedSkills = skills.slice().sort((a, b) => a.start - b.start);

    const typeNames = new Set(sortedSkills.map((s) => s.type));
    const typesCount = typeNames.size;

    this.skillRange = sortedSkills.reduce(
      (prev, curr) => [
        Math.min(prev[0], curr.start),
        Math.max(prev[1], curr.actualEnd),
      ],
      [sortedSkills[0].start, 0]
    );

    this.scale = scalePow()
      .domain([0, this.skillRange[1]])
      .range([settings.layout.centerRadius, settings.layout.width / 2])
      .exponent(0.5);

    for (const skill of sortedSkills) {
      skill.setRanges(this.scale);

      if (skill.icon) {
        skill.getIconDetails();
      }

      if (skill.prerequisites) {
        skill.parents = skill.prerequisites
          .split(',')
          .map((prereq) => ({ source: this.skills[prereq], target: skill }));

        for (const link of skill.parents) {
          this.links.push(link);

          link.source.children.push(link);
        }

        skill.angle = skill.parents[0].source.angle;
      }

      let type = this.types.get(skill.type);

      if (!type) {
        if (skill.angle === undefined) {
          skill.angle = (360 / typesCount) * this.types.size;
        }

        type = [];
        this.types.set(skill.type, type);
      } else if (skill.angle === undefined) {
        skill.angle = type[0].angle;
      }

      this.addToLane(skill);

      type.push(skill);

      this.skills[skill.id] = skill;
    }
  }

  addToLane(skill: Skill): void {
    // Available lanes, ordered by distance from target.
    const laneAngles = this.lanesAtRadius(skill.barRanges.total.start).sort(
      (a, b) => {
        const aDiff = Math.abs(a - skill.angle);
        const bDiff = Math.abs(b - skill.angle);

        return aDiff - bDiff;
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

  closest(needle: number, haystack: number[]): number {
    return haystack.reduce((a, b) => {
      const aDiff = Math.abs(a - needle);
      const bDiff = Math.abs(b - needle);

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
}
