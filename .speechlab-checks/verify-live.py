"""Read-only public-site verification after the approved candidate is published."""
from pathlib import Path
from urllib.request import urlopen,Request
from playwright.sync_api import sync_playwright
import hashlib,json,os,time
BASE='https://korytnikhub.pro/sound/'
KEY='v1.6.3-20261015-02'
OUT=Path(os.environ['RUNNER_TEMP'])/'speechlab-live';OUT.mkdir(exist_ok=True)
EXPECTED={'app-core.js':'a09be849fbaf9948e40ae3f4d3a267ecb07c91e1','index.html':'7ad79fb7297338e9441230f319fbd88c10170b94','app.js':'dc394cd3246fb4402cd5e975f5a0dbd17286c2a7','transcription-worker.js':'4f9ba4450c13f22fa80ea7b0d7467235510f133d','transcription-runtime.js':'c2e7ac9522e2e7a5637ccef806073a77b66823fd','transcription-engine.js':'0d58a9c30fed9390b33c56e357a3bf53116594dc'}
def get(url):
    with urlopen(Request(url,headers={'User-Agent':'SpeechLab-approved-verification','Cache-Control':'no-cache'}),timeout=30) as r:return r.read()
def sha(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
report={'url':BASE,'build':KEY,'scope':'Actual public site, real Whisper weights, public human-speech fixtures, CPU/WASM; no physical GPU or private user recording.','files':{},'tests':[],'browser_errors':[]}
try:
    deadline=time.monotonic()+600
    while True:
        try:
            values={name:sha(get(BASE+name+'?verify='+KEY+'&t='+str(int(time.time())))) for name in EXPECTED}
            if values==EXPECTED:report['files']=values;break
            print('Awaiting approved main publication and Pages propagation',flush=True)
        except Exception as e:print('Awaiting public files:',str(e),flush=True)
        if time.monotonic()>deadline:raise TimeoutError('Public site did not serve all six approved files within 10 minutes')
        time.sleep(10)
    print('PUBLIC_FILE_HASHES_MATCH',json.dumps(report['files']),flush=True)
    fixtures={}
    for name in ['jfk.wav','russian-audio.wav']:
        file=OUT/name
        file.write_bytes(get('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/'+name))
        fixtures[name]=file
    assert hashlib.sha256(fixtures['jfk.wav'].read_bytes()).hexdigest()=='aa81c2552465568567e670f3823117e633900d16bd6202346a72f3c8464c74c8'
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-gpu'])
        page=browser.new_page(viewport={'width':1440,'height':1100},accept_downloads=True)
        page.add_init_script("Object.defineProperty(navigator,'gpu',{get:()=>undefined,configurable:true});window.__speechEvents=[];const NativeWorker=window.Worker;window.Worker=class extends NativeWorker{constructor(...args){super(...args);this.addEventListener('message',e=>window.__speechEvents.push(e.data));}}")
        page.on('pageerror',lambda e:report['browser_errors'].append(str(e)))
        page.goto(BASE+'?build='+KEY,wait_until='networkidle',timeout=60000)
        page.wait_for_function("document.querySelector('#appVersion').textContent==='v1.6.3'")
        page.locator('#fileModeBtn').click()
        trials=[('tiny-english','jfk.wav','english','onnx-community/whisper-tiny','fast'),('auto-russian','russian-audio.wav','russian','auto','auto'),('base-english-accurate','jfk.wav','english','onnx-community/whisper-base','accurate')]
        for label,filename,language,model,quality in trials:
            page.locator('#fileInput').set_input_files(str(fixtures[filename]))
            page.locator('#languageSelect').select_option(language)
            page.locator('#modelSelect').select_option(model)
            page.locator('#qualitySelect').select_option(quality)
            page.evaluate('window.__speechEvents=[]')
            started=time.monotonic();page.locator('#transcribeBtn').click()
            page.wait_for_function("['\u0413\u041e\u0422\u041e\u0412\u041e','\u041e\u0428\u0418\u0411\u041a\u0410','\u041e\u0428\u0418\u0411\u041a\u0410 AI'].includes(document.querySelector('#statusText').textContent)",timeout=480000)
            result=page.evaluate("({status:document.querySelector('#statusText').textContent,note:document.querySelector('#statusNote').textContent,text:document.querySelector('#transcript').value,progress:document.querySelector('#progressValue').textContent,engines:window.__speechEvents.filter(x=>x.type==='engine'),fallbacks:window.__speechEvents.filter(x=>x.type==='backend-fallback')})")
            result.update(test=label,seconds=round(time.monotonic()-started,2));report['tests'].append(result)
            print(json.dumps(result,ensure_ascii=False),flush=True)
            page.screenshot(path=str(OUT/(label+'.png')),full_page=True)
            assert result['status']=='\u0413\u041e\u0422\u041e\u0412\u041e' and result['progress']=='100%',result
            assert len(result['text'].split())>=3,result
            if language=='english':assert 'ask not' in result['text'].lower() and 'country' in result['text'].lower(),result
            assert not result['fallbacks'],result
        with page.expect_download(timeout=30000) as download:page.locator('#downloadBtn').click()
        target=OUT/'transcript.txt';download.value.save_as(str(target))
        assert target.read_text().strip()==report['tests'][-1]['text'].strip()
        report['txt_export']='passed'
        assert not report['browser_errors'],report['browser_errors']
        report['passed']=True;browser.close()
finally:
    (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
