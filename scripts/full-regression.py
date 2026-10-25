"""Fresh source-bound native suite; no receipt reuse; unchanged 300s total."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

FRONTEND = Path.cwd()
BACKEND = Path(os.environ['REGRESSION_BACKEND_DIR']).resolve()
OUTPUT = Path(os.environ['REGRESSION_EVIDENCE_DIR']).resolve()
OUTPUT.mkdir(parents=True, exist_ok=False)
START = time.monotonic()
RECEIPT = {'executed': True, 'pid': os.getpid(), 'status': 'RUNNING', 'phases': [], 'gate': [],
           'external': {'providers': 'NOT_RUN', 'media': 'NOT_VERIFIED', 'humanReview': 'NOT_APPROVED'}}

def git(root, *args):
    return subprocess.check_output(['git', *args], cwd=root, text=True, timeout=remaining()).strip()

def remaining():
    budget = 300 - (time.monotonic() - START)
    if budget <= 0:
        raise TimeoutError('Original300s native budget exhausted')
    return budget

def snapshot():
    result = {}
    for label, root in [('frontend', FRONTEND), ('backend', BACKEND)]:
        names = git(root, 'ls-files', '-z').split('\0')
        remaining()
        result[label] = {'head': git(root, 'rev-parse', 'HEAD'), 'tree': git(root, 'rev-parse', 'HEAD^{tree}'),
                         'trackedStatus': git(root, 'status', '--porcelain', '--untracked-files=no'),
                         'files': {name: hashlib.sha256((root / name).read_bytes()).hexdigest() if (root / name).is_file() else None
                                   for name in names if name}}
    return result

def run(name, cwd, command):
    log = OUTPUT / (name + '.log')
    row = {'name': name, 'command': command, 'cwd': str(cwd), 'executed': False, 'exit_code': None,
           'startedAt': time.time(), 'startOffsetSeconds': time.monotonic() - START}
    RECEIPT['phases'].append(row)
    child = None
    at = time.monotonic()
    try:
        remaining()
        with log.open('xb') as stream:
            environment = {**os.environ, 'PYTHONPATH': str(BACKEND / 'backend')}
            if name not in {'frontend-build', 'production-build-input-controls'}:
                environment.pop('BUILD_REPRO_F7_INPUT_BASE64', None)
            child = subprocess.Popen(command, cwd=cwd, stdout=stream, stderr=subprocess.STDOUT,
                                     start_new_session=True, env=environment)
            row['pid'] = child.pid
            row['executed'] = True
            print(json.dumps(row), flush=True)
            row['exit_code'] = child.wait(timeout=remaining())
    finally:
        if child and child.poll() is None:
            try:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            child.wait()
            row['exit_code'] = child.returncode
        row.update(elapsedSeconds=time.monotonic() - at, endedAt=time.time(), endOffsetSeconds=time.monotonic() - START)
        if log.exists():
            row.update(log=log.name, sha256=hashlib.sha256(log.read_bytes()).hexdigest())
        print(json.dumps(row), flush=True)
    assert row['exit_code'] == 0, name + ' failed; see raw log'

def interrupted(_signum, _frame):
    raise TimeoutError('Native regression interrupted; preserve unfinished work')

signal.signal(signal.SIGTERM, interrupted)
try:
    for index in range(2):
        if index:
            time.sleep(10)
        at = time.monotonic()
        time.sleep(2)
        sample = {'load': os.getloadavg(), 'cpus': os.cpu_count(), 'freeBytes': shutil.disk_usage(FRONTEND).free,
                  'sampleSeconds': time.monotonic() - at}
        sample['loadLimit'] = min(32, 4 * sample['cpus'])
        RECEIPT['gate'].append(sample)
        assert sample['load'][0] <= sample['loadLimit'] and sample['freeBytes'] >= 2 * 1024**3 and sample['sampleSeconds'] <= 3
    before = snapshot()
    (OUTPUT / 'source-before.json').write_text(json.dumps(before, indent=2))
    assert all(not value['trackedStatus'] for value in before.values()), 'Tracked sources must start clean'
    assert before['backend']['head'] == 'f8116ea1d268e5b92489cb9dac3b5f88e8558f01'
    run('release-proof-unit', FRONTEND, [sys.executable, '-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_release_html.py', '-v'])
    run('frontend-full', FRONTEND, ['node_modules/.bin/vitest', 'run', '--maxWorkers=1', '--minWorkers=1',
        '--reporter=default', '--reporter=json', '--outputFile=' + str(OUTPUT / 'vitest.json')])
    vitest = json.loads((OUTPUT / 'vitest.json').read_text())
    assert vitest['success'] and vitest['numPassedTests'] == vitest['numTotalTests'] >= 803
    assert vitest['numFailedTests'] == 0 and vitest['numPendingTests'] == 0
    tests = sorted(str(p.relative_to(BACKEND)) for p in (BACKEND / 'backend/tests').glob('test_digital_human*.py'))
    assert tests
    RECEIPT['backendTestFiles'] = tests
    RECEIPT['pythonExecutable'] = sys.executable
    run('backend-digital-full', BACKEND, [sys.executable, '-m', 'pytest', '--noconftest', '-q',
        '--junitxml=' + str(OUTPUT / 'pytest.xml'), *tests])
    junit = ET.parse(OUTPUT / 'pytest.xml').getroot()
    cases = junit.findall('.//testcase')
    assert len(cases) >= 114
    assert not any(case.find(tag) is not None for case in cases for tag in ['failure', 'error', 'skipped'])
    run('frontend-lint', FRONTEND, ['npm', 'run', 'lint'])
    run('frontend-build', FRONTEND, ['npm', 'run', 'build'])
    run('production-build-input-controls', FRONTEND, ['node', 'scripts/verify-production-build-parity.mjs',
        str(OUTPUT / 'build-parity'), str(remaining())])
    after = snapshot()
    (OUTPUT / 'source-after.json').write_text(json.dumps(after, indent=2))
    assert before == after, 'Tracked sources changed during native regression'
    remaining()
    RECEIPT['reports'] = {name: hashlib.sha256((OUTPUT / name).read_bytes()).hexdigest()
                          for name in ['vitest.json', 'pytest.xml', 'source-before.json', 'source-after.json']}
    remaining()
    RECEIPT.update(status='PASS', frontendTests=vitest['numPassedTests'], backendTests=len(cases))
except BaseException as error:
    RECEIPT.update(status='FAILED_INCOMPLETE', errorType=type(error).__name__, error=str(error))
    raise
finally:
    RECEIPT['elapsedSeconds'] = time.monotonic() - START
    over_budget = RECEIPT['elapsedSeconds'] >= 300
    if over_budget:
        RECEIPT['status'] = 'FAILED_INCOMPLETE'
        RECEIPT['budgetExceeded'] = True
    (OUTPUT / 'native-receipt.json').write_text(json.dumps(RECEIPT, indent=2))
    print(json.dumps(RECEIPT), flush=True)
    if over_budget:
        raise TimeoutError('Original300s native budget exhausted')
