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
    private static final long TTL_DAYS = 30;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public Tutor save(Tutor tutor) {
        String key = TUTOR_KEY_PREFIX + tutor.getId();
        redisTemplate.opsForValue().set(key, tutor, TTL_DAYS, TimeUnit.DAYS);
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
        String key = TUTOR_KEY_PREFIX + id;
        redisTemplate.delete(key);
    }

    @Override
    public boolean existsById(String id) {
        String key = TUTOR_KEY_PREFIX + id;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
}

