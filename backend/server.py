from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'unify-campus-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="UNIFY - Smart Campus Platform")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"  # student, mentor, admin
    registration_no: Optional[str] = None
    mobile: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    registration_no: Optional[str] = None
    mobile: Optional[str] = None
    department: Optional[str] = None
    year: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    club_id: Optional[str] = None

class CommentCreate(BaseModel):
    post_id: str
    content: str

class ClubCreate(BaseModel):
    name: str
    description: str
    image_url: Optional[str] = None

class NoticeCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"  # low, normal, high, urgent

class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    time: Optional[str] = None
    venue: Optional[str] = None
    image_url: Optional[str] = None

class AppointmentCreate(BaseModel):
    mentor_id: str
    date: str
    time_slot: str
    reason: Optional[str] = None

class MentorNoteCreate(BaseModel):
    title: str
    content: str
    password: str
    mentee_id: Optional[str] = None

class ComplaintCreate(BaseModel):
    student_name: str
    department: str
    year: str
    description: str

class FeedbackCreate(BaseModel):
    student_name: str
    description: str

class LostFoundCreate(BaseModel):
    item_name: str
    description: str
    location: Optional[str] = None
    contact: Optional[str] = None
    item_type: str = "lost"  # lost, found
    image_url: Optional[str] = None

class CanteenOrderCreate(BaseModel):
    items: List[Dict[str, Any]]
    total_amount: float
    notes: Optional[str] = None

class TotoBookingCreate(BaseModel):
    driver_id: str
    pickup_location: str
    drop_location: str
    date: str
    time: str

class ChatMessage(BaseModel):
    content: str
    receiver_id: Optional[str] = None  # None for group chat
    group_id: Optional[str] = None

class MentorPairingCreate(BaseModel):
    mentee_id: str

# ==================== HELPER FUNCTIONS ====================

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def get_mentor_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["mentor", "admin"]:
        raise HTTPException(status_code=403, detail="Mentor access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "registration_no": user.registration_no,
        "mobile": user.mobile,
        "department": user.department,
        "year": user.year,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token({"sub": user_id, "role": user.role})
    
    user_response = UserResponse(
        id=user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        registration_no=user.registration_no,
        mobile=user.mobile,
        department=user.department,
        year=user.year,
        created_at=user_doc["created_at"]
    )
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": user["id"], "role": user["role"]})
    
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        registration_no=user.get("registration_no"),
        mobile=user.get("mobile"),
        department=user.get("department"),
        year=user.get("year"),
        profile_image=user.get("profile_image"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in current_user.items() if k != "password"})

# ==================== USERS ROUTES ====================

