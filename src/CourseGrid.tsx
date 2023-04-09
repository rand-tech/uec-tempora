import React from "react";
import {
    StyledCourseCell, CourseListContainer, CourseListItem, CourseTable
} from "./styledComponents";
import { Course } from "./Models";

interface CourseCellProps {
    courses: Course[];
    onClick: (e: React.MouseEvent<HTMLTableCellElement>) => void;
    onDeselect: (course: Course) => void;
}

const CourseCell: React.FC<CourseCellProps> = ({
    courses,
    onClick,
    onDeselect,
}) => {
    const handleDeselect = (event: React.MouseEvent, course: Course) => {
        event.stopPropagation();
        onDeselect(course);
    };

    return (
        <StyledCourseCell onClick={onClick}>
            <CourseListContainer>
                {courses.map((course, i) => (
                    <CourseListItem
                        key={i}
                        onClick={(e) => handleDeselect(e, course)}
                    >
                        {course.course_title_ja}
                    </CourseListItem>
                ))}
            </CourseListContainer>
        </StyledCourseCell>
    );
};

const Thead = () => (
    <thead>
        <tr>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
            <th>Saturday</th>
            <th>Others</th>
        </tr>
    </thead>
);

interface CourseGridProps {
    grid: any; // Define the type for grid
    onCellClick: (rowIndex: number, colIndex: number, x: number, y: number) => void;
    handleCourseDeselect: (course: any) => void; // Define the type for course
}

const CourseGrid: React.FC<CourseGridProps> = ({ grid, onCellClick, handleCourseDeselect }) => {
    return (
        <CourseTable>
            <Thead />
            <tbody>
                {grid.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                        {row.map((courses: any, colIndex: number) => (
                            <CourseCell
                                key={colIndex}
                                courses={courses}
                                onClick={(e) =>
                                    onCellClick(rowIndex, colIndex, e.clientX, e.clientY)
                                }
                                onDeselect={(course) => handleCourseDeselect(course)}
                            />
                        ))}
                    </tr>
                ))}
            </tbody>
        </CourseTable>
    );
};

export default CourseGrid;
