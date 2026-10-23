import hashlib
import unittest

from release_html import CLOUDFLARE_BEACON, verify_html


class ReleaseHTMLTest(unittest.TestCase):
    def setUp(self):
        self.original = b'<html><body><script src="/assets/app.js"></script>\n  </body></html>'
        self.digest = hashlib.sha256(self.original).hexdigest()
        self.edge = self.original.replace(b'</body>', CLOUDFLARE_BEACON + b'\n</body>')

    def test_original_bytes_match_without_transform(self):
        content, proof = verify_html(self.original, self.digest)
        self.assertEqual(content, self.original)
        self.assertEqual(proof['transform'], 'NONE')

    def test_only_measured_beacon_recovers_exact_original_bytes(self):
        content, proof = verify_html(self.edge, self.digest)
        self.assertEqual(content, self.original)
        self.assertEqual(proof['buildSHA256'], self.digest)
        self.assertNotEqual(proof['rawSHA256'], self.digest)
        self.assertEqual(proof['removedSHA256'], hashlib.sha256(CLOUDFLARE_BEACON).hexdigest())

    def test_changed_application_bytes_and_added_scripts_fail(self):
        for changed in [self.edge.replace(b'app.js', b'other.js'), self.edge.replace(b'<body>', b'<body><script>unexpected()</script>')]:
            with self.subTest(changed=changed[:70]), self.assertRaises(AssertionError):
                verify_html(changed, self.digest)

    def test_duplicate_moved_or_changed_beacons_fail(self):
        for changed in [self.edge.replace(CLOUDFLARE_BEACON, CLOUDFLARE_BEACON * 2),
                        self.edge.replace(CLOUDFLARE_BEACON + b'\n</body>', b'</body>' + CLOUDFLARE_BEACON),
                        self.edge.replace(b'crossorigin="anonymous"', b'crossorigin="use-credentials"')]:
            with self.subTest(changed=changed[:70]), self.assertRaises(AssertionError):
                verify_html(changed, self.digest)


if __name__ == '__main__':
    unittest.main()
