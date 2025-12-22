package project.TutorLab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.TutorLab.dto.StudentCardDto;
import project.TutorLab.dto.StudentCreateDto;
import project.TutorLab.dto.StudentResponseDto;
import project.TutorLab.service.StudentService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @PostMapping("/tutor/{tutorId}")
    public ResponseEntity<StudentResponseDto> createStudent(
            @PathVariable String tutorId,
            @RequestBody StudentCreateDto createDto) {
        try {
            StudentResponseDto response = studentService.createStudent(tutorId, createDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentResponseDto> getStudent(@PathVariable String id) {
        StudentResponseDto student = studentService.getStudentById(id);
        if (student == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(student);
    }

    @GetMapping("/tutor/{tutorId}")
    public ResponseEntity<List<StudentCardDto>> getAllStudentsByTutor(@PathVariable String tutorId) {
        List<StudentCardDto> students = studentService.getAllStudentsByTutorId(tutorId);
        return ResponseEntity.ok(students);
    }

    @PostMapping("/{id}/materials")
    public ResponseEntity<StudentResponseDto> addMaterial(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String materialUrl = request.get("materialUrl");
            if (materialUrl == null || materialUrl.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            StudentResponseDto response = studentService.addMaterial(id, materialUrl);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/lessons")
    public ResponseEntity<StudentResponseDto> addLessonDate(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String lessonDate = request.get("lessonDate");
            if (lessonDate == null || lessonDate.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            StudentResponseDto response = studentService.addLessonDate(id, lessonDate);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable String id) {
        try {
            studentService.deleteStudent(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/toggle-favorite")
    public ResponseEntity<Void> toggleFavoriteStudent(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String tutorId = request.get("tutorId");
            if (tutorId == null || tutorId.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            studentService.toggleFavoriteStudent(tutorId, id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

