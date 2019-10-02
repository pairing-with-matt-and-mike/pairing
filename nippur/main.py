import sys
from itertools import product
from statistics import median

from PIL import Image

histogram_width = 50
darkness_fuzziness = 100

def main():
    filename = sys.argv[1]
    image = Image.open(filename)
    print(image.format, image.size, image.mode)
    width, height = image.size
    max_darkness = width
    image_rgb = image.convert("RGB")
    output_image = image_rgb.copy()

    def is_dark(lightness):
        if lightness >= 2 * 255:
            return 0
        else:
            return 1
    
    def get_darkness(y):
        length = 0
        longest = 0
        for x in range(width):
            if is_dark(sum(image_rgb.getpixel((x, y)))):
                length += 1
            else:
                longest = max(longest, length)
                length = 0

        return longest
    
    darknesses = [get_darkness(y) for y in range(height)]

    max_seen_darkness = max(darknesses)

    def is_stave_line(y):
        return darknesses[y] >= max_seen_darkness / 2 and \
            not is_stave_line(y - 1)
    
    for y in range(height):
        scaled_darkness = int(darknesses[y] / max_darkness * histogram_width)
        for hx in range(scaled_darkness):
            output_image.putpixel(
                (hx, y),
                (255, 0, 0) if is_stave_line(y) else (0, 0, 255)
            )

    stave_line_ys = list(filter(
        is_stave_line,
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
    
    output_image.save(filename + "-output.png")


if __name__ == "__main__":
    main()
