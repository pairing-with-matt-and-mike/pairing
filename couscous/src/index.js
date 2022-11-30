import "p5";

class Vec {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    clone() {
        return new Vec(this.x, this.y);
    }

    scale(s) {
        this.x *= s;
        this.y *= s;
    }

    setMagnitude(m) {
        const currentMagnitude = (this.x ** 2 + this.y ** 2) ** 0.5;
        const scaleFactor = m / currentMagnitude;
        this.scale(scaleFactor);
    }
}

class Point {
    constructor(x, y) {
        this.pos = new Vec(x, y);
        this.prevPos = this.pos;
    }

    static fromPolar(offset, angle, radius) {
        const x = Math.sin(angle) * radius;
        const y = Math.cos(angle) * radius;
        return new Point(offset.x + x, offset.y + y);
    }

    move(acceleration) {
        const dt = 1;
        const friction = 0;

        const dtdt = dt * dt;

        const xA = acceleration.x;
        const xC = this.pos.x;
        const xT = (2 - friction) * xC - (1 - friction) * this.prevPos.x + xA * dtdt;

        const yA = acceleration.y;
        const yC = this.pos.y;
        const yT = (2 - friction) * yC - (1 - friction) * this.prevPos.y + yA * dtdt;

        this.prevPos = this.pos.clone();
        this.pos = new Vec(xT, yT);
        this.pos.x = clamp(0, this.pos.x, width);
        this.pos.y = clamp(0, this.pos.y, height);
    }
}

function clamp(min, value, max) {
    return Math.min(Math.max(min, value), max);
}

class Constraint {
    constructor(p, q, minLength, maxLength) {
        this.p = p;
        this.q = q;
        this.minLength = minLength;
        this.maxLength = maxLength;
    }

    constrain(points) {
        const a = points[this.p];
        const b = points[this.q];
        const delta = b.pos.clone();
        delta.sub(a.pos);

	    const dotprod = delta.dot(delta);

	    const kmin = this.minLength * this.minLength;

	    if (dotprod < kmin) {
		    const scaleFactor = kmin / (dotprod + kmin) - 0.5;
		    delta.scale(scaleFactor);
		    a.pos.sub(delta);
		    b.pos.add(delta);
	    }

	    const kmax = this.maxLength * this.maxLength;
	    if (dotprod > kmax) {
		    const scaleFactor = kmax / (dotprod + kmax) - 0.5;
		    delta.scale(scaleFactor);
		    a.pos.sub(delta);
		    b.pos.add(delta);
	    }
    }
}

class Blob {
    constructor(centre, radius) {
        const freedom = 0.009;
        const bigConstraintLength = 2 * Math.cos(22.5 / 180 * Math.PI) * radius;

        this.hullPoints = new Array(8).fill(0).map((_, i) => i * (2*Math.PI/8)).map((angle) => Point.fromPolar(centre, angle, radius));

        this.centerPoint = new Point(centre.x, centre.y);
        this.radius = radius;
        this.points = [...this.hullPoints, this.centerPoint];
        this.constraints = [
            ...this.hullPoints.map((point, i) => {
                return new Constraint(i, (i+3) % this.hullPoints.length,
                                      bigConstraintLength * (1 - freedom),
                                      bigConstraintLength * (1 + freedom));
            }),
            ...this.hullPoints.map((point, i) => {
                return new Constraint(i, this.points.length - 1,
                                      radius * (1 - freedom),
                                      radius * (1 + freedom));
            }),
        ];
    }

    repel(blob) {
        const pos = this.centerPoint.pos.clone();
        pos.sub(blob.centerPoint.pos);

        const minDistance = this.radius + blob.radius;
        const currentDistance = (pos.x ** 2 + pos.y ** 2) ** 0.5;
        const distanceToMove = (minDistance - currentDistance) / 2;

        if (currentDistance < minDistance) {
            const offset = pos.clone();
            offset.setMagnitude(distanceToMove);
            this.centerPoint.pos.add(offset);
            blob.centerPoint.pos.sub(offset);
        }
    }

    draw() {
        noFill();
        strokeWeight(1);
        stroke(200, 0, 0);
        for (let [a, b, c, d] of slidingTuples(this.hullPoints, 4)) {
            curve(a.pos.x, a.pos.y,
                  b.pos.x, b.pos.y,
                  c.pos.x, c.pos.y,
                  d.pos.x, d.pos.y);
        }

        // render supports
        stroke(0, 0, 150);
        for (let i = 0; i < this.constraints.length; i++) {
            const { p, q } = this.constraints[i];
            const a = this.points[p];
            const b = this.points[q];
            line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
        }
        stroke(0, 150, 150);
        strokeWeight(5);
        this.points.map(p => {
            point(p.pos.x, p.pos.y);
        });
    }

    constrain() {
        for (let i = 0; i < this.constraints.length; i++) {
            this.constraints[i].constrain(this.points);
        }
    }

    move(acceleration) {
        this.points.forEach((p) => p.move(acceleration));
    }

    spawn() {
        const offsets = [new Vec(20, 10), new Vec(-20, -10)];
        return offsets.map(offset => {
            const centre = offset;
            centre.add(this.centerPoint.pos);
            return new Blob(centre, this.radius / 1.1);
        })
    }
}

function* slidingTuples(xs, width = 2) {
    for (let i = 0; i < xs.length; i++) {
        const ret = [];
        for (let j = 0; j < width; j++) {
            ret.push(xs[(i + j) % xs.length]);
        }
        yield ret;
    }
}

let blobs = [new Blob(new Vec(150, 50), 35)];
let gravity = new Vec(0, 0.01);

let slider;

const height = 400;
const width = 400;

function setup() {
    slider = createSlider(-0.1, 0.1, 0.01, 0.001);
    slider.position(0, 0);
    createCanvas(width, height);
    frameRate(200);
}

function draw() {
    gravity = new Vec(0, slider.value());
    background(220);

    blobs.forEach((b1, i1) => {
        blobs.forEach((b2, i2) => {
            if (i1 === i2) return;

            b1.repel(b2);
        })
    })

    blobs.forEach((b) => {
        b.draw();
        b.constrain();
        b.move(gravity);
    });
}

function keyTyped() {
    const [mother, child] = blobs.shift().spawn();
    mother.move(new Vec(0.1, 0));
    child.move(new Vec(-0.1, 0));
    blobs.push(mother, child);
}

window.draw = draw;
window.keyTyped = keyTyped;
window.setup = setup;
