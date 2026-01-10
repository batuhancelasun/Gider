
import sys
import os
import json
import unittest
from pathlib import Path
from unittest.mock import patch
import tempfile
import shutil

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app as flask_app

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.data_path = Path(self.test_dir)
        
        # Configure app
        flask_app.app.config['TESTING'] = True
        self.client = flask_app.app.test_client()
        
        # Patch paths
        self.patches = [
            patch('app.DATA_DIR', self.data_path),
            patch('app.USERS_FILE', self.data_path / 'users.json'),
            patch('app.DATA_FILE', self.data_path / 'data.json')
        ]
        
        for p in self.patches:
            p.start()
            
        # Ensure dir exists (mocked ensure_data_dir logic usually handles this, 
        # but since we patched the variable, the function uses the new variable)
        os.makedirs(self.test_dir, exist_ok=True)
        
        # Create empty users.json
        with open(self.data_path / 'users.json', 'w') as f:
            json.dump({}, f)

    def tearDown(self):
        for p in self.patches:
            p.stop()
        shutil.rmtree(self.test_dir)

    def test_auth_flow(self):
        print("Testing Register...")
        res = self.client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'password123'
        })
        self.assertEqual(res.status_code, 201)
        
        print("Testing Login...")
        res = self.client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'password123'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('token', data)
        token = data['token']
        
        print("Testing Protected Route with Token...")
        res = self.client.get('/api/auth/me', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()['username'], 'testuser')
        
        print("Testing Protected Route without Token...")
        res = self.client.get('/api/transactions')
        self.assertEqual(res.status_code, 401)
        
        print("Testing Protected Route with Invalid Token...")
        res = self.client.get('/api/transactions', headers={
            'Authorization': 'Bearer invalidtoken'
        })
        self.assertEqual(res.status_code, 401)
        
        print("Auth Flow Verified Successfully!")

if __name__ == '__main__':
    unittest.main()
