var svgSelection = d3.select("svg");

// var circleSelection = svgSelection
//   .append("circle")
//   .attr("cx", 25)
//   .attr("cy", 25)
//   .attr("r", 25)
//   .style("fill", "purple");

let seed = d3.randomUniform()();
let preseed = window.location.hash.substring(1);
if (preseed != "random") {
  if (preseed) {
    seed = parseFloat(preseed);
  } else {
    window.location.hash = `#${seed}`;
  }
}

const source = d3.randomLcg(seed);
const randomInt = d3.randomInt.source(source);
const randomNormal = d3.randomNormal.source(source);

function randomChoice(options) {
  let r = randomNormal(0.5, 0.3)();
  if (r < 0 || r >= 1) {
    return options[randomInt(0, options.length)()];
  } else {
    return options[Math.floor(options.length * r)];
  }
}

console.log("seed", seed);

const width = 100;
const height = 100;

const padding = 1;
const squareWidth = 10;

const grid = repeat(() => repeat(() => ({ type: "room" }), height), width);
const view = initView();

function onGrid([i, j]) {
  return i >= 0 && i < width && j >= 0 && j < height;
}

function adjacent(x, y) {
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ].filter(onGrid);
}

function neighbours(x, y) {
  let results = [];
  for (let i = x - 1; i <= x + 1; i++) {
    for (let j = y - 1; j <= y + 1; j++) {
      if (!onGrid([i, j]) || (i === x && j === y)) {
        continue;
      }
      results.push([i, j]);
    }
  }
  return results;
}

function countAdjacent([x, y], type) {
  return adjacent(x, y).filter(([x, y]) => grid[x][y].type === type).length;
}

function countNeighbours(x, y, type) {
  return neighbours(x, y).filter(([x, y]) => grid[x][y].type === type).length;
}

async function generate() {
  splitRoom(xAxis, yAxis, {
    minX: 0,
    maxX: width,
    minY: 0,
    maxY: height,
    depth: 0,
  });
}

const xAxis = {
  max: ({ maxX }) => maxX,
  min: ({ minX }) => minX,

  set: (grid, x, y, value) => (grid[x][y] = value),

  toXY: (x, y) => [x, y],

  updateArgs: (args, { max, min, depth }) => {
    args = { ...args };
    if (max !== undefined) {
      args.maxX = max;
    }
    if (min !== undefined) {
      args.minX = min;
    }

    args.depth = depth;
    return args;
  },
};

const yAxis = {
  max: ({ maxY }) => maxY,
  min: ({ minY }) => minY,

  set: (grid, y, x, value) => (grid[x][y] = value),

  toXY: (y, x) => [x, y],

  updateArgs: (args, { max, min, depth }) => {
    args = { ...args };
    if (max !== undefined) {
      args.maxY = max;
    }
    if (min !== undefined) {
      args.minY = min;
    }

    args.depth = depth;
    return args;
  },
};

async function splitRoom(axis1, axis2, args) {
  // axis1 = y
  // axis2 = x
  if (axis1.max(args) - axis1.min(args) < 3) {
    return;
  }

  const { depth } = args;

  await sleep(10);

  const options = [];
  for (let p = axis1.min(args) + 1; p < axis1.max(args) - 1; p++) {
    if (
      countAdjacent(axis2.toXY(axis2.min(args), p), "door") +
        countAdjacent(axis2.toXY(axis2.max(args) - 1, p), "door") ===
      0
    ) {
      options.push(p);
    }
  }

  if (options.length === 0) {
    return;
  }

  let wall1 = randomChoice(options);

  for (let p2 = axis2.min(args); p2 < axis2.max(args); p2++) {
    axis1.set(grid, wall1, p2, { depth, type: "wall" });
  }

  const door2 = randomInt(axis2.min(args), axis2.max(args))();
  axis2.set(grid, door2, wall1, { depth, type: "door" });

  view.render();

  if (depth < 5) {
    const [newAxis1a, newAxis2a] =
      0 === randomInt(0, 4)() ? [axis1, axis2] : [axis2, axis1];

    const ap = splitRoom(
      newAxis1a,
      newAxis2a,
      axis1.updateArgs(args, { max: wall1, depth: depth + 1 })
    );

    const [newAxis1b, newAxis2b] =
      0 === randomInt(0, 4)() ? [axis1, axis2] : [axis2, axis1];

    const bp = splitRoom(
      newAxis1b,
      newAxis2b,
      axis1.updateArgs(args, { min: wall1 + 1, depth: depth + 1 })
    );

    await Promise.all([ap, bp]);
  }
}

async function generateWalk() {
  let startTime = Date.now();
  let visited = new Set();
  let x = randomInt(0, width)();
  let y = randomInt(0, height)();
  let n;
  for (n = 0; n < height; n++) {
    visited.add(x + "_" + y);
    grid[x][y].type = "corridor";
    view.render();
    const threshold = randomChoose([2, 2, 2, 2, 3]);
    const possibleNeighbours = adjacent(x, y).filter(
      ([x, y]) =>
        countNeighbours(x, y, "corridor") < threshold &&
        !visited.has(x + "_" + y)
    );
    if (possibleNeighbours.length === 0) {
      break;
    }
    let [next_x, next_y] = randomChoose(possibleNeighbours);
    x = next_x;
    y = next_y;

    await sleep(10);
  }

  let timeTaken = Date.now() - startTime;
  console.log(timeTaken / n);
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(() => resolve(), milliseconds));
}

generate();

view.render();

function initView() {
  let view = repeat(
    () => repeat(() => svgSelection.append("rect"), height),
    width
  );
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      view[x][y]
        .attr("width", squareWidth - padding)
        .attr("height", squareWidth - padding)
        .attr("x", x * squareWidth + padding / 2)
        .attr("y", y * squareWidth + padding / 2);
    }
  }

  function render() {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        view[x][y].style("fill", squareToColor(grid[x][y]));
      }
    }
  }

  return { render };
}

const wallColors = d3.interpolateLab("red", "blue");

function squareToColor(square) {
  switch (square.type) {
    case "room":
      return "grey";
    case "corridor":
      return "red";
    case "door":
      return "green";
    case "wall":
      return wallColors(square.depth / 5);
  }
}

function randomChoose(array) {
  return array[randomInt(0, array.length)()];
}

function repeat(value, times) {
  return Array.from({ length: times }).map(() => value());
}
