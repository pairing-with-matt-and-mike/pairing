var svgSelection = d3.select("svg");

// var circleSelection = svgSelection
//   .append("circle")
//   .attr("cx", 25)
//   .attr("cy", 25)
//   .attr("r", 25)
//   .style("fill", "purple");

const width = 100;
const height = 100;

const padding = 4;
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
  let startTime = Date.now();
  let visited = new Set();
  let x = d3.randomInt(0, width)();
  let y = d3.randomInt(0, height)();
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
  }
}

function randomChoose(array) {
  return array[d3.randomInt(0, array.length)()];
}

function repeat(value, times) {
  return Array.from({ length: times }).map(() => value());
}
