import sys
from itertools import product
from datetime import datetime
from statistics import median

from PIL import Image

histogram_width = 50
darkness_fuzziness = (3 * 255) * 100

def main():
    image = Image.open(sys.argv[1])
    print(image.format, image.size, image.mode)
    width, height = image.size
    max_darkness = 3 * 255 * width
    image_rgb = image.convert("RGB")
    output_image = image_rgb.copy()

    max_seen_darkness = 0

    def get_darkness(y):
        return sum(
            (3 * 255) - sum(image_rgb.getpixel((x, y)))
            for x in range(width)
        )
    
    for y in range(height):
        darkness = get_darkness(y)
        scaled_darkness = int(darkness / max_darkness * histogram_width)
        for hx in range(scaled_darkness):
            output_image.putpixel((hx, y), (255, 0, 0))

        if darkness > max_seen_darkness:
            max_seen_darkness = darkness

    stave_line_ys = list(filter(
        lambda y: get_darkness(y) >= max_seen_darkness - darkness_fuzziness,
        range(height),
    ))
    gaps = map(
        lambda y1, y2: y2 - y1,
        stave_line_ys,
        stave_line_ys[1:]
    )
    median_gap = median(gaps)
    for i in range(0, len(stave_line_ys) - 4):
        if all(
                median_gap - 1 <=
                stave_line_ys[i + j + 1] - stave_line_ys[i + j]
                <= median_gap + 1
                for j in range(0, 4)
        ):
            for y in range(stave_line_ys[i], stave_line_ys[i + 4] + 1):
                for x in range(-2, 3):
                    output_image.putpixel((78 + x, y), (0, 100, 0))
    
    output_image.save("output-" + datetime.utcnow().isoformat() + ".png")


if __name__ == "__main__":
    main()
