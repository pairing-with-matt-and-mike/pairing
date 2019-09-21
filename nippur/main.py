import sys
from itertools import product
from datetime import datetime

from PIL import Image

histogram_width = 50

def main():
    image = Image.open(sys.argv[1])
    print(image.format, image.size, image.mode)
    width, height = image.size
    max_total = 3 * 255 * width
    image_rgb = image.convert("RGB")
    for y in range(height):
        total = sum(
            (3 * 255) - sum(image_rgb.getpixel((x, y)))
            for x in range(width)
        )
        scaled_total = int(total / max_total * histogram_width)
        for hx in range(scaled_total):
            image_rgb.putpixel((hx, y), (255, 0, 0))
    image_rgb.save("output-" + datetime.utcnow().isoformat() + ".png")

if __name__ == "__main__":
    main()
