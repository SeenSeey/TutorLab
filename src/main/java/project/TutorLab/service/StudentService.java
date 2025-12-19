package project.TutorLab.service;

import project.TutorLab.dto.StudentCardDto;
import project.TutorLab.dto.StudentCreateDto;
import project.TutorLab.dto.StudentResponseDto;

import java.util.List;

public interface StudentService {
    StudentResponseDto createStudent(String tutorId, StudentCreateDto createDto);
    StudentResponseDto getStudentById(String id);
    List<StudentCardDto> getAllStudentsByTutorId(String tutorId);
    StudentResponseDto addMaterial(String studentId, String materialUrl);
    StudentResponseDto addLessonDate(String studentId, String lessonDate);
}

