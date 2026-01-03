# Dayflow HRMS

Dayflow is a modern, web-based Human Resource Management System (HRMS) built to streamline employee management, attendance tracking, leave management, and payroll processing. It features distinct dashboards for HR Administrators and Employees, ensuring a secure and role-specific experience.
##  Features included:
### For Employees
*   * attendance Tracking*: Easy Check-In and Check-Out with real-time status updates and a 10-day history view.
*   *Leave Management*: Apply for leaves with dates and reasons. View the status of requests (Approved/Rejected/Pending) along with comments from HR.
*   *Profile Management*: View and update personal details (Address, Phone). View read-only job information (Department, Designation, Salary Structure updated by HR).
*   *Payroll History*: View a complete history of salary payments received.
### For HR Administrators
*   *Employee Management*: View all employees, edit their Department, Designation, Joining Date, and Base Salary.
*   *Leave Requests*: Review pending leave requests. Approve or Reject them with optional comments.
*   *Payroll Processing*: Manage employee base salaries and process monthly payroll with a single click. View payment history.
*   *Role-Based Access*: Secure login ensures only authorized HR personnel can access administrative features.
##  Tech Stack
*   *Frontend*: React (Vite)
*   *Styling*: Tailwind CSS, Lucide React (Icons)
*   *Backend / Database*: Supabase (PostgreSQL, Auth, Realtime)
*   *Routing*: React Router DOM
##  Setup & Installation
1.  *Clone the Repository*
    bash
    git clone <repository_url>
    cd hrmdayflow
    
2.  *Install Dependencies*
    bash
    npm install
    
3.  *Supabase Configuration*
    *   Create a project on [Supabase](https://supabase.com/).
    *   Create a .env file in the root directory:
        env
        VITE_SUPABASE_URL=your_supabase_project_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        
4.  *Database Setup (SQL Scripts)*
    Run the following scripts in your Supabase SQL Editor in this order to set up the tables and triggers:
    1.  schema.sql (Core tables: profiles, attendance, leaves)
    2.  payroll_schema.sql (Payroll table & Base salary column)
    3.  update_profile_schema.sql (Extended profile fields: phone, address, etc.)
    4.  update_leave_schema.sql (Admin comments for leaves)
    5.  fix_profile_updated_at.sql (Fix for profile timestamps)
5.  *Run the Application*
    bash
    npm run dev
    
##  Database Schema Overview
*   *profiles*: Extends the default Supabase auth user. Stores custom fields like role, department, base_salary, full_name, etc.
*   *attendance*: tracks daily check-in and check-out times linked to user_id.
*   *leave_requests*: Stores leave applications with start_date, end_date, status, and admin_comment.
*   *payroll*: Records processed salary payments with amount, date, and status.
##  Authentication & Roles
*   *Sign Up: New users sign up with an email, password, and **Role* (Employee or HR).
*   *Triggers*: A database trigger automatically creates a public profile entry for every new user, ensuring seamless data linkage.
*   *RLS (Row Level Security)*:
    *   *Employees* can only see/edit their own data.
    *   *HR* has full access to view and manage all employee data.
