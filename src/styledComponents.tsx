import styled from "styled-components";
import CourseGridComponent from "./CourseGrid";
const ExportButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  margin-bottom: 20px;
`;
const ExportButton = styled.button`
  background-color: #f5f5f5;
  border: none;
  text-align: left;
  text-decoration: none;
  display: inline-block;
  margin: 4px 2px;
  margin-right: 10px;
  cursor: pointer;
  padding: 10px 24px;
  outline: 1px solid #e5e5e5;
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.25);
  }
`;

const CourseListContainer = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CourseListItem = styled.li`
  padding: 5px 10px;
  font-size: 0.8em;
  background-color: #f5f5f5;
  outline: 1px solid #e5e5e5;
  margin-bottom: 5px;
  text-align: left; 
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
  // no more than 3 lines
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
interface CourseListItemProps {
  isSelected: boolean;
}

const StyledCourseListItem = styled.div<CourseListItemProps>`
  font-size: ${({ isSelected }) => (isSelected ? '0.8em' : '1em')};
  text-align: left;
  cursor: pointer;
  padding: 2px 5px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;


const CourseTable = styled.table`
  border-collapse: collapse;
  width: clamp(75%, 75%, 100%);
  margin: none ;
`;
const StyledCourseGrid = styled(CourseGridComponent)`
  border-collapse: collapse;
  width: clamp(75%, 75%, 100%);
  margin: none ;
`;

const StyledCourseCell = styled.td`
  border: 1px solid #333333;
  padding: 10px;
  text-align: center;
  vertical-align: top;
  cursor: pointer;
  width: 100px;
  padding-bottom: 1em;
`;

const CourseList = styled.div<{ visible: boolean }>`
  position: absolute;
  background-color: white;
  outline: 1px solid black;
  padding: 10px;
  display: ${({ visible }) => (visible ? "block" : "none")};
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

const CourseItem = styled.li`
  cursor: pointer;
`;
const StyledCourseItem = styled(CourseItem) <{ isSelected: boolean }>`
  color: ${({ isSelected }) => (isSelected ? "gray" : "black")};
`;

const CourseDetails = styled.div`
  position: absolute;
  left: 100%;
  top: 0;
  // TODO: height
  width: clamp(300px, 40%, 500px);
  background-color: white;
  outline: 1px solid black;
  margin: 0;
  p {
    margin: 4px 0;
  }
`;
export {
  ExportButton,
  ExportButtonsContainer,
  CourseListContainer,
  CourseListItem,
  CourseTable,
  StyledCourseCell,
  CourseList,
  CourseItem,
  StyledCourseItem,
  CourseDetails,
  StyledCourseListItem,
  StyledCourseGrid
};
