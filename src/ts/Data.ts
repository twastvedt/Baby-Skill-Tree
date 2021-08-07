import { TreeNode } from './model/TreeNode';
import { settings } from './settings';

import * as d3 from 'd3';
import { Skill } from './model/Skill';

declare module 'd3' {
  export function autoType<R extends object, T extends string>(
    rawRow: d3.DSVRowString<T>,
    index: number,
    columns: T[]
  ): R | undefined | null;
}

export class Data {
  tree = new Tree();

  constructor(csvFile: string) {
    void this.parseData(csvFile);
  }

  async parseData(csvFile: string): Promise<void> {
    const skills = await d3.csv<Skill, string>(csvFile, d3.autoType);

    for (const skill of skills) {
      this.tree.add(skill);
    }

    this.tree.nodeList = <TreeNode[]>Object.values(this.tree.skills);
  }
}

export interface Link {
  source: TreeNode;
  target: TreeNode;
  type?: string;
}

export class Tree {
  skills: { [id: string]: Skill } = {};
  links: Link[] = [];
  levels: Skill[][] = [];
  nodeList: TreeNode[] = [];

  // Add a skill, optionally to a level of the graph
  add(skill: Skill): void {
    this.skills[skill.id] = skill;

    if (skill.level !== null) {
      // Make sure the list for this level exists before adding a person to it
      if (typeof this.levels[skill.level] === 'undefined') {
        this.levels[skill.level] = [];
      }

      this.levels[skill.level].push(skill);
    }
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
