# Lists any brochure text that does not appear word for word in the proposal (index.html).
# Run from the repo root: python3 brochure/check_copy.py
import re,html,sys
def txt(s):
    s=re.sub(r'<style\b.*?</style>|<script\b.*?</script>|<svg\b.*?</svg>','',s,flags=re.S)
    s=re.sub(r'<[^>]+>','\n',s); return html.unescape(s)
raw=open('index.html').read()
src=txt(raw)+' '+html.unescape(raw)  # include JS rail leads
src=re.sub(r'\s+',' ',src).replace(' — ',', ').replace(' &mdash; ',', ')
b=txt(open('brochure/agm-hoa-services-brochure.html').read())
allowed={'AGM HOA Services','Penny Lane on 170th Ave NE','AGM Real Estate Group, LLC','agmrealestategroup.com','206.622.8600','12330 Northup Way, Bellevue, WA 98005'}
bad=set()
for line in b.split('\n'):
    for frag in re.split(r'\s*[·|]\s*',line.strip()):
        f=re.sub(r'\s+',' ',frag).strip()
        if not f or f in allowed or re.fullmatch(r'\d\d[A]?',f): continue
        if f not in src: bad.add(f)
print('\n'.join(sorted(bad)) or 'ALL TEXT FOUND IN PROPOSAL')
