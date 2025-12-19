package project.TutorLab.repository;

import project.TutorLab.model.Tutor;

public interface TutorRepository {
    Tutor save(Tutor tutor);
    Tutor findById(String id);
    void deleteById(String id);
    boolean existsById(String id);
}

