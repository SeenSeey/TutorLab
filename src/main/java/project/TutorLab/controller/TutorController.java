package project.TutorLab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.TutorLab.dto.TutorRegistrationDto;
import project.TutorLab.dto.TutorResponseDto;
import project.TutorLab.service.TutorService;

@RestController
@RequestMapping("/api/tutors")
@CrossOrigin(origins = "*")
public class TutorController {

    @Autowired
    private TutorService tutorService;

    @PostMapping("/register")
    public ResponseEntity<TutorResponseDto> registerTutor(@RequestBody TutorRegistrationDto registrationDto) {
        TutorResponseDto response = tutorService.registerTutor(registrationDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TutorResponseDto> getTutor(@PathVariable String id) {
        TutorResponseDto tutor = tutorService.getTutorById(id);
        if (tutor == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tutor);
    }

    @GetMapping("/{id}/exists")
    public ResponseEntity<Boolean> tutorExists(@PathVariable String id) {
        boolean exists = tutorService.tutorExists(id);
        return ResponseEntity.ok(exists);
    }
}

