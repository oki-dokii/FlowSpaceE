#!/usr/bin/env python3
"""
Backend SMTP Email Testing for FlowSpace Invite System
Tests end-to-end invite flow with SMTP email sending
"""

import requests
import json
import jwt
import os
import time
from datetime import datetime, timedelta
from typing import Dict, Optional

# Configuration
BACKEND_URL = "http://localhost:8001"

# Load JWT secret from .env file
def load_jwt_secret():
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if line.startswith('JWT_ACCESS_SECRET='):
                    secret = line.split('=', 1)[1].strip()
                    return secret.strip('"').strip("'")
    except Exception as e:
        print(f"Error loading JWT secret: {e}")
    return 'flowspace_access_secret_2024_secure'

JWT_SECRET = load_jwt_secret()

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class FlowSpaceSMTPTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        # Test users
        self.owner_token = None
        self.owner_id = None
        self.owner_email = 'flowspace.owner@example.com'
        
        self.invitee_token = None
        self.invitee_id = None
        self.invitee_email = 'testuser@example.com'
        
        self.viewer_token = None
        self.viewer_id = None
        self.viewer_email = 'viewer.user@example.com'
        
        # Board data
        self.board_a_id = None
        self.board_b_id = None
        self.column_id = None
        self.invite_token = None
        self.invite_link = None
        
        self.test_results = []
        
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        print(f"{status} - {test_name}")
        if message:
            print(f"  {message}")
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'message': message
        })
        
    def generate_jwt_token(self, user_id: str) -> str:
        """Generate JWT token for authentication"""
        payload = {
            'sub': user_id,
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        return jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    
    def setup_test_data(self):
        """Create test users and boards"""
        print(f"\n{Colors.BOLD}Setting up test data...{Colors.RESET}")
        
        try:
            from pymongo import MongoClient
            from bson import ObjectId
            client = MongoClient('mongodb://localhost:27017/flowspace')
            db = client['flowspace']
            
            # Create owner user
            owner_user = db.users.find_one({'email': self.owner_email})
            if not owner_user:
                owner_data = {
                    'name': 'Board Owner',
                    'email': self.owner_email,
                    'password': 'owner123',
                    'avatarUrl': 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                result = db.users.insert_one(owner_data)
                self.owner_id = str(result.inserted_id)
                print(f"  Created owner user: {self.owner_id}")
            else:
                self.owner_id = str(owner_user['_id'])
                print(f"  Using existing owner user: {self.owner_id}")
            
            self.owner_token = self.generate_jwt_token(self.owner_id)
            
            # Create invitee user
            invitee_user = db.users.find_one({'email': self.invitee_email})
            if not invitee_user:
                invitee_data = {
                    'name': 'Test User',
                    'email': self.invitee_email,
                    'password': 'invitee123',
                    'avatarUrl': 'https://api.dicebear.com/7.x/avataaars/svg?seed=invitee',
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                result = db.users.insert_one(invitee_data)
                self.invitee_id = str(result.inserted_id)
                print(f"  Created invitee user: {self.invitee_id}")
            else:
                self.invitee_id = str(invitee_user['_id'])
                print(f"  Using existing invitee user: {self.invitee_id}")
            
            self.invitee_token = self.generate_jwt_token(self.invitee_id)
            
            # Create viewer user
            viewer_user = db.users.find_one({'email': self.viewer_email})
            if not viewer_user:
                viewer_data = {
                    'name': 'Viewer User',
                    'email': self.viewer_email,
                    'password': 'viewer123',
                    'avatarUrl': 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer',
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }
                result = db.users.insert_one(viewer_data)
                self.viewer_id = str(result.inserted_id)
                print(f"  Created viewer user: {self.viewer_id}")
            else:
                self.viewer_id = str(viewer_user['_id'])
                print(f"  Using existing viewer user: {self.viewer_id}")
            
            self.viewer_token = self.generate_jwt_token(self.viewer_id)
            
            # Create test board A
            owner_obj_id = owner_user['_id'] if owner_user else ObjectId(self.owner_id)
            
            board_a_data = {
                'title': 'Board A - SMTP Test',
                'description': 'Testing SMTP email sending',
                'ownerId': owner_obj_id,
                'members': [{'userId': owner_obj_id, 'role': 'owner'}],
                'columns': [
                    {'_id': ObjectId(), 'title': 'To Do', 'order': 0},
                    {'_id': ObjectId(), 'title': 'In Progress', 'order': 1},
                    {'_id': ObjectId(), 'title': 'Done', 'order': 2}
                ],
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            board_a_result = db.boards.insert_one(board_a_data)
            self.board_a_id = str(board_a_result.inserted_id)
            self.column_id = str(board_a_data['columns'][0]['_id'])
            
            print(f"  Created test board A: {self.board_a_id}")
            
            # Create test board B
            board_b_data = {
                'title': 'Board B - SMTP Test',
                'description': 'Testing board selection in invites',
                'ownerId': owner_obj_id,
                'members': [{'userId': owner_obj_id, 'role': 'owner'}],
                'columns': [
                    {'_id': ObjectId(), 'title': 'To Do', 'order': 0}
                ],
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            board_b_result = db.boards.insert_one(board_b_data)
            self.board_b_id = str(board_b_result.inserted_id)
            
            print(f"  Created test board B: {self.board_b_id}")
            
            return True
            
        except Exception as e:
            print(f"{Colors.RED}Failed to setup test data: {str(e)}{Colors.RESET}")
            import traceback
            traceback.print_exc()
            return False
    
    def cleanup_test_data(self):
        """Clean up test data"""
        print(f"\n{Colors.BOLD}Cleaning up test data...{Colors.RESET}")
        try:
            from pymongo import MongoClient
            from bson import ObjectId
            client = MongoClient('mongodb://localhost:27017/flowspace')
            db = client['flowspace']
            
            # Delete test invites
            if self.board_a_id:
                db.invites.delete_many({'boardId': ObjectId(self.board_a_id)})
            if self.board_b_id:
                db.invites.delete_many({'boardId': ObjectId(self.board_b_id)})
            print(f"  Deleted test invites")
            
            # Delete test cards
            if self.board_a_id:
                db.cards.delete_many({'boardId': ObjectId(self.board_a_id)})
            if self.board_b_id:
                db.cards.delete_many({'boardId': ObjectId(self.board_b_id)})
            print(f"  Deleted test cards")
                
            # Delete test boards
            if self.board_a_id:
                db.boards.delete_one({'_id': ObjectId(self.board_a_id)})
            if self.board_b_id:
                db.boards.delete_one({'_id': ObjectId(self.board_b_id)})
            print(f"  Deleted test boards")
            
            # Delete test users
            db.users.delete_one({'email': self.owner_email})
            db.users.delete_one({'email': self.invitee_email})
            db.users.delete_one({'email': self.viewer_email})
            print(f"  Deleted test users")
            
        except Exception as e:
            print(f"{Colors.YELLOW}Warning: Cleanup failed: {str(e)}{Colors.RESET}")
    
    def test_1_complete_invite_flow_with_email(self):
        """Test 1: Complete Invite Flow with Email"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}Test 1: Complete Invite Flow with Email{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        
        url = f"{self.base_url}/api/invite"
        headers = {
            'Authorization': f'Bearer {self.owner_token}',
            'Content-Type': 'application/json'
        }
        
        invite_data = {
            'boardId': self.board_a_id,
            'email': self.invitee_email,
            'role': 'editor'
        }
        
        try:
            print(f"\n{Colors.BLUE}Sending invite request...{Colors.RESET}")
            response = requests.post(url, json=invite_data, headers=headers)
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Body: {json.dumps(response.json(), indent=2)}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response fields
                has_success = data.get('success') == True
                has_token = 'token' in data
                has_link = 'inviteLink' in data
                has_message = 'message' in data
                
                self.log_test(
                    "Invite Response Structure",
                    has_success and has_token and has_link and has_message,
                    f"Response includes: success={has_success}, token={has_token}, inviteLink={has_link}, message={has_message}"
                )
                
                if has_token and has_link:
                    self.invite_token = data['token']
                    self.invite_link = data['inviteLink']
                    
                    print(f"\n{Colors.GREEN}Invite Details:{Colors.RESET}")
                    print(f"  Token: {self.invite_token}")
                    print(f"  Link: {self.invite_link}")
                    print(f"  Message: {data.get('message')}")
                    
                    # Check if email was sent or if there's a warning
                    email_sent = 'email not sent' not in data.get('message', '').lower()
                    has_warning = 'warning' in data
                    
                    if email_sent and not has_warning:
                        self.log_test(
                            "SMTP Email Sending",
                            True,
                            "Email sent successfully (no warning in response)"
                        )
                    else:
                        self.log_test(
                            "SMTP Email Sending",
                            False,
                            f"Email not sent - Warning: {data.get('warning', 'Check SMTP configuration')}"
                        )
                    
                    # Verify invite in database
                    time.sleep(0.5)
                    from pymongo import MongoClient
                    client = MongoClient('mongodb://localhost:27017/flowspace')
                    db = client['flowspace']
                    
                    invite_doc = db.invites.find_one({'token': self.invite_token})
                    if invite_doc:
                        print(f"\n{Colors.GREEN}Database Verification:{Colors.RESET}")
                        print(f"  Board ID: {invite_doc['boardId']} (expected: {self.board_a_id})")
                        print(f"  Email: {invite_doc['email']}")
                        print(f"  Role: {invite_doc['role']}")
                        print(f"  Status: {invite_doc['status']}")
                        print(f"  Expires At: {invite_doc['expiresAt']}")
                        
                        fields_ok = (
                            str(invite_doc['boardId']) == self.board_a_id and
                            invite_doc['email'] == self.invitee_email and
                            invite_doc['role'] == 'editor' and
                            invite_doc['status'] == 'pending'
                        )
                        
                        expiry_ok = invite_doc['expiresAt'] > datetime.utcnow()
                        days_until_expiry = (invite_doc['expiresAt'] - datetime.utcnow()).days
                        
                        self.log_test(
                            "Invite Database Fields",
                            fields_ok,
                            f"All fields correct: boardId, email, role, status" if fields_ok else "Some fields incorrect"
                        )
                        
                        self.log_test(
                            "Invite Expiry Date",
                            expiry_ok and days_until_expiry >= 6,
                            f"Expires in {days_until_expiry} days (expected: 7 days)" if expiry_ok else "Expiry date incorrect"
                        )
                    else:
                        self.log_test("Invite Database Verification", False, "Invite not found in database")
                    
                    return True
                else:
                    return False
            else:
                self.log_test(
                    "Invite Creation API",
                    False,
                    f"Expected status 200, got {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Complete Invite Flow", False, f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_2_invite_with_board_selection(self):
        """Test 2: Invite with Board Selection"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}Test 2: Invite with Board Selection{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        
        try:
            from pymongo import MongoClient
            client = MongoClient('mongodb://localhost:27017/flowspace')
            db = client['flowspace']
            
            # Send invite to Board A
            print(f"\n{Colors.BLUE}Sending invite to Board A...{Colors.RESET}")
            url = f"{self.base_url}/api/invite"
            headers = {
                'Authorization': f'Bearer {self.owner_token}',
                'Content-Type': 'application/json'
            }
            
            invite_a_data = {
                'boardId': self.board_a_id,
                'email': 'board_a_user@example.com',
                'role': 'editor'
            }
            
            response_a = requests.post(url, json=invite_a_data, headers=headers)
            
            if response_a.status_code == 200:
                data_a = response_a.json()
                token_a = data_a.get('token')
                
                self.log_test(
                    "Invite Created for Board A",
                    token_a is not None,
                    f"Token: {token_a}"
                )
                
                # Verify in database
                time.sleep(0.5)
                invite_a_doc = db.invites.find_one({'token': token_a})
                if invite_a_doc:
                    board_a_match = str(invite_a_doc['boardId']) == self.board_a_id
                    self.log_test(
                        "Board A Invite Has Correct Board ID",
                        board_a_match,
                        f"Board ID matches: {invite_a_doc['boardId']}" if board_a_match else f"Board ID mismatch"
                    )
            else:
                self.log_test("Invite for Board A", False, f"Failed: {response_a.status_code}")
            
            # Send invite to Board B
            print(f"\n{Colors.BLUE}Sending invite to Board B...{Colors.RESET}")
            invite_b_data = {
                'boardId': self.board_b_id,
                'email': 'board_b_user@example.com',
                'role': 'editor'
            }
            
            response_b = requests.post(url, json=invite_b_data, headers=headers)
            
            if response_b.status_code == 200:
                data_b = response_b.json()
                token_b = data_b.get('token')
                
                self.log_test(
                    "Invite Created for Board B",
                    token_b is not None,
                    f"Token: {token_b}"
                )
                
                # Verify in database
                time.sleep(0.5)
                invite_b_doc = db.invites.find_one({'token': token_b})
                if invite_b_doc:
                    board_b_match = str(invite_b_doc['boardId']) == self.board_b_id
                    self.log_test(
                        "Board B Invite Has Correct Board ID",
                        board_b_match,
                        f"Board ID matches: {invite_b_doc['boardId']}" if board_b_match else f"Board ID mismatch"
                    )
            else:
                self.log_test("Invite for Board B", False, f"Failed: {response_b.status_code}")
            
            return True
            
        except Exception as e:
            self.log_test("Invite with Board Selection", False, f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_3_accept_invite_and_join_board(self):
        """Test 3: Accept Invite and Join Board"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}Test 3: Accept Invite and Join Board{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        
        if not self.invite_token:
            self.log_test("Accept Invite", False, "No invite token available from Test 1")
            return False
        
        url = f"{self.base_url}/api/invite/{self.invite_token}/accept"
        headers = {
            'Authorization': f'Bearer {self.invitee_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            print(f"\n{Colors.BLUE}Accepting invite...{Colors.RESET}")
            response = requests.post(url, headers=headers)
            
            print(f"Response Status: {response.status_code}")
            print(f"Response Body: {json.dumps(response.json(), indent=2)}")
            
            if response.status_code == 200:
                data = response.json()
                
                success = data.get('success') == True
                has_board = 'board' in data
                
                self.log_test(
                    "Accept Invite API",
                    success and has_board,
                    f"Invite accepted successfully" if success else f"Response: {data}"
                )
                
                # Verify user added to board members
                time.sleep(0.5)
                from pymongo import MongoClient
                from bson import ObjectId
                client = MongoClient('mongodb://localhost:27017/flowspace')
                db = client['flowspace']
                
                board = db.boards.find_one({'_id': ObjectId(self.board_a_id)})
                if board:
                    print(f"\n{Colors.GREEN}Board Membership Verification:{Colors.RESET}")
                    member_ids = [str(m['userId']) for m in board.get('members', [])]
                    print(f"  Board members: {member_ids}")
                    print(f"  Invitee ID: {self.invitee_id}")
                    
                    is_member = self.invitee_id in member_ids
                    
                    # Find the member entry
                    member_role = None
                    for m in board.get('members', []):
                        if str(m['userId']) == self.invitee_id:
                            member_role = m.get('role')
                            break
                    
                    self.log_test(
                        "User Added to Board Members",
                        is_member and member_role == 'editor',
                        f"User added with role: {member_role}" if is_member else "User not added to board"
                    )
                else:
                    self.log_test("Board Membership Verification", False, "Board not found")
                
                # Verify invite status changed to 'accepted'
                invite_doc = db.invites.find_one({'token': self.invite_token})
                if invite_doc:
                    status_ok = invite_doc['status'] == 'accepted'
                    self.log_test(
                        "Invite Status Changed to 'accepted'",
                        status_ok,
                        f"Status: {invite_doc['status']}"
                    )
                else:
                    self.log_test("Invite Status Update", False, "Invite not found")
                
                # Note: Socket.io event verification would require WebSocket client
                print(f"\n{Colors.YELLOW}Note: Socket.io 'board:member-joined' event should be emitted (requires WebSocket client to verify){Colors.RESET}")
                
                return success
            else:
                self.log_test(
                    "Accept Invite API",
                    False,
                    f"Expected status 200, got {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Accept Invite", False, f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_4_verify_collaboration_after_invite(self):
        """Test 4: Verify Collaboration After Invite"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}Test 4: Verify Collaboration After Invite{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        
        try:
            # Second user creates a card
            print(f"\n{Colors.BLUE}Second user (invitee) creating a card...{Colors.RESET}")
            url = f"{self.base_url}/api/cards/{self.board_a_id}/cards"
            headers = {
                'Authorization': f'Bearer {self.invitee_token}',
                'Content-Type': 'application/json'
            }
            
            card_data = {
                'columnId': self.column_id,
                'title': 'Collaboration Test Card',
                'description': 'Card created by second user',
                'tags': ['collaboration', 'test']
            }
            
            response = requests.post(url, json=card_data, headers=headers)
            
            if response.status_code != 201:
                self.log_test("Second User Card Creation", False, f"Failed: {response.status_code}")
                return False
            
            card_id = response.json()['card']['_id']
            print(f"  Card created: {card_id}")
            
            self.log_test(
                "Second User Can Create Card",
                True,
                f"Card ID: {card_id}"
            )
            
            time.sleep(0.5)
            
            # First user fetches cards
            print(f"\n{Colors.BLUE}First user (owner) fetching cards...{Colors.RESET}")
            url = f"{self.base_url}/api/cards/{self.board_a_id}/cards"
            headers = {'Authorization': f'Bearer {self.owner_token}'}
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                cards = data.get('cards', [])
                
                # Find the card created by invitee
                invitee_card = None
                for c in cards:
                    if c.get('_id') == card_id:
                        invitee_card = c
                        break
                
                if invitee_card:
                    print(f"\n{Colors.GREEN}Card Details:{Colors.RESET}")
                    print(f"  Title: {invitee_card.get('title')}")
                    print(f"  Created By: {invitee_card.get('createdBy')}")
                    
                    # Verify card has createdBy field
                    has_created_by = 'createdBy' in invitee_card
                    created_by = invitee_card.get('createdBy')
                    
                    # Check if createdBy is populated with user data
                    created_by_populated = isinstance(created_by, dict) and ('name' in created_by or 'email' in created_by)
                    
                    self.log_test(
                        "Card Has createdBy Field",
                        has_created_by and created_by_populated,
                        f"createdBy populated with user data" if created_by_populated else f"createdBy: {created_by}"
                    )
                    
                    # Verify it's the invitee
                    is_invitee = False
                    if isinstance(created_by, dict):
                        is_invitee = created_by.get('email') == self.invitee_email
                    
                    self.log_test(
                        "Card Created By Second User",
                        is_invitee,
                        f"Card shows invitee as creator" if is_invitee else f"Creator mismatch"
                    )
                    
                    # Check for avatar field
                    has_avatar = 'avatarUrl' in created_by if isinstance(created_by, dict) else False
                    
                    self.log_test(
                        "Card Shows User Avatar",
                        has_avatar,
                        f"Avatar URL: {created_by.get('avatarUrl')}" if has_avatar else "Avatar URL missing"
                    )
                    
                    return True
                else:
                    self.log_test("First User Can See Second User's Card", False, "Card not found")
                    return False
            else:
                self.log_test("First User Fetch Cards", False, f"Failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Verify Collaboration", False, f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_5_test_permissions(self):
        """Test 5: Test Permissions"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}Test 5: Test Permissions{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        
        try:
            from pymongo import MongoClient
            from bson import ObjectId
            client = MongoClient('mongodb://localhost:27017/flowspace')
            db = client['flowspace']
            
            # Send invite with role='viewer'
            print(f"\n{Colors.BLUE}Sending invite with role='viewer'...{Colors.RESET}")
            url = f"{self.base_url}/api/invite"
            headers = {
                'Authorization': f'Bearer {self.owner_token}',
                'Content-Type': 'application/json'
            }
            
            invite_data = {
                'boardId': self.board_a_id,
                'email': self.viewer_email,
                'role': 'viewer'
            }
            
            response = requests.post(url, json=invite_data, headers=headers)
            
            if response.status_code != 200:
                self.log_test("Create Viewer Invite", False, f"Failed: {response.status_code}")
                return False
            
            viewer_token = response.json().get('token')
            print(f"  Viewer invite token: {viewer_token}")
            
            # Viewer accepts invite
            print(f"\n{Colors.BLUE}Viewer accepting invite...{Colors.RESET}")
            url = f"{self.base_url}/api/invite/{viewer_token}/accept"
            headers = {'Authorization': f'Bearer {self.viewer_token}'}
            
            response = requests.post(url, headers=headers)
            
            if response.status_code != 200:
                self.log_test("Viewer Accept Invite", False, f"Failed: {response.status_code}")
                return False
            
            self.log_test(
                "Viewer Accepts Invite",
                True,
                "Viewer successfully joined board"
            )
            
            time.sleep(0.5)
            
            # Test: Viewer CANNOT send invites (should get 403)
            print(f"\n{Colors.BLUE}Testing viewer cannot send invites...{Colors.RESET}")
            url = f"{self.base_url}/api/invite"
            headers = {
                'Authorization': f'Bearer {self.viewer_token}',
                'Content-Type': 'application/json'
            }
            
            invite_data = {
                'boardId': self.board_a_id,
                'email': 'another@example.com',
                'role': 'editor'
            }
            
            response = requests.post(url, json=invite_data, headers=headers)
            
            viewer_blocked = response.status_code == 403
            
            self.log_test(
                "Viewer CANNOT Send Invites",
                viewer_blocked,
                f"Viewer correctly blocked (403)" if viewer_blocked else f"Viewer not blocked: {response.status_code}"
            )
            
            # Test: Viewer CAN view cards
            print(f"\n{Colors.BLUE}Testing viewer can view cards...{Colors.RESET}")
            url = f"{self.base_url}/api/cards/{self.board_a_id}/cards"
            headers = {'Authorization': f'Bearer {self.viewer_token}'}
            
            response = requests.get(url, headers=headers)
            
            viewer_can_view = response.status_code == 200
            
            self.log_test(
                "Viewer CAN View Cards",
                viewer_can_view,
                f"Viewer can view cards" if viewer_can_view else f"Viewer cannot view cards: {response.status_code}"
            )
            
            return viewer_blocked and viewer_can_view
            
        except Exception as e:
            self.log_test("Test Permissions", False, f"Exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def print_summary(self):
        """Print test summary"""
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        print(f"{Colors.BOLD}TEST SUMMARY{Colors.RESET}")
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
        
        passed = sum(1 for r in self.test_results if r['passed'])
        total = len(self.test_results)
        
        print(f"\nTotal Tests: {total}")
        print(f"{Colors.GREEN}Passed: {passed}{Colors.RESET}")
        print(f"{Colors.RED}Failed: {total - passed}{Colors.RESET}")
        
        if total - passed > 0:
            print(f"\n{Colors.RED}Failed Tests:{Colors.RESET}")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  ✗ {result['test']}")
                    if result['message']:
                        print(f"    {result['message']}")
        
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}\n")
        
        return passed == total

def main():
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}FlowSpace SMTP Email Testing - Invite System{Colors.RESET}")
    print(f"{Colors.BOLD}{'='*60}{Colors.RESET}")
    
    print(f"\n{Colors.YELLOW}SMTP Configuration:{Colors.RESET}")
    print(f"  Email: {os.getenv('SMTP_EMAIL', 'Not configured')}")
    print(f"  Password: {'*' * 16 if os.getenv('SMTP_PASSWORD') else 'Not configured'}")
    print(f"  Frontend URL: {os.getenv('FRONTEND_URL', 'Not configured')}")
    print(f"  App URL: {os.getenv('APP_URL', 'Not configured')}")
    
    tester = FlowSpaceSMTPTester()
    
    # Setup
    if not tester.setup_test_data():
        print(f"\n{Colors.RED}Failed to setup test data. Exiting.{Colors.RESET}")
        return False
    
    try:
        # Run all tests
        tester.test_1_complete_invite_flow_with_email()
        tester.test_2_invite_with_board_selection()
        tester.test_3_accept_invite_and_join_board()
        tester.test_4_verify_collaboration_after_invite()
        tester.test_5_test_permissions()
        
        # Print summary
        all_passed = tester.print_summary()
        
        return all_passed
        
    finally:
        # Cleanup
        tester.cleanup_test_data()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
