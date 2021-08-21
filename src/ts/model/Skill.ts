import Pt from './Pt';
import { BaseType } from 'd3';
import { settings } from '../settings';
import { Link } from './Link';

export type SkillSelection = d3.Selection<
  SVGGElement,
  Skill,
  BaseType,
  unknown
>;

interface RangeSegment {
  start: number;
  length: number;
  end: number;
}

export class Skill {
  #angle: number;

  id: string;

  notes: string;
  reference: string;
  level: number;
  complete: boolean;
  start: number;
  maxStart: number;
  end: number;
  maxEnd: number;
  prerequisites: string;
  name: string;
  series: string;
  icon?: string;

  element: SVGElement;
  parents: Link[] = [];
  children: Link[] = [];

  nodeType = 'Skill';

  barRanges: {
    start?: RangeSegment;
    main: RangeSegment;
    end?: RangeSegment;
    total: RangeSegment;
  };

  get angle(): number {
    return this.#angle;
  }

  set angle(angle: number) {
    this.#angle = angle;

    this.updateRotation();
  }

  get actualEnd(): number {
    return this.maxEnd ?? this.end ?? this.maxStart ?? this.start;
  }

  toString() {
    return `Skill: ${this.name} (${this.id})
  ${this.series}
  ${this.start} - ${this.actualEnd}`;
  }

  makeBarRange(
    scale: d3.ScaleContinuousNumeric<number, number>,
    start: number,
    end: number
  ): RangeSegment {
    return {
      start: scale(start),
      length: scale(end) - scale(start),
      end: scale(end),
    };
  }

  setRanges(scale: d3.ScaleContinuousNumeric<number, number>): void {
    let end = this.actualEnd;

    if (scale(end) - scale(this.start) < settings.layout.minSkillLength) {
      end = scale.invert(scale(this.start) + settings.layout.minSkillLength);
    }

    this.barRanges = {
      total: this.makeBarRange(scale, this.start, end),
      main: this.makeBarRange(
        scale,
        this.maxStart ?? this.start,
        this.maxEnd ? this.end : end
      ),
    };

    if (this.maxStart) {
      this.barRanges.start = this.makeBarRange(
        scale,
        this.start,
        this.maxStart
      );
    }

    if (this.maxEnd) {
      this.barRanges.end = this.makeBarRange(scale, this.end, this.maxEnd);
    }
  }

  updateRotation(): void {
    if (this.element) {
      this.element.setAttribute('transform', `rotate(${this.angle})`);
    }
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
