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

console.log("seed", seed);

console.log(randomInt(0, 10)());

const width = 100;
const height = 100;

const padding = 1;
const squareWidth = 10;

const grid = repeat(() => repeat(() => "room", height), width);
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

function countNeighbours(x, y, type) {
  return neighbours(x, y).filter(([x, y]) => grid[x][y] === type).length;
}

generate();

async function generate() {
  splitRoomVertically({
    minX: 0,
    maxX: width,
    minY: 0,
    maxY: height,
    depth: 0,
  });
}

async function splitRoomVertically({ minX, maxX, minY, maxY, depth }) {
  if (maxX - minX < 3) {
    return;
  }

  await sleep(10);

  let wallX = randomInt(minX + 1, maxX - 1)();

  for (let y = minY; y < maxY; y++) {
    grid[wallX][y] = "wall";
  }

  grid[wallX][randomInt(minY, maxY)()] = "door";

  view.render();

  if (depth < 5) {
    const ap = (
      0 === randomInt(0, 4)() ? splitRoomVertically : splitRoomHorizontally
    )({
      minX,
      maxX: wallX,
      minY,
      maxY,
      depth: depth + 1,
    });
    const bp = (
      0 === randomInt(0, 4)() ? splitRoomVertically : splitRoomHorizontally
    )({
      minX: wallX + 1,
      maxX,
      minY,
      maxY,
      depth: depth + 1,
    });
    await Promise.all([ap, bp]);
  }
}

async function splitRoomHorizontally({ minX, maxX, minY, maxY, depth }) {
  if (maxY - minY < 3) {
    return;
  }

  await sleep(10);

  let wallY = randomInt(minY + 1, maxY - 1)();

  for (let x = minX; x < maxX; x++) {
    grid[x][wallY] = "wall";
  }

  grid[randomInt(minX, maxX)()][wallY] = "door";

  view.render();

  if (depth < 5) {
    const ap = (
      0 === randomInt(0, 4)() ? splitRoomHorizontally : splitRoomVertically
    )({
      minX,
      maxX,
      minY,
      maxY: wallY,
      depth: depth + 1,
    });
    const bp = (
      0 === randomInt(0, 4)() ? splitRoomHorizontally : splitRoomVertically
    )({
      minX,
      maxX,
      minY: wallY + 1,
      maxY,
      depth: depth + 1,
    });
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
    grid[x][y] = "corridor";
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
  //    return view;

  function render() {
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        view[x][y].style("fill", squareToColor(grid[x][y]));
      }
    }
  }

  return { render };
}

function squareToColor(square) {
  switch (square) {
    case "room":
      return "grey";
    case "corridor":
      return "red";
    case "door":
      return "grey";
    case "wall":
      return "purple";
  }
}

function randomChoose(array) {
  return array[randomInt(0, array.length)()];
}

function repeat(value, times) {
  return Array.from({ length: times }).map(() => value());
}
