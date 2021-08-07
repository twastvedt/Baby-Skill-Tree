import Pt from './Pt';
import { TreeNode } from './TreeNode';
import { BaseType } from 'd3';

export type SkillSelection = d3.Selection<
  SVGGElement,
  Skill,
  BaseType,
  unknown
>;

export class Skill extends TreeNode {
  parents: Skill[] = [];
  children: Skill[] = [];
  notes: string;
  reference: string;
  level: number;
  complete: boolean;
  start: number;
  maxStart: number;
  end: number;
  maxEnd: number;
  prerequisites: string;

  constructor(id: string, public name: string) {
    super(id);
  }

  get actualEnd(): number {
    return this.maxEnd ?? this.end ?? this.maxStart ?? this.start;
  }

  // path generator for arcs
  static arc(
    start: number,
    end: number,
    radius: number,
    scale: d3.ScaleTime<number, number>
  ): string {
    //keep text upright
    if (start % 360 <= 180) {
      [start, end] = [end, start];
    }

    let dTheta = end - start;

    dTheta += dTheta > 180 ? -360 : dTheta < -180 ? 360 : 0;

    const largeArc = Math.abs(dTheta) > 180 ? 1 : 0,
      sweep = dTheta > 0 ? 1 : 0,
      r = scale(radius);

    return (
      'M'
      + new Pt(r, (start * Math.PI) / 180).fromPolar().toString()
      + 'A'
      + r
      + ','
      + r
      + ' 0 '
      + largeArc
      + ','
      + sweep
      + ' '
      + new Pt(r, (end * Math.PI) / 180).fromPolar().toString()
    );
  }
}
