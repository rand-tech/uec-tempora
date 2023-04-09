import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './App.css';
import courseDataJson from "./CourseData.json";
import Select, { ActionMeta } from 'react-select';
import { Course } from "./Models";
import {
  CourseDetails,
  CourseList,
  StyledCourseItem
} from "./styledComponents";
import { StyledCourseGrid } from "./styledComponents";

const courseData = courseDataJson as Course[];

interface Option {
  value: string;
  label: string;
}

interface CourseListPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

const useUniqueFilters = (courseData: Course[]) => {
  return useMemo(() => {
    return {
      uniqueTerms: Array.from(new Set(courseData.map((course) => course.course_schedule_term))),
      uniqueOpeningTerms: Array.from(new Set(courseData.map((course) => course.course_schedule_opening_term))),
      uniqueAcademicYears: Array.from(new Set(courseData.flatMap((course) => course.offering_year_offered))),
      uniqueFaculties: Array.from(new Set(courseData.map((course) => course.faculty))),
      uniqueCategories: Array.from(new Set(courseData.map((course) => course.offering_category))),
      uniqueDepartments: Array.from(new Set(courseData.map((course) => course.offering_department))),
    };
  }, [courseData]);
};
const useFilterHandlers = (setFilter: React.Dispatch<React.SetStateAction<string[]>>, uniqueValues: string[]) => {
  const handleSelectAll = useCallback(() => {
    setFilter(uniqueValues);
  }, [setFilter, uniqueValues]);

  const handleClear = useCallback(() => {
    setFilter([]);
  }, [setFilter]);

  return {
    handleSelectAll,
    handleClear,
  };
};

