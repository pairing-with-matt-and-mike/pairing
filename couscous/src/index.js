class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Constraint {
    constructor(p, q, minLength, maxLength) {
        this.p = p;
        this.q = q;
        this.minLength = minLength;
        this.maxLength = maxLength;
    }
}

class Blob {
    constructor() {
        this.hullPoints = [
            new Point(50, 50),
            new Point(40, 75),
            new Point(50, 100),
            new Point(75, 105),
            new Point(100, 100),
            new Point(110, 75),
            new Point(100, 50),
            new Point(75, 40),
        ];
        this.centerPoint = new Point(75, 75);
        this.points = [...this.hullPoints, this.centerPoint];
        this.constraints = [
            ...this.hullPoints.map((point, i) => {
                return new Constraint(i, (i+3) % this.hullPoints.length);
            }),
            ...this.hullPoints.map((point, i) => {
                return new Constraint(i, this.points.length - 1);
            }),
        ];
    }

    draw() {
        noFill();
        strokeWeight(1);
        stroke(200, 0, 0);
        for (let [a, b, c, d] of slidingTuples(this.hullPoints, 4)) {
            curve(a.x, a.y,
                  b.x, b.y,
                  c.x, c.y,
                  d.x, d.y);
        }
        stroke(0, 0, 150);
        for (let i = 0; i < this.constraints.length; i++) {
            const { p, q } = this.constraints[i];
            const a = this.points[p];
            const b = this.points[q];
            line(a.x, a.y, b.x, b.y);
        }
        stroke(0, 150, 150);
        strokeWeight(5);
        this.points.map(p => {
            point(p.x, p.y);
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

let blob = new Blob();

function setup() {
    createCanvas(400, 400);
    console.log("setup");
}

function draw() {
    background(220);
    blob.draw();
}

window.setup = setup;
window.draw = draw;
