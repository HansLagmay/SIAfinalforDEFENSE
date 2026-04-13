# 🎯 TES Property System - User Stories & Features

Complete list of features organized by user role with user story format.

---

## 📋 Table of Contents
- [Customer User Stories](#-customer-user-stories)
- [Agent User Stories](#-agent-user-stories)
- [Admin User Stories](#-admin-user-stories)
- [Super Admin User Stories](#-super-admin-user-stories)

---

## 👥 Customer User Stories

### Authentication & Account Management

**As a customer, I want to:**

1. **Sign up for an account** so that I can submit property inquiries and track my appointments
   - Create account with email, password, name, and phone
   - Receive immediate account activation
   - Secure password storage with bcrypt hashing
   - JWT token-based authentication (30-day sessions)

2. **Log in to my account** so that I can access my personalized dashboard
   - Login with email and password
   - Automatic session management
   - Persistent login for 30 days
   - Secure token storage

3. **Log out of my account** so that I can secure my session
   - One-click logout
   - Clear session data
   - Return to public homepage

### Property Browsing

**As a customer, I want to:**

4. **Browse all available properties** without needing to log in
   - View property listings in card/grid layout
   - See property images, titles, prices, and locations
   - Filter by property type, price range, bedrooms, etc.
   - Quick access to property details
   - Responsive design for mobile browsing

5. **View detailed property information** to make informed decisions
   - See full property description
   - View image gallery with multiple photos
   - See key features (bedrooms, bathrooms, area)
   - View property status (available, reserved, sold)
   - See pricing information
   - View location details

6. **Navigate through property images** to see all property photos
   - Image gallery with thumbnail navigation
   - Full-screen image viewing
   - Previous/next image controls
   - Smooth image transitions

### Inquiry Management

**As a customer, I want to:**

7. **Submit a property inquiry** when I'm interested in a property
   - Authentication required (must be logged in)
   - Pre-filled customer information from profile
   - Add custom message/questions
   - Receive unique ticket number (e.g., INQ-2026-001)
   - Instant confirmation of submission

8. **See if I already have an active inquiry** for a property to avoid duplicates
   - Automatic duplicate detection
   - Warning message if active inquiry exists
   - Show existing ticket number
   - Display existing inquiry status
   - Cannot submit duplicate until previous inquiry is resolved

9. **View all my submitted inquiries** in one place
   - See list of all inquiries I've submitted
   - View ticket numbers for tracking
   - See inquiry status (new, contacted, viewing scheduled, etc.)
   - View property details for each inquiry
   - See submission date and time
   - Track inquiry progress

10. **Check the status of my inquiries** to know what's happening
    - Real-time status updates
    - Status indicators: new, claimed, assigned, contacted, in-progress, viewing-scheduled, etc.
    - Know which agent is handling my inquiry
    - See when status was last updated

### Appointments

**As a customer, I want to:**

11. **View my scheduled property viewings** so I know when to visit
    - See all upcoming viewing appointments
    - View date and time of viewings
    - See property details for each viewing
    - See assigned agent information
    - Get viewing location/address
    - See viewing type (in-person, virtual)

12. **Receive viewing confirmations** when agent schedules a viewing
    - Automatic linking to calendar when viewing is scheduled
    - See viewing details immediately
    - Know which property and when
    - Contact information for assigned agent

### User Experience

**As a customer, I want to:**

13. **Navigate easily between pages** for a smooth experience
    - Responsive navigation bar
    - Quick access to properties, inquiries, appointments
    - Mobile-friendly menu
    - Breadcrumb navigation
    - Back to home button

14. **Get helpful error messages** when something goes wrong
    - Clear error descriptions
    - Suggested solutions
    - Form validation feedback
    - Connection status indicators

15. **Have a personalized dashboard** to manage everything in one place
    - See overview of my inquiries
    - Quick access to appointments
    - Profile information
    - Activity summary

---

## 🤵 Agent User Stories

### Authentication & Profile

**As an agent, I want to:**

1. **Log in to my agent portal** to manage my work
   - Secure login with email and password
   - Role-based access (agent role required)
   - 30-day session management
   - Access restricted to agent-only features

2. **View my agent dashboard** to see my work overview
   - See number of active inquiries assigned to me
   - View pending tasks
   - See today's scheduled viewings
   - Performance metrics (inquiries handled, viewings scheduled)
   - Quick access to key features

### Inquiry Management

**As an agent, I want to:**

3. **See all available inquiries** that haven't been claimed yet
   - View unassigned inquiries in "Available Tickets" section
   - See customer name, property, and inquiry details
   - Filter by new inquiries
   - Sort by submission date
   - See ticket numbers

4. **Claim an inquiry** to take ownership and start working on it
   - Click "Claim This Ticket" button
   - Inquiry automatically assigned to me
   - Status automatically changes from "new" to "claimed"
   - First-come, first-served basis
   - Prevent double-claiming (race condition protection)

5. **View all my assigned inquiries** to manage my workload
   - See all inquiries assigned to me
   - Filter by status (claimed, contacted, in-progress, etc.)
   - Expandable detail view
   - Quick status updates
   - Priority indicators

6. **Update inquiry status** as I progress through the sales process
   - Change status: contacted, in-progress, viewing-scheduled
   - Add notes about customer interactions
   - Track follow-up dates
   - Document customer preferences
   - Mark negotiation progress

7. **Contact customers directly** from the inquiry details
   - Click-to-call phone numbers
   - Click-to-email addresses
   - See customer contact information
   - Communication history

8. **View inquiry details** to understand customer needs
   - See customer message/questions
   - View property they're interested in
   - See inquiry submission date
   - View ticket number for reference
   - See customer contact information

### Calendar & Viewing Management

**As an agent, I want to:**

9. **View my calendar** to see all scheduled events
   - Monthly calendar view
   - Color-coded events
   - See viewing appointments
   - See meetings
   - Filter by event type
   - Navigate between months

10. **Schedule property viewings** for interested customers
    - Link viewing to specific inquiry
    - Select date and time
    - Add viewing notes/instructions
    - Set viewing duration
    - Conflict detection (prevent double-booking)
    - Automatic inquiry status update to "viewing-scheduled"

11. **Reschedule viewings** when plans change
    - Click "Reschedule" from calendar
    - Select new date/time
    - Update viewing details
    - Conflict checking
    - Keep inquiry link intact

12. **Mark viewings as completed** after they happen
    - Click "✓ Done" button
    - Indicate customer interest level (interested/not interested)
    - Automatic status update: "viewed-interested" or "viewed-not-interested"
    - Remove completed viewing from calendar
    - Activity log entry

13. **Cancel viewings** when necessary
    - Click "✗ Cancel" button
    - Provide cancellation reason
    - Remove from calendar
    - Update relevant records
    - Log cancellation activity

14. **See viewing details** in my calendar
    - Customer name and contact
    - Property information
    - Viewing time and duration
    - Ticket number reference
    - Viewing notes

### Property Management

**As an agent, I want to:**

15. **Create draft property listings** for admin review
    - Add property details (title, type, price, location)
    - Upload property images
    - Add features and descriptions
    - Set property as draft
    - Submit for admin approval
    - Cannot publish directly

16. **View all properties** to answer customer questions
    - Browse property catalog
    - Filter by status (available, reserved, sold)
    - View property details
    - Access property information quickly
    - See which properties have inquiries

### Commission Tracking

**As an agent, I want to:**

17. **View my commission information** to track earnings
    - See properties I've sold
    - View commission amounts
    - Track payment status
    - See sale dates
    - Performance summary

18. **Track my sales performance** to measure success
    - Number of successful deals
    - Total commission earned
    - Conversion rates
    - Active vs. closed inquiries
    - Monthly/yearly performance

### Workflow Management

**As an agent, I want to:**

19. **See customer inquiry history** to provide better service
    - View all inquiries from same customer
    - See previous interactions
    - Track customer preferences
    - Avoid duplicate efforts

20. **Receive only inquiries relevant to me** to focus my work
    - See only my assigned inquiries
    - See unclaimed/available inquiries
    - Don't see other agents' assigned inquiries
    - Privacy protection

---

## 🔧 Admin User Stories

### Authentication & Dashboard

**As an admin, I want to:**

1. **Log in to the admin portal** to manage the entire system
   - Secure admin login
   - Full system access
   - Role-based permissions (admin role required)
   - Override capabilities

2. **View admin dashboard** to monitor system health
   - See total properties, inquiries, agents
   - View system activity overview
   - See pending tasks
   - Monitor agent performance
   - See recent activity

### Property Management

**As an admin, I want to:**

3. **Create new property listings** for the catalog
   - Add complete property details
   - Upload multiple images
   - Set property status (draft, available, reserved, etc.)
   - Add features and amenities
   - Publish immediately or save as draft
   - Set pricing and specifications

4. **Edit existing properties** to keep information current
   - Update property details
   - Change pricing
   - Update status (available → reserved → sold)
   - Add/remove images
   - Modify descriptions
   - Track status history

5. **Delete properties** that are no longer relevant
   - Remove property listings
   - Confirmation before deletion
   - Cascade deletion of related data
   - Audit trail of deletion

6. **Upload multiple property images** to showcase properties
   - Drag-and-drop image upload
   - Multiple image selection
   - 5MB per image limit
   - Preview before upload
   - Set primary image
   - Reorder images

7. **Manage property status** throughout the sales cycle
   - Change status: draft → available → reserved → sold
   - Add status change reason
   - Track who made changes
   - View status history
   - See status change timeline

8. **Track property views** to understand interest
   - See how many times property was viewed
   - View history with timestamps
   - Identify popular properties
   - Analyze viewing patterns

9. **Record property sales** when deals are completed
   - Mark property as sold
   - Record sale price
   - Assign selling agent
   - Calculate commission
   - Record sale date
   - Update property status

### User Management

**As an admin, I want to:**

10. **Create new agent accounts** to expand the team
    - Add agent with email, name, password
    - Set initial credentials
    - Assign agent role automatically
    - Welcome email capability
    - Account activation

11. **View all users** to manage the team
    - See list of all agents and admins
    - View user details
    - See user roles
    - Check account creation dates
    - Filter by role

12. **Delete user accounts** when needed
    - Remove agent accounts
    - Confirmation before deletion
    - Reassign agent's inquiries
    - Audit trail
    - Cannot delete self

### Inquiry Management

**As an admin, I want to:**

13. **View all inquiries** across all agents
    - See complete inquiry list
    - Filter by status
    - Filter by agent
    - Search by ticket number
    - See unassigned inquiries

14. **Assign inquiries to specific agents** for better workload distribution
    - Manual inquiry assignment
    - Select agent from dropdown
    - Override existing assignments (reassign)
    - Automatic status change to "assigned"
    - Agent notification capability

15. **Update inquiry status** to manage workflow
    - Change any status except "claimed"
    - Status options: new, assigned, contacted, in-progress, viewing-scheduled, negotiating, viewed-interested, viewed-not-interested, deal-successful, deal-cancelled, no-response
    - Cannot manually set to "claimed" (agent-only action)
    - Track status history
    - Audit trail

16. **Delete inquiries** when necessary
    - Remove spam or invalid inquiries
    - Confirmation before deletion
    - Audit trail
    - Clean up old inquiries

17. **View agent workload** to balance assignments
    - See inquiries per agent
    - Active vs. completed
    - Success rates
    - Response times
    - Performance comparison

### Activity Monitoring

**As an admin, I want to:**

18. **View activity logs** to audit system actions
    - See all system actions
    - Filter by action type
    - Filter by user
    - Search by date range
    - View detailed descriptions
    - Track who did what and when

19. **Monitor system usage** to ensure smooth operation
    - Track login attempts
    - Monitor API usage
    - See error rates
    - Database health
    - System performance

### Database Management

**As an admin, I want to:**

20. **Access database utilities** for advanced management
    - View raw table data
    - Export data to files
    - Generate reports
    - Database backup capability
    - Data integrity checks

21. **Manage system settings** to configure the platform
    - Update system configurations
    - Manage email templates
    - Set business rules
    - Configure notifications
    - Adjust rate limits

### Reporting

**As an admin, I want to:**

22. **Generate sales reports** to track business performance
    - Total sales by period
    - Commission summaries
    - Agent performance reports
    - Property performance
    - Conversion rates

23. **Export data** for external analysis
    - Export properties to CSV/JSON
    - Export inquiries with filters
    - Export user lists
    - Export activity logs
    - Custom date ranges

---

## 🔐 Super Admin User Stories

### Database Portal Access

**As a super admin, I want to:**

1. **Access the database portal** for direct database inspection
   - Separate super admin login
   - Highest level access
   - Database exploration tools
   - Direct table access

2. **View all database tables** to inspect data
   - See table list
   - View table schemas
   - Check table statistics
   - Monitor data integrity

3. **Inspect raw table data** for troubleshooting
   - Browse table contents
   - Search within tables
   - View relationships
   - Check data consistency

4. **View file metadata** to understand data structure
   - See table sizes
   - Row counts
   - Index information
   - Database statistics

5. **Export entire database** for backups
   - Full database export
   - Selective table export
   - JSON format export
   - Backup scheduling

6. **Monitor database health** to ensure system stability
   - Connection pool status
   - Query performance
   - Database size
   - Growth trends

---

## 🔄 Cross-Cutting Features

### Security Features

**All users benefit from:**

1. **JWT Authentication** - Secure token-based sessions (30-day expiry)
2. **Password Security** - Bcrypt hashing with salt
3. **Rate Limiting** - Protection against brute force attacks
4. **CORS Protection** - Restricted API access
5. **Input Sanitization** - XSS and SQL injection prevention
6. **Secure Headers** - Helmet.js security headers
7. **Role-Based Access Control** - Enforced permissions
8. **Session Management** - Automatic token refresh

### System Features

**The platform provides:**

1. **Activity Logging** - Complete audit trail of all actions
2. **Error Handling** - Graceful error recovery and user-friendly messages
3. **Data Validation** - Input validation on all forms
4. **Real-time Updates** - Instant status changes and notifications
5. **Responsive Design** - Mobile, tablet, and desktop optimized
6. **Performance Optimization** - Fast load times and efficient queries
7. **Database Migrations** - Safe schema updates and versioning
8. **Backup & Recovery** - Data protection and restoration

---

## 📊 Feature Summary Statistics

### Customer Features: **15 user stories**
- Authentication: 3
- Property Browsing: 3
- Inquiry Management: 4
- Appointments: 2
- User Experience: 3

### Agent Features: **20 user stories**
- Authentication: 2
- Inquiry Management: 6
- Calendar Management: 6
- Property Management: 2
- Commission Tracking: 2
- Workflow Management: 2

### Admin Features: **23 user stories**
- Authentication & Dashboard: 2
- Property Management: 7
- User Management: 3
- Inquiry Management: 5
- Activity Monitoring: 2
- Database Management: 2
- Reporting: 2

### Super Admin Features: **6 user stories**
- Database Portal: 6

### Cross-Cutting Features: **16 features**
- Security: 8
- System: 8

---

## 🎯 Total System Features

**80+ User Stories** across all roles, providing comprehensive real estate management platform with:
- ✅ Complete property lifecycle management
- ✅ Intelligent inquiry workflow automation
- ✅ Advanced calendar and viewing management
- ✅ Multi-role access with appropriate permissions
- ✅ Enterprise-level security and auditing
- ✅ Professional customer experience
- ✅ Agent productivity tools
- ✅ Admin control and oversight
- ✅ Database administration capabilities

---

*Last Updated: March 12, 2026*
*TES Property Management System v2.0*