function App() {
  const [grid, setGrid] = useState<Course[][][]>(Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => [])));

  const [courseList, setCourseList] = useState<Course[]>([]);
  const [courseListPosition, setCourseListPosition] = useState<CourseListPosition>({ x: 0, y: 0, row: 0, col: 0 });
  const courseListRef = useRef<HTMLDivElement>(null);
  const [courseListVisible, setCourseListVisible] = useState(false);
  const [courseTermFilter, setCourseTermFilter] = useState<string | undefined>("前学期");
  const [courseOpeningTermFilter, setCourseOpeningTermFilter] = useState<string | undefined>("");
  const [courseAcademicYearFilter, setCourseAcademicYearFilter] = useState<string | undefined>("3");
  // const [courseYearOfferedFilter] = useState<string | undefined>("");

  const [facultyFilter, setFacultyFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  const saveToLocalStorage = (data: Course[]) => {
    const timetableCodes = data.map((course) => course.course_schedule_timetable_code);
    localStorage.setItem("selectedCourses", JSON.stringify(timetableCodes));
  };

  const loadFromLocalStorage = (): Course[] => {
    const data = localStorage.getItem("selectedCourses");
    const timetableCodes = data ? JSON.parse(data) : [];
    return timetableCodes.map((timetableCode: number) => courseData.find((course) => course.course_schedule_timetable_code === timetableCode) as Course);
  };
  const [selectedCourses, setSelectedCourses] = useState<Course[]>(loadFromLocalStorage());

  useEffect(() => {
    setGrid(coursesToGrid(selectedCourses));
    saveToLocalStorage(selectedCourses);
  }, [selectedCourses]);

  const coursesToGrid = (courses: Course[]): Course[][][] => {
    const newGrid: Course[][][] = Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => []));
    courses.forEach((course) => {
      const dayAndPeriod = course.course_schedule_day_and_period;
      dayAndPeriod.forEach((time) => {
        const [col, row] = time.split(':').map(Number);
        if (row < 6 && col < 7) {
          newGrid[row][col] = [...newGrid[row][col], course];
        }
      });
    });
    return newGrid;
  };

  useEffect(() => {
    if (courseListRef.current) {
      courseListRef.current.style.left = `${courseListPosition.x - 30}px`;
      courseListRef.current.style.top = `${courseListPosition.y + 5}px`;
    }
  }, [courseListPosition]);

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      width: 800,
    }),
  };

  const { uniqueFaculties, uniqueCategories, uniqueDepartments, uniqueTerms, uniqueOpeningTerms, uniqueAcademicYears } = useUniqueFilters(courseData);

  const { handleSelectAll: handleFacultySelectAll, handleClear: handleFacultyClear } = useFilterHandlers(
    setFacultyFilter,
    uniqueFaculties
  );
  const { handleSelectAll: handleCategorySelectAll, handleClear: handleCategoryClear } = useFilterHandlers(
    setCategoryFilter,
    uniqueCategories
  );
  const { handleSelectAll: handleDepartmentSelectAll, handleClear: handleDepartmentClear } = useFilterHandlers(
    setDepartmentFilter,
    uniqueDepartments
  );

  const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null);
  const onCellClick = useCallback((row: number, col: number, x: number, y: number) => {
    const time = `${col}:${row}`;
    const availableCourses = courseData.filter((course) => {
      const dayAndPeriod = course.course_schedule_day_and_period;
      const timeMatches = dayAndPeriod.includes(time);
      const termFilterMatches = !courseTermFilter || course.course_schedule_term === courseTermFilter;
      const openingTermFilterMatches = !courseOpeningTermFilter || course.course_schedule_opening_term === courseOpeningTermFilter;
      const academicYearFilterMatches = !courseAcademicYearFilter || course.offering_year_offered.includes(courseAcademicYearFilter);
      // const yearOfferedFilterMatches = !courseYearOfferedFilter || course.offering_year_offered.includes(courseYearOfferedFilter);
      const facultyFilterMatches = facultyFilter.length === 0 || facultyFilter.includes(course.faculty);
      const categoryFilterMatches = categoryFilter.length === 0 || categoryFilter.includes(course.offering_category);
      const departmentFilterCheck = departmentFilter.length === 0 || departmentFilter.includes(course.offering_department);

      return (
        timeMatches &&
        termFilterMatches &&
        openingTermFilterMatches &&
        academicYearFilterMatches &&
        // yearOfferedFilterMatches &&
        facultyFilterMatches &&
        categoryFilterMatches &&
        departmentFilterCheck
      );
    });
    setCourseList(availableCourses);
    setCourseListPosition({ x, y, row, col });
    setCourseListVisible(true);
  }, [courseTermFilter, courseOpeningTermFilter, courseAcademicYearFilter, facultyFilter, categoryFilter, departmentFilter]);

  const onCourseItemClick = useCallback((row: number, col: number, course: Course) => {
    const courseToAddOrRemove = course;
    // Update the selected courses based on the clicked course
    setSelectedCourses((prevSelectedCourses) => {
      const courseIndex = prevSelectedCourses.indexOf(courseToAddOrRemove);
      if (courseIndex >= 0) {
        // Remove the course if it's already in the selectedCourses
        return [
          ...prevSelectedCourses.slice(0, courseIndex),
          ...prevSelectedCourses.slice(courseIndex + 1),
        ];
      } else {
        // Add the course if it's not in the selectedCourses
        return [...prevSelectedCourses, courseToAddOrRemove];
      }
    });
    // Hide the course list after handling the click
    setCourseListVisible(false);
  }, []);


  const handleCourseDeselect = (course: Course) => {
    // Remove the selected course from the selectedCourses array
    const updatedCourses = selectedCourses.filter((c) => c.course_schedule_timetable_code !== course.course_schedule_timetable_code);
    // Update the state with the new array of selected courses
    setSelectedCourses(updatedCourses);
  };

  const exportCoursesToCSV = (courses: Course[]) => {
    const headers = [
      'course_schedule_day_and_period',
      'course_schedule_timetable_code',
      'course_title_ja',
      'course_title_en',
      'code',
      'lecture_name'
    ];

    const csvContent =
      headers.join(',') +
      '\n' +
      selectedCourses
        .map((course) =>
          [
            course.course_schedule_day_and_period,
            course.course_schedule_timetable_code,
            course.course_title_ja,
            course.course_title_en,
            course.code,
            course.lecturer_name,
          ].join(',')
        )
        .join('\n');
    navigator.clipboard.writeText(csvContent)
      .then(() => {
        console.log("Copied text to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <>
      <div className="filters">
        <label>
          Term:
          <select
            value={courseTermFilter}
            onChange={(e) => setCourseTermFilter(e.target.value || undefined)}
          >
            <option value="">All</option>
            {uniqueTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </label>
        <label>
          Opening Term:
          <select
            value={courseOpeningTermFilter}
            onChange={(e) => setCourseOpeningTermFilter(e.target.value || undefined)}
          >
            <option value="">All</option>
            {uniqueOpeningTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </label>
        <label>
          Academic Year:
          <select
            value={courseAcademicYearFilter}
            onChange={(e) => setCourseAcademicYearFilter(e.target.value || undefined)}
          >
            <option value="">All</option>
            {uniqueAcademicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Faculty:
          <Select
            isMulti
            styles={customStyles}
            value={facultyFilter.map((faculty) => ({ value: faculty, label: faculty })) as Option[]}
            onChange={(selected: ReadonlyArray<Option>, _actionMeta: ActionMeta<Option>) => {
              const selectedValues = selected || [];
              setFacultyFilter(selectedValues.map((item) => item.value));
            }}
            options={uniqueFaculties.map((faculty) => ({ value: faculty, label: faculty })) as Option[]}
          />
          <button onClick={handleFacultySelectAll}>Select all</button>
          <button onClick={handleFacultyClear}>Clear</button>
        </label>
        <label>
          Category:
          <Select
            isMulti
            styles={customStyles}
            value={categoryFilter.map((category) => ({ value: category, label: category })) as Option[]}
            onChange={(selected: ReadonlyArray<Option>, _actionMeta: ActionMeta<Option>) => {
              const selectedValues = selected || [];
              setCategoryFilter(selectedValues.map((item) => item.value));
            }}
            options={uniqueCategories.map((category) => ({ value: category, label: category })) as Option[]}
          />
          <button onClick={handleCategorySelectAll}>Select all</button>
          <button onClick={handleCategoryClear}>Clear</button>
        </label>

        <label>
          Department:
          <Select
            isMulti
            styles={customStyles}
            value={departmentFilter.map((department) => ({ value: department, label: department })) as Option[]}
            onChange={(selected: ReadonlyArray<Option>, _actionMeta: ActionMeta<Option>) => {
              const selectedValues = selected || [];
              setDepartmentFilter(selectedValues.map((item) => item.value));
            }}
            options={uniqueDepartments.map((department) => ({ value: department, label: department })) as Option[]}
          />
          <button onClick={handleDepartmentSelectAll}>Select all</button>
          <button onClick={handleDepartmentClear}>Clear</button>
        </label>
      </div>

      <StyledCourseGrid
        grid={grid}
        onCellClick={onCellClick}
        handleCourseDeselect={handleCourseDeselect}
      />
      <CourseList ref={courseListRef} visible={courseListVisible} style={{ left: courseListPosition.x, top: courseListPosition.y }}>
        <ul>
          {courseList.map((course: Course, index) => {
            const isSelected = grid[courseListPosition.row][courseListPosition.col].some(
              (gridCourse) => gridCourse.course_schedule_timetable_code === course.course_schedule_timetable_code
            );
            // TODO:enhancement: content 
            const shortDescription = course.offering_department.substring(
              0,
              50
            );

            return (
              <StyledCourseItem
                key={index}
                isSelected={isSelected}
                onClick={() =>
                  onCourseItemClick(
                    courseListPosition.row,
                    courseListPosition.col,
                    course
                  )
                }
                onMouseEnter={() => setHoveredCourse(course)}
                onMouseLeave={() => setHoveredCourse(null)}
              >
                <a
                  href={`//kyoumu.office.uec.ac.jp/syllabus/2023/31/31_${course.course_schedule_timetable_code}.html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  🌐
                </a>
                {course.course_title_ja} - {shortDescription}
              </StyledCourseItem>
            );
          })}
        </ul>
        {hoveredCourse && (
          <CourseDetails>
            <h3>{hoveredCourse.course_title_ja}</h3>
            <p><strong>Credits:</strong> {hoveredCourse.offering_credits}</p>
            <p><strong>Lecturer Name:</strong> {hoveredCourse.lecturer_name}</p>
            <p><strong>Faculty:</strong> {hoveredCourse.faculty}</p>
            <p><strong>Department:</strong> {hoveredCourse.offering_department}</p>
            <p><strong>Day and Time:</strong> {hoveredCourse.course_schedule_day_and_period.map((dayAndTime) => dayAndTime).join(", ")}</p>
            <p><strong>Year Offered:</strong> {hoveredCourse.offering_year_offered.map((year) => year).join(", ")}</p>
            <p><strong>Teaching Method:</strong> {hoveredCourse.offering_teaching_method}</p>
            <p><strong>Category:</strong> {hoveredCourse.offering_category}</p>
            <p><strong>Course Website:</strong> {hoveredCourse.offering_course_website}</p>
          </CourseDetails>
        )}
      </CourseList>

      <button onClick={() => exportCoursesToCSV(courseList)}>Copy the table to clipboard</button>
    </>
  );
}

export default App;
