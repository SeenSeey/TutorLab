package project.TutorLab.dto;

import java.util.List;

public class StudentResponseDto {
    private String id;
    private String firstName;
    private String lastName;
    private Integer age;
    private String photoUrl;
    private List<String> interests;
    private List<String> materialUrls;
    private List<String> lessonDates;

    public StudentResponseDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public List<String> getInterests() {
        return interests;
    }

    public void setInterests(List<String> interests) {
        this.interests = interests;
    }

    public List<String> getMaterialUrls() {
        return materialUrls;
    }

    public void setMaterialUrls(List<String> materialUrls) {
        this.materialUrls = materialUrls;
    }

    public List<String> getLessonDates() {
        return lessonDates;
    }

    public void setLessonDates(List<String> lessonDates) {
        this.lessonDates = lessonDates;
    }
}

