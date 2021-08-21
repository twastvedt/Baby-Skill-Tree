import { Skill } from './Skill';

export interface Link {
  source: Skill;
  target: Skill;
  type?: string;
}
