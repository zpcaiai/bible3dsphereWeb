"""Verify source HTML across one measured Cloudflare edge insertion.

Exact beacon pinned to the captured999a61f response. Unknown injections,
provider changes and changed application bytes fail closed. Raw bytes retained.
https://developers.cloudflare.com/web-analytics/faq/
"""
import hashlib

CLOUDFLARE_BEACON = b'<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/vce701823e78c4301a35b7e07294d87301792088814092" integrity="sha512-UKNk8GbxkABxKcXYuLkO16EleLGUkcvJWtpSNmExE0Too3ZaFAxTscNWEc1OdAv5/BikHawapSCaiD2XCmp+Bw==" data-cf-beacon=\'{"version":"2024.11.0","token":"d51f673030244340b8c447d622dd2afb","r":1,"spa":2}\' crossorigin="anonymous"></script>'


def verify_html(html, expected_digest):
    raw_digest = hashlib.sha256(html).hexdigest()
    if raw_digest == expected_digest:
        return html, {'transform': 'NONE', 'rawSHA256': raw_digest, 'buildSHA256': raw_digest}
    marker = CLOUDFLARE_BEACON + b'\n</body>'
    assert html.count(CLOUDFLARE_BEACON) == html.count(marker) == 1, 'Unknown or repeated HTML edge transform'
    original = html.replace(marker, b'</body>', 1)
    digest = hashlib.sha256(original).hexdigest()
    assert digest == expected_digest, 'Application HTML bytes differ from exact build'
    return original, {'transform': 'KNOWN_CLOUDFLARE_BEACON', 'rawSHA256': raw_digest,
                      'buildSHA256': digest, 'removedSHA256': hashlib.sha256(CLOUDFLARE_BEACON).hexdigest()}
