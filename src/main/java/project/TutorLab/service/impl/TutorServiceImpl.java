package project.TutorLab.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import project.TutorLab.dto.TutorRegistrationDto;
import project.TutorLab.dto.TutorResponseDto;
import project.TutorLab.model.Tutor;
import project.TutorLab.repository.TutorRepository;
import project.TutorLab.service.TutorService;

import java.util.ArrayList;
import java.util.UUID;

@Service
public class TutorServiceImpl implements TutorService {

    @Autowired
    private TutorRepository tutorRepository;

    @Override
    public TutorResponseDto registerTutor(TutorRegistrationDto registrationDto) {
        String tutorId = UUID.randomUUID().toString();
        
        Tutor tutor = new Tutor();
        tutor.setId(tutorId);
        tutor.setFullName(registrationDto.getFullName());
        tutor.setLogin(registrationDto.getLogin());
        tutor.setPassword(registrationDto.getPassword());
        tutor.setStudentIds(new ArrayList<>());
        
        tutorRepository.save(tutor);
        
        return convertToResponseDto(tutor);
    }

    @Override
    public TutorResponseDto getTutorById(String id) {
        Tutor tutor = tutorRepository.findById(id);
        if (tutor == null) {
            return null;
        }
        return convertToResponseDto(tutor);
    }

    @Override
    public boolean tutorExists(String id) {
        return tutorRepository.existsById(id);
    }

    private TutorResponseDto convertToResponseDto(Tutor tutor) {
        TutorResponseDto dto = new TutorResponseDto();
        dto.setId(tutor.getId());
        dto.setFullName(tutor.getFullName());
        dto.setLogin(tutor.getLogin());
        dto.setStudentIds(tutor.getStudentIds());
        return dto;
    }
}

