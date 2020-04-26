var svg = document.getElementsByTagName("svg")[0];

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  mul(s) {
    return new Vector(this.x * s, this.y * s);
  }

  sub(v) {
    return new Vector(this.x - v.x, this.y - v.y);
  }
}

let nextUniqueId = 7;

function uniqueId() {
  return nextUniqueId++;
}

const fudge = 10000;

class OrbitalObject {
  constructor(
    color,
    position,
    velocity,
    mass,
    id = "orbital-object-" + uniqueId()
  ) {
    this.color = color;
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    this.mass = mass;
  }

  tick(ops) {
    // pseudo
    // a = (m2)/r^2
    const dv = ops.reduce((acc, op) => {
      const dir = op.position.sub(this.position);
      const distance = dir.magnitude();
      const unitDir = dir.mul(1 / distance);
      const dSpeed = op.mass / distance ** 2;
      const dVelocity = unitDir.mul(dSpeed);
      return acc.add(dVelocity);
    }, new Vector(0, 0));

    return new OrbitalObject(
      this.color,
      this.velocity.mul(1 / fudge).add(this.position),
      this.velocity.add(dv.mul(1 / fudge)),
      this.mass,
      this.id
    );
  }

  render() {
    let element = document.getElementById(this.id);
    if (!element || Math.random() < 0.01) {
      element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      element.setAttribute("r", Math.min(this.mass ** (1 / 3), 25));
      element.setAttribute("id", this.id);
      element.setAttribute("fill", this.color);
      svg.appendChild(element);
    }
    element.setAttribute("cx", this.position.x);
    element.setAttribute("cy", this.position.y);
  }
}

const midX = window.innerWidth / 2;
const midY = window.innerHeight / 2;

const sunM = 1000000;
const earthM = 1000;
const venusM = 200;
const marsM = 200;
const moonM = 100;

const earthDistance = 500;
const venusDistance = 300;
const moonDistance = 20;
const marsDistance = 700;

var planets = [
  new OrbitalObject(
    "orange",
    new Vector(midX, midY),
    new Vector(-0.04472, 0),
    sunM
  ),
  new OrbitalObject(
    "blue",
    new Vector(midX, midY - earthDistance),
    new Vector(
      Math.sqrt(
        sunM /
          ((earthM * earthDistance + moonM * moonDistance) / (earthM + moonM))
      ),
      -Math.sqrt(moonM / moonDistance) * (moonM / (earthM + moonM))
    ),
    earthM
  ),
  new OrbitalObject(
    "grey",
    new Vector(midX + moonDistance, midY - earthDistance),
    new Vector(
      Math.sqrt(
        sunM /
          ((earthM * earthDistance + moonM * moonDistance) / (earthM + moonM))
      ),
      Math.sqrt(earthM / moonDistance) * (earthM / (earthM + moonM))
    ),
    moonM
  ),
  new OrbitalObject(
    "purple",
    new Vector(midX - venusDistance, midY),
    new Vector(0, -Math.sqrt(sunM / venusDistance)),
    moonM
  ),
  new OrbitalObject(
    "red",
    new Vector(midX + marsDistance, midY),
    new Vector(0, Math.sqrt(sunM / marsDistance)),
    marsM
  ),
];
//new OrbitalObject("orange", new Vector(midX, midY), new Vector(0, 0), 1000),
//new OrbitalObject("blue", new Vector(midX, midY - 100), new Vector(3, 0), 25),
//new OrbitalObject("grey", new Vector(midX, midY + 200), new Vector(-2, 0), 1),

for (var planet of planets) {
  planet.render();
}

var t = Date.now();

setInterval(function () {
  var dt = Date.now() - t;

  for (var i = 0; i < fudge / 100; i++) {
    planets = planets.map((p) => {
      var ops = planets.filter((op) => op.id !== p.id);
      return p.tick(ops);
    });
  }
  for (var planet of planets) {
    planet.render();
  }
}, 1000 / (60 * fudge));
