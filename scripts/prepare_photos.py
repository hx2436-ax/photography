#!/usr/bin/env python3
"""Export sRGB, EXIF-free responsive WebP images and a gallery manifest.
Install Pillow, then run --help. No network calls or credentials required.
"""
import argparse, hashlib, io, json, re
from pathlib import Path
from PIL import Image, ImageCms, ImageOps

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('input',type=Path,help='Folder containing JPG, PNG, TIFF or WebP files')
    p.add_argument('--output',type=Path,default=Path('exports'))
    p.add_argument('--base-url',required=True,help='Public CDN directory, e.g. https://images.example.com/photography')
    p.add_argument('--series',required=True)
    p.add_argument('--manifest',type=Path,default=Path('exports/photos.json'))
    a=p.parse_args()
    if not a.base_url.startswith('https://'):p.error('--base-url must use HTTPS')
    files=sorted(x for x in a.input.iterdir() if x.suffix.lower() in {'.jpg','.jpeg','.png','.tif','.tiff','.webp'})
    if not files:p.error('No supported image files found')
    a.output.mkdir(parents=True,exist_ok=True);photos=[]
    srgb=ImageCms.createProfile('sRGB')
    for source in files:
        with Image.open(source) as original:
            im=ImageOps.exif_transpose(original)
            if im.info.get('icc_profile'):
                im=ImageCms.profileToProfile(im,ImageCms.ImageCmsProfile(io.BytesIO(im.info['icc_profile'])),srgb,outputMode='RGB')
            else:im=im.convert('RGB')
            # Versioned names prevent stale CDN images after re-editing.
            name=(re.sub(r'[^a-zA-Z0-9_-]+','-',source.stem).strip('-') or 'photo')+'-'+hashlib.sha256(source.read_bytes()).hexdigest()[:12]
            widths=sorted(set(min(w,im.width) for w in (480,960,1600,2560,3200)))
            variants=[]
            for width in widths:
                size=(width,max(1,round(im.height*width/im.width)))
                export=im.resize(size,Image.Resampling.LANCZOS)
                # No EXIF, GPS or source metadata is passed to the export.
                filename=f'{name}-{width}.webp'
                export.save(a.output/filename,'WEBP',quality=90,method=6,exif=b'',icc_profile=b'')
                variants.append({'url':a.base_url.rstrip('/')+'/'+filename,'width':width})
            photos.append({'id':name,'title':source.stem,'alt':source.stem,'series':a.series,'width':im.width,'height':im.height,'src':variants[-1]['url'],'thumbnail':variants[0]['url'],'full':variants[-1]['url'],'variants':variants})
    a.manifest.parent.mkdir(parents=True,exist_ok=True)
    a.manifest.write_text(json.dumps({'photos':photos},indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Exported {len(photos)} photos; edit titles and alt text in {a.manifest}.')
if __name__=='__main__':main()
