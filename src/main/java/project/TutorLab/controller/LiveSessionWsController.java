package project.TutorLab.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import project.TutorLab.dto.live.DrawEvent;
import project.TutorLab.dto.live.PointerEvent;
import project.TutorLab.dto.live.SlideChangeEvent;
import project.TutorLab.model.live.LiveSessionState;
import project.TutorLab.service.LiveSessionService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class LiveSessionWsController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private LiveSessionService liveSessionService;

    private Map<String, LiveSessionState.DrawPath> activePaths = new HashMap<>();

    @MessageMapping("/session/{sessionId}/slide")
    public void changeSlide(@DestinationVariable String sessionId,
                            @Payload SlideChangeEvent event) {
        liveSessionService.updateSlide(sessionId, event.getSlideIndex());
        messagingTemplate.convertAndSend(
                "/topic/session." + sessionId + ".slide",
                event
        );
    }

    @MessageMapping("/session/{sessionId}/draw")
    public void draw(@DestinationVariable String sessionId,
                     @Payload DrawEvent event) {
        LiveSessionState session = liveSessionService.getSession(sessionId);
        if (session == null) return;

        int slideIndex = session.getCurrentSlideIndex();
        String pathId = event.getPathId();

        if (!event.isEnd()) {
            LiveSessionState.DrawPath path = activePaths.get(pathId);
            if (path == null) {
                path = new LiveSessionState.DrawPath();
                path.setPathId(pathId);
                path.setColor(event.getColor());
                path.setWidth(event.getWidth());
                activePaths.put(pathId, path);
            }
            path.getPoints().add(new LiveSessionState.Point(event.getX(), event.getY()));
        } else {
            LiveSessionState.DrawPath path = activePaths.remove(pathId);
            if (path != null) {
                liveSessionService.addDrawPath(sessionId, slideIndex, path);
            }
        }

        messagingTemplate.convertAndSend(
                "/topic/session." + sessionId + ".draw",
                event
        );
    }

    @SuppressWarnings("null")
    @MessageMapping("/session/{sessionId}/pointer")
    public void pointer(@DestinationVariable String sessionId,
                        @Payload PointerEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/session." + sessionId + ".pointer",
                event
        );
    }

    @SuppressWarnings("null")
    @MessageMapping("/session/{sessionId}/clear")
    public void clearSlide(@DestinationVariable String sessionId) {
        LiveSessionState session = liveSessionService.getSession(sessionId);
        if (session == null) return;

        int slideIndex = session.getCurrentSlideIndex();
        liveSessionService.clearSlideDrawings(sessionId, slideIndex);

        Map<String, Integer> clearMessage = Map.of("slideIndex", slideIndex);
        messagingTemplate.convertAndSend(
                "/topic/session." + sessionId + ".clear",
                clearMessage
        );
    }

    @SuppressWarnings("null")
    @MessageMapping("/session/{sessionId}/webrtc")
    public void handleWebRTC(@DestinationVariable String sessionId,
                             @Payload Map<String, Object> signal) {
        messagingTemplate.convertAndSend(
                "/topic/session." + sessionId + ".webrtc",
                signal
        );
    }

    // Уведомление о загрузке презентации (вызывается из REST контроллера)
    @SuppressWarnings("null")
    public void notifyPresentationLoaded(String sessionId, List<String> slideUrls) {
        System.out.println("📢 Отправка презентации в WebSocket для сессии: " + sessionId);
        Map<String, Object> presentationMessage = new HashMap<>();
        presentationMessage.put("slides", slideUrls);
        presentationMessage.put("slideCount", slideUrls.size());
        messagingTemplate.convertAndSend(
                "/topic/session." + sessionId + ".presentation",
                presentationMessage
        );
    }
}
