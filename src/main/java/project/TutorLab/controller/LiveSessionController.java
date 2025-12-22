package project.TutorLab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.TutorLab.model.live.LiveSessionState;
import project.TutorLab.service.LiveSessionService;
import project.TutorLab.service.PdfService;
import project.TutorLab.controller.LiveSessionWsController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/live")
@CrossOrigin(origins = "*")
public class LiveSessionController {

    @Autowired
    private LiveSessionService liveSessionService;

    @Autowired
    private LiveSessionWsController wsController;

    @Autowired
    private PdfService pdfService;

    @Value("${app.upload.dir:users-photos}")
    private String uploadDir;

    @PostMapping("/sessions")
    public ResponseEntity<LiveSessionState> createSession(
            @RequestParam String tutorId,
            @RequestParam(required = false, defaultValue = "Новый урок") String title
    ) {
        LiveSessionState state = liveSessionService.createSession(tutorId, title);
        return ResponseEntity.ok(state);
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<LiveSessionState> getSession(@PathVariable String sessionId) {
        LiveSessionState state = liveSessionService.getSession(sessionId);
        if (state == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(state);
    }

    @PostMapping("/sessions/{sessionId}/presentation")
    public ResponseEntity<Map<String, Object>> uploadPresentation(
            @PathVariable String sessionId,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (!file.getContentType().equals("application/pdf")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only PDF files are allowed"));
        }

        LiveSessionState session = liveSessionService.getSession(sessionId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        // Конвертация PDF в изображения
        List<String> slideUrls = pdfService.convertPdfToImages(file, sessionId);

        // Обновить сессию
        session.setSlideUrls(slideUrls);
        session.setCurrentSlideIndex(0);
        liveSessionService.updateSession(session);

        // Отправить WebSocket сообщение всем подписчикам
        wsController.notifyPresentationLoaded(sessionId, slideUrls);

        return ResponseEntity.ok(Map.of(
                "slides", slideUrls,
                "slideCount", slideUrls.size()
        ));
    }

    @GetMapping("/sessions/{sessionId}/presentation")
    public ResponseEntity<Map<String, Object>> getPresentation(@PathVariable String sessionId) {
        LiveSessionState session = liveSessionService.getSession(sessionId);
        if (session == null || session.getSlideUrls().isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
                "slides", session.getSlideUrls(),
                "currentSlide", session.getCurrentSlideIndex()
        ));
    }

    @PutMapping("/sessions/{sessionId}/slide")
    public ResponseEntity<Void> changeSlide(
            @PathVariable String sessionId,
            @RequestParam int slideIndex
    ) {
        liveSessionService.updateSlide(sessionId, slideIndex);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/sessions/{sessionId}/slides/{slideIndex}/drawings")
    public ResponseEntity<List<LiveSessionState.DrawPath>> getSlideDrawings(
            @PathVariable String sessionId,
            @PathVariable int slideIndex
    ) {
        LiveSessionState session = liveSessionService.getSession(sessionId);
        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        List<LiveSessionState.DrawPath> drawings = session.getSlideDrawings()
                .getOrDefault(slideIndex, new ArrayList<>());

        return ResponseEntity.ok(drawings);
    }


    @GetMapping("/slides/{sessionId}/{filename:.+}")
    public ResponseEntity<Resource> getSlide(
            @PathVariable String sessionId,
            @PathVariable String filename
    ) {
        try {
            Path filePath = Paths.get(uploadDir, "slides", sessionId, filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/sessions/{sessionId}/clear-drawings")
    public ResponseEntity<Void> clearDrawings(
            @PathVariable String sessionId,
            @RequestParam int slideIndex
    ) {
        liveSessionService.clearSlideDrawings(sessionId, slideIndex);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable String sessionId) {
        liveSessionService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }
}
