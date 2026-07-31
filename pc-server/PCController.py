#!/usr/bin/env python3
"""
Nova PC Controller Server
Listens on Tailscale network for remote control commands from the Nova Android app.
Bridges to Google Gemini Live API for real-time AI audio and text.
Run with: python PCController.py
"""

import http.server
import json
import socket
import threading
import os
import sys
import time
import base64
from io import BytesIO
from http import HTTPStatus

try:
    from PIL import Image, ImageGrab
    SCREENSHOT_AVAILABLE = True
except ImportError:
    SCREENSHOT_AVAILABLE = False
    print("Warning: Pillow not installed. Screenshots disabled.")
    print("Install with: pip install Pillow")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-2.5-flash-native-audio-latest')

class NovaCommandHandler(http.server.BaseHTTPRequestHandler):
    sessions = {}
    active_window = None
    clipboard_text = ''

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.path == '/health':
            self.send_json({
                'status': 'ok',
                'sessionId': self.sessions.get('id', 'default'),
                'hostname': socket.gethostname(),
                'timestamp': time.time(),
            })
        elif self.path == '/api/screenshot':
            self.handle_screenshot()
        elif self.path == '/api/screenshot/latest':
            self.handle_latest_screenshot()
        elif self.path == '/api/stream':
            self.handle_stream_request()
        elif self.path.startswith('/api/screenshot/'):
            self.handle_named_screenshot(self.path)
        else:
            self.send_error(HTTPStatus.NOT_FOUND, 'Endpoint not found')

    def do_POST(self):
        if self.path == '/api/command':
            self.handle_command()
        elif self.path == '/api/clipboard/set':
            self.handle_clipboard_set()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, 'Endpoint not found')

    def send_json(self, data, status=HTTPStatus.OK):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def read_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(content_length).decode('utf-8'))

    def handle_command(self):
        try:
            cmd = self.read_body()
            cmd_type = cmd.get('type', '')
            params = cmd.get('params', {})
            timestamp = cmd.get('timestamp', 0)

            result = {'type': cmd_type, 'success': True, 'timestamp': timestamp}

            if cmd_type == 'mouse_move':
                self.handle_mouse_move(params)
            elif cmd_type == 'mouse_click':
                self.handle_mouse_click(params)
            elif cmd_type == 'mouse_scroll':
                self.handle_mouse_scroll(params)
            elif cmd_type == 'key_press':
                self.handle_key_press(params)
            elif cmd_type == 'key_release':
                self.handle_key_release(params)
            elif cmd_type == 'key_combination':
                self.handle_key_combination(params)
            elif cmd_type == 'clipboard_send':
                self.handle_clipboard_send(params)
            elif cmd_type == 'screenshot_request':
                self.handle_screenshot()
            elif cmd_type == 'shutdown':
                self.handle_shutdown(params)
            elif cmd_type == 'lock':
                self.handle_lock()
            else:
                result['success'] = False
                result['error'] = f'Unknown command type: {cmd_type}'

            self.send_json(result)
        except Exception as e:
            self.send_json({'type': cmd_type, 'success': False, 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_mouse_move(self, params):
        from ctypes import windll, Structure, c_long, byref
        class POINT(Structure):
            _fields_ = [('x', c_long), ('y', c_long)]

        pt = POINT()
        windll.user32.GetCursorPos(byref(pt))
        delta_x = params.get('deltaX', 0)
        delta_y = params.get('deltaY', 0)
        new_x = max(0, min(32767, pt.x + int(delta_x)))
        new_y = max(0, min(32767, pt.y + int(delta_y)))
        windll.user32.SetCursorPos(new_x, new_y)

    def handle_mouse_click(self, params):
        import win32api
        import win32con

        x = params.get('x', 0)
        y = params.get('y', 0)
        button = params.get('button', 'left')
        action = params.get('action', 'click')

        import ctypes
        class POINT(ctypes.Structure):
            _fields_ = [('x', ctypes.c_long), ('y', ctypes.c_long)]
        win32api.SetCursorPos((x, y))

        button_map = {
            'left': win32con.MOUSEEVENTF_LEFTDOWN if action in ('down', 'click') else win32con.MOUSEEVENTF_LEFTUP,
            'right': win32con.MOUSEEVENTF_RIGHTDOWN if action in ('down', 'click') else win32con.MOUSEEVENTF_RIGHTUP,
            'middle': win32con.MOUSEEVENTF_MIDDLEDOWN if action in ('down', 'click') else win32con.MOUSEEVENTF_MIDDLEUP,
        }

        flag = button_map.get(button, win32con.MOUSEEVENTF_LEFTDOWN)
        win32api.mouse_event(flag, 0, 0)

        if action == 'click':
            win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, 0, 0)
            win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, 0, 0)

    def handle_mouse_scroll(self, params):
        import win32api
        import win32con
        delta_y = params.get('deltaY', 0)
        scroll_lines = int(delta_y / 120) if abs(delta_y) > 120 else (1 if delta_y > 0 else -1)
        win32api.mouse_event(win32con.MOUSEEVENTF_WHEEL, 0, 0, scroll_lines * 120)

    def handle_key_press(self, params):
        import win32api
        import win32con
        key = params.get('key', '')
        key_code = params.get('keyCode', 0)
        if key_code:
            win32api.keybd_event(key_code, 0, 0, 0)

    def handle_key_release(self, params):
        import win32api
        import win32con
        key = params.get('key', '')
        key_code = params.get('keyCode', 0)
        if key_code:
            win32api.keybd_event(key_code, 0, win32con.KEYEVENTF_KEYUP, 0)

    def handle_key_combination(self, params):
        import win32api
        import win32con
        import time
        keys = params.get('keys', [])

        key_map = {
            'ctrl': 17, 'alt': 18, 'shift': 16, 'win': 91,
            'enter': 13, 'tab': 9, 'escape': 27,
            'up': 38, 'down': 40, 'left': 37, 'right': 39,
            'space': 32, 'backspace': 8, 'delete': 46,
        }

        pressed_codes = []
        for k in keys:
            code = key_map.get(k.lower(), 0)
            if code:
                win32api.keybd_event(code, 0, 0, 0)
                pressed_codes.append(code)

        time.sleep(0.05)

        for code in reversed(pressed_codes):
            win32api.keybd_event(code, 0, win32con.KEYEVENTF_KEYUP, 0)

    def handle_clipboard_send(self, params):
        import win32clipboard
        text = params.get('text', '')
        try:
            win32clipboard.OpenClipboard()
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardText(text, win32clipboard.CF_UNICODETEXT)
            self.clipboard_text = text
        finally:
            win32clipboard.CloseClipboard()

    def handle_screenshot(self):
        if not SCREENSHOT_AVAILABLE:
            self.send_json({'success': False, 'error': 'Pillow not installed'}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return

        try:
            img = ImageGrab.grab()
            buffered = BytesIO()
            img.save(buffered, format='PNG', quality=50)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
            self.send_json({'success': True, 'image': f'data:image/png;base64,{img_base64}'})
        except Exception as e:
            self.send_json({'success': False, 'error': str(e)}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def handle_latest_screenshot(self):
        self.handle_screenshot()

    def handle_stream_request(self):
        self.send_json({
            'streamUrl': f'http://{self.client_address[0]}:{PORT}/api/screenshot/latest',
            'format': 'base64 PNG',
            'refreshRate': '1fps recommended',
            'width': 1920,
            'height': 1080,
        })

    def handle_named_screenshot(self, path):
        self.handle_screenshot()

    def handle_shutdown(self, params):
        import subprocess
        action = params.get('action', 'shutdown')
        if action == 'shutdown':
            os.system('shutdown /s /t 0')
        elif action == 'restart':
            os.system('shutdown /r /t 0')
        elif action == 'sleep':
            os.system('rundll32.exe powrprof.dll,SetSuspendState')
        elif action == 'lock':
            os.system('rundll32.exe user32.dll,LockWorkStation')

    def handle_lock(self):
        os.system('rundll32.exe user32.dll,LockWorkStation')

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


def get_tailscale_ip():
    try:
        import subprocess
        result = subprocess.run(['tailscale', 'status', '--json'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            for peer_id, peer in data.get('Self', {}).get('TailscaleIPs', []):
                if peer.startswith('100.64'):
                    return peer
            self_ip = data.get('Self', {}).get('TailscaleIPs', [])
            if self_ip:
                return self_ip[0]
    except Exception:
        pass
    return get_local_ip()


def main():
    print(f'Nova PC Controller Server')
    print(f'Hostname: {socket.gethostname()}')
    print(f'Local IP: {get_local_ip()}')
    print(f'Tailscale IP: {get_tailscale_ip()}')
    print(f'Listening on {HOST}:{PORT}')
    print(f'Use Ctrl+C to stop')
    print()
    print('QR Code data for mobile app:')
    print(f'  {get_tailscale_ip()}:{PORT}')
    print()

    server = http.server.HTTPServer((HOST, PORT), NovaCommandHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        server.shutdown()


if __name__ == '__main__':
    main()