package project.TutorLab.service;

import project.TutorLab.dto.TutorRegistrationDto;
import project.TutorLab.dto.TutorResponseDto;

public interface TutorService {
    TutorResponseDto registerTutor(TutorRegistrationDto registrationDto);
    TutorResponseDto getTutorById(String id);
    boolean tutorExists(String id);
}

