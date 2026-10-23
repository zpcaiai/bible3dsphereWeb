"""Read-only source/deployment receipts. This does not certify providers/media/review."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from release_html import verify_html

expected = os.environ['EXPECTED_FRONTEND_SHA']
backend = 'f8116ea1d268e5b92489cb9dac3b5f88e8558f01'
output = Path(os.environ['RELEASE_EVIDENCE_DIR'])
output.mkdir(parents=True, exist_ok=False)
receipt = {'expectedFrontendSHA': expected, 'expectedBackendSHA': backend,
           'scope': 'GitHub deployment source metadata, canonical served bytes and public backend snapshot/health. No provider, media or human-review acceptance.',
           'status': 'RUNNING'}

def fetch(url):
    with urlopen(Request(url, headers={'User-Agent': 'SpiritualPlanet-release-regression'}), timeout=25) as response:
        assert response.status == 200
        return response.read()

def gh(path, *query):
    return json.loads(subprocess.check_output(['gh', 'api', path, '--method', 'GET', *query], timeout=25))

try:
    deadline = time.monotonic() + 300
    while True:
        deployments = gh('repos/zpcaiai/bible3dsphereWeb/deployments', '-f', 'sha=' + expected, '-f', 'environment=Production')
        ready = None
        for deployment in deployments:
            assert deployment['sha'] == expected
            statuses = gh('repos/zpcaiai/bible3dsphereWeb/deployments/' + str(deployment['id']) + '/statuses')
            if statuses and statuses[0]['state'] == 'success':
                ready = {'deployment': deployment, 'status': statuses[0]}
                break
        if ready:
            break
        if time.monotonic() >= deadline:
            raise TimeoutError('Expected frontend has no successful Production deployment')
        time.sleep(10)
    receipt['frontendDeployment'] = ready
    html = fetch('https://holiness.uk/')
    startup = re.search(rb'<script[^>]+src="(/assets/[^"?]+\.js)"', html)
    assert startup, 'Canonical startup module missing'
    startup_path = startup.group(1).decode()
    startup_bytes = fetch('https://holiness.uk' + startup_path)
    mirror = re.search(rb'MirrorPage-[A-Za-z0-9_-]+\.js', startup_bytes)
    assert mirror, 'Canonical lazy mirror entry missing'
    mirror_path = '/assets/' + mirror.group().decode()
    mirror_bytes = fetch('https://holiness.uk' + mirror_path)
    receipt['canonical'] = {'http': 200, 'htmlSHA256': hashlib.sha256(html).hexdigest(),
                            'startupPath': startup_path, 'startupSHA256': hashlib.sha256(startup_bytes).hexdigest(),
                            'mirrorPath': mirror_path, 'mirrorSHA256': hashlib.sha256(mirror_bytes).hexdigest()}
    (output / 'canonical.html').write_bytes(html)
    (output / 'canonical-startup.js').write_bytes(startup_bytes)
    (output / 'canonical-mirror.js').write_bytes(mirror_bytes)
    # The pre-manifest production base is observable on PRs only. Main and the
    # actual campaign always require an exact source/hash binding.
    legacy_base = os.environ.get('ALLOW_LEGACY_BASE') == '1' and os.environ.get('GITHUB_EVENT_NAME') == 'pull_request'
    manifest = None
    try:
        manifest_bytes = fetch('https://holiness.uk/release-manifest.json')
        (output / 'release-manifest.response').write_bytes(manifest_bytes)
        manifest = json.loads(manifest_bytes)
    except (HTTPError, json.JSONDecodeError) as error:
        if not legacy_base or isinstance(error, HTTPError) and error.code != 404:
            raise
    receipt['sourceBound'] = manifest is not None
    if manifest is not None:
        assert manifest['schemaVersion'] == 1 and manifest['sourceCommit'] == expected, 'Canonical source differs from expected main'
        original_html, html_proof = verify_html(html, manifest['files']['index.html'])
        (output / 'canonical-origin-equivalent.html').write_bytes(original_html)
        receipt['canonical']['htmlSourceProof'] = html_proof
        for path, payload in [(startup_path.lstrip('/'), startup_bytes), (mirror_path.lstrip('/'), mirror_bytes)]:
            assert manifest['files'][path] == hashlib.sha256(payload).hexdigest(), path + ' manifest hash mismatch'
        receipt['canonical']['manifestSHA256'] = hashlib.sha256(manifest_bytes).hexdigest()
    else:
        assert legacy_base, 'Source manifest is required'
        receipt['scope'] += ' LEGACY BASE OBSERVATION ONLY; canonical source is not qualified.'
    space = json.loads(fetch('https://huggingface.co/api/spaces/StephenZao/biblesphere'))
    commits = json.loads(fetch('https://huggingface.co/api/spaces/StephenZao/biblesphere/commits/main'))
    health = json.loads(fetch('https://holiness.uk/api/health'))
    receipt['backend'] = {'spaceSHA': space['sha'], 'stage': space['runtime']['stage'], 'commit': commits[0],
                          'health': health, 'sourceFiles': []}
    assert space['runtime']['stage'] == 'RUNNING'
    assert commits[0]['id'] == space['sha'] and backend[:8] in commits[0]['title']
    assert health['ok'] and health['components']['database']['status'] == 'ok'
    for name in ['retrieval.py', 'service.py', 'registry.py', 'catalog.v1.3.0.json']:
        path = 'backend/digital_human/' + name
        actual = fetch('https://huggingface.co/spaces/StephenZao/biblesphere/resolve/' + space['sha'] + '/' + path)
        source = fetch('https://raw.githubusercontent.com/zpcaiai/bible3dsphere/' + backend + '/' + path)
        actual_sha, source_sha = hashlib.sha256(actual).hexdigest(), hashlib.sha256(source).hexdigest()
        receipt['backend']['sourceFiles'].append({'path': path, 'servedSHA256': actual_sha, 'expectedSHA256': source_sha})
        assert actual_sha == source_sha, path + ' deployed source mismatch'
    receipt['status'] = 'PASS'
except BaseException as error:
    receipt.update(status='FAILED_INCOMPLETE', errorType=type(error).__name__, error=str(error))
    raise
finally:
    (output / 'deployment-receipt.json').write_text(json.dumps(receipt, indent=2))
    print(json.dumps({'status': receipt['status'], 'expectedFrontendSHA': expected, 'expectedBackendSHA': backend}), flush=True)
