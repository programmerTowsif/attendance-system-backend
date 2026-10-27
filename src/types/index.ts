export type UserRole = "admin" | "student";
export type AccountStatus = "pending" | "active" | "rejected";
export type AttenddanceStatus = "present" | "absent" | "late" | "leave";
export interface User {
    id:string;
    name:string;
    email:string;
    password_hash:string;
    role:UserRole;
    account_status:AccountStatus;
    created_at:Date;
}
export interface Profile{
    id:string;
    user_id:string;
    first_name:string;
    last_name:string;
    phone:string | null;
    profile_picture:string | null;
}
export interface Attendance{
    id:string;
    user_id:string;
    attendance_date:string;
    check_id:Date | null;
    check_out : Date | null;
    status: AttenddanceStatus;
}