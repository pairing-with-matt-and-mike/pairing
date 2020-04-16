var fs = require("fs");

function readLifeForm() {
    var contents = fs.readFileSync("in", "utf8");
    var lines = contents.split("\n").map(function(line) {
        return line.split("").map(function(character) {
            return character !== " ";
        });
    });
    return lines;
}

function readGrid() {
    var lifeForm = readLifeForm();

    var height = 25;
    var width = 80;

    return range(height).map(function(_, rowIndex) {
        var lifeFormLine = lifeForm[rowIndex - Math.floor((height - lifeForm.length) / 2)] || [];
        return range(width).map(function(_, columnIndex) {
            return lifeFormLine[columnIndex - Math.floor((width - lifeForm[0].length) / 2)];
        });
    });
}

function range(max) {
    var result = [];
    for (var i = 0; i < max; i++) {
        result.push(i);
    }
    return result;
}

function run(lines) {
    var grid = readGrid();
    setInterval(function() {
        render(grid);
        grid = step(grid);
    }, 100);
}

function render(grid) {
    process.stdout.write("\033\[2J");
    console.log(grid.map(renderLine).join("\n"));
}

function renderLine(l) {
    return l.map(function(c) { return c ? "#" : "."; }).join("");
}

function step(grid) {
    return grid.map(function(line, rowIndex) {
        return line.map(function(cell, columnIndex) {
            var neighbours = countAliveNeighbours(grid, rowIndex, columnIndex);
            return (cell && neighbours == 2) || neighbours == 3;
        });
    });
}

function countAliveNeighbours(grid, rowIndex, columnIndex) {
    var count = 0;
    for (var i = rowIndex - 1; i <= rowIndex + 1; i++) {
        for (var j = columnIndex - 1; j <= columnIndex + 1; j++) {
            if (!(i == rowIndex && j == columnIndex) && getInGrid(grid, i, j)) {
                count++;
            }
        }
    }
    return count;
}

function getInGrid(grid, i, j) {
    var height = grid.length;
    var width = grid[0].length;
    return grid[(i + height) % height][(j + width) % width];
}

run();
