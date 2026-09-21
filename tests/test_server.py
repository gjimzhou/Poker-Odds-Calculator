from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
import json
from threading import Thread
import unittest

from poker_odds.server import Handler, _compute_lock


class QuietHandler(Handler):
    def log_message(self, *args):
        pass


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), QuietHandler)
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def request(self, method, path, body=None):
        connection = HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        try:
            connection.request(method, path, body=body)
            response = connection.getresponse()
            return response.status, response.read()
        finally:
            connection.close()

    def test_page_and_not_found(self):
        status, body = self.request('GET', '/')
        self.assertEqual(status, 200)
        self.assertIn(b'Calculate exact odds', body)
        self.assertEqual(self.request('GET', '/missing')[0], 404)

    def test_calculation(self):
        status, body = self.request('POST', '/api/equity', json.dumps({
            'hand1': 'As Ah', 'hand2': 'Kc Kd', 'board': '2c 7d 9h Js', 'dead': 'Ks Kh'}))
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['equity']['fraction'], '1')

    def test_bad_requests(self):
        for body in ('not json', '[]', '{}', '{"hand1":4}',
                     '{"hand1":"As Ah","hand2":"As Ks"}', 'x' * 8193):
            self.assertEqual(self.request('POST', '/api/equity', body)[0], 400)
        self.assertEqual(self.request('POST', '/missing', '{}')[0], 404)

    def test_busy(self):
        with _compute_lock:
            status, _ = self.request('POST', '/api/equity', '{"hand1":"As Ah","hand2":"Kc Kd"}')
        self.assertEqual(status, 409)


if __name__ == '__main__':
    unittest.main()