@api_router.get("/users")
async def get_users(role: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    if current_user["id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    allowed_fields = ["name", "mobile", "department", "year", "profile_image"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    return {"message": "User updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@api_router.post("/users/admin-create")
async def admin_create_user(user: UserCreate, current_user: dict = Depends(get_admin_user)):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_doc = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role,
        "registration_no": user.registration_no,
        "mobile": user.mobile,
        "department": user.department,
        "year": user.year,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    return {"message": "User created successfully", "id": user_id}

# ==================== POSTS ROUTES ====================

@api_router.post("/posts")
async def create_post(post: PostCreate, current_user: dict = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        "content": post.content,
        "image_url": post.image_url,
        "club_id": post.club_id,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "author_role": current_user["role"],
        "likes": [],
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.posts.insert_one(post_doc)
    return {**post_doc, "_id": None}

@api_router.get("/posts")
async def get_posts(club_id: Optional[str] = None, limit: int = 50):
    query = {}
    if club_id:
        query["club_id"] = club_id
    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    user_id = current_user["id"]
    if user_id in post.get("likes", []):
        await db.posts.update_one({"id": post_id}, {"$pull": {"likes": user_id}})
        action = "unliked"
    else:
        await db.posts.update_one({"id": post_id}, {"$push": {"likes": user_id}})
        action = "liked"
    
    return {"message": f"Post {action}", "action": action}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["author_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.delete_one({"id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    return {"message": "Post deleted"}

# ==================== COMMENTS ROUTES ====================

@api_router.post("/comments")
async def create_comment(comment: CommentCreate, current_user: dict = Depends(get_current_user)):
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        "post_id": comment.post_id,
        "content": comment.content,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.comments.insert_one(comment_doc)
    await db.posts.update_one({"id": comment.post_id}, {"$inc": {"comments_count": 1}})
    return {**comment_doc, "_id": None}

@api_router.get("/comments/{post_id}")
async def get_comments(post_id: str):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return comments

# ==================== CLUBS ROUTES ====================

@api_router.post("/clubs")
async def create_club(club: ClubCreate, current_user: dict = Depends(get_current_user)):
    club_id = str(uuid.uuid4())
    club_doc = {
        "id": club_id,
        "name": club.name,
        "description": club.description,
        "image_url": club.image_url,
        "creator_id": current_user["id"],
        "members": [current_user["id"]],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.clubs.insert_one(club_doc)
    return {**club_doc, "_id": None}

@api_router.get("/clubs")
async def get_clubs():
    clubs = await db.clubs.find({}, {"_id": 0}).to_list(100)
    return clubs

@api_router.post("/clubs/{club_id}/join")
async def join_club(club_id: str, current_user: dict = Depends(get_current_user)):
    club = await db.clubs.find_one({"id": club_id})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    
    if current_user["id"] in club.get("members", []):
        await db.clubs.update_one({"id": club_id}, {"$pull": {"members": current_user["id"]}})
        return {"message": "Left club", "action": "left"}
    else:
        await db.clubs.update_one({"id": club_id}, {"$push": {"members": current_user["id"]}})
        return {"message": "Joined club", "action": "joined"}

# ==================== NOTICES ROUTES ====================

@api_router.post("/notices")
async def create_notice(notice: NoticeCreate, current_user: dict = Depends(get_admin_user)):
    notice_id = str(uuid.uuid4())
    notice_doc = {
        "id": notice_id,
        "title": notice.title,
        "content": notice.content,
        "priority": notice.priority,
        "author_id": current_user["id"],
        "author_name": current_user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notices.insert_one(notice_doc)
    return {**notice_doc, "_id": None}

@api_router.get("/notices")
async def get_notices():
    notices = await db.notices.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notices

@api_router.delete("/notices/{notice_id}")
async def delete_notice(notice_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.notices.delete_one({"id": notice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")
    return {"message": "Notice deleted"}

# ==================== EVENTS ROUTES ====================

@api_router.post("/events")
async def create_event(event: EventCreate, current_user: dict = Depends(get_admin_user)):
    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "time": event.time,
        "venue": event.venue,
        "image_url": event.image_url,
        "registrations": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.events.insert_one(event_doc)
    return {**event_doc, "_id": None}

@api_router.get("/events")
async def get_events():
    events = await db.events.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return events

@api_router.post("/events/{event_id}/register")
async def register_event(event_id: str, current_user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user["id"] in event.get("registrations", []):
        await db.events.update_one({"id": event_id}, {"$pull": {"registrations": current_user["id"]}})
        return {"message": "Unregistered from event", "action": "unregistered"}
    else:
        await db.events.update_one({"id": event_id}, {"$push": {"registrations": current_user["id"]}})
        return {"message": "Registered for event", "action": "registered"}

# ==================== MENTOR-MENTEE ROUTES ====================

@api_router.post("/mentor/pair")
async def create_mentor_pairing(pairing: MentorPairingCreate, current_user: dict = Depends(get_mentor_user)):
    pairing_id = str(uuid.uuid4())
    pairing_doc = {
        "id": pairing_id,
        "mentor_id": current_user["id"],
        "mentee_id": pairing.mentee_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.mentor_pairings.insert_one(pairing_doc)
    return {**pairing_doc, "_id": None}

@api_router.get("/mentor/mentees")
async def get_mentees(current_user: dict = Depends(get_mentor_user)):
    pairings = await db.mentor_pairings.find({"mentor_id": current_user["id"]}, {"_id": 0}).to_list(100)
    mentee_ids = [p["mentee_id"] for p in pairings]
    mentees = await db.users.find({"id": {"$in": mentee_ids}}, {"_id": 0, "password": 0}).to_list(100)
    return mentees

@api_router.get("/mentor/my-mentor")
async def get_my_mentor(current_user: dict = Depends(get_current_user)):
    pairing = await db.mentor_pairings.find_one({"mentee_id": current_user["id"]}, {"_id": 0})
    if not pairing:
        return None
    mentor = await db.users.find_one({"id": pairing["mentor_id"]}, {"_id": 0, "password": 0})
    return mentor

@api_router.get("/mentors")
async def get_mentors():
    mentors = await db.users.find({"role": "mentor"}, {"_id": 0, "password": 0}).to_list(100)
    return mentors

# ==================== APPOINTMENTS ROUTES ====================

@api_router.post("/appointments")
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    appointment_id = str(uuid.uuid4())
    appointment_doc = {
        "id": appointment_id,
        "student_id": current_user["id"],
        "student_name": current_user["name"],
        "mentor_id": appointment.mentor_id,
        "date": appointment.date,
        "time_slot": appointment.time_slot,
        "reason": appointment.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.appointments.insert_one(appointment_doc)
    return {**appointment_doc, "_id": None}

@api_router.get("/appointments")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "mentor":
        query = {"mentor_id": current_user["id"]}
    elif current_user["role"] == "admin":
        query = {}
    else:
        query = {"student_id": current_user["id"]}
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("date", 1).to_list(100)
    return appointments

@api_router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, status: str = Query(...), current_user: dict = Depends(get_mentor_user)):
    await db.appointments.update_one({"id": appointment_id}, {"$set": {"status": status}})
    return {"message": "Appointment status updated"}

# ==================== MENTOR NOTES ROUTES ====================

@api_router.post("/mentor-notes")
async def create_mentor_note(note: MentorNoteCreate, current_user: dict = Depends(get_mentor_user)):
    note_id = str(uuid.uuid4())
    hashed_password = get_password_hash(note.password)
    note_doc = {
        "id": note_id,
        "title": note.title,
        "content": note.content,
        "password": hashed_password,
        "mentor_id": current_user["id"],
        "mentee_id": note.mentee_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.mentor_notes.insert_one(note_doc)
    return {"id": note_id, "title": note.title, "created_at": note_doc["created_at"]}

@api_router.get("/mentor-notes")
async def get_mentor_notes(current_user: dict = Depends(get_mentor_user)):
    notes = await db.mentor_notes.find({"mentor_id": current_user["id"]}, {"_id": 0, "password": 0, "content": 0}).to_list(100)
    return notes

@api_router.post("/mentor-notes/{note_id}/unlock")
async def unlock_mentor_note(note_id: str, password: str = Query(...), current_user: dict = Depends(get_mentor_user)):
    note = await db.mentor_notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not verify_password(password, note["password"]):
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"id": note["id"], "title": note["title"], "content": note["content"], "created_at": note["created_at"]}

# ==================== COMPLAINTS ROUTES ====================

@api_router.post("/complaints")
async def create_complaint(complaint: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    complaint_id = str(uuid.uuid4())
    complaint_doc = {
        "id": complaint_id,
        "student_name": complaint.student_name,
        "department": complaint.department,
        "year": complaint.year,
        "description": complaint.description,
        "reporter_id": current_user["id"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.complaints.insert_one(complaint_doc)
    return {**complaint_doc, "_id": None}

@api_router.get("/complaints")
async def get_complaints(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        complaints = await db.complaints.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        complaints = await db.complaints.find({"reporter_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return complaints

@api_router.put("/complaints/{complaint_id}/status")
async def update_complaint_status(complaint_id: str, status: str = Query(...), current_user: dict = Depends(get_admin_user)):
    await db.complaints.update_one({"id": complaint_id}, {"$set": {"status": status}})
    return {"message": "Complaint status updated"}

# ==================== FEEDBACK ROUTES ====================

@api_router.post("/feedback")
async def create_feedback(feedback: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    feedback_id = str(uuid.uuid4())
    feedback_doc = {
        "id": feedback_id,
        "student_name": feedback.student_name,
        "description": feedback.description,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feedback.insert_one(feedback_doc)
    return {**feedback_doc, "_id": None}

@api_router.get("/feedback")
async def get_feedback(current_user: dict = Depends(get_admin_user)):
    feedback = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return feedback

# ==================== LOST & FOUND ROUTES ====================

@api_router.post("/lost-found")
async def create_lost_found(item: LostFoundCreate, current_user: dict = Depends(get_current_user)):
    item_id = str(uuid.uuid4())
    item_doc = {
        "id": item_id,
        "item_name": item.item_name,
        "description": item.description,
        "location": item.location,
        "contact": item.contact,
        "item_type": item.item_type,
        "image_url": item.image_url,
        "reporter_id": current_user["id"],
        "reporter_name": current_user["name"],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.lost_found.insert_one(item_doc)
    return {**item_doc, "_id": None}

@api_router.get("/lost-found")
async def get_lost_found():
    items = await db.lost_found.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return items

@api_router.put("/lost-found/{item_id}/status")
async def update_lost_found_status(item_id: str, status: str = Query(...), current_user: dict = Depends(get_current_user)):
    await db.lost_found.update_one({"id": item_id}, {"$set": {"status": status}})
    return {"message": "Status updated"}

# ==================== CANTEEN ROUTES ====================

@api_router.get("/canteen/menu")
async def get_canteen_menu():
    menu = await db.canteen_menu.find({}, {"_id": 0}).to_list(100)
    return menu

@api_router.post("/canteen/orders")
async def create_canteen_order(order: CanteenOrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "items": order.items,
        "total_amount": order.total_amount,
        "notes": order.notes,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.canteen_orders.insert_one(order_doc)
    return {**order_doc, "_id": None}

@api_router.get("/canteen/orders")
async def get_canteen_orders(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        orders = await db.canteen_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        orders = await db.canteen_orders.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return orders

# ==================== TRANSPORT / TOTO ROUTES ====================

@api_router.get("/transport/drivers")
async def get_toto_drivers():
    drivers = await db.toto_drivers.find({}, {"_id": 0}).to_list(20)
    return drivers

@api_router.post("/transport/bookings")
async def create_toto_booking(booking: TotoBookingCreate, current_user: dict = Depends(get_current_user)):
    booking_id = str(uuid.uuid4())
    booking_doc = {
        "id": booking_id,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "driver_id": booking.driver_id,
        "pickup_location": booking.pickup_location,
        "drop_location": booking.drop_location,
        "date": booking.date,
        "time": booking.time,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.toto_bookings.insert_one(booking_doc)
    return {**booking_doc, "_id": None}

@api_router.get("/transport/bookings")
async def get_toto_bookings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        bookings = await db.toto_bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        bookings = await db.toto_bookings.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return bookings

# ==================== LIBRARY ROUTES ====================

@api_router.get("/library/books")
async def get_library_books():
    books = await db.library_books.find({}, {"_id": 0}).to_list(200)
    return books

@api_router.post("/library/borrow/{book_id}")
async def borrow_book(book_id: str, current_user: dict = Depends(get_current_user)):
    book = await db.library_books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    if book.get("borrowed_by"):
        raise HTTPException(status_code=400, detail="Book already borrowed")
    
    await db.library_books.update_one({"id": book_id}, {"$set": {"borrowed_by": current_user["id"], "borrowed_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Book borrowed successfully"}

@api_router.post("/library/return/{book_id}")
async def return_book(book_id: str, current_user: dict = Depends(get_current_user)):
    await db.library_books.update_one({"id": book_id}, {"$set": {"borrowed_by": None, "borrowed_at": None}})
    return {"message": "Book returned successfully"}

# ==================== CHAT ROUTES ====================

@api_router.post("/chat/messages")
async def send_message(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    message_id = str(uuid.uuid4())
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "content": message.content,
        "receiver_id": message.receiver_id,
        "group_id": message.group_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(message_doc)
    return {**message_doc, "_id": None}

@api_router.get("/chat/messages")
async def get_messages(receiver_id: Optional[str] = None, group_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if group_id:
        query = {"group_id": group_id}
    elif receiver_id:
        query = {"$or": [
            {"sender_id": current_user["id"], "receiver_id": receiver_id},
            {"sender_id": receiver_id, "receiver_id": current_user["id"]}
        ]}
    else:
        query = {"group_id": "campus-general"}
    
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(200)
    return messages

# ==================== ANALYTICS ROUTES ====================

@api_router.get("/analytics")
async def get_analytics(current_user: dict = Depends(get_admin_user)):
    total_students = await db.users.count_documents({"role": "student"})
    total_mentors = await db.users.count_documents({"role": "mentor"})
    total_posts = await db.posts.count_documents({})
    total_events = await db.events.count_documents({})
    total_complaints = await db.complaints.count_documents({})
    pending_complaints = await db.complaints.count_documents({"status": "pending"})
    total_orders = await db.canteen_orders.count_documents({})
    total_bookings = await db.toto_bookings.count_documents({})
    
    return {
        "total_students": total_students,
        "total_mentors": total_mentors,
        "total_posts": total_posts,
        "total_events": total_events,
        "total_complaints": total_complaints,
        "pending_complaints": pending_complaints,
        "total_orders": total_orders,
        "total_bookings": total_bookings
    }

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

# ==================== WEBSOCKET FOR REAL-TIME CHAT ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)
    
    async def broadcast(self, message: str, exclude: str = None):
        for user_id, connection in self.active_connections.items():
            if user_id != exclude:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Save message to database
            message_id = str(uuid.uuid4())
            message_doc = {
                "id": message_id,
                "sender_id": user_id,
                "sender_name": message_data.get("sender_name", "Unknown"),
                "content": message_data.get("content", ""),
                "receiver_id": message_data.get("receiver_id"),
                "group_id": message_data.get("group_id", "campus-general"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.chat_messages.insert_one(message_doc)
            
            # Broadcast or send to specific user
            response = json.dumps({**message_doc, "_id": None})
            if message_data.get("receiver_id"):
                await manager.send_personal_message(response, message_data["receiver_id"])
                await manager.send_personal_message(response, user_id)
            else:
                await manager.broadcast(response)
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    admin_exists = await db.users.find_one({"email": "admin@unify.com"})
    if admin_exists:
        return {"message": "Database already seeded"}
    
    # Create Admin
    admin_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": admin_id,
        "name": "Admin",
        "email": "admin@unify.com",
        "password": get_password_hash("Admin@123"),
        "role": "admin",
        "registration_no": None,
        "mobile": "9000000000",
        "department": "Administration",
        "year": None,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Create preloaded students
    student1_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": student1_id,
        "name": "Koyena Sengupta",
        "email": "koyena@unify.com",
        "password": get_password_hash("Student@123"),
        "role": "student",
        "registration_no": "D242506780",
        "mobile": "9439562284",
        "department": "Computer Science & Technology",
        "year": "3rd",
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    student2_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": student2_id,
        "name": "Priti Roy",
        "email": "priti@unify.com",
        "password": get_password_hash("Student@123"),
        "role": "student",
        "registration_no": "D242506679",
        "mobile": "9885431289",
        "department": "Mechanical Engineering",
        "year": "2nd",
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Create mentors
    mentor1_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": mentor1_id,
        "name": "Dr. Ananya Sharma",
        "email": "ananya@unify.com",
        "password": get_password_hash("Mentor@123"),
        "role": "mentor",
        "registration_no": None,
        "mobile": "9876543210",
        "department": "Computer Science & Technology",
        "year": None,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    mentor2_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": mentor2_id,
        "name": "Prof. Rajesh Kumar",
        "email": "rajesh@unify.com",
        "password": get_password_hash("Mentor@123"),
        "role": "mentor",
        "registration_no": None,
        "mobile": "9876543211",
        "department": "Mechanical Engineering",
        "year": None,
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Create Canteen Menu
    canteen_menu = [
        # Breakfast
        {"id": str(uuid.uuid4()), "category": "breakfast", "name": "Tea / Coffee", "price": 15, "image_url": "https://images.unsplash.com/photo-1680118920033-9898dd878a30?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "breakfast", "name": "Masala Dosa", "price": 40, "image_url": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "breakfast", "name": "Poha", "price": 25, "image_url": "https://images.unsplash.com/photo-1736239093746-153503352f8d?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "breakfast", "name": "Bread Jam", "price": 20, "image_url": "https://images.pexels.com/photos/15698219/pexels-photo-15698219.jpeg?w=400", "available": True},
        # Lunch
        {"id": str(uuid.uuid4()), "category": "lunch", "name": "Plain Rice", "price": 30, "image_url": "https://images.unsplash.com/photo-1719670712556-638018bd8238?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "lunch", "name": "Onion Masoor Dal Masala", "price": 35, "image_url": "https://images.unsplash.com/photo-1666251214795-a1296307d29c?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "lunch", "name": "Chicken Kasha", "price": 80, "image_url": "https://images.unsplash.com/photo-1708184528306-f75a0a5118ee?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "lunch", "name": "Egg Curry", "price": 50, "image_url": "https://images.pexels.com/photos/4611424/pexels-photo-4611424.jpeg?w=400", "available": True},
        # Lunch Combos
        {"id": str(uuid.uuid4()), "category": "combo", "name": "Fried Rice & Chilli Chicken", "price": 120, "image_url": "https://images.unsplash.com/photo-1749880183062-ffbf14738723?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "combo", "name": "Basanti Polau & Chicken Kosha", "price": 140, "image_url": "https://images.pexels.com/photos/10078268/pexels-photo-10078268.jpeg?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "combo", "name": "Chowmein & Chicken Manchurian", "price": 110, "image_url": "https://images.pexels.com/photos/32797056/pexels-photo-32797056.jpeg?w=400", "available": True},
        # Dinner
        {"id": str(uuid.uuid4()), "category": "dinner", "name": "Chapati", "price": 10, "image_url": "https://images.unsplash.com/photo-1595959524165-0d395008e55b?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "dinner", "name": "Salad", "price": 25, "image_url": "https://images.unsplash.com/photo-1627366422957-3efa9c6df0fc?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "dinner", "name": "Chicken Curry", "price": 70, "image_url": "https://images.unsplash.com/photo-1736680056361-6a2f6e35fa50?w=400", "available": True},
        {"id": str(uuid.uuid4()), "category": "dinner", "name": "Gulab Jamun", "price": 30, "image_url": "https://images.pexels.com/photos/9619560/pexels-photo-9619560.jpeg?w=400", "available": True},
    ]
    await db.canteen_menu.insert_many(canteen_menu)
    
    # Create Events
    events = [
        {"id": str(uuid.uuid4()), "title": "Sci-Tech Fest", "description": "Annual Science & Technology Festival with workshops, exhibitions, and competitions", "date": "2025-01-06", "time": "10:00 AM", "venue": "Main Auditorium", "image_url": None, "registrations": [], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Technical Model Competition", "description": "Showcase your engineering skills in this technical model competition", "date": "2025-01-07", "time": "09:00 AM", "venue": "Engineering Block", "image_url": None, "registrations": [], "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.events.insert_many(events)
    
    # Create Lost & Found items
    lost_found = [
        {"id": str(uuid.uuid4()), "item_name": "Sunglass", "description": "Black Ray-Ban sunglasses found near library", "location": "Library", "contact": "Reception", "item_type": "found", "image_url": None, "reporter_id": admin_id, "reporter_name": "Admin", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "item_name": "Charger", "description": "65W laptop charger found in Canteen", "location": "Canteen", "contact": "Reception", "item_type": "found", "image_url": None, "reporter_id": admin_id, "reporter_name": "Admin", "status": "active", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.lost_found.insert_many(lost_found)
    
    # Create Complaints
    complaints = [
        {"id": str(uuid.uuid4()), "student_name": "Atanu Ghosal", "department": "Mechanical Engineering", "year": "2nd", "description": "Disturbance in library", "reporter_id": student2_id, "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "student_name": "Sumit Das", "department": "Computer Science & Engineering", "year": "3rd", "description": "Making noise in class", "reporter_id": student1_id, "status": "pending", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.complaints.insert_many(complaints)
    
    # Create Toto Drivers
    toto_drivers = [
        {"id": str(uuid.uuid4()), "name": "Ramesh Kumar", "phone": "9876543201", "vehicle_no": "WB-01-1234", "available": True, "timing": "9:30 AM - 6:10 PM"},
        {"id": str(uuid.uuid4()), "name": "Suresh Das", "phone": "9876543202", "vehicle_no": "WB-01-5678", "available": True, "timing": "9:30 AM - 6:10 PM"},
        {"id": str(uuid.uuid4()), "name": "Mohan Singh", "phone": "9876543203", "vehicle_no": "WB-01-9012", "available": True, "timing": "9:30 AM - 6:10 PM"},
    ]
    await db.toto_drivers.insert_many(toto_drivers)
    
    # Create Library Books
    library_books = [
        {"id": str(uuid.uuid4()), "title": "Data Structures and Algorithms", "author": "Thomas H. Cormen", "isbn": "978-0262033848", "category": "Computer Science", "borrowed_by": None, "borrowed_at": None},
        {"id": str(uuid.uuid4()), "title": "Engineering Mechanics", "author": "R.S. Khurmi", "isbn": "978-8121925242", "category": "Mechanical Engineering", "borrowed_by": None, "borrowed_at": None},
        {"id": str(uuid.uuid4()), "title": "Database Management Systems", "author": "Raghu Ramakrishnan", "isbn": "978-0072465631", "category": "Computer Science", "borrowed_by": None, "borrowed_at": None},
        {"id": str(uuid.uuid4()), "title": "Thermodynamics", "author": "P.K. Nag", "isbn": "978-0070681132", "category": "Mechanical Engineering", "borrowed_by": None, "borrowed_at": None},
        {"id": str(uuid.uuid4()), "title": "Operating System Concepts", "author": "Abraham Silberschatz", "isbn": "978-1118063330", "category": "Computer Science", "borrowed_by": None, "borrowed_at": None},
    ]
    await db.library_books.insert_many(library_books)
    
    # Create Clubs
    clubs = [
        {"id": str(uuid.uuid4()), "name": "Coding Club", "description": "For programming enthusiasts", "image_url": None, "creator_id": admin_id, "members": [admin_id, student1_id], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Robotics Club", "description": "Build and innovate with robots", "image_url": None, "creator_id": admin_id, "members": [admin_id, student2_id], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Cultural Club", "description": "Celebrate art, music, and dance", "image_url": None, "creator_id": admin_id, "members": [admin_id], "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.clubs.insert_many(clubs)
    
    # Create Notices
    notices = [
        {"id": str(uuid.uuid4()), "title": "Welcome to UNIFY", "content": "Welcome to the UNIFY Smart Campus Platform. Connect, collaborate, and grow together!", "priority": "high", "author_id": admin_id, "author_name": "Admin", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Library Timings", "content": "Library is open from 9:00 AM to 8:00 PM on weekdays. Saturday: 10:00 AM to 5:00 PM", "priority": "normal", "author_id": admin_id, "author_name": "Admin", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.notices.insert_many(notices)
    
    return {"message": "Database seeded successfully"}

@api_router.get("/")
async def root():
    return {"message": "UNIFY Smart Campus Platform API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
