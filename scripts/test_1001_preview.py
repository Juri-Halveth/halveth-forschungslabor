"""The 1001 local preview publishes only its named browser assets."""

import functools
import http.server
import importlib.util
from pathlib import Path
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "doors_preview", ROOT / "branches" / "1001-doors" / "serve.py"
)
preview = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(preview)


class QuietHandler(preview.LabHandler):
    def log_message(self, *_args):
        pass


class PreviewBoundaryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = functools.partial(QuietHandler, directory=str(ROOT))
        cls.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def test_browser_assets_and_shared_parser_are_available(self):
        for path, mime in (
            ("/branches/1001-doors/", "text/html"),
            ("/branches/1001-doors/app.mjs", "text/javascript"),
            ("/branches/1001-doors/FORWARD_PORT.md", "text/markdown"),
            ("/scripts/plain-json.mjs", "text/javascript"),
        ):
            with self.subTest(path=path), urlopen(self.base + path) as response:
                self.assertEqual(response.status, 200)
                self.assertTrue(response.headers["Content-Type"].startswith(mime))
                self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")

    def test_repository_and_unlisted_files_remain_unavailable(self):
        for path in (
            "/.git/config", "/README.md", "/SOURCE_PROVENANCE.json",
            "/branches/1001-doors/model.test.mjs",
            "/branches/1001-doors/%2e%2e/README.md",
            "/branches/1001-doors/../README.md",
        ):
            with self.subTest(path=path), self.assertRaises(HTTPError) as error:
                urlopen(self.base + path)
            self.assertEqual(error.exception.code, 404)
            error.exception.close()

    def test_head_cannot_bypass_the_allowlist(self):
        with self.assertRaises(HTTPError) as error:
            urlopen(Request(self.base + "/.git/config", method="HEAD"))
        self.assertEqual(error.exception.code, 404)
        error.exception.close()

    def test_rebinding_host_is_rejected(self):
        request = Request(
            self.base + "/branches/1001-doors/",
            headers={"Host": "example.invalid"},
        )
        with self.assertRaises(HTTPError) as error:
            urlopen(request)
        self.assertEqual(error.exception.code, 403)
        error.exception.close()


if __name__ == "__main__":
    unittest.main()
