package project.TutorLab.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import project.TutorLab.dto.TutorLoginDto;
import project.TutorLab.dto.TutorRegistrationDto;
import project.TutorLab.dto.TutorResponseDto;
import project.TutorLab.dto.TutorUpdateDto;
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
        // Проверяем, существует ли пользователь с таким логином
        if (tutorRepository.existsByLogin(registrationDto.getLogin())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Пользователь с таким логином уже существует");
        }
        
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
    public TutorResponseDto loginTutor(TutorLoginDto loginDto) {
        Tutor tutor = tutorRepository.findByLogin(loginDto.getLogin());
        if (tutor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        if (!tutor.getPassword().equals(loginDto.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль");
        }
        return convertToResponseDto(tutor);
    }

    @Override
    public TutorResponseDto updateTutor(String id, TutorUpdateDto updateDto) {
        Tutor tutor = tutorRepository.findById(id);
        if (tutor == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Репетитор не найден");
        }
        
        if (updateDto.getFullName() != null) {
            tutor.setFullName(updateDto.getFullName());
        }
        if (updateDto.getPhotoUrl() != null) {
            tutor.setPhotoUrl(updateDto.getPhotoUrl());
        }
        if (updateDto.getAbout() != null) {
            tutor.setAbout(updateDto.getAbout());
        }
        
        tutorRepository.save(tutor);
        return convertToResponseDto(tutor);
    }

    @Override
    public boolean loginExists(String login) {
        return tutorRepository.existsByLogin(login);
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
        dto.setPhotoUrl(tutor.getPhotoUrl());
        dto.setAbout(tutor.getAbout());
        dto.setStudentIds(tutor.getStudentIds());
        return dto;
    }
}

