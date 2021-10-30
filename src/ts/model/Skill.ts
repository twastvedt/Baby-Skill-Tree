import Pt from './Pt';
import { settings, IconDetails } from '../settings';
import { Link } from './Link';

interface RangeSegment {
  start: number;
  length: number;
  end: number;
}

export class Skill {
  angle!: number;

  id!: string;

  notes?: string;
  reference?: string;
  complete?: boolean;
  start!: number;
  maxStart?: number;
  end?: number;
  maxEnd?: number;
  prerequisites?: string;
  name!: string;
  type!: string;
  series?: string;
  icon?: string;

  iconDetails?: IconDetails;

  parents: Link[] = [];
  children: Link[] = [];

  nodeType = 'Skill';

  barRanges!: {
    start?: RangeSegment;
    main?: RangeSegment;
    end?: RangeSegment;
    total: RangeSegment;
  };

  get actualEnd(): number {
    return this.maxEnd ?? this.end ?? this.maxStart ?? this.start;
  }

  get roundedLength(): number {
    return Math.round(this.barRanges.total.length * 100) / 100;
  }

  get reversed(): boolean {
    return (this.angle + 90) % 360 > 180;
  }

  getIconDetails(): void {
    if (this.icon) {
      this.iconDetails = settings.icons.get(this.icon);
    }
  }

  toString(): string {
    return `Skill: ${this.name} (${this.id})
  ${this.type}
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
    let visualEnd = this.actualEnd;

    if (scale(visualEnd) - scale(this.start) < settings.layout.minSkillLength) {
      visualEnd = scale.invert(
        scale(this.start) + settings.layout.minSkillLength
      );
    }

    this.barRanges = {
      total: this.makeBarRange(scale, this.start, visualEnd),
    };

    if (this.end) {
      this.barRanges.main = this.makeBarRange(
        scale,
        this.maxStart ?? this.start,
        this.end
      );
    }

    if (this.maxStart) {
      this.barRanges.start = this.makeBarRange(
        scale,
        this.start,
        this.maxStart
      );
    }

    if (this.maxEnd && this.end) {
      this.barRanges.end = this.makeBarRange(scale, this.end, this.maxEnd);
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
