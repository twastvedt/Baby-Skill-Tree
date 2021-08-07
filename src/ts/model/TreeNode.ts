﻿export class TreeNode {
  #angle: number;

  get angle(): number {
    return this.#angle;
  }

  set angle(angle: number) {
    this.#angle = angle;

    this.updateRotation();
  }

  element: SVGElement;
  rotationChildren: Iterable<TreeNode>;

  constructor(public id: string) {}

  updateRotation(): void {
    if (this.element) {
      this.element.setAttribute('transform', `rotate(${this.angle - 90})`);
    }
  }

  /**
   * Get all tree nodes that should be rotated if this node is rotated.
   * (All descendants of ancestors that are not descendants of this node.)
   * @param families Families to include, and from which to walk the tree.
   * @param nodes Nodes to include without walking their trees.
   */
  getRotationChildren(nodes: Iterable<TreeNode> = [this]): Iterable<TreeNode> {
    const rotationChildren = new Set<TreeNode>(nodes);

    // TODO: recurse

    return rotationChildren;
  }
}
