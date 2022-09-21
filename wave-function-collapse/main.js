const width = 20
var dim = 32 * width;
let sprites;

const greenTile = {
    source: [6, 3],
    edges: {U: 'G', D: 'G', L: 'G', R: 'G'}};

const greyTile = {source: [5, 3]};

// const TILES = [
//     // Down and Right
//     {source: [0, 0],
//      edges: {U: 'G', D: 'R', L: 'G', R: 'R'}},
//     // Up and Left
//     {source: [7, 0],
//      edges: {U: 'R', D: 'G', L: 'R', R: 'G'}},
//     // Up and Right
//     {source: [6, 1],
//      edges: {U: 'R', D: 'G', L: 'G', R: 'R'}},
//     // Down and Left
//     {source: [2, 2],
//      edges: {U: 'G', D: 'R', L: 'R', R: 'G'}},
//     // Up and Down
//     {source: [6, 0],
//      edges: {U: 'R', D: 'R', L: 'G', R: 'G'}},
//     // Left and Right
//     {source: [4, 3],
//      edges: {U: 'G', D: 'G', L: 'R', R: 'R'}},
//     // Up, Left and Right
//     {source: [7, 1],
//      edges: {U: 'R', D: 'G', L: 'R', R: 'R'}},
//     // Up, Down, Left and Right
//     {source: [5, 2],
//      edges: {U: 'R', D: 'R', L: 'R', R: 'R'}},
//     // R Up, R Down, W Left and W Right
//     {source: [8, 6],
//      edges: {U: 'R', D: 'R', L: 'W', R: 'W'}},
//     // W Up, W Down, R Left and R Right
//     {source: [5, 8],
//      edges: {U: 'W', D: 'W', L: 'R', R: 'R'}},
//     // W Down, W Right
//     {source: [1, 4],
//      edges: {U: 'G', D: 'W', L: 'G', R: 'W'}},
//     // W Up, W Left
//     {source: [2, 4],
//      edges: {U: 'W', D: 'G', L: 'W', R: 'G'}},
//     // W Up, W Right
//     {source: [0, 6],
//      edges: {U: 'W', D: 'G', L: 'G', R: 'W'}},
//     // W Down, W Left
//     {source: [1, 7],
//      edges: {U: 'G', D: 'W', L: 'W', R: 'G'}},
//     // W Up, W Down
//     {source: [8, 3],
//      edges: {U: 'W', D: 'W', L: 'G', R: 'G'}},
//     // W Left, W Right
//     {source: [2, 8],
//      edges: {U: 'G', D: 'G', L: 'W', R: 'W'}},
//     // Green
//     greenTile
// ];

let TILES;
let world;

const unrendered = greyTile;

const defaultTile = {source: [8, 8],
                     edges: {U: 'G', D: 'G', L: 'G', R: 'G'}}

function getEdge(sprites, xIndex, yIndex, d) {
    const xOffset = d === 'R' ? 63 : 0;
    const xPixel = xIndex * 64 + xOffset;
    const width = d === 'U' || d === 'D' ? 64 : 1;
    const yOffset = d === 'D' ? 63 : 0;
    const yPixel = yIndex * 64 + yOffset;
    const height = d === 'L' || d === 'R' ? 64 : 1;

    const edge = sprites.get(xPixel, yPixel, width, height);
    edge.loadPixels();
    return edge.pixels.toString();
}

function preload() {
    sprites = loadImage("spritesheet.png");
    sprites.loadPixels();
}

