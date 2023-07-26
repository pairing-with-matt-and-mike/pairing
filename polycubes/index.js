function main(sz) {

    console.log(sz);

    const polys = createPolys(sz)
          .map(poly => serialise(poly).split("\n"));

    polys.sort((a, b) => a.length - b.length);

    console.log(`Found ${polys.length}`);

    for (const chunk of chunked(polys, 6)) {
        console.log();

        const polysAsRows = chunk;
        const maxHeight = Math.max(
            ...polysAsRows.map(polyAsRows => polyAsRows.length)
        );

        for (let rowIndex = 0; rowIndex < maxHeight; rowIndex++) {
            let row = "";
            for (const polyAsRow of polysAsRows) {
                row += polyAsRow[rowIndex] || " ".repeat(polyAsRow[0].length);
                row += "     ";
            }
            console.log(row);
            //console.log(serialise(poly));
        }
    }
}

function chunked(array, chunkSize) {
    const result = [];
    let current;

    for (let i = 0; i < array.length; i++) {
        if (i % chunkSize === 0) {
            current = [];
            result.push(current);
        }
        current.push(array[i]);
    }

    return result;
}

function step(grid, options, r, results) {
    for (var [x, y] of options) {
        if (x < 0 || y < 0 || grid[x][y] === 1) {
            continue;
        }

        grid[x][y] = 1;

        if (r === 1) {
            results.add(grid);
        } else {
            var nextOptions = [
                ...options,
                [x + 1, y],
                [x, y + 1],
                [x - 1, y],
                [x, y - 1],
            ];
            step(grid, nextOptions, r - 1, results);
        }

        grid[x][y] = 0;
    }
}

function createPolys(count) {
    const start = Math.floor((count - 1) / 4);
    var poly = emptyPoly(count + start);
    var results = new Results();
    step(poly, [[start, start]], count, results);

    return results.get();
}

function serialise(grid) {
    let spacingAtStart = grid.length;
    let spacingAtEnd = 0;

    for (const o of grid) {
        const i = o.indexOf(1);
        const j = o.lastIndexOf(1);
        if (i !== -1) {
            spacingAtStart = Math.min(i, spacingAtStart);
            spacingAtEnd = Math.max(j, spacingAtEnd);
        }
    }

    return grid
        .filter(o => o.some(c => c === 1))
        .map(o => o
             .map(x => x === 1 ? "#" : " ")
             .join("")
             .substring(spacingAtStart, spacingAtEnd + 1))
        .join("\n");
}

function repeat(value, length) {
    return Array.from({length}).map(() => value());
}

class Results {
    constructor() {
        this.rotations = new Set();
        this.results = [];
    }

    add(result) {
        const serialised = serialise(result);
        if (this.rotations.has(serialised)) {
            return;
        }
        this.results.push(result.map(o => [...o]));

        for (const rotation of rotations(result)) {
            this.rotations.add(serialise(rotation));
        }
    }

    get() {
        return this.results;
    }
}

function rotations(poly) {
    const poly2 = rotate(poly);
    const poly3 = rotate(poly2);
    const poly4 = rotate(poly3);
    return [poly, poly2, poly3, poly4];
}

function rotate(poly) {
    const rotated = emptyPoly(poly.length);

    for (let x = 0; x < poly.length; x++) {
        for (let y = 0; y < poly.length; y++) {
            rotated[y][poly.length - x - 1] = poly[x][y];
        }
    }

    return rotated;
}

function emptyPoly(size) {
    return repeat(() => repeat(() => 0, size), size);
}

main(parseInt(process.argv[2]));
