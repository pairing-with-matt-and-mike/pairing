// start: F
// rules: F->FF
// n: 6

// draw("F+[[X]-X]-F");

//draw("F", {"F": ["F", "F"]}, 6);

const path = expandN("X", 6);
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
  "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1"
     width="600" height="600">
  <path stroke="#3c3" stroke-width="1px" d="${drawPath(path)}" />
</svg>
`;

console.log(svg);

function drawPath(value) {
  let position = { x: 100, y: 600 };
  let angle = (30 / 180) * Math.PI;
  let stack = [];

  return value
    .split("")
    .map(command => {
      switch (command) {
        case "F":
          const { x, y } = position;
          const dx = Math.sin(angle) * 3;
          const dy = -Math.cos(angle) * 3;
          const path = `M ${x},${y} l ${dx},${dy}`;
          position = addPosition(position, { x: dx, y: dy });
          return path;
        case "+":
          angle -= (25 / 180) * Math.PI;
          return "";
        case "-":
          angle += (25 / 180) * Math.PI;
          return "";
        case "[":
          stack.push({ position, angle });
          return "";
        case "]":
          ({ position, angle } = stack.pop());
          return "";
      }
    })
    .join(" ");
}

function addPosition(left, right) {
  return { x: left.x + right.x, y: left.y + right.y };
}

function expandN(value, n) {
  for (let x = 0; x < n; x++) {
    value = expand(value);
  }
  return value;
}

function expand(value) {
  return value.replace(/F/g, "FF").replace(/X/g, "F+[[X]-X]-F[-FX]+X");
}
