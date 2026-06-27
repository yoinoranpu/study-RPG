from PIL import Image, ImageDraw
import os

base = os.path.dirname(os.path.abspath(__file__))
icons_dir = os.path.join(base, 'public', 'icons')

for s in [192, 512]:
    img = Image.new('RGB', (s, s), '#06060f')
    draw = ImageDraw.Draw(img)
    draw.ellipse([s//4, s//4, s*3//4, s*3//4], fill='#a78bfa')
    path = os.path.join(icons_dir, f'icon-{s}.png')
    img.save(path)
    print(f'saved: {path}')

print('done')