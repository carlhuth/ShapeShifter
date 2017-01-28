interface IPoint { x: number; y: number; };

/** An immutable point class. */
export class Point {
  constructor(public readonly x = 0, public readonly y = 0) { }

  equals(p: Point) {
    const diffX = Math.abs(this.x - p.x);
    const diffY = Math.abs(this.y - p.y);
    return diffX < 1e-8 && diffY < 1e-8;
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

/** Returns true if the points are collinear. */
export function areCollinear(...points: Point[]) {
  if (points.length < 3) {
    return true;
  }
  const {x: a, y: b} = points[0];
  const {x: m, y: n} = points[1];
  return points.every(({x, y}: Point) => {
    // The points are collinear if the area of the triangle they form
    // is equal (or in this case close to) zero.
    return a * (n - y) + m * (y - b) + x * (b - n) < 1e-8;
  });
}

/** Applies a list of transformation matrices to the specified point. */
export function transform(point: IPoint, ...matrices: Matrix[]): Point {
  return matrices.reduce((p: Point, m: Matrix) => {
    // [a c e]   [p.x]
    // [b d f] * [p.y]
    // [0 0 1]   [ 1 ]
    return new Point(
      m.a * p.x + m.c * p.y + m.e * 1,
      m.b * p.x + m.d * p.y + m.f * 1,
    );
  }, new Point(point.x, point.y));
}

/** Calculates the distance between two points. */
export function distance(p1: IPoint, p2: IPoint) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/** Returns the floor modulus of the integer argument. */
export function floorMod(num, maxNum) {
  return ((num % maxNum) + maxNum) % maxNum;
}

export function flattenTransforms(matricies: Matrix[]) {
  return matricies.reduce((prev, curr) => curr.dot(prev), new Matrix());
}

/** An immutable Matrix class that uses the standard SVG transformation matrix notation. */
export class Matrix {
  constructor(
    public readonly a = 1,
    public readonly b = 0,
    public readonly c = 0,
    public readonly d = 1,
    public readonly e = 0,
    public readonly f = 0) { }

  /** Returns the dot product of this 2D transformation matrices with m. */
  dot(m: Matrix) {
    // [a c e]   [a' c' e']
    // [b d f] * [b' d' f']
    // [0 0 1]   [0  0  1 ]
    return new Matrix(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f,
    );
  }

  /** Returns the inverse of this transformation matrix. */
  invert() {
    const m = this;
    return new Matrix(
      m.d / (m.a * m.d - m.b * m.c),
      m.b / (m.b * m.c - m.a * m.d),
      m.c / (m.b * m.c - m.a * m.d),
      m.a / (m.a * m.d - m.b * m.c),
      (m.d * m.e - m.c * m.f) / (m.b * m.c - m.a * m.d),
      (m.b * m.e - m.a * m.f) / (m.a * m.d - m.b * m.c),
    );
  }

  getScale() {
    // Given unit vectors A = (0, 1) and B = (1, 0).
    // After matrix mapping, we got A' and B'. Let theta = the angle b/t A' and B'.
    // Therefore, the final scale we want is min(|A'| * sin(theta), |B'| * sin(theta)),
    // which is (|A'| * |B'| * sin(theta)) / max (|A'|, |B'|);
    // If max (|A'|, |B'|) = 0, that means either x or y has a scale of 0.
    //
    // For non-skew case, which is most of the cases, matrix scale is computing exactly the
    // scale on x and y axis, and take the minimal of these two.
    // For skew case, an unit square will mapped to a parallelogram. And this function will
    // return the minimal height of the 2 bases.

    const matrix = new Matrix(this.a, this.b, this.c, this.d, 0, 0);
    const vecA = transform({ x: 0, y: 1 }, matrix);
    const vecB = transform({ x: 1, y: 0 }, matrix);
    const scaleX = Math.hypot(vecA.x, vecA.y);
    const scaleY = Math.hypot(vecB.x, vecB.y);
    const crossProduct = vecA.y * vecB.x - vecA.x * vecB.y;
    const maxScale = Math.max(scaleX, scaleY);
    return maxScale > 0 ? Math.abs(crossProduct) / maxScale : 0;
  }
}

/** A simple rectangle container class. */
export class Rect {
  constructor(
    public l = 0,
    public t = 0,
    public r = 0,
    public b = 0) { }
}

/** Linearly interpolate between point a and point b using time t. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