function setup() {
    createCanvas(dim, dim);

    TILES = [];

    for (let i = 0 ; i < 9 ; i ++) {
        for (let j = 0 ; j < 9 ; j ++) {
            if ((i === 7 || i === 8) && j === 8) continue
            TILES.push({source: [i, j],
                        edges: ['U', 'D', 'L', 'R'].reduce((m, d) => ({[d]: getEdge(sprites, i, j, d), ...m}), {})});
        }
    }

    world = {
        width: width,
        tiles: Array.from({length: width * width}).map(() => ({
            options: TILES,
            render: unrendered,
            resolved: false
        })),
    };

    frameRate(20);
    const seed = false ? 559558 : floor(random(1e6));
    // const seed = 104658; // 816720; //640933; //724062;
    randomSeed(seed);
    console.log(seed);
}

function reverseDirection (d) {
    return d === 'U' ? 'D' :
        d === 'D' ? 'U' :
        d === 'L' ? 'R' :
        'L';
}

function i2xy(i) {
    return [i % width,
            Math.floor(i / width)];
}

function xy2i([x, y]) {
    return y * width + x;
}

function neighbours([x, y]) {
    const ret = [[x, y - 1, 'U'],
                 [x - 1, y, 'L'],
                 [x + 1, y, 'R'],
                 [x, y + 1, 'D']].filter(
                     ([i, j]) => i >= 0 && i < width && j >= 0 && j < width);
    return ret;
}

function step() {
    const cells = findLowestEntropyCells();

    if (cells.length === 0) {
        return;
    }

    for (let {cell, i} of shuffle(cells).slice(0, frameCount === 1 ? 10 : 1)) {
        collapse(i2xy(i), cell);
    }
}

function findLowestEntropyCells() {
    let cells = world.tiles
          .map((cell, i) => ({i, cell}))
          .sort((a, b) => a.cell.options.length - b.cell.options.length)
          .filter(({cell}) => !cell.resolved);

    return cells.filter(({cell: {options}}) => options.length === cells[0].cell.options.length);
}

function collapse(xy, cell) {
    cell.render = cell.options.length === 0 ? defaultTile : random(cell.options);
    cell.options = [cell.render];
    cell.resolved = true;
    // drawTile({x: xy[0], y: xy[1], source: cell.render.source});

    propagate(xy, cell);
}

function propagate(xy, cell) {
    const cellsToPropagate = [{xy, cell}];

    while (cellsToPropagate.length > 0) {
        const {xy, cell} = cellsToPropagate.shift();
        neighbours(xy).forEach(([x, y, d]) => {
            const colours = cell.options.map(option => option.edges[d])
            const hasChanged = resolve([x, y], d, colours);
            if (hasChanged) {
                cellsToPropagate.push({xy: [x, y], cell: world.tiles[xy2i([x, y])]})
            }
        });
    }
}

function resolve(xy, d, colours) {
    const cell = world.tiles[xy2i(xy)];
    if (cell.resolved) {
        return false;
    }
    const edge = reverseDirection(d);
    let newOptions = cell.options.filter(({edges}) => colours.includes(edges[edge]));
    if (cell.options.length === newOptions.length) {
        return false;
    }
    cell.options = newOptions;
    if (newOptions.length === 0) {
        return false;
    }
    return true;
}

function draw() {
    clear();

    let x = 0;
    let y = 0;
    for (let tile of world.tiles) {
        drawTile({x, y, source: tile.render.source});
        x++;
        if (x === world.width) {
            y++;
            x = 0;
        }
    }

    step();
}

function drawTile({x, y, source: [sourceX, sourceY]}) {
    const tileWidth = 32;
    const spriteWidth = 64;
    image(
        sprites,
        x * tileWidth,
        y * tileWidth,
        tileWidth,
        tileWidth,
        sourceX * spriteWidth,
        sourceY * spriteWidth,
        spriteWidth,
        spriteWidth,
    );
}

var originalDate;
function check() {
  fetch(document.getElementById("script-to-reload").src)
    .then(r => {
      var newDate = r.headers.get("Last-Modified")
      if (!originalDate) {
        originalDate = newDate
      }
      if (newDate !== originalDate) {
        location = location;
      } else {
        setTimeout(() => check(), 500);
      }
    });
}

check();
