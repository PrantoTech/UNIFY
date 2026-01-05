# UNIFY - Smart Campus Platform PRD

## Original Problem Statement
Create a full-stack MERN-based Smart Campus Platform named UNIFY that digitally connects students, mentors, and campus administration into a single centralized system.

## Architecture
- **Frontend**: React + TailwindCSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT
- **Real-time**: WebSocket for chat

## User Personas
1. **Students**: Access campus connect, clubs, mentoring, canteen, library, transport, events
2. **Mentors**: Manage mentees, appointments, create password-protected notes
3. **Admin**: Full platform control, user management, analytics

## Core Requirements (Static)
- Role-based authentication (Student/Mentor/Admin)
- Social feed with posts, likes, comments
- Club creation and membership
- Real-time WebSocket chat
- Mentor-mentee pairing with appointments
- Password-protected mentor notes
- Canteen menu with ordering
- Transport/Toto booking
- Library services
- Event calendar with registration
- Lost & Found reporting
- Complaint submission
- Feedback system
- Admin analytics dashboard

## What's Been Implemented (January 2025)
- ✅ Complete JWT authentication system
- ✅ Role-based routing and dashboards
- ✅ Campus Connect social feed
- ✅ Clubs with join/leave
- ✅ WebSocket real-time chat
- ✅ Mentor-mentee module with appointments
- ✅ Password-locked mentor notes
- ✅ Digital notice board
- ✅ Library with borrow/return
- ✅ Transport/Toto booking system
- ✅ Canteen menu with cart & ordering
- ✅ Event calendar with registration
- ✅ Lost & Found
- ✅ Complaint panel
- ✅ Feedback system
- ✅ Admin dashboard with analytics charts
- ✅ User management (add/delete)
- ✅ Theme toggle (light/dark)
- ✅ Responsive design
- ✅ Preloaded database with students, mentors, menu, events, complaints

## Preloaded Data
- Admin: admin@unify.com / Admin@123
- Students: Koyena Sengupta (D242506780), Priti Roy (D242506679)
- Mentors: Dr. Ananya Sharma, Prof. Rajesh Kumar
- Events: Sci-Tech Fest, Technical Model Competition
- Canteen: Breakfast, Lunch, Combos, Dinner items
- Complaints: Atanu Ghosal, Sumit Das
- Lost Items: Sunglass, Charger

## Prioritized Backlog
### P0 (Critical) - Done
- All core features implemented

### P1 (High Priority) - Future
- Push notifications
- Email notifications for appointments
- Profile image upload
- Mentor ratings/reviews

### P2 (Medium Priority) - Future
- Advanced analytics dashboard
- Export reports to PDF
- Group chat for clubs
- Event reminders

### P3 (Low Priority) - Future
- Mobile app version
- Calendar integration
- Payment integration for canteen
- QR code check-in for events

## Next Tasks
1. Add push notifications for appointments and events
2. Implement profile image upload
3. Add mentor rating system
4. Create group chat for each club
