package project.TutorLab.repository.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;
import project.TutorLab.model.Tutor;
import project.TutorLab.repository.TutorRepository;

import java.util.concurrent.TimeUnit;

@Repository
public class TutorRepositoryImpl implements TutorRepository {

    private static final String TUTOR_KEY_PREFIX = "tutor:";
    private static final String TUTOR_LOGIN_INDEX_PREFIX = "tutor:login:";
    private static final long TTL_DAYS = 30;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public Tutor save(Tutor tutor) {
        // Проверяем, существует ли уже репетитор с таким ID
        Tutor existingTutor = findById(tutor.getId());
        
        // Если логин изменился, удаляем старый индекс
        if (existingTutor != null && existingTutor.getLogin() != null 
            && !existingTutor.getLogin().equals(tutor.getLogin())) {
            String oldLoginIndexKey = TUTOR_LOGIN_INDEX_PREFIX + existingTutor.getLogin();
            redisTemplate.delete(oldLoginIndexKey);
        }
        
        String key = TUTOR_KEY_PREFIX + tutor.getId();
        redisTemplate.opsForValue().set(key, tutor, TTL_DAYS, TimeUnit.DAYS);
        
        // Создаем/обновляем индекс для поиска по логину
        if (tutor.getLogin() != null && !tutor.getLogin().isEmpty()) {
            String loginIndexKey = TUTOR_LOGIN_INDEX_PREFIX + tutor.getLogin();
            redisTemplate.opsForValue().set(loginIndexKey, tutor.getId(), TTL_DAYS, TimeUnit.DAYS);
        }
        
        return tutor;
    }

    @Override
    public Tutor findById(String id) {
        String key = TUTOR_KEY_PREFIX + id;
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Tutor) {
            return (Tutor) value;
        }
        try {
            return objectMapper.convertValue(value, Tutor.class);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public void deleteById(String id) {
        Tutor tutor = findById(id);
        if (tutor != null && tutor.getLogin() != null) {
            // Удаляем индекс логина
            String loginIndexKey = TUTOR_LOGIN_INDEX_PREFIX + tutor.getLogin();
            redisTemplate.delete(loginIndexKey);
        }
        String key = TUTOR_KEY_PREFIX + id;
        redisTemplate.delete(key);
    }

    @Override
    public boolean existsById(String id) {
        String key = TUTOR_KEY_PREFIX + id;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    @Override
    public Tutor findByLogin(String login) {
        // Используем индекс для быстрого поиска
        String loginIndexKey = TUTOR_LOGIN_INDEX_PREFIX + login;
        Object tutorIdObj = redisTemplate.opsForValue().get(loginIndexKey);
        
        if (tutorIdObj == null) {
            return null;
        }
        
        String tutorId;
        if (tutorIdObj instanceof String) {
            tutorId = (String) tutorIdObj;
        } else {
            tutorId = tutorIdObj.toString();
        }
        
        return findById(tutorId);
    }

    @Override
    public boolean existsByLogin(String login) {
        return findByLogin(login) != null;
    }
}

