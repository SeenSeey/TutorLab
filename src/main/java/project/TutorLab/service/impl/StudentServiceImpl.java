package project.TutorLab.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import project.TutorLab.dto.StudentCardDto;
import project.TutorLab.dto.StudentCreateDto;
import project.TutorLab.dto.StudentResponseDto;
import project.TutorLab.model.Student;
import project.TutorLab.repository.StudentRepository;
import project.TutorLab.repository.TutorRepository;
import project.TutorLab.service.StudentService;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class StudentServiceImpl implements StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TutorRepository tutorRepository;

    @Override
    public StudentResponseDto createStudent(String tutorId, StudentCreateDto createDto) {
        if (!tutorRepository.existsById(tutorId)) {
            throw new IllegalArgumentException("Tutor with id " + tutorId + " does not exist");
        }

        String studentId = UUID.randomUUID().toString();
        
        Student student = new Student();
        student.setId(studentId);
        student.setTutorId(tutorId);
        student.setFirstName(createDto.getFirstName());
        student.setLastName(createDto.getLastName());
        student.setAge(createDto.getAge());
        student.setPhotoUrl(createDto.getPhotoUrl());
        student.setInterests(createDto.getInterests() != null ? createDto.getInterests() : new ArrayList<>());
        student.setMaterialUrls(new ArrayList<>());
        student.setLessonDates(new ArrayList<>());
        
        studentRepository.save(student);
        
        return convertToResponseDto(student);
    }

    @Override
    public StudentResponseDto getStudentById(String id) {
        Student student = studentRepository.findById(id);
        if (student == null) {
            return null;
        }
        return convertToResponseDto(student);
    }

    @Override
    public List<StudentCardDto> getAllStudentsByTutorId(String tutorId) {
        List<Student> students = studentRepository.findByTutorId(tutorId);
        List<StudentCardDto> cardDtos = new ArrayList<>();
        
        for (Student student : students) {
            StudentCardDto cardDto = new StudentCardDto();
            cardDto.setId(student.getId());
            cardDto.setFirstName(student.getFirstName());
            cardDto.setLastName(student.getLastName());
            cardDto.setAge(student.getAge());
            cardDto.setPhotoUrl(student.getPhotoUrl());
            cardDtos.add(cardDto);
        }
        
        return cardDtos;
    }

    @Override
    public StudentResponseDto addMaterial(String studentId, String materialUrl) {
        Student student = studentRepository.findById(studentId);
        if (student == null) {
            throw new IllegalArgumentException("Student with id " + studentId + " does not exist");
        }
        
        if (student.getMaterialUrls() == null) {
            student.setMaterialUrls(new ArrayList<>());
        }
        student.getMaterialUrls().add(materialUrl);
        studentRepository.save(student);
        
        return convertToResponseDto(student);
    }

    @Override
    public StudentResponseDto addLessonDate(String studentId, String lessonDate) {
        Student student = studentRepository.findById(studentId);
        if (student == null) {
            throw new IllegalArgumentException("Student with id " + studentId + " does not exist");
        }
        
        if (student.getLessonDates() == null) {
            student.setLessonDates(new ArrayList<>());
        }
        student.getLessonDates().add(lessonDate);
        studentRepository.save(student);
        
        return convertToResponseDto(student);
    }

    private StudentResponseDto convertToResponseDto(Student student) {
        StudentResponseDto dto = new StudentResponseDto();
        dto.setId(student.getId());
        dto.setFirstName(student.getFirstName());
        dto.setLastName(student.getLastName());
        dto.setAge(student.getAge());
        dto.setPhotoUrl(student.getPhotoUrl());
        dto.setInterests(student.getInterests());
        dto.setMaterialUrls(student.getMaterialUrls());
        dto.setLessonDates(student.getLessonDates());
        return dto;
    }
}

