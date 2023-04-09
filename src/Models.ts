export interface Course {
    course_title_ja: string;
    course_title_en: string;
    course_schedule_term: string;
    course_schedule_opening_term: string;
    course_schedule_day_and_period: string[];
    course_schedule_timetable_code: number;
    code: string;
    faculty: string;
    offering_year_offered: string[];
    offering_teaching_method: string;
    offering_credits: number;
    offering_category: string;
    offering_department: string;
    offering_course_website: string;
    lecturer_name: string;
    lecturer_email: string;
    lecturer_office_hours: string;
    lecturer_office_location: string;
}
